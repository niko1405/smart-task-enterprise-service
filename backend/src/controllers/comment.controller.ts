import { Request, Response } from 'express';
import { commentService } from '../services/comment.service';
import { CommentQueryInput } from '../models/comment.model';
import { Role } from '@prisma/client';
import { emitCommentAdded, emitCommentDeleted } from '../websocket/handlers';
import { getIO } from '../websocket/io';
import { sanitizeCommentInput } from '../utils/sanitize';

export const listComments = async (req: Request, res: Response): Promise<void> => {
  const taskId = req.params['id'] as string;
  const result = await commentService.getComments(taskId, req.query as unknown as CommentQueryInput);
  res.status(200).json({ success: true, data: result });
};

export const createComment = async (req: Request, res: Response): Promise<void> => {
  const taskId = req.params['id'] as string;
  const userId = req.user!.userId;
  const comment = await commentService.createComment(taskId, userId, sanitizeCommentInput(req.body));
  emitCommentAdded(getIO(), taskId, comment);
  res.status(201).json({ success: true, data: comment });
};

export const deleteComment = async (req: Request, res: Response): Promise<void> => {
  const taskId = req.params['id'] as string;
  const commentId = req.params['commentId'] as string;
  const userId = req.user!.userId;
  const userRole = req.user!.role as Role;
  await commentService.deleteComment(commentId, userId, userRole);
  emitCommentDeleted(getIO(), taskId, commentId);
  res.status(200).json({ success: true, message: 'Comment deleted successfully' });
};
