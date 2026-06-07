import { Router, Request, Response } from 'express';
import { commentService } from '../services/comment.service';
import { createCommentSchema, commentQuerySchema } from '../models/comment.model';
import { validateBody, validateQuery } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { io } from '../index';
import { emitCommentAdded, emitCommentDeleted } from '../websocket/handlers';
import { Role } from '@prisma/client';

const router = Router({ mergeParams: true });

router.use(authenticate);

/**
 * @swagger
 * /tasks/{id}/comments:
 *   get:
 *     summary: Get comments for a task (cursor-based pagination)
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: Task ID
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *         description: Number of comments to return
 *       - in: query
 *         name: cursor
 *         schema: { type: string, format: uuid }
 *         description: Comment ID to paginate from (exclusive)
 *     responses:
 *       200:
 *         description: List of comments with pagination cursor
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Task not found
 */
router.get(
  '/',
  validateQuery(commentQuerySchema),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const taskId = req.params['id'] as string;
    const result = await commentService.getComments(taskId, req.query as never);
    res.status(200).json({ success: true, data: result });
  })
);

/**
 * @swagger
 * /tasks/{id}/comments:
 *   post:
 *     summary: Add a comment to a task
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: Task ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 2000
 *     responses:
 *       201:
 *         description: Comment created
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Task not found
 */
router.post(
  '/',
  validateBody(createCommentSchema),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const taskId = req.params['id'] as string;
    const userId = req.user!.userId;

    const comment = await commentService.createComment(taskId, userId, req.body as never);

    emitCommentAdded(io, taskId, comment);

    res.status(201).json({ success: true, data: comment });
  })
);

/**
 * @swagger
 * /tasks/{id}/comments/{commentId}:
 *   delete:
 *     summary: Delete a comment (author or ADMIN only)
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: Task ID
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: Comment ID
 *     responses:
 *       200:
 *         description: Comment deleted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not allowed
 *       404:
 *         description: Comment not found
 */
router.delete(
  '/:commentId',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const taskId = req.params['id'] as string;
    const commentId = req.params['commentId'] as string;
    const userId = req.user!.userId;
    const userRole = req.user!.role as Role;

    await commentService.deleteComment(commentId, userId, userRole);

    emitCommentDeleted(io, taskId, commentId);

    res.status(200).json({ success: true, message: 'Comment deleted successfully' });
  })
);

export { router as commentRouter };
