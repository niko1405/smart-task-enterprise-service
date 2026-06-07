# Devin Handoff Document - Smart Task Enterprise Service

**Date:** 2026-06-07  
**Backend Status:** ✅ Complete (Phases 1-7) + API-Improvements  
**API Base URL:** `http://localhost:3000/api/v1`

---

## 🎯 Mission

Implement the **React Frontend** (Phases 8-11) for Smart Task Enterprise Service.

---

## 📋 API Specification

### Authentication Endpoints

#### POST /api/v1/auth/register
Register a new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "role": "USER"  // optional, defaults to USER
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "USER"
    },
    "token": "jwt_token_here"
  }
}
```

#### POST /api/v1/auth/login
Login existing user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "token": "jwt_token_here"
  }
}
```

#### GET /api/v1/auth/me
Get current user profile.

**Headers:**
```
Authorization: Bearer <token>
```

---

### Task Endpoints

All task endpoints require: `Authorization: Bearer <token>`

#### GET /api/v1/tasks
List all tasks with filtering and pagination.

**Query Parameters:**
- `status` - Filter by status (TODO, IN_PROGRESS, DONE)
- `priority` - Filter by priority (LOW, MEDIUM, HIGH)
- `assignedToId` - Filter by assignee
- `createdById` - Filter by creator
- `tags` - Filter by tags (comma-separated)
- `search` - Full-text search in title/description
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `sortBy` - Sort field (createdAt, updatedAt, dueDate, priority, status)
- `sortOrder` - asc or desc

**Response (200):**
```json
{
  "success": true,
  "data": {
    "data": [ /* tasks array */ ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "totalPages": 5
    }
  }
}
```

#### POST /api/v1/tasks
Create a new task.

**Request Body:**
```json
{
  "title": "Task Title",
  "description": "Task Description",  // optional
  "status": "TODO",  // optional, default: TODO
  "priority": "MEDIUM",  // optional, default: MEDIUM
  "dueDate": "2024-12-31T23:59:59Z",  // optional
  "tags": ["tag1", "tag2"],  // optional, max 10
  "assignedToId": "user_uuid"  // optional
}
```

#### GET /api/v1/tasks/:id
Get a single task by ID.

**Response (200):**
```json
{
  "success": true,
  "data": { /* Task object */ }
}
```

**Headers returned:**
```
ETag: "<task-id>-<updatedAt-timestamp>"
```

**Conditional GET** — send `If-None-Match` to avoid re-fetching unchanged data:
```
If-None-Match: "<etag-from-previous-response>"
```
→ Returns **304 Not Modified** (no body) if task hasn't changed.

---

#### PATCH /api/v1/tasks/:id
Update a task.

**Request Body:** (all fields optional)
```json
{
  "title": "Updated Title",
  "status": "IN_PROGRESS",
  "priority": "HIGH"
}
```

**Response: `204 No Content`** — no body, but `ETag` header of the updated task is set.

**Optimistic Locking** — send `If-Match` to prevent lost updates:
```
If-Match: "<etag-from-get-response>"
```
→ Returns **412 Precondition Failed** if task was modified by someone else since last fetch.
→ Omitting `If-Match` performs the update unconditionally (backwards-compatible).

**Note:** When status changes to `DONE`, an email notification is automatically sent.

#### DELETE /api/v1/tasks/:id
Delete a task.

**Response (200):**
```json
{
  "success": true,
  "message": "Task deleted successfully"
}
```

---

### Comment Endpoints

All comment endpoints require: `Authorization: Bearer <token>`

#### GET /api/v1/tasks/:id/comments
Fetch comments for a task — cursor-based pagination, oldest first.

**Query Parameters:**
- `limit` — number of comments to return (default: 20)
- `cursor` — comment UUID to paginate from (exclusive)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "uuid",
        "content": "Great progress!",
        "taskId": "uuid",
        "authorId": "uuid",
        "author": { "id": "uuid", "email": "user@example.com", "name": "John Doe" },
        "createdAt": "2026-06-07T13:00:00.000Z"
      }
    ],
    "nextCursor": "uuid-or-null"
  }
}
```

#### POST /api/v1/tasks/:id/comments
Add a comment to a task.

**Request Body:**
```json
{ "content": "This is a comment" }
```

**Response (201):** Created comment object (same shape as above).

**WebSocket:** Emits `task:comment:added` to all clients in the task room.

#### DELETE /api/v1/tasks/:id/comments/:commentId
Delete a comment. Allowed for: **author** or **ADMIN** role.

**Response (200):**
```json
{ "success": true, "message": "Comment deleted successfully" }
```

**WebSocket:** Emits `task:comment:deleted` to all clients in the task room.

---

## 🔐 Authentication Notes

- JWT tokens expire after **7 days** (`JWT_EXPIRES_IN=7d`)
- If a token references a deleted user, the API returns **401** `"User no longer exists. Please log in again."`
- Always re-login after a DB reset (e.g. TEST_MODE seed)

### Error Codes Reference

| HTTP Code | Situation |
|---|---|
| 400 | Validation failed (Zod) or invalid DB operation |
| 401 | Missing/invalid token or deleted user |
| 403 | Valid token but insufficient role |
| 404 | Resource not found |
| 409 | Conflict — referenced resource does not exist (FK violation) |
| 412 | Precondition Failed — ETag mismatch (If-Match header) |
| 429 | Rate limit exceeded |

---

## 🔌 WebSocket Events

**WebSocket URL:** `ws://localhost:3000`

