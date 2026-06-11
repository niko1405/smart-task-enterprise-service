import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { prisma } from '../config/database';

export const requireTaskOwnership = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const taskId = req.params['id'] as string;
  const userId = req.user?.userId;
  const userRole = req.user?.role;

  if (!userId) {
    res.status(401).json({ success: false, error: 'Not authenticated.' });
    return;
  }

  if (userRole === Role.ADMIN) {
    next();
    return;
  }

  const task = await prisma.task.findFirst({
    where: { id: taskId, deletedAt: null },
    select: { createdById: true },
  });

  if (!task) {
    res.status(404).json({ success: false, error: 'Task not found' });
    return;
  }

  if (task.createdById !== userId) {
    res.status(403).json({
      success: false,
      error: 'Access denied. You are not the owner of this task.',
    });
    return;
  }

  next();
};

export const requireTaskOwnershipHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  requireTaskOwnership(req, res, next).catch(next);
};
