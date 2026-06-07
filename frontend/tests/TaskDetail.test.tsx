import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { TaskDetailPage } from '../src/pages/TaskDetailPage';
import { useAuth } from '../src/hooks/useAuth';
import { useTask } from '../src/hooks/useTask';
import * as tasksApi from '../src/api/tasks';
import { makeTask, normalUser } from './fixtures';

jest.mock('../src/hooks/useAuth');
jest.mock('../src/hooks/useTask');
jest.mock('../src/api/tasks');
// CommentSection has its own coverage; stub it here to isolate the page.
jest.mock('../src/components/comments/CommentSection', () => ({
  CommentSection: () => <div data-testid="comment-section" />,
}));

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockedUseTask = useTask as jest.MockedFunction<typeof useTask>;
const mockedUpdate = tasksApi.updateTask as jest.MockedFunction<typeof tasksApi.updateTask>;
const mockedDelete = tasksApi.deleteTask as jest.MockedFunction<typeof tasksApi.deleteTask>;
const mockedETag = tasksApi.computeETag as jest.MockedFunction<typeof tasksApi.computeETag>;

const reload = jest.fn().mockResolvedValue(undefined);

function renderDetail(): void {
  render(
    <MemoryRouter initialEntries={['/tasks/task-1']}>
      <Routes>
        <Route path="/tasks/:id" element={<TaskDetailPage />} />
        <Route path="/" element={<div>Home</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('TaskDetailPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedETag.mockReturnValue('"task-1-123"');
    mockedUseAuth.mockReturnValue({
      user: normalUser,
      token: 'tok',
      loading: false,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
    });
    mockedUseTask.mockReturnValue({
      task: makeTask({ id: 'task-1', title: 'Detailed Task' }),
      loading: false,
      error: null,
      deleted: false,
      setTask: jest.fn(),
      reload,
    });
  });

  it('renders task details and comment section', () => {
    renderDetail();
    expect(screen.getByText('Detailed Task')).toBeInTheDocument();
    expect(screen.getByTestId('comment-section')).toBeInTheDocument();
  });

  it('updates the task via the edit modal with ETag', async () => {
    mockedUpdate.mockResolvedValue();
    renderDetail();
    await userEvent.click(screen.getByRole('button', { name: /edit/i }));
    const title = screen.getByLabelText('Title');
    await userEvent.clear(title);
    await userEvent.type(title, 'Updated title');
    await userEvent.click(screen.getByRole('button', { name: /save changes/i }));
    await waitFor(() => expect(mockedUpdate).toHaveBeenCalled());
    expect(mockedUpdate.mock.calls[0]?.[2]).toBe('"task-1-123"');
  });

  it('deletes the task after confirmation', async () => {
    mockedDelete.mockResolvedValue();
    jest.spyOn(window, 'confirm').mockReturnValue(true);
    renderDetail();
    await userEvent.click(screen.getByRole('button', { name: /delete/i }));
    await waitFor(() => expect(mockedDelete).toHaveBeenCalledWith('task-1'));
  });

  it('shows a deleted notice when the task was removed remotely', () => {
    mockedUseTask.mockReturnValue({
      task: null,
      loading: false,
      error: null,
      deleted: true,
      setTask: jest.fn(),
      reload,
    });
    renderDetail();
    expect(screen.getByText(/has been deleted/i)).toBeInTheDocument();
  });
});
