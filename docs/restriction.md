# Restrictions (Hard Rules)

These rules are non-negotiable. The agent must follow them in every phase.

## 1. Latest Tech Only

- Always use the **latest stable** versions of the stack. Before recommending
  any npm package or tool, **do a web search** for its current version.
- Never copy old tutorials/blogs with outdated commands (e.g., nodemon,
  express 4 patterns, mysql (v1) package, vitest 2, MySQL 5.7 images).
- Pinned baseline (verified 2026-09-06):

| Tool | Version | Why |
|---|---|---|
| Node.js | 24.x LTS | Current LTS line |
| Express | 5.2.x | Latest major (async errors built in) |
| mysql2 | 3.24.x | Promise pool + prepared statements |
| Vitest | 4.1.x (stable) | Latest stable (5.0 is still RC) |
| MySQL (Docker) | 8.4 LTS | Oracle's LTS release |
| supertest | 7.2.x | HTTP integration tests |
| dotenv | 17.4.x | Env config |
| winston | 3.19.x | App logging |
| morgan | 1.12.x | HTTP request logging |
| express-rate-limit | 8.7.x | Global API rate limiting |
| Module system | ES Modules | `"type": "module"` — ESM everywhere |

- If a newer stable version appears mid-project, flag it and decide with the user.
- Prefer Node built-ins over extra deps: `node --watch` replaces nodemon.

## 2. Commands & Installations — User Executes Everything

- The agent **never** runs shell commands itself: no npm install, no docker
  compose up, no git add/commit, no server start.
- The agent provides **exact, ready-to-paste commands** and the user runs them.
- This applies to Docker setup, all npm scripts, database init/seeding, and
  every git operation including git init if the repo doesn't exist yet.

## 3. Git — User Commits

- The agent never stages, commits, or pushes.
- After each phase, the agent hands over a **complete git commit command**
  (with a descriptive message, no co-author trailers — the user's assignment,
  their commits). User pastes and runs it.

## 4. Architecture & Code Rules

- **Insert-only architecture is mandatory.** No UPDATE/DELETE on business or
  financial tables. Corrections/reversals = new INSERTed rows.
- **Raw SQL only.** No ORM (no Sequelize/Prisma/Knex). All SQL written by hand
  to demonstrate JOIN, GROUP BY, SUM, CASE, FKs, indexes, transactions.
- **Layered structure** routes → controllers → services → repositories → db.
  No business logic in routes/controllers, no SQL outside repositories.
- **Double-entry always balances.** Debit total must equal credit total —
  asserted in the service and re-checked inside the DB transaction.
- **Multi-table financial operations must run inside a MySQL transaction**
  with ROLLBACK on any failure.
- Summaries are **calculated from ledger data**, never stored/duplicated.

## 5. Documentation Discipline

- After **every file edit**, update `docs/sessionlog.md` (date, time, what, next).
- After **every phase**, explain changes and ask for approval before proceeding.
- `AGENT.md` at repo root is the source of truth for operating rules — read it
  first in every session, then the docs/ folder.

## 6. Communication Rules

- The agent explains **what** changed, **which files**, and **why** after each phase.
- No work starts on the next phase until the user approves the current one.
- The user should understand everything — the agent explains like a pair
  programmer, not a black box.
