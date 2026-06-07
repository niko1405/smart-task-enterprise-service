import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/cn';

export function Spinner({ className }: { className?: string }): JSX.Element {
  return (
    <Loader2
      role="status"
      aria-label="Loading"
      className={cn('h-5 w-5 animate-spin text-indigo-600', className)}
    />
  );
}
