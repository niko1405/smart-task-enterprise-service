import { apiClient } from '../lib/apiClient';
import type { Comment, CommentsPage } from '../types';

interface SuccessEnvelope<T> {
  success: boolean;
  data: T;
}

export async function listComments(
  taskId: string,
  options: { limit?: number; cursor?: string } = {}
): Promise<CommentsPage> {
  const params: Record<string, string> = {};
  if (options.limit) params.limit = String(options.limit);
  if (options.cursor) params.cursor = options.cursor;
  const res = await apiClient.get<SuccessEnvelope<CommentsPage>>(`/tasks/${taskId}/comments`, {
    params,
  });
  return res.data.data;
}

export async function createComment(taskId: string, content: string): Promise<Comment> {
  const res = await apiClient.post<SuccessEnvelope<Comment>>(`/tasks/${taskId}/comments`, {
    content,
  });
  return res.data.data;
}

export async function deleteComment(taskId: string, commentId: string): Promise<void> {
  await apiClient.delete(`/tasks/${taskId}/comments/${commentId}`);
}
