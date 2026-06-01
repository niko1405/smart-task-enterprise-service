import request from 'supertest';
import { PrismaClient, TaskStatus, Priority } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:3000/api/v1';

describe('Task Endpoints', () => {
  let authToken: string;
  let userId: string;

  beforeEach(async () => {
    await prisma.task.deleteMany();
    await prisma.user.deleteMany();

    // Create test user and login
    const user = await prisma.user.create({
      data: {
        email: 'taskuser@example.com',
        password: await bcrypt.hash('password123', 12),
        name: 'Task User',
      },
    });
    userId = user.id;

    const loginResponse = await request(API_URL)
      .post('/auth/login')
      .send({
        email: 'taskuser@example.com',
        password: 'password123',
      });

    authToken = loginResponse.body.data.token;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /tasks', () => {
    it('should create a new task', async () => {
      const response = await request(API_URL)
        .post('/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Task',
          description: 'Test Description',
          status: TaskStatus.TODO,
          priority: Priority.MEDIUM,
          tags: ['test', 'important'],
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.title).toBe('Test Task');
      expect(response.body.data.createdById).toBe(userId);
    });

    it('should require title', async () => {
      const response = await request(API_URL)
        .post('/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: 'Test Description',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should require authentication', async () => {
      const response = await request(API_URL)
        .post('/tasks')
        .send({
          title: 'Test Task',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /tasks', () => {
    beforeEach(async () => {
      // Create some test tasks
      await prisma.task.createMany({
        data: [
          {
            title: 'Task 1',
            description: 'Description 1',
            status: TaskStatus.TODO,
            priority: Priority.HIGH,
            createdById: userId,
            tags: ['tag1'],
          },
          {
            title: 'Task 2',
            description: 'Description 2',
            status: TaskStatus.IN_PROGRESS,
            priority: Priority.MEDIUM,
            createdById: userId,
            tags: ['tag2'],
          },
          {
            title: 'Task 3',
            status: TaskStatus.DONE,
            priority: Priority.LOW,
            createdById: userId,
          },
        ],
      });
    });

    it('should get all tasks', async () => {
      const response = await request(API_URL)
        .get('/tasks')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.data).toHaveLength(3);
      expect(response.body.data.pagination.total).toBe(3);
    });

    it('should filter by status', async () => {
      const response = await request(API_URL)
        .get('/tasks?status=TODO')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.data).toHaveLength(1);
      expect(response.body.data.data[0].status).toBe('TODO');
    });

    it('should filter by priority', async () => {
      const response = await request(API_URL)
        .get('/tasks?priority=HIGH')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.data).toHaveLength(1);
      expect(response.body.data.data[0].priority).toBe('HIGH');
    });

    it('should support pagination', async () => {
      const response = await request(API_URL)
        .get('/tasks?page=1&limit=2')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.data).toHaveLength(2);
      expect(response.body.data.pagination.totalPages).toBe(2);
    });

    it('should search tasks', async () => {
      const response = await request(API_URL)
        .get('/tasks?search=Description 1')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.data.length).toBeGreaterThanOrEqual(1);
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
      const response = await request(API_URL)
        .get(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(taskId);
      expect(response.body.data.title).toBe('Single Task');
    });

    it('should return 404 for non-existent task', async () => {
      const response = await request(API_URL)
        .get('/tasks/non-existent-id')
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
          title: 'Update Task',
          description: 'Original Description',
          status: TaskStatus.TODO,
          priority: Priority.MEDIUM,
          createdById: userId,
        },
      });
      taskId = task.id;
    });

    it('should update task', async () => {
      const response = await request(API_URL)
        .patch(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated Title',
          description: 'Updated Description',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Updated Title');
      expect(response.body.data.description).toBe('Updated Description');
    });

    it('should update task status', async () => {
      const response = await request(API_URL)
        .patch(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: TaskStatus.IN_PROGRESS,
        });

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('IN_PROGRESS');
    });
  });

  describe('DELETE /tasks/:id', () => {
    let taskId: string;

    beforeEach(async () => {
      const task = await prisma.task.create({
        data: {
          title: 'Delete Task',
          status: TaskStatus.TODO,
          priority: Priority.MEDIUM,
          createdById: userId,
        },
      });
      taskId = task.id;
    });

    it('should delete task', async () => {
      const response = await request(API_URL)
        .delete(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify task is deleted
      const getResponse = await request(API_URL)
        .get(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(getResponse.status).toBe(404);
    });
  });
});
