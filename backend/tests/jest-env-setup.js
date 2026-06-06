// Loads .env.test BEFORE any module is imported, so Prisma client picks up the correct DATABASE_URL
require('dotenv').config({ path: '.env.test', override: true });
