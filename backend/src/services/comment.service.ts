import { prisma } from '../config/database';
import { CreateCommentInput, CommentQueryInput } from '../models/comment.model';
import { Prisma, Role } from '@prisma/client';
import { createError } from '../middleware/errorHandler';

const AUTHOR_SELECT = { id: true, email: true, name: true } as const;

type CommentWithAuthor = Prisma.CommentGetPayload<{
  include: { author: { select: { id: true; email: true; name: true } } };
}>;

export class CommentService {
  async getComments(
    taskId: string,
    query: CommentQueryInput
  ): Promise<{ data: CommentWithAuthor[]; nextCursor: string | null }> {
    const limit = parseInt(query.limit, 10);

    const comments = await prisma.comment.findMany({
      where: { taskId },
      include: { author: { select: AUTHOR_SELECT } },
      orderBy: { createdAt: 'asc' },
      take: limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    });

    const hasMore = comments.length > limit;
    const data = hasMore ? comments.slice(0, limit) : comments;
    const nextCursor = hasMore ? (data[data.length - 1]?.id ?? null) : null;

    return { data, nextCursor };
  }

  async createComment(
    taskId: string,
    authorId: string,
    input: CreateCommentInput
  ): Promise<CommentWithAuthor> {
    const task = await prisma.task.findFirst({
      where: { id: taskId, deletedAt: null },
      select: { id: true },
    });
    if (!task) {
      throw createError('Task not found', 404);
    }

    return await prisma.comment.create({
      data: { content: input.content, taskId, authorId },
      include: { author: { select: AUTHOR_SELECT } },
    });
  }

  async deleteComment(commentId: string, userId: string, userRole: Role): Promise<void> {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { authorId: true },
    });

    if (!comment) {
      throw createError('Comment not found', 404);
    }

    if (comment.authorId !== userId && userRole !== Role.ADMIN) {
      throw createError('You are not allowed to delete this comment', 403);
    }

    await prisma.comment.delete({ where: { id: commentId } });
  }
}

export const commentService = new CommentService();
