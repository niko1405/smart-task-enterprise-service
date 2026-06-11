import type { Task, User, UserSummary } from '../types';

// Builds a de-duplicated list of users referenced by the loaded tasks plus the
// current user, used to populate the assignee dropdown (the API exposes no
// dedicated "list users" endpoint).
export function collectUsers(tasks: Task[], current: User | null): UserSummary[] {
  const map = new Map<string, UserSummary>();
  if (current) {
    map.set(current.id, {
      id: current.id,
      email: current.email,
      name: current.name,
    });
  }
  for (const task of tasks) {
    map.set(task.createdBy.id, task.createdBy);
    if (task.assignedTo) map.set(task.assignedTo.id, task.assignedTo);
  }
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}
