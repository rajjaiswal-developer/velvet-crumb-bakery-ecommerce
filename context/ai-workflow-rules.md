# AI Workflow Rules

## Approach

Build this project incrementally using a spec-driven workflow. The
context files in this folder (`project-overview.md`,
`architecture.md`, `code-standards.md`, `ui-context.md`) define what
to build, how to build it, and the constraints it must respect.
`progress-tracker.md` defines the current state. Always implement
against these specs — do not infer or invent product behavior,
architecture decisions, or design choices that aren't defined here.

**"Quick Question" discussions**: the project owner may ask
clarifying or discussion-only questions during development. These
never change scope, architecture, or implementation on their own —
only an explicit instruction to implement/add/include a change does.
If a discussion reveals a genuinely better approach, state it
clearly and wait for explicit confirmation before touching any
context file or code.

Follow this phased build order unless `progress-tracker.md` says
otherwise:

1. Data layer & admin core (Prisma schema, migrations, admin auth,
   catalog CRUD)
2. Public storefront (browse, search, filter, cart)
3. Checkout flow (delivery-radius validation, phone double-entry,
   time slots, stock reservation)
4. Payments & order lifecycle (Razorpay, webhooks, idempotency,
   transactional confirmation)
5. Post-order (receipts via outbox, order tracking, audit logging)
6. Security hardening pass
7. Legal pages, SEO polish, performance pass
8. Cron/backup setup (GitHub Actions workflows), staging, smoke
   test, launch

## Scoping Rules

- Work on one feature unit at a time (e.g. "admin product CRUD" is
  one unit; "checkout stock reservation" is a separate unit).
- Prefer small, verifiable increments over large speculative
  changes — implement one endpoint/page/component fully (including
  validation and error states) before moving to the next.
- Do not combine unrelated system boundaries in a single
  implementation step (e.g. don't touch payment webhook logic while
  implementing product search).

## When to Split Work

Split an implementation step if it combines:

- Storefront (UI) changes and API route changes for *different*
  features (e.g. building the cart UI and the Razorpay webhook
  handler in the same step)
- Multiple unrelated API routes (e.g. product CRUD and checkout
  reservation logic)
- Any behavior not clearly defined in `project-overview.md` or
  `architecture.md` — stop and resolve it first rather than guessing

If a change cannot be verified end to end quickly (e.g. "can I place
a test order and see the correct reserved-stock behavior?"), the
scope is too broad — split it.

## Handling Missing Requirements

- Do not invent product behavior not defined in the context files
  (e.g. do not add a coupon system, COD option, customer login, or
  automated SMS/OTP — all explicitly out of scope per
  `project-overview.md` and `architecture.md`).
- If a requirement is ambiguous, resolve it in the relevant context
  file before implementing, or flag it in `progress-tracker.md`
  under Open Questions and use a clearly-marked placeholder so the
  real decision can be swapped in later.
- If a requirement is missing, add it as an open question in
  `progress-tracker.md` before continuing.

## Protected Files

Do not modify the following unless explicitly instructed:

- `components/ui/*` — generated shadcn/ui library components
- Any third-party library internals (`node_modules`, generated
  Prisma client output)
- `prisma/migrations/*` that have already been applied — create a
  new migration instead of editing a historical one
- Razorpay webhook signature-verification logic, once implemented
  and tested — this is a security-critical invariant area
  (`architecture.md` Invariant 4); changes here need explicit
  sign-off, not incidental edits while working on something else

## Keeping Docs in Sync

Update the relevant context file whenever implementation changes:

- System architecture or boundaries → `architecture.md`
- Storage model / schema decisions → `architecture.md`
- Code conventions or standards → `code-standards.md`
- Feature scope → `project-overview.md`
- Visual/design decisions → `ui-context.md`

## Verification & Security Gate (Mandatory Before Any Unit Is Marked Complete)

No unit is "done" on first implementation. Before `progress-tracker.md`
is updated to mark anything Completed, all four checks below must
pass — this is a hard gate, not a suggestion, and applies to every
feature for the rest of the project:

1. **Functional verification** — the feature works end to end for
   its defined scope, tested directly (not just "the build passed").
   State exactly what was tested and what the result was.
2. **Edge case / negative-path check** — invalid input, boundary
   values (e.g. last unit of stock, expired reservation, malformed
   address), and failure paths (e.g. payment failure, webhook
   retry) behave correctly, not just the happy path.
3. **Security check specific to this unit** — e.g. for an auth
   feature: can a logged-out session reach a protected route? Can a
   session cookie be tampered with? For a data-mutating endpoint: is
   input validated server-side, not just client-side? Is the query
   parameterized? For anything touching money or stock: is the
   operation idempotent and atomic? Name the specific attack/misuse
   attempted and the result — a generic "looks secure" is not
   sufficient.
4. **Regression check** — confirm nothing previously completed (per
   `progress-tracker.md`'s Completed list) was altered or broken by
   this change. If anything outside the current unit's declared
   scope was touched, that's a flag to investigate, not ignore.

Only after all four pass does `progress-tracker.md` get updated:
move the unit from In Progress to Completed, with a one-line note on
what was verified. If any check fails, the unit stays In Progress
and the failure gets fixed before anything else proceeds — do not
start the next unit with a known-failing check outstanding.

## Before Moving to the Next Unit

1. The current unit passed the Verification & Security Gate above.
2. No invariant defined in `architecture.md` was violated.
3. `progress-tracker.md` reflects the completed work, including any
   new open questions or architecture decisions made along the way.
4. The build passes (`npm run build`).
5. No unrelated file was modified.
