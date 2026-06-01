import { Router, Request, Response, NextFunction } from 'express';
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
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await taskService.getTasks(req.query, req.user!.userId);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
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
 *     responses:
 *       200:
 *         description: Task found
 *       404:
 *         description: Task not found
 */
router.get(
  '/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const task = await taskService.getTaskById(req.params.id);
      if (!task) {
        return res.status(404).json({
          success: false,
          error: 'Task not found',
        });
      }
      res.status(200).json({
        success: true,
        data: task,
      });
    } catch (error) {
      next(error);
    }
  }
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
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const task = await taskService.createTask(req.user!.userId, req.body);

      // Emit WebSocket event
      emitTaskCreated(io, task);

      res.status(201).json({
        success: true,
        data: task,
      });
    } catch (error) {
      next(error);
    }
  }
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
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Task'
 *     responses:
 *       200:
 *         description: Task updated
 */
router.patch(
  '/:id',
  validateBody(updateTaskSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const oldTask = await taskService.getTaskById(req.params.id);
      if (!oldTask) {
        return res.status(404).json({
          success: false,
          error: 'Task not found',
        });
      }

      const oldStatus = oldTask.status;
      const task = await taskService.updateTask(req.params.id, req.body);

      // Emit WebSocket events
      emitTaskUpdated(io, task);

      if (req.body.status && req.body.status !== oldStatus) {
        emitTaskStatusChanged(io, task.id, oldStatus, req.body.status);

        // Send email if status changed to DONE
        if (req.body.status === TaskStatus.DONE) {
          await emailService.sendTaskCompletionEmail(task);
        }
      }

      res.status(200).json({
        success: true,
        data: task,
      });
    } catch (error) {
      next(error);
    }
  }
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
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await taskService.deleteTask(req.params.id);

      // Emit WebSocket event
      emitTaskDeleted(io, req.params.id);

      res.status(200).json({
        success: true,
        message: 'Task deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

export { router as taskRouter };
