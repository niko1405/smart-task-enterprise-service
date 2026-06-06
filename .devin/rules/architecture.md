---
trigger: always_on
---
# Architektur-Richtlinien

## Technische Vorgaben
- Das gesamte Projekt (Backend & Frontend) MUSS strikt in TypeScript verfasst sein.
- Für das Backend wird Node.js mit Express verwendet.
- Für das Frontend wird React verwendet.
- Strict Mode ist in TypeScript zu aktivieren (`"strict": true` in tsconfig.json).
- Alle TypeScript-Compiler-Warnings müssen behoben werden, bevor Code committed wird.

## Projektstruktur
```
smart-task-enterprise-service/
├── backend/
│   ├── src/
│   │   ├── controllers/    # Request-Handler
│   │   ├── services/      # Business-Logik
│   │   ├── models/        # Datenmodelle & Schemas
│   │   ├── middleware/    # Express-Middleware
│   │   ├── routes/        # API-Routen-Definitionen
│   │   ├── utils/         # Hilfsfunktionen
│   │   ├── config/        # Konfiguration
│   │   └── types/         # TypeScript-Typen
│   ├── tests/             # Backend-Tests
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/    # React-Komponenten
│   │   ├── pages/         # Seiten/Komponenten
│   │   ├── hooks/         # Custom Hooks
│   │   ├── services/      # API-Clients
│   │   ├── utils/         # Hilfsfunktionen
│   │   ├── types/         # TypeScript-Typen
│   │   └── styles/        # CSS/Styles
│   ├── tests/             # Frontend-Tests
│   └── package.json
└── .env.example           # Template für Umgebungsvariablen
```

## Sicherheits- und Validierungsregeln
- Alle HTTP-Requests im Backend müssen zur Laufzeit zwingend mit der Bibliothek 'Zod' validiert werden (Schutz vor Injection-Angriffen).
- SENSIBLE DATEN (API-Keys, Tokens, Passwörter) dürfen NIEMALS hartcodiert werden. Nutze ausnahmslos Umgebungsvariablen (.env-Dateien).
- Die .env-Datei MUSS in .gitignore enthalten sein.
- Für jedes sensible Environment-Variable MUSS ein .env.example Template existieren.
- HTTPS ist für alle Produktions-Endpoints zwingend erforderlich.
- Implementiere Rate-Limiting für alle API-Endpoints (z.B. mit express-rate-limit).
- Nutze Helmet-Middleware für Security-Header im Express-Backend.
- CORS muss strikt konfiguriert werden (nur erlaubte Origins).
- Alle Passwörter müssen mit bcrypt oder argon2 gehasht werden (min. 12 Runden).
- JWT-Tokens müssen mit einer starken Secret-Key signiert werden und eine angemessene Expiration haben.
- Implementiere Input-Sanitization zusätzlich zur Zod-Validierung.
- SQL-Injection-Schutz: Nutze Parameterized Queries oder ORM (z.B. Prisma, TypeORM).
- XSS-Schutz: Frontend muss User-Input vor Rendering escapen (React bietet dies standardmäßig).
- CSRF-Schutz für state-changing Operations.

## TypeScript-Best-Practices
- Vermeide `any` - nutze stattdessen `unknown` oder spezifische Typen.
- Nutze Interfaces für öffentliche APIs, Types für interne Strukturen.
- Nutze Utility-Types (Pick, Omit, Partial, etc.) statt manueller Typ-Definitionen.
- Implementiere Type Guards für komplexe Validierungen.
- Nutze Enums nur wenn notwendig - bevorzuge Union Types mit Literal Types.
- Nutze readonly für unveränderliche Datenstrukturen.
- Nutze const assertions (`as const`) für Literal Types.

## Backend-Architektur (Node.js/Express)
- Trenne Business-Logik (Services) von Request-Handling (Controllers).
- Nutze Dependency Injection für Services.
- Implementiere einheitliches Error-Handling-Middleware.
- Nutze asynchrone Operationen mit async/await (keine Callbacks).
- Implementiere Request-Logging (z.B. mit morgan oder winston).
- Nutze Environment-Variablen für Konfiguration (z.B. dotenv, config).
- API-Responses müssen einheitliches Format haben (z.B. `{ success, data, error }`).
- Implementiere Health-Check Endpoint (`/health`).
- Nutze HTTP-Status-Codes korrekt (200, 201, 400, 401, 403, 404, 500, etc.).
- Implementiere Pagination für Listen-Endpoints.
- Nutze DTOs (Data Transfer Objects) für Request/Response Validierung.

