# Auth Coding Standards

This document is the single source of truth for how authentication and authorization are handled in this project. It applies to every page, layout, Server Action, and Route Handler under `src/app/`.

## The rule: Clerk only, no custom auth

**This app uses [Clerk](https://clerk.com) (`@clerk/nextjs`) for all authentication. Nothing else is allowed to touch sessions, credentials, or tokens.**

- Do not hand-roll sign-in/sign-up forms, password hashing, session cookies, or JWT verification. Clerk owns all of that.
- Do not add another auth library (NextAuth/Auth.js, Lucia, Passport, a custom bcrypt+cookie setup, etc.) alongside or instead of Clerk.
- Do not read or trust any identity information from anywhere other than Clerk's server-side helpers (`auth()`, `auth.protect()`, `currentUser()`). Never trust a `userId` from a cookie you set yourself, a query param, a form field, or a header.
- If a Clerk feature is needed (organizations, billing, webhooks, testing, custom flows, etc.), check `.agents/skills/` first — framework-specific Clerk skill packs are already installed there — before writing integration code from scratch.

## Middleware

- `src/proxy.ts` is the only place Clerk's middleware is configured (`clerkMiddleware()` from `@clerk/nextjs/server`), and the only place the route matcher lives. Don't duplicate or bypass it with a second middleware file.
- Do not add auth logic (redirects, role checks, etc.) inside `clerkMiddleware()`'s matcher config. Routes are public by default at the middleware layer — authorization happens per-route, per the next section.

## Routes are public by default — protect individually

**Every route, Server Component, Server Action, and Route Handler that should require a signed-in user must call `await auth.protect()` itself.** There is no global gate; omitting the check means the route is public.

```tsx
// src/app/dashboard/page.tsx — CORRECT
import { auth } from "@clerk/nextjs/server";
import { getRecentWorkouts } from "@/data/workouts";

export default async function DashboardPage() {
  const { userId } = await auth.protect();
  const workouts = await getRecentWorkouts(userId);

  return <WorkoutList workouts={workouts} />;
}
```

```tsx
// src/app/dashboard/page.tsx — WRONG: no protect() call, page is silently public
import { getRecentWorkouts } from "@/data/workouts";

export default async function DashboardPage() {
  const workouts = await getRecentWorkouts("some-user-id"); // ❌ where does this come from?
  return <WorkoutList workouts={workouts} />;
}
```

- `await auth.protect()` both verifies the session and returns `{ userId }` in one call — use the returned `userId`, don't call `auth()` separately afterward.
- A layout's `auth.protect()` call does **not** cover the Server Actions or Route Handlers colocated with it — each Server Action and Route Handler re-verifies `auth.protect()` itself, since it can be invoked directly. See [Data Fetching → Mutations](./data-fetching.md#mutations) for how this applies to writes.
- If a page needs the signed-in user's profile data (name, email, image) rather than just the ID, use `currentUser()` from `@clerk/nextjs/server`, not a client-side hook, inside the same Server Component that already calls `auth.protect()`.

## `userId` is the only trusted identity signal

**Every data helper that reads or writes user-owned data takes `userId` as an argument sourced from `await auth.protect()` — never from client input.** This is the same rule as [Data Fetching → Ownership](./data-fetching.md#ownership-users-only-see-their-own-data); it's restated here because it's fundamentally an auth boundary; and its consequence — that other users' data can leak or be mutated — is a security bug, not a data-layer style choice.

- Never accept a `userId` from `searchParams`, a hidden form field, a request body, or a route param and use it to decide whose data to return or mutate.
- The only trusted source of "who is asking" is `await auth.protect()` (or `await auth()` where a route is optionally authenticated) called on the server, for the current request.

## Client-side auth UI: use Clerk's own components/hooks

- Sign-in/sign-up/user-menu UI in `src/app/layout.tsx` uses Clerk's prebuilt components (`SignInButton`, `SignUpButton`, `UserButton`, `Show`) from `@clerk/nextjs`. Keep using these for global auth UI rather than building custom buttons that redirect to `/sign-in` / `/sign-up`.
- The dedicated sign-in and sign-up pages live at `src/app/sign-in/[[...sign-in]]` and `src/app/sign-up/[[...sign-up]]` and render Clerk's `<SignIn />` / `<SignUp />` components. Don't create additional ad-hoc auth routes.
- If a screen needs a fully custom sign-in/sign-up flow (not just restyling), use Clerk's own hooks (`useSignIn`, `useSignUp`, etc.) per the `clerk-custom-ui` skill — don't call Clerk's Backend API directly from the client, and don't implement the flow by hand.
- Any auth UI is still built from shadcn/ui primitives per [`docs/ui.md`](./ui.md) — Clerk's prebuilt components (`<SignIn />`, `<UserButton />`, etc.) are the exception, since they render Clerk's own UI, not a custom one.

## Route Handlers: Clerk webhooks are the only exception

Per [Data Fetching](./data-fetching.md), this app has no Route Handlers for reading/writing app data. The one allowed use of a Route Handler is a Clerk webhook endpoint (e.g. syncing user/org events).

- Verify every Clerk webhook with `verifyWebhook` from `@clerk/nextjs/webhooks` (or the equivalent for the event source) — never process a webhook payload without verifying its signature first.
- A webhook handler is the only place allowed to trust an identity claim (e.g. `user.id`) straight from a payload, and only after signature verification succeeds.
- See the `clerk-webhooks` skill for the current verification pattern before adding or changing a webhook route.

## Secrets and environment variables

- Clerk keys live in `.env.local` for the development instance. Never commit `.env.local`, never print its contents, and never paste a secret key into code, logs, or a commit message.
- Only the publishable key (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`) is exposed to the browser. The secret key (`CLERK_SECRET_KEY`) is read only by server-side Clerk helpers (`auth()`, `auth.protect()`, `clerkMiddleware()`, webhook verification) and must never be imported into a Client Component or serialized into a prop/response sent to the browser.

## Summary

| Do | Don't |
|---|---|
| Use `@clerk/nextjs` for all auth — sessions, sign-in/up UI, tokens | Hand-roll auth, add another auth library, or verify tokens yourself |
| Call `await auth.protect()` in every page/Server Action/Route Handler that needs a signed-in user | Assume a layout's `auth.protect()` covers its Server Actions or Route Handlers |
| Pass `userId` from `await auth.protect()` into data helpers | Trust a `userId` from `searchParams`, form data, a cookie you set, or any client input |
| Use Clerk's prebuilt components (`SignInButton`, `SignUp`, `UserButton`, etc.) or its hooks for custom flows | Build custom sign-in/sign-up forms or call Clerk's Backend API from the client |
| Verify Clerk webhooks with `verifyWebhook` before trusting the payload | Process a webhook payload without verifying its signature |
| Keep the secret key server-only; keep keys in `.env.local`, never committed | Expose `CLERK_SECRET_KEY` to the client or commit/print `.env.local` |
