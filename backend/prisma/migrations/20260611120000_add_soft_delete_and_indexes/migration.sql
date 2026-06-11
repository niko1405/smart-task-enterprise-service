-- Add soft delete column to tasks
ALTER TABLE "tasks" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- Add performance indexes to tasks table
CREATE INDEX "tasks_status_idx" ON "tasks"("status");
CREATE INDEX "tasks_priority_idx" ON "tasks"("priority");
CREATE INDEX "tasks_createdById_idx" ON "tasks"("createdById");
CREATE INDEX "tasks_assignedToId_idx" ON "tasks"("assignedToId");
CREATE INDEX "tasks_status_priority_idx" ON "tasks"("status", "priority");
CREATE INDEX "tasks_deletedAt_idx" ON "tasks"("deletedAt");
