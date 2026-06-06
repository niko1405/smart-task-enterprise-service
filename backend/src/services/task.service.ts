import { prisma } from '../config/database';
import { CreateTaskInput, UpdateTaskInput, TaskFilterInput } from '../models/task.model';
import { TaskStatus } from '@prisma/client';

export class TaskService {
  async createTask(userId: string, input: CreateTaskInput) {
    return await prisma.task.create({
      data: {
        title: input.title,
        description: input.description,
        status: input.status,
        priority: input.priority,
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
        tags: input.tags,
        createdById: userId,
        assignedToId: input.assignedToId,
      },
      include: {
        createdBy: {
          select: { id: true, email: true, name: true },
        },
        assignedTo: {
          select: { id: true, email: true, name: true },
        },
      },
    });
  }

  private buildWhereClause(filters: TaskFilterInput): Record<string, unknown> {
    const where: Record<string, unknown> = {};

    if (filters.status) where.status = filters.status;
    if (filters.priority) where.priority = filters.priority;
    if (filters.assignedToId) where.assignedToId = filters.assignedToId;
    if (filters.createdById) where.createdById = filters.createdById;

    if (filters.tags) {
      where.tags = { hasSome: filters.tags.split(',') };
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return where;
  }

  async getTasks(filters: TaskFilterInput): Promise<{
    data: unknown[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const page = parseInt(filters.page, 10);
    const limit = parseInt(filters.limit, 10);
    const skip = (page - 1) * limit;
    const where = this.buildWhereClause(filters);

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          createdBy: { select: { id: true, email: true, name: true } },
          assignedTo: { select: { id: true, email: true, name: true } },
        },
        orderBy: { [filters.sortBy]: filters.sortOrder },
        skip,
        take: limit,
      }),
      prisma.task.count({ where }),
    ]);

    return {
      data: tasks,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getTaskById(taskId: string) {
    return await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        createdBy: {
          select: { id: true, email: true, name: true },
        },
        assignedTo: {
          select: { id: true, email: true, name: true },
        },
      },
    });
  }

  async updateTask(taskId: string, input: UpdateTaskInput) {
    const updateData: Record<string, unknown> = {};

    if (input.title !== undefined) updateData.title = input.title;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.status !== undefined) updateData.status = input.status;
    if (input.priority !== undefined) updateData.priority = input.priority;
    if (input.dueDate !== undefined) {
      updateData.dueDate = input.dueDate ? new Date(input.dueDate) : null;
    }
    if (input.tags !== undefined) updateData.tags = input.tags;
    if (input.assignedToId !== undefined) updateData.assignedToId = input.assignedToId;

    return await prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: {
        createdBy: {
          select: { id: true, email: true, name: true },
        },
        assignedTo: {
          select: { id: true, email: true, name: true },
        },
      },
    });
  }

  async deleteTask(taskId: string) {
    await prisma.task.delete({
      where: { id: taskId },
    });
  }

  async getTaskStatus(taskId: string): Promise<TaskStatus | null> {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { status: true },
    });
    return task?.status || null;
  }
}

export const taskService = new TaskService();
