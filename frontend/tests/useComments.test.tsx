import { act, renderHook, waitFor } from '@testing-library/react';
import { useComments } from '../src/hooks/useComments';
import * as commentsApi from '../src/api/comments';
import { useSocket } from '../src/hooks/useSocket';
import { FakeSocket } from './fakeSocket';
import { makeComment } from './fixtures';

jest.mock('../src/api/comments');
jest.mock('../src/hooks/useSocket');

const mockedListComments = commentsApi.listComments as jest.MockedFunction<
  typeof commentsApi.listComments
>;
const mockedCreate = commentsApi.createComment as jest.MockedFunction<
  typeof commentsApi.createComment
>;
const mockedDelete = commentsApi.deleteComment as jest.MockedFunction<
  typeof commentsApi.deleteComment
>;
const mockedUseSocket = useSocket as jest.MockedFunction<typeof useSocket>;

describe('useComments', () => {
  let socket: FakeSocket;

  beforeEach(() => {
    socket = new FakeSocket();
    mockedUseSocket.mockReturnValue(socket as unknown as ReturnType<typeof useSocket>);
    mockedListComments.mockResolvedValue({
      data: [makeComment({ id: 'c1' })],
      nextCursor: null,
    });
  });

  it('joins the task room and loads comments', async () => {
    const { result, unmount } = renderHook(() => useComments('task-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.comments).toHaveLength(1);
    expect(socket.emitted).toContainEqual({ event: 'task:join', payload: 'task-1' });

    unmount();
    expect(socket.emitted).toContainEqual({ event: 'task:leave', payload: 'task-1' });
  });

  it('appends comments from socket and removes deleted ones', async () => {
    const { result } = renderHook(() => useComments('task-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      socket.trigger('task:comment:added', {
        comment: makeComment({ id: 'c2', taskId: 'task-1' }),
      });
    });
    expect(result.current.comments.map((c) => c.id)).toEqual(['c1', 'c2']);

    act(() => {
      socket.trigger('task:comment:deleted', { commentId: 'c1' });
    });
    expect(result.current.comments.map((c) => c.id)).toEqual(['c2']);
  });

  it('posts a comment and deletes via the API', async () => {
    mockedCreate.mockResolvedValue(makeComment({ id: 'c3', content: 'Hi' }));
    mockedDelete.mockResolvedValue();
    const { result } = renderHook(() => useComments('task-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.addComment('Hi');
    });
    expect(mockedCreate).toHaveBeenCalledWith('task-1', 'Hi');
    expect(result.current.comments.map((c) => c.id)).toContain('c3');

    await act(async () => {
      await result.current.removeComment('c1');
    });
    expect(mockedDelete).toHaveBeenCalledWith('task-1', 'c1');
    expect(result.current.comments.map((c) => c.id)).not.toContain('c1');
  });
});
