import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:3000/api/v1';

describe('Auth Endpoints', () => {
  beforeEach(async () => {
    await prisma.task.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(API_URL)
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toHaveProperty('id');
      expect(response.body.data.user.email).toBe('test@example.com');
      expect(response.body.data.user.name).toBe('Test User');
      expect(response.body.data).toHaveProperty('token');
    });

    it('should return 409 for duplicate email', async () => {
      // Create user first
      await prisma.user.create({
        data: {
          email: 'duplicate@example.com',
          password: await bcrypt.hash('password123', 12),
          name: 'Existing User',
        },
      });

      const response = await request(API_URL)
        .post('/auth/register')
        .send({
          email: 'duplicate@example.com',
          password: 'password123',
          name: 'Test User',
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });

    it('should validate email format', async () => {
      const response = await request(API_URL)
        .post('/auth/register')
        .send({
          email: 'invalid-email',
          password: 'password123',
          name: 'Test User',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should require password of at least 8 characters', async () => {
      const response = await request(API_URL)
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password: 'short',
          name: 'Test User',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      await prisma.user.create({
        data: {
          email: 'login@example.com',
          password: await bcrypt.hash('password123', 12),
          name: 'Login User',
        },
      });
    });

    it('should login with valid credentials', async () => {
      const response = await request(API_URL)
        .post('/auth/login')
        .send({
          email: 'login@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user.email).toBe('login@example.com');
    });

    it('should return 401 for invalid password', async () => {
      const response = await request(API_URL)
        .post('/auth/login')
        .send({
          email: 'login@example.com',
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should return 401 for non-existent user', async () => {
      const response = await request(API_URL)
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /auth/me', () => {
    let authToken: string;
    let userId: string;

    beforeEach(async () => {
      const user = await prisma.user.create({
        data: {
          email: 'me@example.com',
          password: await bcrypt.hash('password123', 12),
          name: 'Me User',
        },
      });
      userId = user.id;

      // Login to get token
      const response = await request(API_URL)
        .post('/auth/login')
        .send({
          email: 'me@example.com',
          password: 'password123',
        });

      authToken = response.body.data.token;
    });

    it('should get current user profile', async () => {
      const response = await request(API_URL)
        .get('/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(userId);
      expect(response.body.data.email).toBe('me@example.com');
    });

    it('should return 401 without token', async () => {
      const response = await request(API_URL).get('/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});
