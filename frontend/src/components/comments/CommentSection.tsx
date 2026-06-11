import { MessageSquare } from 'lucide-react';
import { useComments } from '../../hooks/useComments';
import { useAuth } from '../../hooks/useAuth';
import { CommentItem } from './CommentItem';
import { CommentComposer } from './CommentComposer';
import { Spinner } from '../ui/Spinner';
import { Alert } from '../ui/Alert';
import { Button } from '../ui/Button';

export function CommentSection({ taskId }: { taskId: string }): JSX.Element {
  const { user } = useAuth();
  const {
    comments,
    loading,
    loadingMore,
    posting,
    error,
    nextCursor,
    loadMore,
    addComment,
    removeComment,
  } = useComments(taskId);

  const isAdmin = user?.role === 'ADMIN';

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-slate-500" />
        <h3 className="text-base font-semibold text-slate-900">Comments ({comments.length})</h3>
        {isAdmin && (
          <span className="text-xs font-medium text-purple-600">
            Admin · can delete any comment
          </span>
        )}
      </div>

      {error && <Alert message={error} />}

      {loading ? (
        <div className="flex justify-center py-6">
          <Spinner />
        </div>
      ) : (
        <div className="space-y-3">
          {comments.length === 0 && (
            <p className="text-sm text-slate-500">No comments yet. Be the first to comment.</p>
          )}
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUserId={user?.id ?? ''}
              canDelete={isAdmin || comment.authorId === user?.id}
              onDelete={removeComment}
            />
          ))}
          {nextCursor && (
            <div className="flex justify-center">
              <Button variant="ghost" size="sm" loading={loadingMore} onClick={loadMore}>
                Load more comments
              </Button>
            </div>
          )}
        </div>
      )}

      <CommentComposer posting={posting} onSubmit={addComment} />
    </section>
  );
}
