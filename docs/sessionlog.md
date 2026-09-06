# Session Log

> Purpose: time-stamped record of everything done in this project.
> Rule: after every code edit or significant action, append an entry with
> date, time, what changed (files + summary), and what comes next.

## Log Format

```
### [YYYY-MM-DD HH:MM] — Short title
- **Done:** what was edited/created and why
- **Files:** changed file paths
- **Next:** what the next step is
```

---

## Entries

### [2026-09-06 12:19] — Documentation foundation created
- **Done:** Created the complete docs/ foundation: architecture, session log, phase plan, testing strategy, restrictions, data flow, API contract, schema design, assignment summary, and root AGENT.md operating rules. Verified latest stable versions of the stack via web search (Node 24 LTS, Express 5.2.1, mysql2 3.24.2, Vitest 4.1.11, MySQL 8.4 LTS).
- **Files:** docs/architecture.md, docs/sessionlog.md, docs/phase.md, docs/test.md, docs/restriction.md, docs/flow.md, docs/api.md, docs/schema.md, docs/assignment/assignment.md, AGENT.md
- **Next:** User reviews docs. Then Phase 1 begins: project scaffolding (package.json, npm scripts, docker-compose.yml, .env.example, src/config/db.js) — user runs all commands, no self-installation.

### [2026-09-06 12:26] — Audited pasted utils/ folder, updated docs
- **Done:** Reviewed all 10 files in the user-pasted utils/ folder (from a previous Chatty project). Decided: KEEP 6 (apiError, apiResponse, asyncHandler, logger, loggerHelpers, rateLimiters — adapted to this project), DELETE 4 (cloudinary, encryption, token, !Logger.md — no auth/uploads/encryption here), ADD 7 new (errors, validators, gst, ledger, money, env, index barrel). Updated architecture.md (§3a inventory + §8 error/response envelope), phase.md (Phase 2 deliverables), test.md (unit test targets).
- **Files:** docs/architecture.md, docs/phase.md, docs/test.md, docs/sessionlog.md
- **Next:** User approval for updated plan. Then Phase 1 (scaffolding) begins.

