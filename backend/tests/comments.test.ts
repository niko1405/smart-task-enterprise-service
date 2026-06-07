import request from 'supertest';
import bcrypt from 'bcryptjs';
import { app } from '../src/index';
import { prisma } from '../src/config/database';
import jwt from 'jsonwebtoken';
import { env } from '../src/config/env';
import { Role } from '@prisma/client';

describe('Comment Endpoints', () => {
  let userToken: string;
  let userId: string;
  let adminToken: string;
  let adminId: string;
  let otherToken: string;
  let otherId: string;
  let taskId: string;

  beforeAll(async () => {
    await prisma.$connect();
  });

  beforeEach(async () => {
    await prisma.comment.deleteMany();
    await prisma.task.deleteMany();
    await prisma.user.deleteMany();

    const user = await prisma.user.create({
      data: {
        email: 'commentuser@example.com',
        password: await bcrypt.hash('password123', 12),
        name: 'Comment User',
        role: Role.USER,
      },
    });
    userId = user.id;
    userToken = jwt.sign({ userId: user.id, email: user.email, role: user.role }, env.JWT_SECRET);

    const admin = await prisma.user.create({
      data: {
        email: 'admin@example.com',
        password: await bcrypt.hash('password123', 12),
        name: 'Admin User',
        role: Role.ADMIN,
      },
    });
    adminId = admin.id;
    adminToken = jwt.sign(
      { userId: admin.id, email: admin.email, role: admin.role },
      env.JWT_SECRET
    );

    const other = await prisma.user.create({
      data: {
        email: 'other@example.com',
        password: await bcrypt.hash('password123', 12),
        name: 'Other User',
        role: Role.USER,
      },
    });
    otherId = other.id;
    otherToken = jwt.sign(
      { userId: other.id, email: other.email, role: other.role },
      env.JWT_SECRET
    );

    const task = await prisma.task.create({
      data: { title: 'Task with comments', createdById: userId },
    });
    taskId = task.id;
  });

  afterAll(async () => {
    await prisma.comment.deleteMany();
    await prisma.task.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  describe('GET /tasks/:id/comments', () => {
    it('should return empty array when no comments exist', async () => {
      const res = await request(app)
        .get(`/api/v1/tasks/${taskId}/comments`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.data).toEqual([]);
      expect(res.body.data.nextCursor).toBeNull();
    });

    it('should return comments for a task', async () => {
      await prisma.comment.create({
        data: { content: 'First comment', taskId, authorId: userId },
      });

      const res = await request(app)
        .get(`/api/v1/tasks/${taskId}/comments`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.data).toHaveLength(1);
      expect(res.body.data.data[0].content).toBe('First comment');
      expect(res.body.data.data[0].author).toHaveProperty('id', userId);
    });

    it('should return 401 without token', async () => {
      const res = await request(app).get(`/api/v1/tasks/${taskId}/comments`);
      expect(res.status).toBe(401);
    });

    it('should paginate comments with cursor', async () => {
      const comments = await Promise.all([
        prisma.comment.create({ data: { content: 'Comment 1', taskId, authorId: userId } }),
        prisma.comment.create({ data: { content: 'Comment 2', taskId, authorId: userId } }),
        prisma.comment.create({ data: { content: 'Comment 3', taskId, authorId: userId } }),
      ]);

      const firstPage = await request(app)
        .get(`/api/v1/tasks/${taskId}/comments?limit=2`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(firstPage.body.data.data).toHaveLength(2);
      expect(firstPage.body.data.nextCursor).not.toBeNull();

      const cursor = firstPage.body.data.nextCursor as string;
      const secondPage = await request(app)
        .get(`/api/v1/tasks/${taskId}/comments?limit=2&cursor=${cursor}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(secondPage.body.data.data).toHaveLength(1);
      expect(secondPage.body.data.nextCursor).toBeNull();

      // Suppress unused variable warning
      void comments;
    });
  });

  describe('POST /tasks/:id/comments', () => {
    it('should create a comment', async () => {
      const res = await request(app)
        .post(`/api/v1/tasks/${taskId}/comments`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ content: 'Hello world' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.content).toBe('Hello world');
      expect(res.body.data.taskId).toBe(taskId);
      expect(res.body.data.authorId).toBe(userId);
      expect(res.body.data.author).toHaveProperty('name', 'Comment User');
    });

    it('should return 400 for empty content', async () => {
      const res = await request(app)
        .post(`/api/v1/tasks/${taskId}/comments`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ content: '' });

      expect(res.status).toBe(400);
    });

    it('should return 400 for missing content', async () => {
      const res = await request(app)
        .post(`/api/v1/tasks/${taskId}/comments`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({});

      expect(res.status).toBe(400);
    });

    it('should return 404 for non-existent task', async () => {
      const res = await request(app)
        .post(`/api/v1/tasks/00000000-0000-0000-0000-000000000000/comments`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ content: 'This should fail' });

      expect(res.status).toBe(404);
    });

    it('should return 401 without token', async () => {
      const res = await request(app)
        .post(`/api/v1/tasks/${taskId}/comments`)
        .send({ content: 'No auth' });

      expect(res.status).toBe(401);
    });
  });

  describe('DELETE /tasks/:id/comments/:commentId', () => {
    let commentId: string;

    beforeEach(async () => {
      const comment = await prisma.comment.create({
        data: { content: 'To be deleted', taskId, authorId: userId },
      });
      commentId = comment.id;
    });

    it('should allow author to delete own comment', async () => {
      const res = await request(app)
        .delete(`/api/v1/tasks/${taskId}/comments/${commentId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const deleted = await prisma.comment.findUnique({ where: { id: commentId } });
      expect(deleted).toBeNull();
    });

    it('should allow ADMIN to delete any comment', async () => {
      const res = await request(app)
        .delete(`/api/v1/tasks/${taskId}/comments/${commentId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Suppress unused variable warning
      void adminId;
    });

    it('should return 403 when non-author non-admin tries to delete', async () => {
      const res = await request(app)
        .delete(`/api/v1/tasks/${taskId}/comments/${commentId}`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(res.status).toBe(403);

      // Suppress unused variable warning
      void otherId;
    });

    it('should return 404 for non-existent comment', async () => {
      const res = await request(app)
        .delete(`/api/v1/tasks/${taskId}/comments/00000000-0000-0000-0000-000000000000`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(404);
    });

    it('should return 401 without token', async () => {
      const res = await request(app).delete(
        `/api/v1/tasks/${taskId}/comments/${commentId}`
      );
      expect(res.status).toBe(401);
    });
  });
});
