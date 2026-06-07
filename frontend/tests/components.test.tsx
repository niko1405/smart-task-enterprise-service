import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Button } from '../src/components/ui/Button';
import { Alert } from '../src/components/ui/Alert';
import { StatusBadge, PriorityBadge } from '../src/components/tasks/badges';
import { TaskCard } from '../src/components/tasks/TaskCard';
import { TaskFilters } from '../src/components/tasks/TaskFilters';
import { CommentItem } from '../src/components/comments/CommentItem';
import { makeTask, makeComment, normalUser } from './fixtures';

describe('UI primitives', () => {
  it('renders a button and disables while loading', () => {
    render(<Button loading>Save</Button>);
    expect(screen.getByRole('button', { name: /save/i })).toBeDisabled();
  });

  it('renders an alert with role=alert', () => {
    render(<Alert message="Something failed" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Something failed');
  });

  it('renders status and priority badges', () => {
    render(
      <>
        <StatusBadge status="IN_PROGRESS" />
        <PriorityBadge priority="HIGH" />
      </>
    );
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument();
  });
});

describe('TaskCard', () => {
  it('renders task info and emits status changes', async () => {
    const onStatusChange = jest.fn();
    const task = makeTask({ title: 'My Task', _count: { comments: 5 } });
    render(
      <MemoryRouter>
        <TaskCard task={task} onStatusChange={onStatusChange} />
      </MemoryRouter>
    );
    expect(screen.getByText('My Task')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();

    await userEvent.selectOptions(
      screen.getByLabelText('Change status'),
      'DONE'
    );
    expect(onStatusChange).toHaveBeenCalledWith(task, 'DONE');
  });
});

describe('TaskFilters', () => {
  it('emits filter changes for search and status', async () => {
    const onChange = jest.fn();
    render(
      <TaskFilters
        filters={{ sortBy: 'createdAt', sortOrder: 'desc' }}
        onChange={onChange}
      />
    );
    await userEvent.type(screen.getByLabelText('Search tasks'), 'a');
    expect(onChange).toHaveBeenCalledWith({ search: 'a' });

    await userEvent.selectOptions(
      screen.getByLabelText('Filter by status'),
      'DONE'
    );
    expect(onChange).toHaveBeenCalledWith({ status: 'DONE' });
  });
});

describe('CommentItem', () => {
  it('shows the "You" badge and delete button for own comment', async () => {
    const onDelete = jest.fn();
    const comment = makeComment();
    render(
      <CommentItem
        comment={comment}
        currentUserId={normalUser.id}
        canDelete
        onDelete={onDelete}
      />
    );
    expect(screen.getByText('You')).toBeInTheDocument();
    await userEvent.click(screen.getByLabelText('Delete comment'));
    expect(onDelete).toHaveBeenCalledWith(comment.id);
  });

  it('hides the delete button when not permitted', () => {
    render(
      <CommentItem
        comment={makeComment({ authorId: 'someone-else', author: { id: 'someone-else', email: 'x@y.z', name: 'X Y' } })}
        currentUserId={normalUser.id}
        canDelete={false}
        onDelete={jest.fn()}
      />
    );
    expect(screen.queryByLabelText('Delete comment')).not.toBeInTheDocument();
  });
});