### [2026-09-06 12:44] — Phase 2 (utils) executed: src/utils/ built, old folder removed
- **Done:** Moved+adapted the user's pasted utils/ into src/utils/ as ESM (kept import/export — Node 24 + `"type": "module"`, no CJS rewrite). KEPT+ADAPTED: apiError.js (added `code` field, default+named export), apiResponse.js (added sendSuccess helper), asyncHandler.js (default+named export), logger.js (logs/ dir, morgan stream, removed logExamples noise), loggerHelpers.js (requestLogger + logError), rateLimiters.js (globalLimiter only). DELETED: cloudinary.js, encryption.js, token.js, !Logger.md. ADDED: errors.js (NotFound/Conflict/Validation/Overpayment), validators.js, gst.js (calculateGst, round2), ledger.js (assertBalanced, makeEntry), money.js (parseMoney for ₹ input), env.js (loadEnv fail-fast), index.js (barrel). Root utils/ folder removed. package.json (ESM, node --watch dev, test scripts), .env.example, .gitignore created. Verified package versions: winston 3.19.0, morgan 1.12.0, express-rate-limit 8.7.0, dotenv 17.4.2, supertest 7.2.2, express 5.2.1, @vitest/coverage-v8 4.1.11.
- **Files:** src/utils/* (13 files), package.json, .env.example, .gitignore, docs/sessionlog.md, docs/phase.md, docs/architecture.md
- **Next:** User runs git init + first commit, then npm install. Phase 1 (scaffolding: docker-compose, schema.sql, seed.sql, db.js, app/server.js) follows.

### [2026-09-06 12:50] — Clarified mysql2 need; removed co-author trailers
- **Done:** Explained why mysql2 (Node driver) is required even with Docker MySQL (server) — the app can't query MySQL without a client library. Per user decision: all git commit templates now have NO co-author trailer — this is the user's assignment. Updated AGENT.md §8 and restriction.md §3.
- **Files:** AGENT.md, docs/restriction.md, docs/sessionlog.md
- **Next:** User runs the corrected commit + install commands; then Phase 1 (scaffolding).

### [2026-09-06 13:00] — Phase 1 executed: Docker + server skeleton + tests
- **Done:** Created docker-compose.yml (MySQL 8.4, init mount, healthcheck, named volume), db/schema.sql (6 tables with PK/FK/indexes/timestamps + CHECK), db/seed.sql (accounts + worked example), db/test.sql (insurance_test DB). Created src/config/db.js (dual pools), src/app.js (express + morgan→winston + requestLogger + globalLimiter + /health + 404/error middleware), src/server.js. Vitest 5 config + smoke tests (gst, ledger, health with auto-skip). Verified installed versions (all latest): express 5.2.1, mysql2 3.24.3, dotenv 17.4.2, winston 3.19.0, morgan 1.12.0, express-rate-limit 8.7.0, vitest 5.0.0 (stable today), supertest 7.2.2. Node 24.6.0, Docker 28.5.2, Compose v2.40.3 confirmed. Syntax-checked all new files.
- **Files:** docker-compose.yml, db/schema.sql, db/seed.sql, db/test.sql, src/config/db.js, src/app.js, src/server.js, vitest.config.js, tests/unit/gst.test.js, tests/unit/ledger.test.js, tests/integration/health.test.js, docs/phase.md, docs/architecture.md, docs/restriction.md
- **Next:** User runs: docker compose up -d → npm run dev → curl health → npm test. Approval gate: health 200 + tests green.

### [2026-09-06 13:09] — Postman collection + cmd.md created; explained testing
- **Done:** Created postman/EdgeNRoots_Assignment.postman_collection.json (health + all 6 assignment endpoints + error-case examples, baseUrl variable). Created docs/cmd.md (every command with explanation: git, npm, docker, env, workflows, reset). Explained to user why unit+integration tests are simple to explain in interviews (unit = math in isolation, integration = full API→DB flow incl. rollback). User's test run: 9/9 passed. Docker container healthy, server running.
- **Files:** postman/EdgeNRoots_Assignment.postman_collection.json, docs/cmd.md, docs/assignment/assignment.md (Vitest 4→5), docs/phase.md (Postman collection marked created), docs/sessionlog.md
- **Next:** User commits Phase 1. Then Phase 3: Customers module (repository → service → controller → route → tests).

### [2026-09-06 13:18] — Git commit style simplified per user preference
- **Done:** User prefers `git add .` + `git commit -m "..."` instead of `git add -A` + heredoc multi-line messages. Updated AGENT.md §8 and restriction.md §3 to match. Also clarified to user that the winston error log line in test output is the app's intended 404-test logging, not a failure (9/9 tests pass).
- **Files:** AGENT.md, docs/restriction.md, docs/sessionlog.md
- **Next:** User commits Phase 1 with the simple style; then Phase 3: Customers module.

### [2026-09-06 13:25] — Assignment compliance audit: health layering + bulk seed
- **Done:** Re-read assignment (now at docs/backend_intern_insurance_accounting_assignment.md). Fixed two compliance gaps: (1) /health now follows layered structure — new healthRoutes.js → healthController.js → healthService.js → healthRepository.js; app.js mounts route, inline SQL removed (assignment §9). (2) db/seed.sql rewritten with bulk sample data: 5 customers, 6 policies with GST rates 0/5/12/18/28%, partial payment, full settlement, unsettled policies, REVERSAL + corrected payment (insert-only demo). All 12 transactions balance. Confirmed Postman collection already has Health → GET /health ({{baseUrl}}/health).
- **Files:** src/repositories/healthRepository.js, src/services/healthService.js, src/controllers/healthController.js, src/routes/healthRoutes.js (new), src/app.js, db/seed.sql, docs/phase.md, docs/sessionlog.md
- **Next:** User reseeds: docker compose down -v && docker compose up -d; verify health in Postman; npm test; commit. Then Phase 3: Customers module.

### [2026-09-06 13:30] — DB migration/seed/fresh scripts added
- **Done:** Created scripts/db.js with migrate/seed/fresh commands (connects as MySQL root from .env, no Docker restart needed). npm scripts added: db:migrate (create DBs + apply schema to both DBs, idempotent), db:seed (reset main + sample data), db:fresh (reset both: main schema+seed, test schema+accounts). Added DB_ROOT_USER/DB_ROOT_PASSWORD to .env and .env.example. Documented DB connection details for user's VS Code DB extension (host 127.0.0.1:3306, insurance_user/insurance_pass, insurance_db; root/rootpass for admin).
- **Files:** scripts/db.js (new), package.json, .env, .env.example, docs/cmd.md, docs/architecture.md, docs/phase.md, docs/sessionlog.md
- **Next:** User runs npm run db:fresh to reseed; commit; Phase 3: Customers module.

### [2026-09-06 13:32] — Fixed test.sql SOURCE syntax error
- **Done:** db:fresh failed on test.sql because SOURCE is a mysql CLI-only command, invalid over programmatic connection. Rewrote db/test.sql to only INSERT the 4 accounts (schema is already applied by scripts/db.js before this file runs).
- **Files:** db/test.sql, docs/sessionlog.md
- **Next:** User re-runs npm run db:fresh; then Postman health + GET policies checks; commit; Phase 3: Customers.

### [2026-09-06 13:42] — Phase 3 completed: Customers module (first vertical slice)
- **Done:** Full layered slice: customerRepository.js (createCustomer returns fresh row, findByEmail, findById — parameterized raw SQL) → customerService.js (name/email/phone validation, duplicate email → ConflictError 409, trims + lowercases email) → customerController.js (asyncHandler + sendSuccess 201) → customerRoutes.js (POST /customers, mounted in app.js). Test infra: tests/helpers/db.js (truncate business tables + reseed accounts in insurance_test), tests/setup.integration.js (DB_USE_TEST=true routes app SQL to test DB), vitest.config.js (separate unit + integration projects). Tests: 6 unit (mocked repo) + 4 integration (real MySQL: 201, 409 duplicate, 422 invalid email, 422 missing name). All new files syntax-checked.
- **Files:** src/repositories/customerRepository.js, src/services/customerService.js, src/controllers/customerController.js, src/routes/customerRoutes.js (new), src/app.js, src/config/db.js, vitest.config.js, tests/helpers/db.js, tests/setup.integration.js, tests/unit/customerService.test.js, tests/integration/customers.test.js (new), docs/phase.md, docs/sessionlog.md
- **Next:** User runs npm test + Postman (POST /customers valid/duplicate/invalid). Commit. Then Phase 4: Policies + Ledger (POST /policies with double-entry).

### [2026-09-06 13:50] — Fixed insurance_test access denied for app user
- **Done:** Integration tests failed: insurance_user had no privileges on insurance_test (Docker's default init only grants the app user rights on the main DB, and the earlier db:fresh recreated the test DB, dropping grants). Added GRANT ALL ON insurance_test.* TO insurance_user to db/test.sql so both the Docker init path and scripts/db.js grant access when run as root. Fixed test.sql also now reruns accounts INSERT on fresh.
- **Files:** db/test.sql, docs/sessionlog.md
- **Next:** User runs npm run db:fresh (regrant), then npm test (integration should pass now). Commit. Then Phase 4: Policies + Ledger.

