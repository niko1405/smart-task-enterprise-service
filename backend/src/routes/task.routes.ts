import { Router } from 'express';
import { createTaskSchema, updateTaskSchema, taskFilterSchema } from '../models/task.model';
import { validateBody, validateQuery } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { requireTaskOwnershipHandler } from '../middleware/ownership';
import { asyncHandler } from '../utils/asyncHandler';
import * as taskController from '../controllers/task.controller';

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
router.get('/', validateQuery(taskFilterSchema), asyncHandler(taskController.listTasks));

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
router.get('/:id', asyncHandler(taskController.getTask));

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
router.post('/', validateBody(createTaskSchema), asyncHandler(taskController.createTask));

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
  requireTaskOwnershipHandler,
  validateBody(updateTaskSchema),
  asyncHandler(taskController.updateTask)
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
router.delete('/:id', requireTaskOwnershipHandler, asyncHandler(taskController.deleteTask));

export { router as taskRouter };
