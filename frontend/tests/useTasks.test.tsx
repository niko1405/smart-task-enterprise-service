import { act, renderHook, waitFor } from '@testing-library/react';
import { useTasks, matchesFilters } from '../src/hooks/useTasks';
import * as tasksApi from '../src/api/tasks';
import { useSocket } from '../src/hooks/useSocket';
import { FakeSocket } from './fakeSocket';
import { makeTask } from './fixtures';

jest.mock('../src/api/tasks');
jest.mock('../src/hooks/useSocket');

const mockedList = tasksApi.listTasks as jest.MockedFunction<
  typeof tasksApi.listTasks
>;
const mockedUseSocket = useSocket as jest.MockedFunction<typeof useSocket>;

function paginated(tasks: ReturnType<typeof makeTask>[]) {
  return {
    data: tasks,
    pagination: { page: 1, limit: 10, total: tasks.length, totalPages: 1 },
  };
}

describe('matchesFilters', () => {
  it('matches by status, priority and search text', () => {
    const task = makeTask({ status: 'DONE', priority: 'HIGH', title: 'Deploy app' });
    expect(matchesFilters(task, { status: 'DONE' })).toBe(true);
    expect(matchesFilters(task, { status: 'TODO' })).toBe(false);
    expect(matchesFilters(task, { priority: 'LOW' })).toBe(false);
    expect(matchesFilters(task, { search: 'deploy' })).toBe(true);
    expect(matchesFilters(task, { search: 'nope' })).toBe(false);
  });
});

describe('useTasks real-time sync', () => {
  let socket: FakeSocket;

  beforeEach(() => {
    socket = new FakeSocket();
    mockedUseSocket.mockReturnValue(socket as unknown as ReturnType<typeof useSocket>);
    mockedList.mockResolvedValue(paginated([makeTask({ id: 'task-1' })]));
  });

  it('loads tasks then reacts to socket events', async () => {
    const { result } = renderHook(() => useTasks());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.tasks).toHaveLength(1);

    act(() => {
      socket.trigger('task:created', { task: makeTask({ id: 'task-2' }) });
    });
    expect(result.current.tasks.map((t) => t.id)).toContain('task-2');

    act(() => {
      socket.trigger('task:statusChanged', {
        taskId: 'task-1',
        oldStatus: 'TODO',
        newStatus: 'DONE',
      });
    });
    expect(result.current.tasks.find((t) => t.id === 'task-1')?.status).toBe('DONE');

    act(() => {
      socket.trigger('task:deleted', { taskId: 'task-2' });
    });
    expect(result.current.tasks.map((t) => t.id)).not.toContain('task-2');
  });

  it('refetches when filters change', async () => {
    const { result } = renderHook(() => useTasks());
    await waitFor(() => expect(result.current.loading).toBe(false));
    mockedList.mockClear();
    act(() => result.current.setFilters({ status: 'DONE' }));
    await waitFor(() => expect(mockedList).toHaveBeenCalled());
    expect(mockedList.mock.calls[0]?.[0]?.status).toBe('DONE');
  });
});
