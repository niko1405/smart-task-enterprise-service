import { useCallback, useEffect, useState } from 'react';
import { getTask } from '../api/tasks';
import { toErrorMessage } from '../lib/errors';
import { useSocket } from './useSocket';
import type {
  StatusChangedPayload,
  Task,
  TaskDeletedPayload,
  TaskEventPayload,
} from '../types';

interface UseTaskResult {
  task: Task | null;
  loading: boolean;
  error: string | null;
  deleted: boolean;
  setTask: (task: Task) => void;
  reload: () => Promise<void>;
}

export function useTask(taskId: string): UseTaskResult {
  const socket = useSocket();
  const [task, setTaskState] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleted, setDeleted] = useState(false);

  const reload = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      setTaskState(await getTask(taskId));
    } catch (err) {
      setError(toErrorMessage(err, 'Failed to load task.'));
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (!socket) return;
    const onUpdated = ({ task: updated }: TaskEventPayload): void => {
      if (updated.id === taskId) setTaskState(updated);
    };
    const onStatus = (p: StatusChangedPayload): void => {
      if (p.taskId === taskId) {
        setTaskState((prev) => (prev ? { ...prev, status: p.newStatus } : prev));
      }
    };
    const onDeleted = ({ taskId: deletedId }: TaskDeletedPayload): void => {
      if (deletedId === taskId) setDeleted(true);
    };
    socket.on('task:updated', onUpdated);
    socket.on('task:statusChanged', onStatus);
    socket.on('task:deleted', onDeleted);
    return () => {
      socket.off('task:updated', onUpdated);
      socket.off('task:statusChanged', onStatus);
      socket.off('task:deleted', onDeleted);
    };
  }, [socket, taskId]);

  return { task, loading, error, deleted, setTask: setTaskState, reload };
}
