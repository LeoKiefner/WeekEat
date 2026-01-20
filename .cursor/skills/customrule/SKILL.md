---
name: weekeat-quality-bar
description: Force Cursor to output production-quality, cozy UI/UX, lint-clean code for WeekEat (Next.js App Router).
---

# Overview

You are building WeekEat, a Next.js (App Router) + TypeScript application. Every output must be production-quality: lint-clean, type-safe, cohesive UI, and immediately usable without follow-up fixes. Prioritize a cozy, breathable, “mignon” UI with minimal but polished components.

# Quality bar (non-negotiable)

- Output must compile on first try.
- No TypeScript errors, no ESLint errors, no unused imports/vars, no implicit any.
- No placeholder TODO code. If something is unknown, implement a safe stub with clear types and fallback UI.
- Prefer small, composable components with clear responsibilities.
- Never introduce new dependencies unless asked.

# Stack assumptions

- Next.js App Router, TypeScript, Tailwind.
- shadcn/ui components.
- Prisma + PostgreSQL.
- Auth via NextAuth/Auth.js (server-safe patterns).

# Coding standards

- Always provide complete files (full content), not fragments, when editing/creating.
- Use named exports for utilities, default export for pages/components only when idiomatic.
- Use server components by default. Use "use client" only when necessary.
- Use Server Actions or Route Handlers consistently; do not mix patterns in the same feature without reason.
- Validate all external/AI inputs with zod schemas; return typed results.
- Use `cn()` utility for className composition and keep Tailwind class order consistent.

# UI/UX standards ("cozy")

- Use generous spacing: `gap-4/6`, `py-6`, `px-4/6`, avoid cramped layouts.
- Prefer card-based layout with soft borders, subtle shadows, rounded-2xl.
- Typography: clear hierarchy (title, subtitle, muted description).
- Empty states must be designed: illustration placeholder (simple), short supportive copy, single primary CTA.
- Keep screens calm: max 1 primary CTA per view, secondary actions in menus.
- Use consistent iconography (lucide-react) and microcopy (short, friendly, non-judgmental).
- All lists must have loading/empty/error states.

# Architecture rules (WeekEat)

- Routes:
  - `/app/week` = home (weekly plan)
  - `/app/groceries` = shopping list
  - `/app/household` = members + preferences + bans
  - `/app/history` = last 30 days (dedupe)
- Shared layout in `/app/(app)/layout.tsx`:
  - bottom navigation (mobile-first) + centered container on desktop.
- Data access via `lib/db.ts` and `lib/queries/*` with typed functions.
- Business rules must be enforced server-side:
  - banned ingredients never appear
  - no duplicates within last 30 days
  - one-pan/one-pot constraints reflected in tags + instructions
- Any prompt strings must be versioned in `lib/ai/prompts/*` and tested with schemas.

# Linting and formatting requirements

- Use async/await, no `.then()` chains.
- Prefer `const` and early returns.
- No `any`, no `as unknown as`.
- All React lists have stable keys.
- Use `type` over `interface` unless extending.
- Avoid deeply nested JSX; extract subcomponents.

# Output format requirements

When asked to implement something:
1. Brief plan (3-6 bullets max).
2. Provide file tree changes.
3. Provide full code for each file.
4. Mention how to run/test (1-3 commands).
5. If a trade-off exists, pick the safest default and note it in 1 sentence.

If asked for refactor:
- Keep behavior unchanged unless explicitly requested.
- Remove dead code, fix types, and improve UX states.
