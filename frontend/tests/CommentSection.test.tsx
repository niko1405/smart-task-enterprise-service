import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CommentSection } from '../src/components/comments/CommentSection';
import { useAuth } from '../src/hooks/useAuth';
import { useComments } from '../src/hooks/useComments';
import { adminUser, makeComment, normalUser } from './fixtures';

jest.mock('../src/hooks/useAuth');
jest.mock('../src/hooks/useComments');

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockedUseComments = useComments as jest.MockedFunction<typeof useComments>;

function authAs(user: typeof adminUser | typeof normalUser): void {
  mockedUseAuth.mockReturnValue({
    user,
    token: 'tok',
    loading: false,
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
  });
}

describe('CommentSection', () => {
  const addComment = jest.fn().mockResolvedValue(undefined);
  const removeComment = jest.fn().mockResolvedValue(undefined);
  const loadMore = jest.fn();

  const baseHook = {
    comments: [makeComment({ id: 'c1', authorId: normalUser.id })],
    loading: false,
    loadingMore: false,
    posting: false,
    error: null,
    nextCursor: 'cursor-1',
    loadMore,
    addComment,
    removeComment,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseComments.mockReturnValue(baseHook);
  });

  it('shows the admin capability hint and allows deleting any comment', async () => {
    authAs(adminUser);
    render(<CommentSection taskId="task-1" />);
    expect(screen.getByText(/can delete any comment/i)).toBeInTheDocument();
    await userEvent.click(screen.getByLabelText('Delete comment'));
    expect(removeComment).toHaveBeenCalledWith('c1');
  });

  it('loads more comments and posts a new one', async () => {
    authAs(normalUser);
    render(<CommentSection taskId="task-1" />);
    await userEvent.click(screen.getByRole('button', { name: /load more/i }));
    expect(loadMore).toHaveBeenCalled();

    await userEvent.type(screen.getByLabelText('Add a comment'), 'Nice work');
    await userEvent.click(screen.getByRole('button', { name: /^comment$/i }));
    await waitFor(() => expect(addComment).toHaveBeenCalledWith('Nice work'));
  });

  it('renders a loading spinner while fetching', () => {
    authAs(normalUser);
    mockedUseComments.mockReturnValue({ ...baseHook, loading: true, comments: [] });
    render(<CommentSection taskId="task-1" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});