## Frontend-Architektur (React)
- Nutze Functional Components mit Hooks (keine Class Components).
- Komponenten müssen klein und fokussiert sein (Single Responsibility).
- Nutze TypeScript für alle Props und State.
- Implementiere Error Boundaries für kritische Komponenten.
- Nutze React.memo für Performance-Optimierung bei re-renders.
- Nutze useMemo/useCallback für teure Berechnungen und Funktionen.
- State-Management: Für komplexe State nutze Redux Toolkit, Zustand oder Context API.
- Nutze React Router für Navigation (TypeScript-typed).
- Implementiere Lazy Loading für Code-Splitting (React.lazy).
- Nutze CSS-in-JS (z.B. styled-components) oder CSS Modules - vermeide globale CSS.
- Implementiere Loading States und Error Handling für async Operationen.
- Nutze Form-Validation-Bibliothek (z.B. react-hook-form mit Zod).
- Accessibility: Nutze semantisches HTML und ARIA-Attribute wo nötig.

## Testing
- Backend: Mindestens 80% Code Coverage für Services und Controllers.
- Frontend: Mindestens 70% Code Coverage für Komponenten und Hooks.
- Nutze Jest als Test-Framework.
- Backend: Nutze Supertest für API-Integrationstests.
- Frontend: Nutze React Testing Library für Komponententests.
- Schreibe Unit-Tests für reine Funktionen und Services.
- Schreibe Integrationstests für API-Endpoints.
- Schreibe E2E-Tests für kritische User-Flows (z.B. mit Playwright oder Cypress).
- Mocke externe Dependencies in Tests.
- Tests müssen deterministisch sein (keine zufälligen Werte).

## Error-Handling
- Backend: Zentrales Error-Handling-Middleware für alle Fehler.
- Frontend: Globale Error Boundary für uncaught errors.
- Logge Fehler mit Kontext (User-ID, Request-ID, Timestamp).
- Zeige Usern freundliche Fehlermeldungen (keine technischen Details).
- Implementiere Retry-Logic für transient errors (z.B. Netzwerkfehler).
- Nutze Monitoring-Tools (z.B. Sentry) für Fehler-Tracking in Produktion.

## API-Design
- Nutze RESTful Prinzipien für API-Design.
- Nutze kebab-case für URL-Parameter und camelCase für JSON-Properties.
- Implementiere API-Versioning (z.B. `/api/v1/...`).
- Nutze sinnvolle HTTP-Verben (GET, POST, PUT, PATCH, DELETE).
- Implementiere Filtering, Sorting und Pagination für Listen-Endpoints.
- API-Documentation: Nutze OpenAPI/Swagger für Backend-API-Dokumentation.
- Implementiere Request-IDs für Tracing (X-Request-ID Header).

## Datenbank
- Nutze ORM oder Query Builder (z.B. Prisma, TypeORM, Knex).
- Implementiere Database-Migrations für Schema-Änderungen.
- Nutze Transactions für multi-step Operationen.
- Implementiere Indexes für häufige Queries.
- Nutze Soft Delete statt Hard Delete wo möglich.
- Backup-Strategie muss definiert sein.
- Database-Connections müssen gepoolt werden.

## Performance
- Implementiere Caching für häufige Daten (z.B. Redis).
- Nutze Compression für API-Responses (gzip/brotli).
- Optimiere Bundle-Size im Frontend (Tree-shaking, Code-splitting).
- Nutze Lazy Loading für Bilder und Komponenten.
- Implementieren CDN für statische Assets.
- Monitor Performance mit APM-Tools (z.B. New Relic, Datadog).

