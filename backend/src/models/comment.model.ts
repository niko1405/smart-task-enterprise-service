import { z } from 'zod';

export const createCommentSchema = z.object({
  content: z
    .string()
    .min(1, 'Comment cannot be empty')
    .max(2000, 'Comment must be less than 2000 characters'),
});

export const commentQuerySchema = z.object({
  limit: z
    .string()
    .default('20')
    .refine(
      (s) => {
        const n = parseInt(s, 10);
        return !isNaN(n) && n >= 1 && n <= 100;
      },
      { message: 'Limit must be between 1 and 100' }
    ),
  cursor: z.string().uuid().optional(),
});

export const commentResponseSchema = z.object({
  id: z.string(),
  content: z.string(),
  taskId: z.string(),
  authorId: z.string(),
  author: z.object({
    id: z.string(),
    email: z.string(),
    name: z.string(),
  }),
  createdAt: z.date(),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type CommentQueryInput = z.infer<typeof commentQuerySchema>;
export type CommentResponse = z.infer<typeof commentResponseSchema>;
