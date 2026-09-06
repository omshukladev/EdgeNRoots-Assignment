# Commands Reference (cmd.md)

Every command used in this project, what it does, and when to run it.
All commands run from the project root unless stated otherwise.

---

## 1. Git

| Command | What it does | When |
|---|---|---|
| `git init` | Create a git repo in this folder | Once (done) |
| `git add -A` | Stage all changes | Before every commit |
| `git commit -F - <<'EOF' ... EOF` | Commit with a multi-line message | After each phase |
| `git push origin main` | Push commits to GitHub | After commit |
| `git status` | Show changed files | Any time |
| `git log --oneline` | Show commit history | Any time |

## 2. npm — installs (done once)

| Command | What it does |
|---|---|
| `npm install express mysql2 dotenv winston morgan express-rate-limit` | Production dependencies: web framework (express), MySQL driver (mysql2), env config (dotenv), logging (winston, morgan), API rate limiting (express-rate-limit) |
| `npm install --save-dev vitest supertest @vitest/coverage-v8` | Dev dependencies: test runner (vitest), HTTP test client (supertest), coverage reports (@vitest/coverage-v8) |

## 3. npm — running the app & tests

| Command | What it does |
|---|---|
| `npm run dev` | Start server with auto-restart on file change (`node --watch`). Runs until Ctrl+C |
| `npm start` | Start server once, no watch. For "production" run |
| `npm test` | Run ALL tests once (unit + integration) |
| `npm run test:unit` | Run only unit tests (math/logic, no DB needed) |
| `npm run test:integration` | Run only integration tests (needs MySQL up) |
| `npm run test:coverage` | Run all tests + coverage report (HTML in coverage/) |

## 4. Docker — MySQL

| Command | What it does |
|---|---|
| `docker compose up -d` | Pull MySQL 8.4 image (first time), start container in background. Init scripts (db/*.sql) run only on a FRESH volume |
| `docker compose ps` | Show container status + health |
| `docker compose logs -f mysql` | Follow MySQL logs (Ctrl+C to stop watching) |
| `docker compose down` | Stop container. Data survives (named volume) |
| `docker compose down -v` | Stop container AND delete all data. Next `up` re-runs init scripts |

## 4b. Database — migrate / seed / fresh (no compose down needed)

Use these instead of restarting Docker when schema or data changes:

| Command | What it does |
|---|---|
| `npm run db:migrate` | Create DBs if missing + apply schema.sql to insurance_db AND insurance_test (idempotent — safe to re-run) |
| `npm run db:seed` | Reset insurance_db and load sample data (5 customers, 6 policies, payments + reversal) |
| `npm run db:fresh` | Reset BOTH DBs: main gets schema+seed, test gets schema+accounts |

> These connect as MySQL root (DB_ROOT_USER/DB_ROOT_PASSWORD in .env)
> and manage databases directly — no Docker restart required.
> Docker init scripts (db/*.sql) still work for reviewers who just run `docker compose up`.

## 5. Database connection details (for DB tools like VS Code extensions)

| Field | Value |
|---|---|
| Host | `127.0.0.1` |
| Port | `3306` |
| Username | `insurance_user` |
| Password | `insurance_pass` |
| Database | `insurance_db` (or `insurance_test` for tests) |
| Connection string | `mysql://insurance_user:insurance_pass@127.0.0.1:3306/insurance_db` |
| Root credentials (admin tasks) | `root` / `rootpass` |

## 6. Env setup

| Command | What it does | When |
|---|---|---|
| `cp .env.example .env` | Create your local .env from the template | Once (done) |

## 7. Quick checks

| Command | What it does |
|---|---|
| `curl http://localhost:3000/health` | Terminal health check (Postman also has this) |
| `node -v` | Verify Node 24+ |
| `docker --version` | Verify Docker installed |

## 8. Typical workflow

```bash
# start everything
docker compose up -d          # 1. MySQL up
npm run db:fresh              # 2. optional: reset + reseed both DBs
npm run dev                   # 3. server up (separate terminal)

# test in Postman → import postman/EdgeNRoots_Assignment.postman_collection.json

# when done for the day
docker compose down           # stop MySQL (data kept)
```

## 9. Reset everything (fresh DB + fresh data)

```bash
npm run db:fresh              # preferred: no Docker restart
# or the manual way:
docker compose down -v
docker compose up -d
```

> Note: Docker init scripts (db/*.sql) only run on a **fresh** volume.
> For day-to-day schema/data changes use `npm run db:migrate` / `db:seed` / `db:fresh`
> — they connect as MySQL root and don't need any Docker restart.
