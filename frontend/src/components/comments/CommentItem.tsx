import { Trash2 } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { formatDateTime, initials } from '../../lib/format';
import type { Comment } from '../../types';

interface CommentItemProps {
  comment: Comment;
  currentUserId: string;
  canDelete: boolean;
  onDelete: (commentId: string) => void;
}

export function CommentItem({
  comment,
  currentUserId,
  canDelete,
  onDelete,
}: CommentItemProps): JSX.Element {
  const isOwn = comment.authorId === currentUserId;
  return (
    <div className="flex gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-600">
        {initials(comment.author.name)}
      </div>
      <div className="flex-1 rounded-lg bg-slate-50 px-3 py-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-800">
              {comment.author.name}
            </span>
            {isOwn && (
              <Badge className="bg-indigo-100 text-indigo-700">You</Badge>
            )}
            <span className="text-xs text-slate-400">
              {formatDateTime(comment.createdAt)}
            </span>
          </div>
          {canDelete && (
            <button
              type="button"
              aria-label="Delete comment"
              onClick={() => onDelete(comment.id)}
              className="rounded p-1 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
        <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-700">
          {comment.content}
        </p>
      </div>
    </div>
  );
}
