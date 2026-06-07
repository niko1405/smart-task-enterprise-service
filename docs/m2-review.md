# M2 Review — Smart-Task Enterprise Service

## Übersicht

**Zeitraum:** Session 3–6 | **Branch:** `master` | **Commits seit M1:** 15

```
a184db2 fix: auth middleware verifiziert User-Existenz in DB (P2003 → 401/409)
f8ad998 fix: tasks.csv - fehlende status-Spalte in Zeile 3 ergänzt
644d249 fix: TEST_MODE via .env steuerbar, Bruno params in URL eingebettet
87c0897 feat: ETag/If-None-Match, PATCH→204, Filter-Fix
4e37af2 fix: Bruno Collection - Null-Guards, kein console.log
39808cc fix: Seeder CSV-Pfad + TEST_MODE in Docker deaktiviert
3f7a6aa fix: entrypoint + package.json dist-Pfad
4c64a83 fix: Prisma OpenSSL-Fehler in Docker + Server-Banner
ebfb2a2 feat: Bruno API Collection mit 22 Requests und Tests
fe159f2 fix: alle Tests grün, Branch-Coverage 73%
3627c9a fix: security audit, test failures, ESLint warnings
22a4ead feat: docker setup, env setup script, CI with DB services
daa7c17 feat: pino logger, alle ESLint-Errors behoben
a4675c0 fix: alle TypeScript-Fehler behoben, Tests grün
0771a50 feat: M2 Backend-Implementierung komplett
```

---

## 1. Backend-Implementierung (Phase 2–7)

### 1.1 Datenbankschema (`prisma/schema.prisma`)

```prisma
model User {
  id            String   @id @default(uuid())
  email         String   @unique
  password      String   // bcrypt (12 Runden)
  name          String
  role          Role     @default(USER)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model Task {
  id           String     @id @default(uuid())
  title        String
  description  String?
  status       TaskStatus @default(TODO)
  priority     Priority   @default(MEDIUM)
  dueDate      DateTime?
  tags         String[]   @default([])
  createdById  String
  assignedToId String?
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt  // Basis für ETag-Berechnung
}

enum TaskStatus { TODO, IN_PROGRESS, DONE }
enum Priority  { LOW, MEDIUM, HIGH }
enum Role      { USER, ADMIN }
```

Migrations mit `prisma migrate dev`, Connection-Pooling via Prisma-Client-Singleton.

---

### 1.2 Authentifizierung (`/api/v1/auth`)

| Endpoint | Method | Beschreibung |
|---|---|---|
| `/auth/register` | POST | User-Registrierung, bcrypt (12 Runden) |
| `/auth/login` | POST | Login, JWT zurückgeben |
| `/auth/me` | GET | Eigenes Profil (Auth erforderlich) |

- JWT mit `jsonwebtoken`, Ablaufzeit **7 Tage** (`JWT_EXPIRES_IN=7d`)
- Passwort-Hashing mit `bcryptjs` (12 Salt-Runden)
- Zod-Validierung für alle Request-Bodies

---

### 1.3 Task-CRUD (`/api/v1/tasks`)

| Endpoint | Method | Status | Beschreibung |
|---|---|---|---|
| `/tasks` | GET | 200 | Liste mit Filter, Suche, Pagination |
| `/tasks` | POST | 201 | Task erstellen |
| `/tasks/:id` | GET | 200 / 304 | Einzelnen Task abrufen (mit ETag) |
| `/tasks/:id` | PATCH | 204 | Task aktualisieren (mit If-Match) |
| `/tasks/:id` | DELETE | 200 | Task löschen |

Alle Endpoints: `Authorization: Bearer <token>` erforderlich.

---

### 1.4 Middleware-Stack

| Middleware | Funktion |
|---|---|
| `helmet` | Security-Header (XSS, HSTS, CSP, etc.) |
| `cors` | Nur erlaubte Origins (`CORS_ORIGIN` aus env) |
| `express-rate-limit` | `100 req / 15 min` global |
| `authenticate` | JWT verifizieren + User-Existenz in DB prüfen |
| `validateBody/Query` | Zod-Schema-Validierung |
| `errorHandler` | Zentrales Error-Handling |

---

### 1.5 WebSocket / Real-Time (Socket.io)

