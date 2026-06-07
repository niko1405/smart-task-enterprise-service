import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Field } from '../ui/Field';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';
import type { CreateTaskInput, Task, UserSummary } from '../../types';

const schema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long'),
  description: z.string().max(2000, 'Description is too long').optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  dueDate: z.string().optional(),
  tags: z.string().optional(),
  assignedToId: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface TaskFormProps {
  initial?: Task;
  users: UserSummary[];
  submitting: boolean;
  error: string | null;
  onSubmit: (input: CreateTaskInput) => void;
  onCancel: () => void;
}

function defaults(initial?: Task): FormValues {
  return {
    title: initial?.title ?? '',
    description: initial?.description ?? '',
    status: initial?.status ?? 'TODO',
    priority: initial?.priority ?? 'MEDIUM',
    dueDate: initial?.dueDate ? initial.dueDate.slice(0, 10) : '',
    tags: initial?.tags?.join(', ') ?? '',
    assignedToId: initial?.assignedToId ?? '',
  };
}

function toInput(values: FormValues): CreateTaskInput {
  const tags = (values.tags ?? '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 10);
  const input: CreateTaskInput = {
    title: values.title.trim(),
    description: values.description?.trim() || undefined,
    status: values.status,
    priority: values.priority,
    tags,
  };
  if (values.dueDate) input.dueDate = new Date(values.dueDate).toISOString();
  if (values.assignedToId) input.assignedToId = values.assignedToId;
  return input;
}

export function TaskForm({
  initial,
  users,
  submitting,
  error,
  onSubmit,
  onCancel,
}: TaskFormProps): JSX.Element {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaults(initial),
  });

  const submit = handleSubmit((values) => onSubmit(toInput(values)));

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      {error && <Alert message={error} />}
      <Field label="Title" htmlFor="title" error={errors.title?.message}>
        <Input id="title" placeholder="Task title" invalid={!!errors.title} {...register('title')} />
      </Field>
      <Field label="Description" htmlFor="description" error={errors.description?.message}>
        <Textarea id="description" rows={3} placeholder="Optional details" {...register('description')} />
      </Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Status" htmlFor="status">
          <Select id="status" {...register('status')}>
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="DONE">Done</option>
          </Select>
        </Field>
        <Field label="Priority" htmlFor="priority">
          <Select id="priority" {...register('priority')}>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </Select>
        </Field>
        <Field label="Due date" htmlFor="dueDate">
          <Input id="dueDate" type="date" {...register('dueDate')} />
        </Field>
        <Field label="Assignee" htmlFor="assignedToId">
          <Select id="assignedToId" {...register('assignedToId')}>
            <option value="">Unassigned</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label="Tags" htmlFor="tags" error={errors.tags?.message}>
        <Input id="tags" placeholder="comma, separated, tags" {...register('tags')} />
      </Field>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          {initial ? 'Save changes' : 'Create task'}
        </Button>
      </div>
    </form>
  );
}
