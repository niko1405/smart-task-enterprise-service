import { Badge } from '../ui/Badge';
import { PRIORITY_CLASSES, PRIORITY_LABELS, STATUS_CLASSES, STATUS_LABELS } from '../../lib/format';
import type { Priority, TaskStatus } from '../../types';

export function StatusBadge({ status }: { status: TaskStatus }): JSX.Element {
  return <Badge className={STATUS_CLASSES[status]}>{STATUS_LABELS[status]}</Badge>;
}

export function PriorityBadge({ priority }: { priority: Priority }): JSX.Element {
  return <Badge className={PRIORITY_CLASSES[priority]}>{PRIORITY_LABELS[priority]}</Badge>;
}
