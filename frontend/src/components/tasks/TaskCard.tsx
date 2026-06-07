import { Link } from 'react-router-dom';
import { CalendarDays, MessageSquare } from 'lucide-react';
import { PriorityBadge, StatusBadge } from './badges';
import { Select } from '../ui/Select';
import { formatDate, initials } from '../../lib/format';
import type { Task, TaskStatus } from '../../types';

interface TaskCardProps {
  task: Task;
  onStatusChange: (task: Task, status: TaskStatus) => void;
}

export function TaskCard({ task, onStatusChange }: TaskCardProps): JSX.Element {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <Link
          to={`/tasks/${task.id}`}
          className="font-semibold text-slate-900 hover:text-indigo-600"
        >
          {task.title}
        </Link>
        <PriorityBadge priority={task.priority} />
      </div>

      {task.description && (
        <p className="line-clamp-2 text-sm text-slate-500">{task.description}</p>
      )}

      {task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {task.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="h-4 w-4" /> {formatDate(task.dueDate)}
          </span>
          <Link
            to={`/tasks/${task.id}`}
            className="inline-flex items-center gap-1 hover:text-indigo-600"
          >
            <MessageSquare className="h-4 w-4" /> {task._count.comments}
          </Link>
          {task.assignedTo && (
            <span
              title={task.assignedTo.name}
              className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-semibold text-indigo-700"
            >
              {initials(task.assignedTo.name)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={task.status} />
          <Select
            aria-label="Change status"
            value={task.status}
            onChange={(e) => onStatusChange(task, e.target.value as TaskStatus)}
            className="w-auto py-1 text-xs"
          >
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="DONE">Done</option>
          </Select>
        </div>
      </div>
    </div>
  );
}
