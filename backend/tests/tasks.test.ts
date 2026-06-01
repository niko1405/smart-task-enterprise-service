import request from 'supertest';
import bcrypt from 'bcrypt';
import { app } from '../src/index';
import { prisma } from '../src/config/database';
import jwt from 'jsonwebtoken';
import { env } from '../src/config/env';
import { Priority, Role, TaskStatus } from '@prisma/client';

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

    it('should update task', async () => {
      const response = await request(app)
        .patch(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated Title',
          status: TaskStatus.IN_PROGRESS,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Updated Title');
      expect(response.body.data.status).toBe('IN_PROGRESS');
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
});
