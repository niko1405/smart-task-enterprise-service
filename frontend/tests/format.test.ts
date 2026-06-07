import {
  formatDate,
  formatDateTime,
  initials,
  PRIORITY_LABELS,
  STATUS_LABELS,
} from '../src/lib/format';

describe('format utils', () => {
  it('builds initials from one or two names', () => {
    expect(initials('John Doe')).toBe('JD');
    expect(initials('Madonna')).toBe('M');
    expect(initials('  ')).toBe('?');
    expect(initials('Jane Mary Smith')).toBe('JS');
  });

  it('formats dates and handles null/invalid', () => {
    expect(formatDate(null)).toBe('—');
    expect(formatDate('not-a-date')).toBe('—');
    expect(formatDate('2025-01-15T00:00:00.000Z')).toMatch(/2025/);
  });

  it('formats date-time and handles invalid', () => {
    expect(formatDateTime('nope')).toBe('');
    expect(formatDateTime('2026-06-07T13:00:00.000Z')).not.toBe('');
  });

  it('exposes label maps', () => {
    expect(STATUS_LABELS.IN_PROGRESS).toBe('In Progress');
    expect(PRIORITY_LABELS.HIGH).toBe('High');
  });
});
