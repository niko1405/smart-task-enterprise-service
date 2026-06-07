import { act, renderHook, waitFor } from '@testing-library/react';
import { useTask } from '../src/hooks/useTask';
import * as tasksApi from '../src/api/tasks';
import { useSocket } from '../src/hooks/useSocket';
import { FakeSocket } from './fakeSocket';
import { makeTask } from './fixtures';

jest.mock('../src/api/tasks');
jest.mock('../src/hooks/useSocket');

const mockedGet = tasksApi.getTask as jest.MockedFunction<typeof tasksApi.getTask>;
const mockedUseSocket = useSocket as jest.MockedFunction<typeof useSocket>;

describe('useTask', () => {
  let socket: FakeSocket;

  beforeEach(() => {
    socket = new FakeSocket();
    mockedUseSocket.mockReturnValue(socket as unknown as ReturnType<typeof useSocket>);
    mockedGet.mockResolvedValue(makeTask({ id: 'task-1', title: 'Loaded' }));
  });

  it('loads the task and reflects remote updates and deletion', async () => {
    const { result } = renderHook(() => useTask('task-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.task?.title).toBe('Loaded');

    act(() => {
      socket.trigger('task:updated', {
        task: makeTask({ id: 'task-1', title: 'Renamed' }),
      });
    });
    expect(result.current.task?.title).toBe('Renamed');

    act(() => {
      socket.trigger('task:statusChanged', {
        taskId: 'task-1',
        oldStatus: 'TODO',
        newStatus: 'DONE',
      });
    });
    expect(result.current.task?.status).toBe('DONE');

    act(() => {
      socket.trigger('task:deleted', { taskId: 'task-1' });
    });
    expect(result.current.deleted).toBe(true);
  });

  it('surfaces an error when the task fails to load', async () => {
    mockedGet.mockRejectedValue(new Error('boom'));
    const { result } = renderHook(() => useTask('task-x'));
    await waitFor(() => expect(result.current.error).toBeTruthy());
  });
});