## Logging & Monitoring
- Nutze strukturiertes Logging (JSON-Format).
- Log-Level: DEBUG (Entwicklung), INFO (Produktion), WARN, ERROR.
- Logge sensible Daten NIEMALS (Passwörter, Tokens).
- Implementiere Request-Logging mit Response-Time.
- Nutze Monitoring für System-Metriken (CPU, Memory, Disk).
- Implementiere Health-Checks und Uptime-Monitoring.
- Nutze Distributed Tracing für Microservices (falls zutreffend).
- **WICHTIG: `console.log` ist VERBOTEN** - Nutze ausschließlich den Pino-Logger (`src/utils/logger.ts`).
- Alle Logs müssen über `logger.info()`, `logger.error()`, `logger.warn()`, `logger.debug()` erfolgen.
- Der Logger ist bereits im Backend eingerichtet und unterstützt pretty-printing in Development.

## Code-Qualitäts-Regeln (ESLint)
- Maximale Funktionslänge: 80 Zeilen (Warnung bei Überschreitung).
- Maximale Komplexität: 10 (Cyclomatic Complexity).
- Keine `console.log` Statements erlaubt (ESLint-Regel: `no-console: error`).
- Async-Handler müssen mit `asyncHandler` Wrapper oder `void` Operator behandelt werden.
- Alle Funktionen müssen explizite Return-Types haben (TypeScript).

## Code-Qualität
- Nutze ESLint mit TypeScript-Regeln (z.B. @typescript-eslint/recommended).
- Nutze Prettier für konsistentes Code-Formatting.
- Nutze Husky für Git-Hooks (pre-commit: lint/test, pre-push: full test suite).
- Nutze Commitlint für konventionelle Commit-Messages.
- Implementiere Code-Review-Prozess (min. 1 Reviewer).
- Nutze SonarQube oder ähnlich für Code-Qualitäts-Analyse.
- Maximale Komplexität für Funktionen: 10 (Cyclomatic Complexity).
- Maximale Funktionslänge: 50 Zeilen.

## Dokumentation
- README.md muss Projekt-Beschreibung, Installation und Usage enthalten.
- API-Dokumentation muss aktuell und vollständig sein.
- Komplexe Funktionen müssen JSDoc-Kommentare haben.
- Architecture Decision Records (ADRs) für wichtige Architektur-Entscheidungen.
- Changelog muss für Releases gepflegt werden.

## CI/CD
- Implementiere CI-Pipeline (GitHub Actions, GitLab CI, etc.).
- Pipeline muss: Lint, Test, Build ausführen.
- Deployments müssen automatisiert sein.
- Implementiere Environment-Promotion (dev -> staging -> prod).
- Nutze Containerisierung (Docker) für konsistente Deployments.
- Implementiere Rollback-Strategie für Deployments.

## Dependencies
- Nutze lock-files (package-lock.json, yarn.lock) und committe sie.
- Regelmäßig Dependencies aktualisieren (npm audit, dependabot).
- Vermeide unnötige Dependencies.
- Prüfe Dependencies auf Sicherheitslücken (npm audit).
- Nutze exact versions für Dependencies in package.json.

## Git-Workflow
- Nutze Feature-Branches (git flow oder GitHub flow).
- Branches müssen sinnvoll benannt sein (feature/..., bugfix/..., hotfix/...).
- Commit-Messages müssen konventionell sein (feat:, fix:, docs:, etc.).
- Keine direkten Commits auf main/master branch.
- Pull-Requests müssen beschrieben und getestet sein.

## Pflicht-Checkliste für den Agenten bei jeder Implementierung

Nach JEDER Code-Änderung MÜSSEN die folgenden Schritte in dieser Reihenfolge ausgeführt und verifiziert werden, bevor ein Commit erstellt wird:

### 1. TypeScript Compile-Check
```bash
# Backend
cd backend && npx tsc --noEmit

# Frontend
cd frontend && npx tsc --noEmit
```
- **Pflicht:** Kein einziger TypeScript-Fehler erlaubt. Warnungen müssen bewertet werden.

### 2. Linter
```bash
# Backend
cd backend && npm run lint

# Frontend
cd frontend && npm run lint
```
- **Pflicht:** Keine ESLint-Errors. Warnings müssen dokumentiert oder behoben werden.
- Regel: Kein `any`-Typ, max. Komplexität 10, max. Funktionslänge 50 Zeilen.

