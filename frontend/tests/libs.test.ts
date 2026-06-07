import { computeETag } from '../src/api/tasks';
import { collectUsers } from '../src/lib/users';
import { toErrorMessage } from '../src/lib/errors';
import { ApiError } from '../src/lib/apiClient';
import { cn } from '../src/lib/cn';
import { makeTask, normalUser, adminUser } from './fixtures';

describe('computeETag', () => {
  it('produces the backend ETag format with quotes', () => {
    const task = makeTask({ id: 'abc', updatedAt: '2026-06-07T12:30:00.000Z' });
    const ms = new Date('2026-06-07T12:30:00.000Z').getTime();
    expect(computeETag(task)).toBe(`"abc-${ms}"`);
  });
});

describe('collectUsers', () => {
  it('dedupes and sorts users from tasks and the current user', () => {
    const task = makeTask();
    const users = collectUsers([task], adminUser);
    const ids = users.map((u) => u.id);
    expect(ids).toContain(adminUser.id);
    expect(ids).toContain(task.createdBy.id);
    expect(ids).toContain(task.assignedTo?.id);
    // sorted by name
    const names = users.map((u) => u.name);
    expect([...names].sort()).toEqual(names);
  });

  it('handles null current user and unassigned tasks', () => {
    const task = makeTask({ assignedTo: null, assignedToId: null });
    const users = collectUsers([task], null);
    expect(users).toHaveLength(1);
    expect(users[0]?.id).toBe(normalUser.id);
  });
});

describe('toErrorMessage', () => {
  it('joins validation details', () => {
    const err = new ApiError('Validation failed', 400, [
      { path: 'title', message: 'Title is required' },
      { path: 'email', message: 'Invalid email' },
    ]);
    expect(toErrorMessage(err)).toBe('Title is required, Invalid email');
  });

  it('falls back to ApiError message, Error message, then default', () => {
    expect(toErrorMessage(new ApiError('Boom', 500))).toBe('Boom');
    expect(toErrorMessage(new Error('plain'))).toBe('plain');
    expect(toErrorMessage(42, 'fallback')).toBe('fallback');
  });
});

describe('cn', () => {
  it('merges conditional and conflicting classes', () => {
    expect(cn('px-2', false && 'hidden', 'px-4')).toBe('px-4');
  });
});
