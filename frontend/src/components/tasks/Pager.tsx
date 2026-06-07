import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui/Button';
import type { Pagination } from '../../types';

interface PagerProps {
  pagination: Pagination;
  onPage: (page: number) => void;
}

export function Pager({ pagination, onPage }: PagerProps): JSX.Element {
  const { page, totalPages } = pagination;
  return (
    <div className="flex items-center justify-center gap-4">
      <Button
        variant="secondary"
        size="sm"
        disabled={page <= 1}
        onClick={() => onPage(page - 1)}
      >
        <ChevronLeft className="h-4 w-4" /> Prev
      </Button>
      <span className="text-sm text-slate-600">
        Page {page} of {totalPages}
      </span>
      <Button
        variant="secondary"
        size="sm"
        disabled={page >= totalPages}
        onClick={() => onPage(page + 1)}
      >
        Next <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
