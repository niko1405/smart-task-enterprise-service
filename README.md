# Smart-Task Enterprise Service

Ein vollständiges Task-Management-System mit Node.js/Express-Backend und React-Frontend, inklusive Echtzeit-Updates via Socket.IO, JWT-Authentifizierung und Role-Based Access Control.

## Tech Stack

### Backend
- **Node.js** mit **Express** & TypeScript (Strict Mode)
- **Prisma** ORM mit PostgreSQL
- **Zod** für Request-Validierung + Input-Sanitization
- **Socket.IO** für Echtzeit-Updates
- **JWT** (jsonwebtoken) + bcryptjs für Auth
- **Nodemailer** für Email-Benachrichtigungen via Mailpit
- **Helmet**, **express-rate-limit**, CORS, Compression
- **Jest** + Supertest für Testing
- **Pino** für strukturiertes Logging
- **Swagger/OpenAPI** für API-Dokumentation

### Frontend
- **React 18** mit TypeScript & Vite
- **TailwindCSS** für Styling
- **React Router** für Navigation
- **Axios** als API-Client
- **Socket.IO Client** für Echtzeit-Updates
- **React Testing Library** + Jest für Testing

---

## Schnellstart

### Voraussetzungen
- Node.js ≥ 20
- Docker (für PostgreSQL und Mailpit)

### 1. Infrastruktur starten
```bash
docker compose up -d postgres mailpit
```

### 2. Backend
```bash
cd backend
npm install
cp .env.example .env    # Werte ggf. anpassen
npx prisma migrate deploy
npm run dev             # läuft auf http://localhost:3000
```

### 3. Frontend
```bash
cd frontend
npm install
cp .env.example .env    # Werte ggf. anpassen
npm run dev             # läuft auf http://localhost:5173
```

> **TEST_MODE:** Ist `TEST_MODE=true` in `backend/.env` gesetzt, wird die Datenbank bei jedem Serverstart mit Demo-Daten befüllt (Seed).

---

## Demo-Zugänge (Seed-Daten)

| Rolle  | E-Mail                    | Passwort      |
|--------|---------------------------|---------------|
| **Admin**  | `admin@smarttask.com`     | `admin123`    |
| User   | `john.doe@example.com`    | `password123` |
| User   | `jane.smith@example.com`  | `password123` |
| User   | `bob.wilson@example.com`  | `password123` |

**Admin-Rechte:** Admins können alle Tasks bearbeiten und löschen. Normale User können nur ihre eigenen Tasks bearbeiten/löschen.

---

## Alle Befehle im Überblick

### Backend (`cd backend`)

| Zweck | Befehl |
|-------|--------|
| Entwicklungsserver starten | `npm run dev` |
| Produktions-Build | `npm run build` |
| Produktions-Server starten | `npm start` |
| **Tests** ausführen | `npm test` |
| Tests mit Coverage | `npm run test:coverage` |
| Tests im Watch-Modus | `npm run test:watch` |
| **ESLint** ausführen | `npm run lint` |
| ESLint mit Auto-Fix | `npm run lint:fix` |
| **Prettier** formatieren | `npm run format` |
| **TypeScript** Compile-Check | `npx tsc --noEmit` |
| Prisma Migration erstellen | `npx prisma migrate dev --name <name>` |
| Prisma Migration deployen | `npx prisma migrate deploy` |
| Prisma Studio öffnen | `npx prisma studio` |
| DB zurücksetzen + neu seeden | `npx prisma migrate reset` |
| Datenbank manuell seeden | `npx ts-node src/utils/seeder.ts` |
| Security Audit | `npm audit --audit-level=high` |

### Frontend (`cd frontend`)

| Zweck | Befehl |
|-------|--------|
| Entwicklungsserver starten | `npm run dev` |
| Produktions-Build | `npm run build` |
| Build-Vorschau | `npm run preview` |
| **Tests** ausführen | `npm test` |
| Tests mit Coverage | `npm run test:coverage` |
| **ESLint** ausführen | `npm run lint` |
| ESLint mit Auto-Fix | `npm run lint:fix` |
| **Prettier** formatieren | `npm run format` |
| **TypeScript** Compile-Check | `npx tsc --noEmit` |
| Security Audit | `npm audit --audit-level=high` |

### Docker

| Zweck | Befehl |
|-------|--------|
| Alle Dienste starten | `docker compose up -d` |
| Nur PostgreSQL + Mailpit | `docker compose up -d postgres mailpit` |
| Backend + Frontend (Container) | `docker compose up -d backend frontend` |
| Logs anzeigen | `docker compose logs -f backend` |
| Dienste stoppen | `docker compose down` |
| Volumes löschen (DB-Reset) | `docker compose down -v` |
| Backend-Image bauen | `docker build -t smart-task-backend:local backend/` |
| Frontend-Image bauen | `docker build -t smart-task-frontend:local frontend/` |

---

## Dienste & URLs

| Dienst | URL |
|--------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3000/api/v1 |
| **Swagger API-Docs** | http://localhost:3000/api-docs |
| Health Check | http://localhost:3000/health |
| Mailpit Web UI | http://localhost:8025 |

---

## Features

- **Authentifizierung:** JWT-basierte Registrierung und Login
- **RBAC:** Admin kann alles; User nur eigene Tasks bearbeiten/löschen
- **Task-Management:** Erstellen, Bearbeiten, Löschen, Filtern, Paginierung
- **Soft Delete:** Gelöschte Tasks werden nicht physisch entfernt
- **Kommentare:** Paginierte Kommentarfunktion pro Task
- **Echtzeit:** Socket.IO für Live-Updates bei Task- und Kommentaränderungen
- **Email:** Benachrichtigung bei Task-Status "DONE" via Mailpit
- **Optimistic Locking:** ETag-basiertes Concurrent-Editing
- **Sicherheit:** Helmet, CORS, Rate-Limiting, Input-Sanitization, X-Request-ID

---

## Architecture

Siehe `.windsurf/rules/architecture.md` für detaillierte Architektur-Richtlinien.

---

## License

MIT
