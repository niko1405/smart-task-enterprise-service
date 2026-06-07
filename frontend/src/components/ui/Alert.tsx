import { AlertCircle } from 'lucide-react';
import { cn } from '../../lib/cn';

interface AlertProps {
  message: string;
  className?: string;
}

// Inline error banner used for surfacing API/form failures to the user.
export function Alert({ message, className }: AlertProps): JSX.Element {
  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700',
        className
      )}
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <span>{message}</span>
    </div>
  );
}
