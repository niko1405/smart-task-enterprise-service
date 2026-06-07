import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createComment,
  deleteComment as deleteCommentApi,
  listComments,
} from '../api/comments';
import { toErrorMessage } from '../lib/errors';
import { useSocket } from './useSocket';
import type {
  Comment,
  CommentAddedPayload,
  CommentDeletedPayload,
} from '../types';

const PAGE_SIZE = 20;

interface UseCommentsResult {
  comments: Comment[];
  loading: boolean;
  loadingMore: boolean;
  posting: boolean;
  error: string | null;
  nextCursor: string | null;
  loadMore: () => void;
  addComment: (content: string) => Promise<void>;
  removeComment: (commentId: string) => Promise<void>;
}

export function useComments(taskId: string): UseCommentsResult {
  const socket = useSocket();
  const [comments, setComments] = useState<Comment[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cursorRef = useRef<string | null>(null);

  const fetchPage = useCallback(
    async (cursor: string | null): Promise<void> => {
      const page = await listComments(taskId, {
        limit: PAGE_SIZE,
        cursor: cursor ?? undefined,
      });
      setComments((prev) => {
        const seen = new Set(prev.map((c) => c.id));
        const additions = page.data.filter((c) => !seen.has(c.id));
        return cursor ? [...prev, ...additions] : page.data;
      });
      setNextCursor(page.nextCursor);
      cursorRef.current = page.nextCursor;
    },
    [taskId]
  );

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    fetchPage(null)
      .catch((err) => {
        if (active) setError(toErrorMessage(err, 'Failed to load comments.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [fetchPage]);

  const loadMore = useCallback((): void => {
    if (!cursorRef.current) return;
    setLoadingMore(true);
    fetchPage(cursorRef.current)
      .catch((err) => setError(toErrorMessage(err, 'Failed to load comments.')))
      .finally(() => setLoadingMore(false));
  }, [fetchPage]);

  const addComment = useCallback(
    async (content: string): Promise<void> => {
      setPosting(true);
      setError(null);
      try {
        const created = await createComment(taskId, content);
        setComments((prev) =>
          prev.some((c) => c.id === created.id) ? prev : [...prev, created]
        );
      } catch (err) {
        setError(toErrorMessage(err, 'Failed to post comment.'));
        throw err;
      } finally {
        setPosting(false);
      }
    },
    [taskId]
  );

  const removeComment = useCallback(
    async (commentId: string): Promise<void> => {
      try {
        await deleteCommentApi(taskId, commentId);
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      } catch (err) {
        setError(toErrorMessage(err, 'Failed to delete comment.'));
        throw err;
      }
    },
    [taskId]
  );

  useEffect(() => {
    if (!socket) return;
    socket.emit('task:join', taskId);

    const onAdded = ({ comment }: CommentAddedPayload): void => {
      if (comment.taskId !== taskId) return;
      setComments((prev) =>
        prev.some((c) => c.id === comment.id) ? prev : [...prev, comment]
      );
    };
    const onDeleted = ({ commentId }: CommentDeletedPayload): void => {
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    };

    socket.on('task:comment:added', onAdded);
    socket.on('task:comment:deleted', onDeleted);
    return () => {
      socket.emit('task:leave', taskId);
      socket.off('task:comment:added', onAdded);
      socket.off('task:comment:deleted', onDeleted);
    };
  }, [socket, taskId]);

  return {
    comments,
    loading,
    loadingMore,
    posting,
    error,
    nextCursor,
    loadMore,
    addComment,
    removeComment,
  };
}
