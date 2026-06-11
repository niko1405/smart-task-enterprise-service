import { Request, Response } from 'express';
import { authService } from '../services/auth.service';

export const register = async (req: Request, res: Response): Promise<void> => {
  const result = await authService.register(req.body);
  res.status(201).json({
    success: true,
    data: result,
  });
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const result = await authService.login(req.body);
  res.status(200).json({
    success: true,
    data: result,
  });
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  const user = await authService.getMe(req.user!.userId);
  if (!user) {
    res.status(404).json({
      success: false,
      error: 'User not found',
    });
    return;
  }
  res.status(200).json({
    success: true,
    data: user,
  });
};
