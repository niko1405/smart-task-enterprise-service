import { useMemo, useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Pencil, Trash2, User as UserIcon } from 'lucide-react';
import { useTask } from '../hooks/useTask';
import { useAuth } from '../hooks/useAuth';
import { ApiError } from '../lib/apiClient';
import { computeETag, deleteTask, updateTask } from '../api/tasks';
import { toErrorMessage } from '../lib/errors';
import { collectUsers } from '../lib/users';
import { formatDate } from '../lib/format';
import { PriorityBadge, StatusBadge } from '../components/tasks/badges';
import { TaskForm } from '../components/tasks/TaskForm';
import { CommentSection } from '../components/comments/CommentSection';
import { Button } from '../components/ui/Button';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { Modal } from '../components/ui/Modal';
import { Spinner } from '../components/ui/Spinner';
import { Alert } from '../components/ui/Alert';
import type { CreateTaskInput, Task } from '../types';

interface UseTaskActionsResult {
  editOpen: boolean;
  setEditOpen: (open: boolean) => void;
  confirmDeleteOpen: boolean;
  setConfirmDeleteOpen: (open: boolean) => void;
  submitting: boolean;
  formError: string | null;
  deleteError: string | null;
  canModify: boolean;
  handleUpdate: (input: CreateTaskInput) => Promise<void>;
  handleDelete: () => Promise<void>;
}

function useTaskActions(
  task: Task | null,
  userId: string | undefined,
  userRole: string | undefined,
  reload: () => Promise<void>
): UseTaskActionsResult {
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const canModify = task !== null && (userId === task.createdBy.id || userRole === 'ADMIN');

  async function handleUpdate(input: CreateTaskInput): Promise<void> {
    if (!task) return;
    setSubmitting(true);
    setFormError(null);
    try {
      await updateTask(task.id, input, computeETag(task));
      setEditOpen(false);
      await reload();
    } catch (err) {
      if (err instanceof ApiError && err.status === 412) {
        await reload();
        setFormError(
          'This task was changed elsewhere. We reloaded it — please review and try again.'
        );
      } else {
        setFormError(toErrorMessage(err, 'Could not update task.'));
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(): Promise<void> {
    if (!task) return;
    setDeleteError(null);
    try {
      await deleteTask(task.id);
      navigate('/');
    } catch (err) {
      setDeleteError(toErrorMessage(err, 'Could not delete task. You may not have permission.'));
    } finally {
      setConfirmDeleteOpen(false);
    }
  }

  return {
    editOpen,
    setEditOpen,
    confirmDeleteOpen,
    setConfirmDeleteOpen,
    submitting,
    formError,
    deleteError,
    canModify,
    handleUpdate,
    handleDelete,
  };
}

function MetaRow({ label, children }: { label: string; children: ReactNode }): JSX.Element {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-24 shrink-0 text-slate-400">{label}</span>
      <span className="text-slate-700">{children}</span>
    </div>
  );
}

function TaskMeta({ task }: { task: Task }): JSX.Element {
  return (
    <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <MetaRow label="Created by">{task.createdBy.name}</MetaRow>
      <MetaRow label="Assignee">
        <span className="inline-flex items-center gap-1">
          <UserIcon className="h-4 w-4 text-slate-400" />
          {task.assignedTo ? task.assignedTo.name : 'Unassigned'}
        </span>
      </MetaRow>
      <MetaRow label="Due date">
        <span className="inline-flex items-center gap-1">
          <CalendarDays className="h-4 w-4 text-slate-400" />
          {formatDate(task.dueDate)}
        </span>
      </MetaRow>
      {task.tags.length > 0 && (
        <MetaRow label="Tags">
          <span className="flex flex-wrap gap-1.5">
            {task.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
              >
                #{tag}
              </span>
            ))}
          </span>
        </MetaRow>
      )}
    </div>
  );
}

export function TaskDetailPage(): JSX.Element {
  const { id = '' } = useParams();
  const { user } = useAuth();
  const { task, loading, error, deleted, reload } = useTask(id);
  const users = useMemo(() => collectUsers(task ? [task] : [], user), [task, user]);
  const {
    editOpen,
    setEditOpen,
    confirmDeleteOpen,
    setConfirmDeleteOpen,
    submitting,
    formError,
    deleteError,
    canModify,
    handleUpdate,
    handleDelete,
  } = useTaskActions(task, user?.id, user?.role, reload);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (deleted) {
    return (
      <div className="space-y-4">
        <Alert message="This task has been deleted." />
        <Link to="/" className="text-sm font-medium text-indigo-600 hover:underline">
          ← Back to tasks
        </Link>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="space-y-4">
        <Alert message={error ?? 'Task not found.'} />
        <Link to="/" className="text-sm font-medium text-indigo-600 hover:underline">
          ← Back to tasks
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-indigo-600"
      >
        <ArrowLeft className="h-4 w-4" /> Back to tasks
      </Link>

      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-900">{task.title}</h2>
            <div className="flex items-center gap-2">
              <StatusBadge status={task.status} />
              <PriorityBadge priority={task.priority} />
            </div>
          </div>
          {canModify && (
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => setEditOpen(true)}>
                <Pencil className="h-4 w-4" /> Edit
              </Button>
              <Button variant="danger" size="sm" onClick={() => setConfirmDeleteOpen(true)}>
                <Trash2 className="h-4 w-4" /> Delete
              </Button>
            </div>
          )}
        </div>
        {task.description && (
          <p className="whitespace-pre-wrap text-sm text-slate-600">{task.description}</p>
        )}
      </div>

      {deleteError && <Alert message={deleteError} />}

      <TaskMeta task={task} />

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <CommentSection taskId={task.id} />
      </div>

      <ConfirmModal
        isOpen={confirmDeleteOpen}
        title="Delete task"
        message="Delete this task? This cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => void handleDelete()}
        onCancel={() => setConfirmDeleteOpen(false)}
        dangerous
      />

      <Modal open={editOpen} title="Edit task" onClose={() => setEditOpen(false)}>
        <TaskForm
          initial={task}
          users={users}
          submitting={submitting}
          error={formError}
          onSubmit={handleUpdate}
          onCancel={() => setEditOpen(false)}
        />
      </Modal>
    </div>
  );
}
