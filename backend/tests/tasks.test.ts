import request from 'supertest';
import bcrypt from 'bcryptjs';
import { app } from '../src/index';
import { prisma } from '../src/config/database';
import jwt from 'jsonwebtoken';
import { env } from '../src/config/env';
import { Priority, Role, TaskStatus } from '@prisma/client';
import { taskService } from '../src/services/task.service';

describe('Task Endpoints', () => {
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    // Connect to database
    await prisma.$connect();
  });

  beforeEach(async () => {
    // Clean up
    await prisma.task.deleteMany();
    await prisma.user.deleteMany();

    // Create test user and token
    const user = await prisma.user.create({
      data: {
        email: 'taskuser@example.com',
        password: await bcrypt.hash('password123', 12),
        name: 'Task User',
        role: Role.USER,
      },
    });
    userId = user.id;
    authToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      env.JWT_SECRET
    );
  });

  afterAll(async () => {
    // Clean up
    await prisma.task.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  describe('POST /tasks', () => {
    it('should create a new task', async () => {
      const response = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Task',
          description: 'Test Description',
          priority: Priority.HIGH,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.title).toBe('Test Task');
      expect(response.body.data.createdById).toBe(userId);
    });

    it('should require title', async () => {
      const response = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: 'Test Description',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should require authentication', async () => {
      const response = await request(app).post('/api/v1/tasks').send({
        title: 'Test Task',
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /tasks', () => {
    beforeEach(async () => {
      // Create some tasks
      await prisma.task.createMany({
        data: [
          {
            title: 'Task 1',
            description: 'Description 1',
            status: TaskStatus.TODO,
            priority: Priority.HIGH,
            createdById: userId,
          },
          {
            title: 'Task 2',
            description: 'Description 2',
            status: TaskStatus.IN_PROGRESS,
            priority: Priority.MEDIUM,
            createdById: userId,
          },
          {
            title: 'Task 3',
            description: 'Description 3',
            status: TaskStatus.DONE,
            priority: Priority.LOW,
            createdById: userId,
          },
        ],
      });
    });

    it('should get all tasks', async () => {
      const response = await request(app)
        .get('/api/v1/tasks')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.data).toHaveLength(3);
      expect(response.body.data.pagination.total).toBe(3);
    });

    it('should filter by status', async () => {
      const response = await request(app)
        .get('/api/v1/tasks?status=TODO')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.data).toHaveLength(1);
      expect(response.body.data.data[0].status).toBe('TODO');
    });

    it('should filter by priority', async () => {
      const response = await request(app)
        .get('/api/v1/tasks?priority=HIGH')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.data).toHaveLength(1);
      expect(response.body.data.data[0].priority).toBe('HIGH');
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/v1/tasks?page=1&limit=2')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.data).toHaveLength(2);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(2);
    });

    it('should filter by tags', async () => {
      await prisma.task.create({
        data: {
          title: 'Tagged Task',
          status: TaskStatus.TODO,
          priority: Priority.HIGH,
          tags: ['urgent', 'backend'],
          createdById: userId,
        },
      });

      const response = await request(app)
        .get('/api/v1/tasks?tags=urgent')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.data).toHaveLength(1);
      expect(response.body.data.data[0].title).toBe('Tagged Task');
    });

    it('should filter by search term', async () => {
      const response = await request(app)
        .get('/api/v1/tasks?search=Task+1')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.data).toHaveLength(1);
      expect(response.body.data.data[0].title).toBe('Task 1');
    });
  });

  describe('GET /tasks/:id', () => {
    let taskId: string;

    beforeEach(async () => {
      const task = await prisma.task.create({
        data: {
          title: 'Single Task',
          description: 'Single Description',
          status: TaskStatus.TODO,
          priority: Priority.MEDIUM,
          createdById: userId,
        },
      });
      taskId = task.id;
    });

    it('should get task by id', async () => {
      const response = await request(app)
        .get(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(taskId);
      expect(response.body.data.title).toBe('Single Task');
    });

    it('should return ETag header', async () => {
      const response = await request(app)
        .get(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.headers['etag']).toBeDefined();
      expect(response.headers['etag']).toMatch(/^"[^"]+"$/);
    });

    it('should return 304 when If-None-Match matches ETag', async () => {
      const first = await request(app)
        .get(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`);
      const etag = first.headers['etag'] as string;

      const second = await request(app)
        .get(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('If-None-Match', etag);

      expect(second.status).toBe(304);
    });

    it('should return 200 when If-None-Match does not match', async () => {
      const response = await request(app)
        .get(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('If-None-Match', '"stale-etag-value"');

      expect(response.status).toBe(200);
      expect(response.headers['etag']).toBeDefined();
    });

    it('should return 404 for non-existent task', async () => {
      const response = await request(app)
        .get('/api/v1/tasks/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /tasks/:id', () => {
    let taskId: string;

    beforeEach(async () => {
      const task = await prisma.task.create({
        data: {
          title: 'Task to Update',
          description: 'Description',
          status: TaskStatus.TODO,
          priority: Priority.LOW,
          createdById: userId,
        },
      });
      taskId = task.id;
    });

    it('should update task and return 204 No Content', async () => {
      const response = await request(app)
        .patch(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated Title',
          status: TaskStatus.IN_PROGRESS,
        });

      expect(response.status).toBe(204);
      expect(response.headers['etag']).toBeDefined();
      expect(response.body).toEqual({});
    });

    it('should update task status to DONE and return 204', async () => {
      const response = await request(app)
        .patch(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: TaskStatus.DONE });

      expect(response.status).toBe(204);
    });

    it('should update task with dueDate and return 204', async () => {
      const response = await request(app)
        .patch(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ dueDate: '2025-12-31T00:00:00.000Z' });

      expect(response.status).toBe(204);
    });

    it('should return 204 with fresh ETag after update', async () => {
      const getResponse = await request(app)
        .get(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`);
      const originalEtag = getResponse.headers['etag'] as string;

      const patchResponse = await request(app)
        .patch(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('If-Match', originalEtag)
        .send({ title: 'ETag Updated Title' });

      expect(patchResponse.status).toBe(204);
      expect(patchResponse.headers['etag']).toBeDefined();
      expect(patchResponse.headers['etag']).not.toBe(originalEtag);
    });

    it('should return 412 when If-Match does not match current ETag', async () => {
      const response = await request(app)
        .patch(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('If-Match', '"stale-etag-12345"')
        .send({ title: 'Should Fail' });

      expect(response.status).toBe(412);
      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent task', async () => {
      const response = await request(app)
        .patch('/api/v1/tasks/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'New Title' });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /tasks/:id', () => {
    let taskId: string;

    beforeEach(async () => {
      const task = await prisma.task.create({
        data: {
          title: 'Task to Delete',
          description: 'Description',
          status: TaskStatus.TODO,
          priority: Priority.LOW,
          createdById: userId,
        },
      });
      taskId = task.id;
    });

    it('should delete task', async () => {
      const response = await request(app)
        .delete(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify task is deleted
      const getResponse = await request(app)
        .get(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(getResponse.status).toBe(404);
    });

    it('should return 404 for non-existent task', async () => {
      const response = await request(app)
        .delete('/api/v1/tasks/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('TaskService.getTaskStatus (direct)', () => {
    it('should return status for existing task', async () => {
      const task = await prisma.task.create({
        data: {
          title: 'Status Task',
          status: TaskStatus.IN_PROGRESS,
          priority: Priority.HIGH,
          createdById: userId,
        },
      });

      const status = await taskService.getTaskStatus(task.id);

      expect(status).toBe(TaskStatus.IN_PROGRESS);
    });

    it('should return null for non-existent task id', async () => {
      const status = await taskService.getTaskStatus('00000000-0000-0000-0000-000000000000');

      expect(status).toBeNull();
    });
  });
});