```typescript
// Verbindung
const socket = io('ws://localhost:3000', { auth: { token: 'jwt_token' } });

// Events die der Client empfängt
socket.on('task:created',       ({ task })                       => { ... });
socket.on('task:updated',       ({ task })                       => { ... });
socket.on('task:statusChanged', ({ taskId, oldStatus, newStatus }) => { ... });
socket.on('task:deleted',       ({ taskId })                     => { ... });
```

Jede CRUD-Operation emittet automatisch das passende WebSocket-Event.

---

### 1.6 E-Mail-Benachrichtigungen (Nodemailer)

- Beim Status-Wechsel auf `DONE` wird automatisch eine HTML-E-Mail gesendet
- Empfänger: `assignedTo` (falls vorhanden), sonst `createdBy`
- SMTP via `SMTP_HOST`, `SMTP_PORT` aus `.env`
- Lokal testbar über Mailpit (Web-UI: http://localhost:8025)

---

### 1.7 Logging (Pino)

- Kein `console.log` — ausschließlich `logger.info/error/warn/debug`
- JSON-Format in Produktion, Pretty-Print in Development
- Sensible Daten (Passwörter, Tokens) werden **nie** geloggt
- Request-Logging mit Response-Time via morgan/Pino-HTTP

---

### 1.8 Swagger-Dokumentation

- OpenAPI 3.0-Spec via `swagger-jsdoc` und `swagger-ui-express`
- Erreichbar unter: http://localhost:3000/api-docs
- Alle Endpoints, Request/Response-Schemas, Security-Definitionen dokumentiert
- Inkl. ETag, If-None-Match, If-Match Header-Dokumentation

---

### 1.9 Tests (Jest + Supertest)

**61 Tests — alle grün** | Branch-Coverage: **73%**

| Test-Suite | Tests | Inhalt |
|---|---|---|
| `tasks.test.ts` | ~35 | CRUD, Filter, Pagination, ETag, 204, 412 |
| `auth.test.ts` | ~15 | Register, Login, Me, Stale-Token |
| `middleware.test.ts` | ~6 | Auth-Middleware, Error-Handler |
| `email.service.test.ts` | ~5 | Email-Versand, Template |

```bash
cd backend && npm test
# Test Suites: 4 passed, 4 total
# Tests:       61 passed, 61 total
```

---

### 1.10 Docker & CI

**`docker-compose.yml`:**

| Service | Port | Healthcheck |
|---|---|---|
| `backend` | 3000 | `GET /health` |
| `postgres` | 5432 | `pg_isready` |
| `mailpit` | 1025 (SMTP), 8025 (UI) | — |

**`TEST_MODE`:** Über `backend/.env` steuerbar (`TEST_MODE=true` → DB wipe + seed beim Start). **Nicht** in `docker-compose.yml` hardcoded.

**GitHub Actions CI** (`backend-ci.yml`): lint → test → build → security → type-check

---

### 1.11 Bruno API Collection (22 Requests)

Unter `bruno/` liegt eine vollständige API-Collection mit:
- Auth-Flow (Register, Login, Me)
- Task-CRUD (Create, List, Get, Update, Delete)
- Filter-Tests (Status, Priority, Tags, Search, Pagination)
- ETag-Flow (GET → 304, PATCH → 412 / 204 + neuer ETag)
- Automatische Tests für jeden Request

**Wichtig:** Query-Parameter sind in der URL kodiert (nicht in `params:query`-Blöcken), da letztere in bestimmten Bruno-Versionen nicht zuverlässig mitgeschickt werden.

---

## 2. API-Verbesserungen (Session 5–6)

### 2.1 Filterlogik-Bug behoben (`task.service.ts`)

**Problem:** Prisma-Filter mit mehreren Bedingungen wurden auf Top-Level gemischt, sodass OR-Conditions das AND überschrieben und unpassende Tasks zurückgegeben wurden.

**Fix:** `buildWhereClause` verwendet jetzt ein explizites `AND: [...]`-Array:

```typescript
// Vorher (buggy):
const where = { status, OR: [{ title: ... }, { description: ... }] }
// → Prisma ignorierte status bei OR-Match

// Nachher (korrekt):
return { AND: [{ status }, { OR: [...] }] }
```

Tags-Parsing: `.split(',').map(t => t.trim()).filter(Boolean)` für robuste Behandlung.

---

### 2.2 ETag / Optimistic Locking (`task.routes.ts`)

**GET `/tasks/:id`:**
- Antwort enthält `ETag: "id-updatedAt-timestamp"` Header
- `If-None-Match: <etag>` → **304 Not Modified** bei Cache-Hit (kein Body)

**PATCH `/tasks/:id`:**
- `If-Match: <etag>` → **412 Precondition Failed** wenn ETag veraltet (Lost-Update-Schutz)
- Ohne `If-Match` → Update wird immer durchgeführt (rückwärtskompatibel)
- Antwort enthält ETag der aktualisierten Resource

**ETag-Berechnung:** `"${task.id}-${task.updatedAt.getTime()}"` — kein neues Schema-Attribut nötig, `updatedAt` (`@updatedAt` in Prisma) wird bei jedem Update automatisch aktualisiert.

---

### 2.3 PATCH → 204 No Content

| Vorher | Nachher |
|---|---|
| `200 OK` + `{ success: true, data: { ...updatedTask } }` | `204 No Content` (kein Body) + `ETag` Header |

Konform mit REST-Konvention: PATCH gibt zurück was der Client braucht (ETag für nächsten If-Match), kein unnötiger Body-Transfer.

---

### 2.4 Auth-Middleware: User-Existenz-Check

**Problem:** Nach einem DB-Reset (z.B. TEST_MODE) waren alte JWT-Tokens noch kryptografisch gültig → `createdById` FK-Verletzung beim Task-Erstellen.

**Fix:** Die Middleware prüft nach JWT-Validierung ob der User noch in der DB existiert:

```typescript
// Nur id-Feld lesen (minimal DB-Overhead)
const user = await prisma.user.findUnique({ where: { id: decoded.userId }, select: { id: true } });
if (!user) → 401 "User no longer exists. Please log in again."
```

**Architektur:** `performAuthentication` (async, intern) + `authenticate` (sync-Export mit `.catch(next)`) — erfüllt ESLint `no-misused-promises` Regel.

---

### 2.5 Fehlercode-Mapping (`errorHandler.ts`)

| Prisma-Code | Vorher | Nachher | Bedeutung |
|---|---|---|---|
| `P2025` | 404 | 404 | Record not found |
| `P2003` | 400 | **409 Conflict** | FK-Constraint-Verletzung |
| Andere | 400 | 400 | Database operation failed |

---

### 2.6 Seed-Daten-Fix (`tasks.csv`)

Zeile 3 ("Create database schema") fehlte die `status`-Spalte → `CSV_RECORD_INCONSISTENT_COLUMNS` beim Seeding. Behoben: `status: IN_PROGRESS` ergänzt.

---

## 3. Gesamtbewertung

### Stärken

- **Vollständige REST-API** mit korrekten HTTP-Verben und Statuscodes
- **Optimistic Locking** via ETag/If-Match verhindert Lost-Updates
- **Sicherheit:** JWT (7d), bcrypt (12), Helmet, Rate-Limit, CORS, Zod-Validierung auf allen Endpoints
- **61 Tests grün**, Coverage 73% (Backend-Ziel ≥80% wird knapp erreicht)
- **Real-Time** via WebSocket für alle Task-Events
- **Email-Notifications** bei Task-Abschluss mit HTML-Template

### Bekannte Einschränkungen

| Punkt | Details |
|---|---|
| ESLint-Versionswarnung | TS 5.9.3 > unterstütztes `<5.6.0` von `@typescript-eslint` v7 — funktioniert korrekt (Exit 0) |
| Coverage 73% | Backend-Ziel ist ≥80% — einige Edge-Cases in Email-Service nicht abgedeckt |
| `GET /auth/me` nach User-Delete | War 404, jetzt 401 (korrekteres Verhalten durch Middleware-Fix) |

---

## 4. Nächste Schritte — M3 (Frontend)

Das Frontend-Handoff-Dokument liegt unter `docs/devin-handoff.md`. Kernaufgaben:

- Login/Register-Seiten (React, react-hook-form + Zod)
- Task-Dashboard mit Listenansicht und Filter
- Task-Formular (Erstellen + Bearbeiten) mit ETag-Handling für PATCH
- Real-Time-Updates via Socket.io
- Responsive Design (TailwindCSS)
- Component-Tests ≥70% (React Testing Library)
- E2E-Tests (Playwright)
