export type Role = 'USER' | 'ADMIN';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export interface UserSummary {
  id: string;
  email: string;
  name: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: Priority;
  dueDate: string | null;
  tags: string[];
  createdById: string;
  assignedToId: string | null;
  createdBy: UserSummary;
  assignedTo: UserSummary | null;
  createdAt: string;
  updatedAt: string;
  _count: { comments: number };
}

export interface Comment {
  id: string;
  content: string;
  taskId: string;
  authorId: string;
  author: UserSummary;
  createdAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedTasks {
  data: Task[];
  pagination: Pagination;
}

export interface CommentsPage {
  data: Comment[];
  nextCursor: string | null;
}

export interface AuthPayload {
  user: User;
  token: string;
}

export interface TaskFilters {
  status?: TaskStatus | '';
  priority?: Priority | '';
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'dueDate' | 'priority' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: Priority;
  dueDate?: string | null;
  tags?: string[];
  assignedToId?: string | null;
}

export type UpdateTaskInput = Partial<CreateTaskInput>;

// Socket event payloads
export interface TaskEventPayload {
  task: Task;
}
export interface StatusChangedPayload {
  taskId: string;
  oldStatus: TaskStatus;
  newStatus: TaskStatus;
}
export interface TaskDeletedPayload {
  taskId: string;
}
export interface CommentAddedPayload {
  comment: Comment;
}
export interface CommentDeletedPayload {
  commentId: string;
}
