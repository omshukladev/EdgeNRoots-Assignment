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
| `docker compose up -d` | Pull MySQL 8.4 image (first time), start container in background. First run also creates insurance_db + insurance_test + sample data automatically |
| `docker compose ps` | Show container status + health |
| `docker compose logs -f mysql` | Follow MySQL logs (Ctrl+C to stop watching) |
| `docker compose down` | Stop container. Data survives (named volume) |
| `docker compose down -v` | Stop container AND delete all data. Fresh start next `up` |

## 5. Env setup

| Command | What it does |
|---|---|
| `cp .env.example .env` | Create your local .env from the template | Once (done) |

## 6. Quick checks

| Command | What it does |
|---|---|
| `curl http://localhost:3000/health` | Terminal health check (Postman also has this) |
| `node -v` | Verify Node 24+ |
| `docker --version` | Verify Docker installed |

## 7. Typical workflow

```bash
# start everything
docker compose up -d          # 1. MySQL up
npm run dev                   # 2. server up (separate terminal)

# test in Postman → import postman/EdgeNRoots_Assignment.postman_collection.json

# when done for the day
docker compose down           # stop MySQL (data kept)
```

## 8. Reset everything (fresh DB + fresh data)

```bash
docker compose down -v
docker compose up -d
```

> Note: init scripts (db/*.sql) only run on a **fresh** volume. After editing
> schema.sql or seed.sql, run `docker compose down -v` then `up -d` to re-run them.
