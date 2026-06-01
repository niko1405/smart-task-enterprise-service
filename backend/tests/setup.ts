import { prisma } from '../src/config/database';

// Global test setup
beforeAll(async () => {
  // Ensure database connection
  await prisma.$connect();
});

afterAll(async () => {
  // Clean up database connection
  await prisma.$disconnect();
});

// Reset database before each test
beforeEach(async () => {
  // Clean up test data
  await prisma.task.deleteMany();
  await prisma.user.deleteMany();
});
