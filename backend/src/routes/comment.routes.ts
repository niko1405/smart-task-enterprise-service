import { Router } from 'express';
import { createCommentSchema, commentQuerySchema } from '../models/comment.model';
import { validateBody, validateQuery } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import * as commentController from '../controllers/comment.controller';

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
router.get('/', validateQuery(commentQuerySchema), asyncHandler(commentController.listComments));

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
router.post('/', validateBody(createCommentSchema), asyncHandler(commentController.createComment));

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
router.delete('/:commentId', asyncHandler(commentController.deleteComment));

export { router as commentRouter };
