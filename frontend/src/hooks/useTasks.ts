import { useCallback, useEffect, useRef, useState } from 'react';
import type { MutableRefObject, Dispatch, SetStateAction } from 'react';
import type { Socket } from 'socket.io-client';
import { listTasks } from '../api/tasks';
import { toErrorMessage } from '../lib/errors';
import { useSocket } from './useSocket';
import type {
  Pagination,
  StatusChangedPayload,
  Task,
  TaskDeletedPayload,
  TaskEventPayload,
  TaskFilters,
} from '../types';

const DEFAULT_LIMIT = 10;

function bindTaskSocketHandlers(
  socket: Socket,
  filtersRef: MutableRefObject<TaskFilters>,
  setTasks: Dispatch<SetStateAction<Task[]>>
): () => void {
  const onPage1 = (): boolean => (filtersRef.current.page ?? 1) === 1;

  const onCreated = ({ task }: TaskEventPayload): void => {
    if (!onPage1() || !matchesFilters(task, filtersRef.current)) return;
    setTasks((prev) => (prev.some((t) => t.id === task.id) ? prev : [task, ...prev]));
  };

  const onUpdated = ({ task }: TaskEventPayload): void => {
    setTasks((prev) => {
      const exists = prev.some((t) => t.id === task.id);
      if (matchesFilters(task, filtersRef.current)) {
        if (exists) return prev.map((t) => (t.id === task.id ? task : t));
        return onPage1() ? [task, ...prev] : prev;
      }
      return prev.filter((t) => t.id !== task.id);
    });
  };

  const onStatusChanged = (p: StatusChangedPayload): void => {
    setTasks((prev) => prev.map((t) => (t.id === p.taskId ? { ...t, status: p.newStatus } : t)));
  };

  const onDeleted = ({ taskId }: TaskDeletedPayload): void => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  socket.on('task:created', onCreated);
  socket.on('task:updated', onUpdated);
  socket.on('task:statusChanged', onStatusChanged);
  socket.on('task:deleted', onDeleted);

  return (): void => {
    socket.off('task:created', onCreated);
    socket.off('task:updated', onUpdated);
    socket.off('task:statusChanged', onStatusChanged);
    socket.off('task:deleted', onDeleted);
  };
}

export function matchesFilters(task: Task, filters: TaskFilters): boolean {
  if (filters.status && task.status !== filters.status) return false;
  if (filters.priority && task.priority !== filters.priority) return false;
  if (filters.search) {
    const q = filters.search.toLowerCase();
    const haystack = `${task.title} ${task.description ?? ''}`.toLowerCase();
    if (!haystack.includes(q)) return false;
  }
  return true;
}

interface UseTasksResult {
  tasks: Task[];
  pagination: Pagination | null;
  loading: boolean;
  error: string | null;
  filters: TaskFilters;
  setFilters: (update: Partial<TaskFilters>) => void;
  refetch: () => void;
}

export function useTasks(): UseTasksResult {
  const socket = useSocket();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<TaskFilters>({
    page: 1,
    limit: DEFAULT_LIMIT,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  const fetchTasks = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const result = await listTasks(filtersRef.current);
      setTasks(result.data);
      setPagination(result.pagination);
    } catch (err) {
      setError(toErrorMessage(err, 'Failed to load tasks.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchTasks();
  }, [fetchTasks, filters]);

  const setFilters = useCallback((update: Partial<TaskFilters>): void => {
    setFiltersState((prev) => {
      const resetsPage = 'page' in update ? {} : { page: 1 };
      return { ...prev, ...resetsPage, ...update };
    });
  }, []);

  useEffect(() => {
    if (!socket) return;
    return bindTaskSocketHandlers(socket, filtersRef, setTasks);
  }, [socket]);

  return {
    tasks,
    pagination,
    loading,
    error,
    filters,
    setFilters,
    refetch: fetchTasks,
  };
}
