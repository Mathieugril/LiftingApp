# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Working with tasks

- Before starting any non-trivial task, ask clarifying questions until you are at least 95% confident you understand what's being asked and how to approach it. Don't guess at ambiguous requirements — surface the ambiguity and ask.
- It's fine to proceed without asking on small, unambiguous tasks (e.g. a one-line typo fix) where there's effectively only one reasonable interpretation.
- When working through a to-do list, run checks (typecheck/lint/tests/manual verification, as applicable) after completing each step, and don't move on to the next step until you're at least 95% confident the current one is correct.
- All generated code must adhere to the relevant standards documents in `docs/` (e.g. `docs/ui.md` for anything UI-related). Read the applicable doc before writing code in that area, and follow it exactly — don't deviate without flagging the conflict to the user first.

## Project state

This started as a `create-next-app` scaffold and now has Clerk authentication wired in. Next.js 16.3.6 (App Router), React 19.2.8, TypeScript (strict), Tailwind CSS v4, ESLint 9, `@clerk/nextjs` for auth. No tests, no CI, no database.

- App Router lives in `src/app/`. Path alias `@/*` maps to `./src/*` (tsconfig.json).
- Tailwind v4 uses CSS-first config — theme variables are defined in `src/app/globals.css` via `@theme inline`, there is no `tailwind.config.js`.
- Lint with `npm run lint` (ESLint flat config in `eslint.config.mjs`, using `eslint-config-next` presets only — no custom rules).
- Run the dev server with `npm run dev` (Turbopack), build with `npm run build`, serve a production build with `npm start`.

### Authentication

- Clerk is configured via `src/proxy.ts` (the Next.js proxy/middleware equivalent) and `ClerkProvider` in `src/app/layout.tsx`, which also renders the sign-in/sign-up/user-button header controls.
- Sign-in and sign-up pages live at `src/app/sign-in/[[...sign-in]]` and `src/app/sign-up/[[...sign-up]]`.
- Routes are public by default — protect pages, Route Handlers, and Server Actions individually with `await auth.protect()`.
- Clerk keys live in `.env.local` (development instance); never commit secret keys or print `.env.local` contents.
- Clerk skill packs are installed under `.agents/skills/` for framework-specific auth patterns (orgs, billing, webhooks, testing, etc.).

## Git commit conventions

- Use [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `test:`, `refactor:`, `docs:`, `chore:`, with an optional scope, e.g. `feat(review): add card flagging`.
- Subject line is imperative ("add", not "added"), lowercase after the prefix, 72 characters max, no full stop.
- Leave a blank line, then a short body explaining why the change was made, not what changed.
- One logical change per commit. Don't mix a feature with unrelated refactors.
- Run `npm run typecheck` and `npm test` before every commit, and never commit if either fails.
- Never commit `.env`, secrets, or `node_modules`.
- Keep the `Co-Authored-By: Claude` trailer on commits you write.
- Try keep it one feature per commit.
