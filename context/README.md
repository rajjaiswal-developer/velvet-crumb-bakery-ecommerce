# Velvet Crumb Bakery — AI Development Context Folder

This folder is the single source of truth for building the Velvet Crumb
Cakes e-commerce website with the help of an AI development agent
(Claude Code). It exists to keep the agent consistent across
sessions — so that fixing one bug or adding one feature doesn't
silently break something that already worked.

The AI agent must treat every file here as **project-specific
documentation for Velvet Crumb Bakery**, not a generic template, and must
follow it throughout the entire development lifecycle.

## Files in This Folder

- **`project-overview.md`** — What the site does, who it's for
  (Velvet Crumb Bakery, a vegetarian cake shop in 12 Baker's Lane, Demo City),
  the core customer flow, features, and what's explicitly in/out of
  scope for v1.
- **`architecture.md`** — The stack (Next.js on Vercel, Postgres +
  Prisma on Neon, ImageKit, Brevo, Razorpay), system boundaries,
  storage model, auth model, and the invariants the codebase must
  never violate (e.g. no duplicate orders, no unvalidated admin
  access, no overselling).
- **`code-standards.md`** — Coding conventions: TypeScript rules,
  Next.js/Express conventions, styling rules, API route
  requirements, and security baselines that apply to every change.
- **`ui-context.md`** — The brand's visual language: colors,
  typography, layout patterns, and component conventions, based on
  the Velvet Crumb Bakery logo and brand assets.
- **`ai-workflow-rules.md`** — How the agent should scope work,
  when to split a task, how to handle missing or ambiguous
  requirements, which files are protected, and the checklist to
  clear before moving to the next unit of work.
- **`progress-tracker.md`** — **The only file that should be
  updated continuously.** Current phase, what's completed, what's
  in progress, open questions, and architecture decisions made along
  the way. The agent must review this before starting any new task,
  and must update it only after a feature has been fully
  implemented, tested, and verified — not before.

## Ground Rules for the AI Agent

1. Read `progress-tracker.md` first, every session, before touching
   any code.
2. Implement against the specs in this folder — do not invent
   product behavior, architecture, or design choices not defined
   here. If something is missing or ambiguous, resolve it in the
   relevant file first, or log it as an Open Question in
   `progress-tracker.md`.
3. Only modify files, functions, and components directly related to
   the current task. Do not refactor, rename, restructure, or
   "improve" unrelated code unless explicitly instructed.
4. Preserve backward compatibility — existing features must keep
   working exactly as before unless a change was explicitly
   requested.
5. Mark a feature Completed in `progress-tracker.md` only after it
   passes validation, testing, and integration checks — not on first
   implementation.
6. Security, performance, scalability, and code quality are always
   priorities, not afterthoughts — see `architecture.md` invariants
   and the Security section of `code-standards.md`.

The full stack, database, phone-verification approach, and hosting
plan are finalized as of this version of the context folder — see
`progress-tracker.md`'s Architecture Decisions for the reasoning
behind each. Remaining open items (exact brand hex values, Backblaze
B2 account setup) are listed under Open Questions there and should
be resolved as they come up, not guessed at.
