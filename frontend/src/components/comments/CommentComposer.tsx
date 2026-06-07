import { useState, type FormEvent } from 'react';
import { SendHorizonal } from 'lucide-react';
import { Textarea } from '../ui/Textarea';
import { Button } from '../ui/Button';

interface CommentComposerProps {
  posting: boolean;
  onSubmit: (content: string) => Promise<void>;
}

export function CommentComposer({
  posting,
  onSubmit,
}: CommentComposerProps): JSX.Element {
  const [value, setValue] = useState('');

  async function handleSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    const content = value.trim();
    if (!content) return;
    try {
      await onSubmit(content);
      setValue('');
    } catch {
      // Error surfaced by the parent section via the shared error state.
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <Textarea
        rows={2}
        aria-label="Add a comment"
        placeholder="Write a comment…"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <div className="flex justify-end">
        <Button type="submit" size="sm" loading={posting} disabled={!value.trim()}>
          <SendHorizonal className="h-4 w-4" /> Comment
        </Button>
      </div>
    </form>
  );
}
