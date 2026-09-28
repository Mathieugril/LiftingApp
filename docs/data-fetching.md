# Data Fetching Standards

This document is the single source of truth for how data is fetched and queried in this project. It applies to every page and layout under `src/app/` and every database query in the codebase.

## The rule: Server Components only

**All data fetching in this app must happen in Server Components. There is no other place data is allowed to be fetched from.**

- **Do not** fetch data in Route Handlers (`route.ts`). This project has no Route Handlers today — keep it that way for reading/writing app data. (Clerk's own webhook/auth endpoints are the only exception, and those don't fetch app data.)
- **Do not** fetch data in Client Components — no `useEffect` + `fetch`, no SWR, no TanStack Query, no client-side calls to a Route Handler.
- **Do not** fetch data via Server Actions as a way to load data for a page. Server Actions are for mutations, not reads.
- **Do** fetch all data by `await`-ing a data-helper function directly inside an `async` Server Component (a `page.tsx`, `layout.tsx`, or a server-only child component).

This matches [Next.js's Component-Level / Data Access Layer guidance](https://nextjs.org/docs/app/guides/data-security): Server Components run only on the server, so they're the only place that can safely hold database credentials and unfiltered data. Client Components must never import anything that touches the database.

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
// src/app/dashboard/_components/workout-list.tsx — WRONG
"use client";
import { useEffect, useState } from "react";

export function WorkoutList() {
  const [workouts, setWorkouts] = useState([]);
  useEffect(() => {
    fetch("/api/workouts").then(/* ... */); // ❌ no route handler, no client fetch
  }, []);
  // ...
}
```

If a Client Component needs data, a parent Server Component fetches it and passes it down as props. If a Client Component needs to trigger a *change*, that goes through a Server Action (see [Mutations](#mutations)), never through fetching data itself.

## Database queries live in `src/data/`, and only there

**Every database query must go through a helper function defined in `src/data/`. No other file — a page, a component, a Server Action — is allowed to import `@/db` or touch Drizzle directly.**

- Group helpers by feature/entity, e.g. `src/data/workouts.ts`, `src/data/exercises.ts`.
- Each helper is a plain `async function` that takes whatever scalar arguments it needs (most importantly `userId`, see [Ownership](#ownership-users-only-see-their-own-data) below) and returns already-shaped data — not a raw query builder.
- Add `import "server-only";` at the top of every file in `src/data/` so an accidental import from a Client Component fails the build instead of leaking a database connection to the browser.
- Pages and components call these helpers; they never construct a `db.query...` or `db.select()...` call themselves.

```ts
// src/data/workouts.ts — CORRECT
import "server-only";
import { db } from "@/db";

export async function getRecentWorkouts(userId: string, limit = 10) {
  return db.query.workouts.findMany({
    where: { userId },
    orderBy: { performedAt: "desc" },
    limit,
  });
}
```

```tsx
// src/app/dashboard/page.tsx — WRONG
import { db } from "@/db"; // ❌ pages never import `db` directly

export default async function DashboardPage() {
  const workouts = await db.query.workouts.findMany(/* ... */);
  // ...
}
```

### Use Drizzle ORM — never raw SQL

- Query through Drizzle's relational query API (`db.query.<table>.findMany` / `.findFirst`) or its query builder (`db.select()`, `db.insert()`, `db.update()`, `db.delete()`). These are the only supported ways to talk to the database.
- **Do not** use `db.execute(sql\`...\`)`, a raw `pg`/node-postgres client, or any hand-written SQL string to implement a query. Do not build queries by concatenating strings — that's how SQL injection happens.
- The `sql` tagged-template helper may only be used *inside* a Drizzle query builder call, for a small parameterized fragment Drizzle's API can't express otherwise (e.g. a timezone-aware date cast). Every value passed through it must go in via a `${}` placeholder — never interpolated into a plain string first. This is the existing pattern in `src/data/workouts.ts::getWorkoutsOnDate`; don't reach for it unless the query builder genuinely can't express what you need.

```ts
// Acceptable narrow use of `sql` — still fully parameterized, still inside the query builder
export async function getWorkoutsOnDate(userId: string, date: string, timeZone: string) {
  return db.query.workouts.findMany({
    where: {
      userId,
      RAW: (t, { sql }) => sql`(${t.performedAt} AT TIME ZONE ${timeZone})::date = ${date}::date`,
    },
  });
}
```

```ts
// WRONG — hand-written raw SQL, string-built, and unparameterized
const rows = await db.execute(
  `SELECT * FROM workouts WHERE user_id = '${userId}'` // ❌ raw SQL + string interpolation
);
```

## Ownership: users only see their own data

**Every helper in `src/data/` that reads or writes user-owned rows (workouts, workout exercises, sets, and anything added later that belongs to a user) must scope its query to the current user's `userId`, and that `userId` must come from Clerk's server-side `auth()`/`auth.protect()` — never from a client-supplied value like a route param, query string, or form field.**

- The calling Server Component gets `userId` from `await auth.protect()` and passes it into the data helper as an argument. The helper then filters `where: { userId, ... }` (or the equivalent `eq(table.userId, userId)` in the query builder) on every read, update, and delete.
- Never accept a `userId` argument sourced from client input (e.g. `searchParams.userId`, a hidden form field, a request body) and use it to decide whose data to return — that's an IDOR ([Insecure Direct Object Reference](https://cheatsheetseries.owasp.org/cheatsheets/Insecure_Direct_Object_Reference_Prevention_Cheat_Sheet.html)) vulnerability. The only trusted source of "who is asking" is the authenticated session.
- For a row that isn't owned directly (e.g. `sets`, which belongs to a `workoutExercise`, which belongs to a `workout`), the helper must join up to the `workouts.userId` column and filter on it, rather than trusting a passed-in ID belongs to the caller.
- Writes need the same check: an `update`/`delete` must include the `userId` filter in its `where` clause (or verify ownership with a `findFirst` first) so a user can never mutate another user's row by guessing an ID.

```ts
// src/data/workouts.ts — CORRECT: userId comes from the caller's session, not from input
export async function deleteWorkout(userId: string, workoutId: string) {
  return db
    .delete(workouts)
    .where(and(eq(workouts.id, workoutId), eq(workouts.userId, userId)));
}
```

```ts
// WRONG — no ownership check, any authenticated user could delete any workout by ID
export async function deleteWorkout(workoutId: string) {
  return db.delete(workouts).where(eq(workouts.id, workoutId));
}
```

## Mutations

This doc covers reads, but the same boundaries apply to writes: mutations go through Server Actions, the Server Action re-verifies `auth.protect()` itself (a page-level check does not cover it), and the actual database write is delegated to a helper in `src/data/` — not written inline in the action. See [Next.js's guidance on Server Actions and authorization](https://nextjs.org/docs/app/guides/data-security#authentication-and-authorization) for the reasoning.

## Summary

| Do | Don't |
|---|---|
| Fetch data by `await`-ing a helper inside an `async` Server Component | Fetch data in a Route Handler, Client Component, or Server Action |
| Put every database query in a helper function under `src/data/` | Import `@/db` or call Drizzle from a page, component, or action |
| Query with Drizzle's relational query API or query builder | Write raw SQL strings or use `db.execute(sql\`...\`)` for a whole query |
| Take `userId` from `await auth.protect()` and filter every query on it | Trust a `userId` from `searchParams`, form data, or any client input |
| Scope updates/deletes to the owning user in the `where` clause | Let an ID from the client alone decide which row gets read or mutated |
