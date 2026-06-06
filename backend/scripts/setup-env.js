#!/usr/bin/env node
'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ENV_FILE = path.join(__dirname, '..', '.env');
const ENV_EXAMPLE_FILE = path.join(__dirname, '..', '.env.example');

function generateHexSecret(bytes = 64) {
  return crypto.randomBytes(bytes).toString('hex');
}

function replaceEnvValue(content, key, value) {
  const regex = new RegExp(`^(${key}=).*$`, 'm');
  if (regex.test(content)) {
    return content.replace(regex, `$1${value}`);
  }
  return content + `\n${key}=${value}`;
}

function isPlaceholder(value) {
  return (
    !value ||
    value.trim() === '' ||
    value.includes('change-in-production') ||
    value.includes('your-') ||
    value === 'undefined'
  );
}

function parseEnvValue(content, key) {
  const match = content.match(new RegExp(`^${key}=(.*)$`, 'm'));
  return match ? match[1].trim() : '';
}

function main() {
  const envExists = fs.existsSync(ENV_FILE);

  if (!envExists) {
    if (!fs.existsSync(ENV_EXAMPLE_FILE)) {
      process.stderr.write('❌ .env.example not found!\n');
      process.exit(1);
    }
    fs.copyFileSync(ENV_EXAMPLE_FILE, ENV_FILE);
    process.stdout.write('✅ Created .env from .env.example\n');
  } else {
    process.stdout.write('ℹ️  .env already exists, checking secrets...\n');
  }

  let envContent = fs.readFileSync(ENV_FILE, 'utf-8');
  let changed = false;

  // Generate JWT_SECRET if placeholder/empty
  const currentSecret = parseEnvValue(envContent, 'JWT_SECRET');
  if (isPlaceholder(currentSecret)) {
    const secret = generateHexSecret(64);
    envContent = replaceEnvValue(envContent, 'JWT_SECRET', secret);
    process.stdout.write('🔑 Generated JWT_SECRET\n');
    changed = true;
  } else {
    process.stdout.write('ℹ️  JWT_SECRET already set, skipping\n');
  }

  if (changed) {
    fs.writeFileSync(ENV_FILE, envContent);
  }

  process.stdout.write('\n✅ Setup complete! Your .env is ready.\n\n');
  process.stdout.write('── Local development ──────────────────────────\n');
  process.stdout.write('  cd backend && npm run dev\n\n');
  process.stdout.write('── Docker (backend + DB + Mailpit) ────────────\n');
  process.stdout.write('  docker-compose up -d backend postgres mailpit\n');
  process.stdout.write('  Swagger:  http://localhost:3000/api-docs\n');
  process.stdout.write('  Mailpit:  http://localhost:8025\n');
  process.stdout.write('───────────────────────────────────────────────\n');
}

main();
