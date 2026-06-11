const HTML_PATTERN = /<[^>]*>/g;

export function sanitizeString(value: string): string {
  return value.replace(HTML_PATTERN, '').trim();
}

export function sanitizeOptionalString(
  value: string | null | undefined
): string | null | undefined {
  if (value == null) return value;
  return sanitizeString(value);
}

export interface SanitizedTask {
  title?: string;
  description?: string | null;
  tags?: string[];
}

export function sanitizeTaskInput<T extends SanitizedTask>(input: T): T {
  return {
    ...input,
    ...(input.title !== undefined && { title: sanitizeString(input.title) }),
    ...(input.description !== undefined && {
      description: sanitizeOptionalString(input.description),
    }),
    ...(input.tags !== undefined && {
      tags: input.tags.map(sanitizeString),
    }),
  };
}

export interface SanitizedComment {
  content: string;
}

export function sanitizeCommentInput<T extends SanitizedComment>(input: T): T {
  return { ...input, content: sanitizeString(input.content) };
}
