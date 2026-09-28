# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project state

This is a fresh `create-next-app` scaffold with no custom features yet. Next.js 16.3.6 (App Router), React 19.2.8, TypeScript (strict), Tailwind CSS v4, ESLint 9. No tests, no CI, no database, no env vars configured.

- App Router lives in `src/app/`. Path alias `@/*` maps to `./src/*` (tsconfig.json).
- Tailwind v4 uses CSS-first config — theme variables are defined in `src/app/globals.css` via `@theme inline`, there is no `tailwind.config.js`.
- Lint with `npm run lint` (ESLint flat config in `eslint.config.mjs`, using `eslint-config-next` presets only — no custom rules).
