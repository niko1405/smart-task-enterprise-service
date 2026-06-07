import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskForm } from '../src/components/tasks/TaskForm';
import { otherUser } from './fixtures';
import type { CreateTaskInput } from '../src/types';

describe('TaskForm', () => {
  it('validates required title', async () => {
    const onSubmit = jest.fn();
    render(
      <TaskForm
        users={[]}
        submitting={false}
        error={null}
        onSubmit={onSubmit}
        onCancel={jest.fn()}
      />
    );
    await userEvent.click(screen.getByRole('button', { name: /create task/i }));
    expect(await screen.findByText('Title is required')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('transforms tags and due date into the API shape', async () => {
    const onSubmit = jest.fn<void, [CreateTaskInput]>();
    render(
      <TaskForm
        users={[otherUser]}
        submitting={false}
        error={null}
        onSubmit={onSubmit}
        onCancel={jest.fn()}
      />
    );
    await userEvent.type(screen.getByLabelText('Title'), 'New task');
    await userEvent.type(screen.getByLabelText('Tags'), 'a, b , ,c');
    await userEvent.selectOptions(screen.getByLabelText('Priority'), 'HIGH');
    await userEvent.click(screen.getByRole('button', { name: /create task/i }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const input = onSubmit.mock.calls[0]?.[0];
    expect(input?.title).toBe('New task');
    expect(input?.priority).toBe('HIGH');
    expect(input?.tags).toEqual(['a', 'b', 'c']);
  });
});
