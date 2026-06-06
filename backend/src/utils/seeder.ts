import { parse } from 'csv-parse';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient, Role, TaskStatus, Priority } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { logger } from './logger';

const prisma = new PrismaClient();

interface UserCSVRow {
  email: string;
  password: string;
  name: string;
  role: Role;
}

interface TaskCSVRow {
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: Priority;
  dueDate: string | null;
  tags: string[];
  assignedToEmail: string | null;
  createdByEmail: string;
}

export async function seedDatabase(): Promise<void> {
  logger.info('🌱 Starting database seeding...');

  try {
    // Wipe existing data
    logger.info('🗑️  Wiping existing data...');
    await prisma.task.deleteMany();
    await prisma.user.deleteMany();
    logger.info('✅ Database wiped');

    // Seed users
    logger.info('👥 Seeding users...');
    const usersData = await readUsersCSV();
    const userMap = new Map<string, string>(); // email -> id

    for (const userData of usersData) {
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      const user = await prisma.user.create({
        data: {
          email: userData.email,
          password: hashedPassword,
          name: userData.name,
          role: userData.role,
        },
      });
      userMap.set(user.email, user.id);
      logger.info(`   Created user: ${user.email} (${user.role})`);
    }

    // Seed tasks
    logger.info('📋 Seeding tasks...');
    const tasksData = await readTasksCSV();

    for (const taskData of tasksData) {
      const createdById = userMap.get(taskData.createdByEmail);
      if (!createdById) {
        logger.warn(`   Warning: Creator ${taskData.createdByEmail} not found, skipping task`);
        continue;
      }

      const assignedToId = taskData.assignedToEmail
        ? userMap.get(taskData.assignedToEmail)
        : null;

      if (taskData.assignedToEmail && !assignedToId) {
        logger.warn(`   Warning: Assignee ${taskData.assignedToEmail} not found, task will be unassigned`);
      }

      const task = await prisma.task.create({
        data: {
          title: taskData.title,
          description: taskData.description,
          status: taskData.status,
          priority: taskData.priority,
          dueDate: taskData.dueDate ? new Date(taskData.dueDate) : null,
          tags: taskData.tags,
          createdById,
          assignedToId,
        },
      });
      logger.info(`   Created task: ${task.title} (${task.status})`);
    }

    logger.info('✅ Database seeding completed successfully!');
  } catch (error) {
    logger.error({ error }, '❌ Error seeding database');
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function readUsersCSV(): Promise<UserCSVRow[]> {
  const csvPath = path.join(process.cwd(), 'prisma/seed-data/users.csv');
  const fileContent = fs.readFileSync(csvPath, 'utf-8');

  return new Promise((resolve, reject) => {
    parse(
      fileContent,
      {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      },
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      (err: Error | undefined, records: UserCSVRow[]) => {
        if (err) {
          reject(err);
        } else {
          resolve(records);
        }
      }
    );
  });
}

async function readTasksCSV(): Promise<TaskCSVRow[]> {
  const csvPath = path.join(process.cwd(), 'prisma/seed-data/tasks.csv');
  const fileContent = fs.readFileSync(csvPath, 'utf-8');

  return new Promise((resolve, reject) => {
    parse(
      fileContent,
      {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      },
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      (err: Error | undefined, records: Array<Record<string, string>>) => {
        if (err) {
          reject(err);
        } else {
          const tasks: TaskCSVRow[] = records.map((record) => ({
            title: record.title || '',
            description: record.description || null,
            status: record.status as TaskStatus,
            priority: record.priority as Priority,
            dueDate: record.dueDate || null,
            tags: record.tags ? record.tags.split(',').map((t) => t.trim()) : [],
            assignedToEmail: record.assignedToEmail || null,
            createdByEmail: record.createdByEmail || '',
          }));
          resolve(tasks);
        }
      }
    );
  });
}

// Run seeder if this file is executed directly
if (require.main === module) {
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  seedDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      logger.error({ error }, 'Seeder failed');
      process.exit(1);
    });
}
