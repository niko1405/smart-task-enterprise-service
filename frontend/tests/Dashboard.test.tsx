import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { DashboardPage } from '../src/pages/DashboardPage';
import { useAuth } from '../src/hooks/useAuth';
import { useTasks } from '../src/hooks/useTasks';
import * as tasksApi from '../src/api/tasks';
import { makeTask, normalUser } from './fixtures';

jest.mock('../src/hooks/useAuth');
jest.mock('../src/hooks/useTasks');
jest.mock('../src/api/tasks');

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockedUseTasks = useTasks as jest.MockedFunction<typeof useTasks>;
const mockedCreate = tasksApi.createTask as jest.MockedFunction<typeof tasksApi.createTask>;
const mockedUpdate = tasksApi.updateTask as jest.MockedFunction<typeof tasksApi.updateTask>;
const mockedETag = tasksApi.computeETag as jest.MockedFunction<typeof tasksApi.computeETag>;

const setFilters = jest.fn();
const refetch = jest.fn();

function setup(overrides = {}): void {
  mockedUseAuth.mockReturnValue({
    user: normalUser,
    token: 'tok',
    loading: false,
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
  });
  mockedUseTasks.mockReturnValue({
    tasks: [makeTask({ id: 'task-1', title: 'Task One' })],
    pagination: { page: 1, limit: 10, total: 12, totalPages: 2 },
    loading: false,
    error: null,
    filters: { sortBy: 'createdAt', sortOrder: 'desc', page: 1 },
    setFilters,
    refetch,
    ...overrides,
  });
}

describe('DashboardPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedETag.mockReturnValue('"task-1-123"');
    setup();
  });

  it('lists tasks and total count', () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );
    expect(screen.getByText('Task One')).toBeInTheDocument();
    expect(screen.getByText('12 total')).toBeInTheDocument();
  });

  it('creates a task through the modal', async () => {
    mockedCreate.mockResolvedValue(makeTask());
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );
    await userEvent.click(screen.getByRole('button', { name: /new task/i }));
    await userEvent.type(screen.getByLabelText('Title'), 'Brand new task');
    await userEvent.click(screen.getByRole('button', { name: /create task/i }));
    await waitFor(() => expect(mockedCreate).toHaveBeenCalled());
    expect(mockedCreate.mock.calls[0]?.[0]?.title).toBe('Brand new task');
  });

  it('changes status from the card with optimistic locking', async () => {
    mockedUpdate.mockResolvedValue();
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );
    await userEvent.selectOptions(screen.getByLabelText('Change status'), 'DONE');
    await waitFor(() =>
      expect(mockedUpdate).toHaveBeenCalledWith('task-1', { status: 'DONE' }, '"task-1-123"')
    );
  });

  it('paginates via the pager', async () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );
    await userEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(setFilters).toHaveBeenCalledWith({ page: 2 });
  });
});