### 3. Tests ausführen
```bash
# Backend
cd backend && npm test

# Frontend
cd frontend && npm test
```
- **Pflicht:** Alle Tests müssen grün sein.
- Neue Funktionalität MUSS mit Unit-Tests abgedeckt sein (Backend: ≥80%, Frontend: ≥70%).
- Bei neuen API-Endpoints: Supertest-Integrationstests schreiben.
- Bei neuen React-Komponenten: React Testing Library Tests schreiben.

### 4. Security Audit
```bash
cd backend && npm audit --audit-level=high
cd frontend && npm audit --audit-level=high
```
- **Pflicht:** Keine High-Severity Vulnerabilities. Moderate müssen dokumentiert werden.
- Bei neuen Dependencies: immer `npm audit` prüfen.

### 5. Zod-Validierung prüfen
- Jeder neue API-Endpoint MUSS eine Zod-Schema-Validierung für Request-Body, Query-Params und Path-Params haben.
- Zod-Schemas MÜSSEN in `backend/src/models/` oder `backend/src/types/` definiert sein.

### 6. Environment-Variablen prüfen
- Jede neue sensible Konfiguration MUSS als Umgebungsvariable implementiert sein.
- `backend/.env.example` und `frontend/.env.example` MÜSSEN aktuell gehalten werden.
- Hardcodierte Secrets oder URLs sind VERBOTEN.

### 7. Containerisierung (Docker)
- Neue Services oder Konfigurationsänderungen MÜSSEN in `docker-compose.yml` reflektiert werden.
- `.dockerignore` muss aktuell bleiben.

### 8. Git-Commit (PFLICHT am Ende jeder Bearbeitung)
- Nach jeder abgeschlossenen Bearbeitung MUSS `git status` leer sein.
- Alle Änderungen MÜSSEN in sinnvolle, atomare Commits verpackt sein.
- Kein Commit darf unzusammenhängende Änderungen mischen.
- Verifizierung vor Abschluss:
```bash
git status   # muss "nothing to commit" zeigen
git log --oneline -3  # zur Kontrolle der letzten Commits
```
- **Pflicht:** Der Agent darf eine Bearbeitung erst als abgeschlossen melden, wenn `git status` keine offenen Änderungen mehr zeigt.

### Commit-Konvention
- Format: `type(scope): beschreibung`
- Typen: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `ci`, `build`
- Beispiel: `feat(tasks): POST /api/v1/tasks Endpoint mit Zod-Validierung`

### Containerisierung (Docker)
- Backend und Frontend müssen in separaten Containern laufen.
- Nutze Docker Compose für lokale Entwicklung und Orchestrierung.
- Implementiere Multi-Stage Builds für optimierte Image-Größe.
- Nutze Alpine Linux als Base-Image für kleinere Images.
- Implementiere Health-Checks für alle Container.
- Container müssen über dedizierte Netzwerke kommunizieren.
- Nutze Volumes für Hot-Reloading in der Entwicklung.
- Mailpit muss als separater Container für Email-Testing laufen.
- Environment-Variablen müssen via env_file in Docker Compose geladen werden.
- .dockerignore muss in beiden Projekten vorhanden sein.
- Container-Ports müssen konsistent mit lokaler Entwicklung sein (Backend: 3000, Frontend: 5173, Mailpit: 1025/8025).

## Container-Start-Prüfung
- Vor jedem Backend-Start müssen die Container mit `docker compose ps` geprüft werden.
- Falls Container nicht laufen (`unhealthy` oder `exited`), müssen sie mit `docker compose up -d` neu gestartet werden.
- Datenbank-Container müssen `healthy` sein bevor Prisma-Migrationen ausgeführt werden.
- Test-Datenbank (smarttask_test_db) muss separat existieren oder automatisch erstellt werden.
- Container-Logs müssen auf Fehler geprüft werden: `docker compose logs <service>`.

## Development-Workflow mit Docker
- Lokale Entwicklung: `docker-compose up` startet alle Services.
