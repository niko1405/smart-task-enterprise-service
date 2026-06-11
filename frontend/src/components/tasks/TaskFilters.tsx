import { Search } from 'lucide-react';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import type { TaskFilters as Filters } from '../../types';

interface TaskFiltersProps {
  filters: Filters;
  onChange: (update: Partial<Filters>) => void;
}

export function TaskFilters({ filters, onChange }: TaskFiltersProps): JSX.Element {
  return (
    <div className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
      <div className="relative sm:col-span-2 lg:col-span-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          aria-label="Search tasks"
          placeholder="Search tasks..."
          className="pl-9"
          value={filters.search ?? ''}
          onChange={(e) => onChange({ search: e.target.value })}
        />
      </div>
      <Select
        aria-label="Filter by status"
        value={filters.status ?? ''}
        onChange={(e) => onChange({ status: e.target.value as Filters['status'] })}
      >
        <option value="">All statuses</option>
        <option value="TODO">To Do</option>
        <option value="IN_PROGRESS">In Progress</option>
        <option value="DONE">Done</option>
      </Select>
      <Select
        aria-label="Filter by priority"
        value={filters.priority ?? ''}
        onChange={(e) => onChange({ priority: e.target.value as Filters['priority'] })}
      >
        <option value="">All priorities</option>
        <option value="LOW">Low</option>
        <option value="MEDIUM">Medium</option>
        <option value="HIGH">High</option>
      </Select>
      <Select
        aria-label="Sort by"
        value={`${filters.sortBy}:${filters.sortOrder}`}
        onChange={(e) => {
          const [sortBy, sortOrder] = e.target.value.split(':');
          onChange({
            sortBy: sortBy as Filters['sortBy'],
            sortOrder: sortOrder as Filters['sortOrder'],
          });
        }}
      >
        <option value="createdAt:desc">Newest first</option>
        <option value="createdAt:asc">Oldest first</option>
        <option value="dueDate:asc">Due date ↑</option>
        <option value="priority:desc">Priority ↓</option>
        <option value="status:asc">Status</option>
      </Select>
    </div>
  );
}
