import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { useTasks } from '../hooks/useTasks';
import { useAuth } from '../hooks/useAuth';
import { createTask, computeETag, updateTask } from '../api/tasks';
import { toErrorMessage } from '../lib/errors';
import { TaskFilters } from '../components/tasks/TaskFilters';
import { TaskCard } from '../components/tasks/TaskCard';
import { TaskForm } from '../components/tasks/TaskForm';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Spinner } from '../components/ui/Spinner';
import { Alert } from '../components/ui/Alert';
import { Pager } from '../components/tasks/Pager';
import { collectUsers } from '../lib/users';
import type { CreateTaskInput, Task, TaskStatus } from '../types';

export function DashboardPage(): JSX.Element {
  const { user } = useAuth();
  const { tasks, pagination, loading, error, filters, setFilters, refetch } =
    useTasks();
  const [createOpen, setCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const users = useMemo(
    () => collectUsers(tasks, user),
    [tasks, user]
  );

  async function handleCreate(input: CreateTaskInput): Promise<void> {
    setSubmitting(true);
    setFormError(null);
    try {
      await createTask(input);
      setCreateOpen(false);
    } catch (err) {
      setFormError(toErrorMessage(err, 'Could not create task.'));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatusChange(
    task: Task,
    status: TaskStatus
  ): Promise<void> {
    if (task.status === status) return;
    try {
      await updateTask(task.id, { status }, computeETag(task));
    } catch {
      refetch();
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Tasks</h2>
          <p className="text-sm text-slate-500">
            {pagination ? `${pagination.total} total` : 'Loading tasks…'}
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" /> New task
        </Button>
      </div>

      <TaskFilters filters={filters} onChange={setFilters} />

      {error && <Alert message={error} />}

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-8 w-8" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center text-slate-500">
          No tasks match your filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <Pager
          pagination={pagination}
          onPage={(page) => setFilters({ page })}
        />
      )}

      <Modal
        open={createOpen}
        title="Create task"
        onClose={() => setCreateOpen(false)}
      >
        <TaskForm
          users={users}
          submitting={submitting}
          error={formError}
          onSubmit={handleCreate}
          onCancel={() => setCreateOpen(false)}
        />
      </Modal>
    </div>
  );
}
