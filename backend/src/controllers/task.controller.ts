import { Request, Response } from 'express';
import { taskService } from '../services/task.service';
import { emailService } from '../services/email.service';
import { TaskFilterInput } from '../models/task.model';
import { TaskStatus } from '@prisma/client';
import {
  emitTaskCreated,
  emitTaskUpdated,
  emitTaskStatusChanged,
  emitTaskDeleted,
} from '../websocket/handlers';
import { getIO } from '../websocket/io';
import { sanitizeTaskInput } from '../utils/sanitize';

export const listTasks = async (req: Request, res: Response): Promise<void> => {
  const result = await taskService.getTasks(req.query as unknown as TaskFilterInput);
  res.status(200).json({
    success: true,
    data: result,
  });
};

export const getTask = async (req: Request, res: Response): Promise<void> => {
  const task = await taskService.getTaskById(req.params['id'] as string);
  if (!task) {
    res.status(404).json({ success: false, error: 'Task not found' });
    return;
  }
  const etag = `"${task.id}-${task.updatedAt.getTime()}"`;
  const ifNoneMatch = req.headers['if-none-match'];
  if (ifNoneMatch && ifNoneMatch === etag) {
    res.status(304).send();
    return;
  }
  res.setHeader('ETag', etag);
  res.status(200).json({ success: true, data: task });
};

export const createTask = async (req: Request, res: Response): Promise<void> => {
  const task = await taskService.createTask(req.user!.userId, sanitizeTaskInput(req.body));
  emitTaskCreated(getIO(), task);
  res.status(201).json({ success: true, data: task });
};

export const updateTask = async (req: Request, res: Response): Promise<void> => {
  const oldTask = await taskService.getTaskById(req.params['id'] as string);
  if (!oldTask) {
    res.status(404).json({ success: false, error: 'Task not found' });
    return;
  }

  const ifMatch = req.headers['if-match'];
  if (ifMatch) {
    const currentEtag = `"${oldTask.id}-${oldTask.updatedAt.getTime()}"`;
    if (ifMatch !== currentEtag) {
      res.status(412).json({
        success: false,
        error: 'Precondition Failed – resource was modified since last fetch',
      });
      return;
    }
  }

  const oldStatus = oldTask.status;
  const task = await taskService.updateTask(req.params['id'] as string, sanitizeTaskInput(req.body));

  emitTaskUpdated(getIO(), task);

  if (req.body.status && req.body.status !== oldStatus) {
    emitTaskStatusChanged(getIO(), task.id, oldStatus, req.body.status);
    if (req.body.status === TaskStatus.DONE) {
      await emailService.sendTaskCompletionEmail(task);
    }
  }

  const newEtag = `"${task.id}-${task.updatedAt.getTime()}"`;
  res.setHeader('ETag', newEtag);
  res.status(204).send();
};

export const deleteTask = async (req: Request, res: Response): Promise<void> => {
  await taskService.deleteTask(req.params['id'] as string);
  emitTaskDeleted(getIO(), req.params['id'] as string);
  res.status(200).json({ success: true, message: 'Task deleted successfully' });
};
