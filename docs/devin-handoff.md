# Devin Handoff Document - Smart Task Enterprise Service

**Date:** 2024-12-30  
**Backend Status:** ✅ Complete (Phases 1-7)  
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

**Note:** When status changes to "DONE", an email notification is automatically sent.

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

### TypeScript Types

```typescript
interface Task {
  id: string;
  title: string;
  description: string | null;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  dueDate: string | null;  // ISO date
  tags: string[];
  createdById: string;
  assignedToId: string | null;
  createdBy: { id: string; email: string; name: string };
  assignedTo: { id: string; email: string; name: string } | null;
  createdAt: string;  // ISO date
  updatedAt: string;  // ISO date
}
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

**Database not seeded?**
```bash
cd backend
TEST_MODE=true npm run dev
```

**Need to see API docs?**
Visit http://localhost:3000/api-docs after starting the backend.
