# AGENT.md — Operating Rules for This Project

This file is the source of truth for how work happens in this repository.
Read it first, then read the docs/ folder. Follow it in every session, every phase.

## 1. Read Everything Before Acting

1. Read this file.
2. Read `docs/` — especially `docs/phase.md` (current phase), `docs/restriction.md`
   (hard rules), and `docs/sessionlog.md` (what has been done so far).
3. Never start a new phase without checking which phase is currently approved.

## 2. Phase Discipline (from docs/phase.md)

- Work is split into phases. **One phase at a time. Never skip or merge phases.**
- After completing a phase:
  1. Explain what was done: which files were created/edited and what changed in each.
  2. **Ask the user for approval** before starting the next phase.
  3. Update `docs/sessionlog.md` with a new timestamped entry (date, time, done, next).
  4. Hand over a **complete git commit command** (message + co-author trailer) —
     the user runs it. The agent never runs git itself.

## 3. Command & Installation Rules (from docs/restriction.md)

- The agent **never executes shell commands** — no `npm install`, no `docker compose`,
  no `git add/commit/push`, no starting servers.
- The agent provides exact, ready-to-paste commands; **the user runs them all**.
- This covers Docker setup, npm scripts, DB init/seed, and every git operation.

## 4. Tech Rules (from docs/restriction.md)

- **Latest stable versions only.** Before recommending any package or tool, web-search
  its current stable version. Never reuse outdated commands or versions from old tutorials.
- Baseline stack (verified 2026-09-06): Node 24 LTS · Express 5.2.x · mysql2 3.24.x ·
  Vitest 4.1.x · MySQL 8.4 LTS (Docker) · supertest · dotenv.
- Raw SQL only — no ORM. All SQL hand-written.
- Layered code: routes → controllers → services → repositories → db. No business
  logic in routes/controllers. No SQL outside repositories.
- **Insert-only architecture**: no UPDATE/DELETE on business/financial data.
  Corrections and reversals are new INSERTed rows.
- **Double-entry always balances**: assert debit === credit in the service and
  again inside the DB transaction.
- Multi-table financial operations must run in an explicit MySQL transaction
  with ROLLBACK on any failure.
- Summaries (outstanding, account balances) are always computed from ledger/
  transaction data — never stored or duplicated.

## 5. Documentation Discipline

- After **every file edit**, append an entry to `docs/sessionlog.md` with:
  date, time, what was done, which files, and what comes next.
- Keep docs in sync with reality. If the design changes, update the relevant doc
  (architecture / api / schema / flow) in the same edit session.

## 6. Testing

- Tests are part of every phase, not an afterthought (see `docs/test.md`).
- Unit tests for pure logic (utils, services with mocked repos).
- Integration tests for full HTTP → MySQL flows, including rollback scenarios.
- `npm test` must be green before a phase is reported complete.

## 7. Communication Style

- Explain like a pair programmer: what changed, why, and what's next.
- After each phase: clear summary + approval request. Never proceed silently.
- The user must always understand what happened in the project.

## 8. Git Commit Template

After each phase, hand the user simple one-line commands in this shape (user pastes them):

```bash
git add .
git commit -m "<phase>: <what was done>"
```

No co-author trailers — this is the user's assignment, commits are theirs alone.
The agent itself never runs git commands.
