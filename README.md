# Smart-Task Enterprise Service

Ein Task-Management-System mit Node.js/Express-Backend und React-Frontend, entwickelt zur Evaluation von Windsurf/Cascade Features.

## Tech Stack

### Backend
- Node.js mit Express
- TypeScript (Strict Mode)
- Zod für Input-Validierung
- Prisma (ORM, für M3)
- Nodemailer (Email-Versand via Mailpit)
- Jest + Supertest (Testing)

### Frontend
- React 18 mit TypeScript
- Vite (Build Tool)
- TailwindCSS (Styling)
- React Router (Navigation)
- React Hook Form + Zod (Formular-Validierung)
- Axios (API-Client)
- React Testing Library (Testing)

## Installation

### Backend
```bash
cd backend
npm install
cp .env.example .env
# .env anpassen
npm run dev
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env
# .env anpassen
npm run dev
```

## Usage

Backend läuft auf `http://localhost:3000`
Frontend läuft auf `http://localhost:5173`

## Features

- **F01 - Task-Erstellung:** Aufgaben über Frontend-Formular anlegen
- **F02 - Status-Update:** Echtzeit-Statusänderungen im Frontend
- **F03 - Email-Notifikation:** Automatische Email bei Status "erledigt" via Mailpit

## Architecture

Siehe `.windsurf/rules/architecture.md` für detaillierte Architektur-Richtlinien.

## Testing

### Backend
```bash
cd backend
npm test
npm run test:coverage
```

### Frontend
```bash
cd frontend
npm test
npm run test:coverage
```

## Mailpit Setup (für M2)

```bash
docker-compose up -d
```
Mailpit Web UI: http://localhost:8025

## License

MIT
