import { prisma } from '../config/database';
import { CreateTaskInput, UpdateTaskInput, TaskFilterInput } from '../models/task.model';
import { Prisma, TaskStatus } from '@prisma/client';

type TaskWithAssociations = Prisma.TaskGetPayload<{
  include: {
    createdBy: { select: { id: true; email: true; name: true } };
    assignedTo: { select: { id: true; email: true; name: true } };
    _count: { select: { comments: true } };
  };
}>;

export class TaskService {
  async createTask(userId: string, input: CreateTaskInput): Promise<TaskWithAssociations> {
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
        _count: { select: { comments: true } },
      },
    });
  }

  private buildWhereClause(filters: TaskFilterInput): Prisma.TaskWhereInput {
    const conditions: Prisma.TaskWhereInput[] = [{ deletedAt: null }];

    if (filters.status) conditions.push({ status: filters.status });
    if (filters.priority) conditions.push({ priority: filters.priority });
    if (filters.assignedToId) conditions.push({ assignedToId: filters.assignedToId });
    if (filters.createdById) conditions.push({ createdById: filters.createdById });

    if (filters.tags) {
      const tagList = filters.tags.split(',').map((t) => t.trim()).filter(Boolean);
      if (tagList.length > 0) {
        conditions.push({ tags: { hasSome: tagList } });
      }
    }

    if (filters.search) {
      conditions.push({
        OR: [
          { title: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } },
        ],
      });
    }

    return conditions.length > 0 ? { AND: conditions } : {};
  }

  async getTasks(filters: TaskFilterInput): Promise<{
    data: TaskWithAssociations[];
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
          _count: { select: { comments: true } },
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

  async getTaskById(taskId: string): Promise<TaskWithAssociations | null> {
    return await prisma.task.findFirst({
      where: { id: taskId, deletedAt: null },
      include: {
        createdBy: {
          select: { id: true, email: true, name: true },
        },
        assignedTo: {
          select: { id: true, email: true, name: true },
        },
        _count: { select: { comments: true } },
      },
    });
  }

  async updateTask(taskId: string, input: UpdateTaskInput): Promise<TaskWithAssociations> {
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
        _count: { select: { comments: true } },
      },
    });
  }

  async deleteTask(taskId: string): Promise<void> {
    await prisma.task.update({
      where: { id: taskId },
      data: { deletedAt: new Date() },
    });
  }

  async getTaskStatus(taskId: string): Promise<TaskStatus | null> {
    const task = await prisma.task.findFirst({
      where: { id: taskId, deletedAt: null },
      select: { status: true },
    });
    return task?.status ?? null;
  }
}

export const taskService = new TaskService();
