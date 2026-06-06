import { Router, Request, Response } from 'express';
import { taskService } from '../services/task.service';
import { emailService } from '../services/email.service';
import { createTaskSchema, updateTaskSchema, taskFilterSchema } from '../models/task.model';
import { validateBody, validateQuery } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { io } from '../index';
import {
  emitTaskCreated,
  emitTaskUpdated,
  emitTaskStatusChanged,
  emitTaskDeleted,
} from '../websocket/handlers';
import { TaskStatus } from '@prisma/client';
import { TaskFilterInput } from '../models/task.model';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

// All task routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /tasks:
 *   get:
 *     summary: Get all tasks with filtering and pagination
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [TODO, IN_PROGRESS, DONE]
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [LOW, MEDIUM, HIGH]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of tasks
 */
router.get(
  '/',
  validateQuery(taskFilterSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await taskService.getTasks(req.query as unknown as TaskFilterInput);
    res.status(200).json({
      success: true,
      data: result,
    });
  })
);

/**
 * @swagger
 * /tasks/{id}:
 *   get:
 *     summary: Get task by ID
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: header
 *         name: If-None-Match
 *         schema:
 *           type: string
 *         description: ETag value from previous response – returns 304 if unchanged
 *     responses:
 *       200:
 *         description: Task found
 *         headers:
 *           ETag:
 *             schema:
 *               type: string
 *       304:
 *         description: Not Modified (cache still valid)
 *       404:
 *         description: Task not found
 */
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const task = await taskService.getTaskById(req.params['id'] as string);
    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found',
      });
    }
    const etag = `"${task.id}-${task.updatedAt.getTime()}"`;
    const ifNoneMatch = req.headers['if-none-match'];
    if (ifNoneMatch && ifNoneMatch === etag) {
      return res.status(304).send();
    }
    res.setHeader('ETag', etag);
    return res.status(200).json({
      success: true,
      data: task,
    });
  })
);

/**
 * @swagger
 * /tasks:
 *   post:
 *     summary: Create a new task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Task'
 *     responses:
 *       201:
 *         description: Task created
 */
router.post(
  '/',
  validateBody(createTaskSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const task = await taskService.createTask(req.user!.userId, req.body);

    // Emit WebSocket event
    emitTaskCreated(io, task);

    res.status(201).json({
      success: true,
      data: task,
    });
  })
);

/**
 * @swagger
 * /tasks/{id}:
 *   patch:
 *     summary: Update a task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: header
 *         name: If-Match
 *         schema:
 *           type: string
 *         description: ETag for optimistic locking – returns 412 if resource was modified
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Task'
 *     responses:
 *       204:
 *         description: Task updated (no content)
 *         headers:
 *           ETag:
 *             schema:
 *               type: string
 *       404:
 *         description: Task not found
 *       412:
 *         description: Precondition Failed – resource was modified since last fetch
 */
router.patch(
  '/:id',
  validateBody(updateTaskSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const oldTask = await taskService.getTaskById(req.params['id'] as string);
    if (!oldTask) {
      return res.status(404).json({
        success: false,
        error: 'Task not found',
      });
    }

    const ifMatch = req.headers['if-match'];
    if (ifMatch) {
      const currentEtag = `"${oldTask.id}-${oldTask.updatedAt.getTime()}"`;
      if (ifMatch !== currentEtag) {
        return res.status(412).json({
          success: false,
          error: 'Precondition Failed – resource was modified since last fetch',
        });
      }
    }

    const oldStatus = oldTask.status;
    const task = await taskService.updateTask(req.params['id'] as string, req.body);

    // Emit WebSocket events
    emitTaskUpdated(io, task);

    if (req.body.status && req.body.status !== oldStatus) {
      emitTaskStatusChanged(io, task.id, oldStatus, req.body.status);

      // Send email if status changed to DONE
      if (req.body.status === TaskStatus.DONE) {
        await emailService.sendTaskCompletionEmail(task);
      }
    }

    const newEtag = `"${task.id}-${task.updatedAt.getTime()}"`;
    res.setHeader('ETag', newEtag);
    return res.status(204).send();
  })
);

/**
 * @swagger
 * /tasks/{id}:
 *   delete:
 *     summary: Delete a task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Task deleted
 */
router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    await taskService.deleteTask(req.params['id'] as string);

    // Emit WebSocket event
    emitTaskDeleted(io, req.params['id'] as string);

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
    });
  })
);

export { router as taskRouter };
