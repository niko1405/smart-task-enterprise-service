import { Role, TaskStatus, Priority } from '@prisma/client';

// User Types
export interface UserPayload {
  userId: string;
  email: string;
  role: Role;
}

export interface AuthenticatedRequest extends Request {
  user?: UserPayload;
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  details?: Array<{ path: string; message: string }>;
}

// Task Types
export interface TaskFilter {
  status?: TaskStatus;
  priority?: Priority;
  assignedToId?: string;
  createdById?: string;
  tags?: string[];
  search?: string;
}

export interface TaskSort {
  field: 'createdAt' | 'updatedAt' | 'dueDate' | 'priority' | 'status';
  order: 'asc' | 'desc';
}

// Pagination Types
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
