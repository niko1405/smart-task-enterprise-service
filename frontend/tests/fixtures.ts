import type { Comment, Task, User, UserSummary } from '../src/types';

export const adminUser: User = {
  id: 'admin-1',
  email: 'admin@smarttask.com',
  name: 'Admin User',
  role: 'ADMIN',
};

export const normalUser: User = {
  id: 'user-1',
  email: 'john.doe@example.com',
  name: 'John Doe',
  role: 'USER',
};

export const otherUser: UserSummary = {
  id: 'user-2',
  email: 'jane.smith@example.com',
  name: 'Jane Smith',
};

export function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    title: 'Implement feature',
    description: 'Some description',
    status: 'TODO',
    priority: 'MEDIUM',
    dueDate: '2025-01-15T00:00:00.000Z',
    tags: ['frontend'],
    createdById: normalUser.id,
    assignedToId: otherUser.id,
    createdBy: { id: normalUser.id, email: normalUser.email, name: normalUser.name },
    assignedTo: otherUser,
    createdAt: '2026-06-07T12:00:00.000Z',
    updatedAt: '2026-06-07T12:30:00.000Z',
    _count: { comments: 2 },
    ...overrides,
  };
}

export function makeComment(overrides: Partial<Comment> = {}): Comment {
  return {
    id: 'comment-1',
    content: 'Looks good!',
    taskId: 'task-1',
    authorId: normalUser.id,
    author: { id: normalUser.id, email: normalUser.email, name: normalUser.name },
    createdAt: '2026-06-07T13:00:00.000Z',
    ...overrides,
  };
}
