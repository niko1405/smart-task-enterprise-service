import { apiClient } from '../lib/apiClient';
import type {
  CreateTaskInput,
  PaginatedTasks,
  Task,
  TaskFilters,
  UpdateTaskInput,
} from '../types';

interface SuccessEnvelope<T> {
  success: boolean;
  data: T;
}

// The backend derives its ETag as `"<id>-<updatedAt epoch ms>"`. We reconstruct
// it from the task body so optimistic-locking works without relying on the
// (cross-origin, non-exposed) ETag response header.
export function computeETag(task: Pick<Task, 'id' | 'updatedAt'>): string {
  return `"${task.id}-${new Date(task.updatedAt).getTime()}"`;
}

function buildParams(filters: TaskFilters): Record<string, string> {
  const params: Record<string, string> = {};
  if (filters.status) params.status = filters.status;
  if (filters.priority) params.priority = filters.priority;
  if (filters.search) params.search = filters.search;
  if (filters.page) params.page = String(filters.page);
  if (filters.limit) params.limit = String(filters.limit);
  if (filters.sortBy) params.sortBy = filters.sortBy;
  if (filters.sortOrder) params.sortOrder = filters.sortOrder;
  return params;
}

export async function listTasks(
  filters: TaskFilters = {}
): Promise<PaginatedTasks> {
  const res = await apiClient.get<SuccessEnvelope<PaginatedTasks>>('/tasks', {
    params: buildParams(filters),
  });
  return res.data.data;
}

export async function getTask(id: string): Promise<Task> {
  const res = await apiClient.get<SuccessEnvelope<Task>>(`/tasks/${id}`);
  return res.data.data;
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const res = await apiClient.post<SuccessEnvelope<Task>>('/tasks', input);
  return res.data.data;
}

// Sends `If-Match` for optimistic locking. Throws ApiError(status=412) on a
// concurrent-modification conflict so callers can re-fetch and retry.
export async function updateTask(
  id: string,
  input: UpdateTaskInput,
  etag?: string
): Promise<void> {
  await apiClient.patch(`/tasks/${id}`, input, {
    headers: etag ? { 'If-Match': etag } : undefined,
  });
}

export async function deleteTask(id: string): Promise<void> {
  await apiClient.delete(`/tasks/${id}`);
}