**Authentication:** Pass JWT token in connection auth:
```javascript
const socket = io('ws://localhost:3000', {
  auth: { token: 'jwt_token_here' }
});
```

### Events (Client receives)

| Event | Payload | Description |
|-------|---------|-------------|
| `task:created` | `{ task: Task }` | New task created |
| `task:updated` | `{ task: Task }` | Task updated |
| `task:statusChanged` | `{ taskId, oldStatus, newStatus }` | Status changed |
| `task:deleted` | `{ taskId }` | Task deleted |
| `task:comment:added` | `{ comment: Comment }` | New comment posted (task room only) |
| `task:comment:deleted` | `{ commentId }` | Comment deleted (task room only) |

### Events (Client sends)

| Event | Payload | Description |
|-------|---------|-------------|
| `task:join` | `taskId: string` | Join task room to receive comment events |
| `task:leave` | `taskId: string` | Leave task room |

```javascript
// When user opens task detail view:
socket.emit('task:join', taskId);
socket.on('task:comment:added', ({ comment }) => { /* append to list */ });
socket.on('task:comment:deleted', ({ commentId }) => { /* remove from list */ });

// When user closes task detail view:
socket.emit('task:leave', taskId);
```

### TypeScript Types

```typescript
interface Task {
  id: string;
  title: string;
  description: string | null;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  dueDate: string | null;          // ISO date string
  tags: string[];
  createdById: string;
  assignedToId: string | null;
  createdBy: { id: string; email: string; name: string };
  assignedTo: { id: string; email: string; name: string } | null;
  createdAt: string;               // ISO date string
  updatedAt: string;               // ISO date string — used for ETag calculation
  _count: { comments: number };   // comment badge count (no content loaded)
}

interface Comment {
  id: string;
  content: string;
  taskId: string;
  authorId: string;
  author: { id: string; email: string; name: string };
  createdAt: string;               // ISO date string
}

// ETag format (returned in response header, not in body):
// ETag: "<task.id>-<task.updatedAt.getTime()>"
// Example: "abc123-1749254400000"
```

### PATCH Workflow (with Optimistic Locking)

```typescript
// 1. Fetch task and store ETag
const res = await fetch(`/api/v1/tasks/${id}`, { headers: { Authorization } });
const etag = res.headers.get('ETag');
const task = await res.json();

// 2. Update with If-Match to prevent lost updates
const patch = await fetch(`/api/v1/tasks/${id}`, {
  method: 'PATCH',
  headers: { Authorization, 'If-Match': etag, 'Content-Type': 'application/json' },
  body: JSON.stringify({ status: 'DONE' }),
});
// 204 → success, new ETag in patch.headers.get('ETag')
// 412 → conflict, re-fetch task and retry
```

---

## 🚀 Frontend Setup

```bash
cd /home/u7411/CascadeProjects/smart-task-enterprise-service/frontend
npm install

# Create .env file
cat > .env << EOF
VITE_API_URL=http://localhost:3000/api/v1
VITE_WS_URL=ws://localhost:3000
EOF

npm run dev
```

**Frontend runs on:** http://localhost:5173

---

## 📧 Mailpit (Email Testing)

**Web UI:** http://localhost:8025

All emails sent by the backend (e.g., task completion notifications) appear here.

---

## 🧪 Testing Requirements

### Component Tests (≥70% Coverage)
- React Testing Library + Jest
- MSW (Mock Service Worker) for API mocking
- Test coverage report: `npm run test:coverage`

### E2E Tests with Playwright
```bash
npm init playwright@latest
```

Test scenarios:
1. Registration → Login → Dashboard
2. Create task → Update status → Verify real-time sync
3. Check email in Mailpit UI

---

## ✅ Acceptance Criteria

- [ ] Login/Register pages functional
- [ ] Task dashboard with list view
- [ ] Task creation form with validation
- [ ] Task editing with status updates
- [ ] Real-time updates via WebSocket
- [ ] Responsive design (mobile + desktop)
- [ ] Loading states for async operations
- [ ] Error handling for API errors
- [ ] Component test coverage ≥70%
- [ ] E2E tests stable

---

## 📚 Resources

- **Swagger UI:** http://localhost:3000/api-docs
- **Backend Health:** http://localhost:3000/health
- **Mailpit UI:** http://localhost:8025

---

## 🆘 Troubleshooting

**Backend not running?**
```bash
cd /home/u7411/CascadeProjects/smart-task-enterprise-service
docker-compose up -d
```

**Database not seeded / reset needed?**
```bash
# 1. Set TEST_MODE=true in backend/.env
# 2. Restart container (no rebuild needed):
docker compose up -d backend
# 3. After seeding, set TEST_MODE=false and restart again
```

**Token invalid after DB reset?**
Log in again — old tokens reference deleted user IDs and return 401.

**Need to see API docs?**
Visit http://localhost:3000/api-docs after starting the backend.
