import { z } from 'zod';
import { TaskStatus, Priority } from '@prisma/client';

export const taskStatusSchema = z.enum([TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.DONE]);

export const taskPrioritySchema = z.enum([Priority.LOW, Priority.MEDIUM, Priority.HIGH]);

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  description: z.string().max(2000, 'Description must be less than 2000 characters').optional(),
  status: taskStatusSchema.default(TaskStatus.TODO),
  priority: taskPrioritySchema.default(Priority.MEDIUM),
  dueDate: z.string().datetime().optional(),
  tags: z.array(z.string()).max(10, 'Maximum 10 tags allowed').default([]),
  assignedToId: z.string().uuid().optional(),
});

export const updateTaskSchema = createTaskSchema.partial();

export const taskFilterSchema = z.object({
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  assignedToId: z.string().uuid().optional(),
  createdById: z.string().uuid().optional(),
  tags: z.string().optional(), // comma-separated
  search: z.string().optional(),
  page: z.string().default('1'),
  limit: z.string().default('10'),
  sortBy: z.enum(['createdAt', 'updatedAt', 'dueDate', 'priority', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const taskResponseSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  status: taskStatusSchema,
  priority: taskPrioritySchema,
  dueDate: z.date().nullable(),
  tags: z.array(z.string()),
  createdById: z.string(),
  assignedToId: z.string().nullable(),
  createdBy: z.object({
    id: z.string(),
    email: z.string(),
    name: z.string(),
  }).optional(),
  assignedTo: z.object({
    id: z.string(),
    email: z.string(),
    name: z.string(),
  }).nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type TaskFilterInput = z.infer<typeof taskFilterSchema>;
export type TaskResponse = z.infer<typeof taskResponseSchema>;
