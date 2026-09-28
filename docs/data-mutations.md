# Data Mutation Coding Standards

This document is the single source of truth for how data is *written* in this project — creates, updates, and deletes. It complements [`docs/data-fetching.md`](./data-fetching.md) (which covers reads) and [`docs/auth.md`](./auth.md) (which covers authorization); read those first. This doc applies to every mutation of application data anywhere in `src/app/`.

## The rule: mutations flow Server Action → `src/data` helper → Drizzle

**Every write to the database goes: a colocated `actions.ts` Server Action validates input with Zod, then calls a helper function in `src/data/` that wraps the actual Drizzle call.** No other shape is allowed — a Server Action never calls `db.insert()`/`update()`/`delete()` itself, and nothing outside `src/data/` is allowed to import `@/db`.

```
Client Component (form/button)
  → Server Action in a colocated `actions.ts` ("use server", typed params, Zod-validated)
    → helper function in `src/data/*.ts` ("server-only", wraps Drizzle)
      → db.insert() / db.update() / db.delete()
```

## Mutations go through `src/data/` helpers, never inline Drizzle

This is the same boundary [`docs/data-fetching.md`](./data-fetching.md#database-queries-live-in-srcdata-and-only-there) sets for reads, and it applies identically to writes: **every `db.insert()`, `db.update()`, and `db.delete()` call must live in a helper function in `src/data/`.** A Server Action calls the helper; it never constructs the Drizzle call itself.

- Group write helpers in the same file as the entity's read helpers (e.g. `createWorkout` and `getRecentWorkouts` both live in `src/data/workouts.ts`), unless the file is getting large enough to split by concern.
- Every file in `src/data/` keeps `import "server-only";` at the top, per `docs/data-fetching.md`.
- A write helper takes already-validated, already-typed arguments (including `userId`) and returns whatever the caller needs (e.g. the inserted row) — it does not re-validate shape, since that's the Server Action's job.

```ts
// src/data/workouts.ts — CORRECT
import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { workouts } from "@/db/schema";

export async function createWorkout(userId: string, name: string | null) {
  const [workout] = await db
    .insert(workouts)
    .values({ userId, name })
    .returning();
  return workout;
}

export async function deleteWorkout(userId: string, workoutId: string) {
  return db
    .delete(workouts)
    .where(and(eq(workouts.id, workoutId), eq(workouts.userId, userId)));
}
```

```ts
// src/app/dashboard/actions.ts — WRONG: Drizzle call inline in the action
"use server";
import { db } from "@/db"; // ❌ Server Actions never import `@/db` directly
import { workouts } from "@/db/schema";

export async function createWorkout(userId: string, name: string | null) {
  return db.insert(workouts).values({ userId, name }).returning();
}
```

## Server Actions live in colocated `actions.ts` files

**Every mutation is exposed to the client through a Server Action, and every Server Action lives in a file literally named `actions.ts`, colocated with the route/component that uses it** (e.g. `src/app/dashboard/actions.ts`, next to `src/app/dashboard/page.tsx` and its `_components/`). Don't define Server Actions inline inside a Server Component with `"use server"` at the top of the function body, and don't scatter them across arbitrarily named files.

```ts
// src/app/dashboard/actions.ts — CORRECT: file-level "use server", colocated with the route
"use server";

import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { createWorkout } from "@/data/workouts";

const createWorkoutSchema = z.object({
  name: z.string().trim().min(1).max(120).nullable(),
});

export async function createWorkoutAction(input: z.infer<typeof createWorkoutSchema>) {
  const { userId } = await auth.protect();
  const { name } = createWorkoutSchema.parse(input);

  return createWorkout(userId, name);
}
```

- Only `async function` exports (and constants re-exported the same way) belong in an `actions.ts` file — this is a Next.js requirement for `"use server"` files, not just a style choice.
- Every Server Action re-verifies `await auth.protect()` itself, exactly as described in [`docs/auth.md`](./auth.md#routes-are-public-by-default--protect-individually). A page-level or layout-level `auth.protect()` call does not cover it, because the action can be invoked directly.
- `userId` passed into the `src/data` helper always comes from that `auth.protect()` call inside the action — never from the action's own parameters. See [`docs/auth.md`](./auth.md#userid-is-the-only-trusted-identity-signal).

## Server Action parameters: typed, no `FormData`

**Every Server Action takes explicitly typed parameters. `FormData` is not an allowed parameter type.**

```ts
// CORRECT — plain typed parameters
export async function renameWorkoutAction(workoutId: string, name: string) {
  // ...
}
```

```ts
// WRONG — FormData param
export async function renameWorkoutAction(formData: FormData) { // ❌
  const name = formData.get("name");
  // ...
}
```

- Call Server Actions directly with typed arguments from the client (e.g. from an event handler or `useTransition`), not by passing a `<form action={...}>`'s implicit `FormData`.
- If a form's input needs shaping before it reaches the action, do that shaping in the Client Component (read individual controlled field values) and call the action with a typed object/scalar arguments — don't hand the action a `FormData` to unpack.

## Every Server Action validates its arguments with Zod

**Every Server Action parses its incoming arguments through a Zod schema before doing anything else with them (including before calling `auth.protect()`-adjacent logic that depends on that input).** TypeScript types alone are not enough — they don't survive the client→server boundary at runtime, so a Zod `.parse()` (or `.safeParse()` with explicit error handling) is mandatory.

- Define the schema next to the action (top of the same `actions.ts` file, or an adjacent `schema.ts` if several actions in the same folder share pieces) using `z.object({...})` with explicit constraints (`min`/`max`/`trim`/enum members/etc.), not just `z.string()` with no bounds, wherever the domain has a known constraint.
- Prefer `z.infer<typeof schema>` for the action's parameter type instead of hand-writing a matching `type`/`interface` — keeps the compile-time type and runtime check from drifting apart.
- Use `.parse()` when an invalid input should throw (typical for this app, since Server Action errors surface via Next.js's error boundaries); use `.safeParse()` only when the caller needs to branch on a validation failure instead of throwing.

```ts
// src/app/dashboard/actions.ts — CORRECT
"use server";
import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import { deleteWorkout } from "@/data/workouts";

const deleteWorkoutSchema = z.object({
  workoutId: z.uuid(),
});

export async function deleteWorkoutAction(input: z.infer<typeof deleteWorkoutSchema>) {
  const { userId } = await auth.protect();
  const { workoutId } = deleteWorkoutSchema.parse(input);

  await deleteWorkout(userId, workoutId);
}
```

```ts
// WRONG — no validation, trusts the caller's shape and constraints
"use server";
export async function deleteWorkoutAction(input: { workoutId: string }) {
  const { userId } = await auth.protect();
  await deleteWorkout(userId, input.workoutId); // ❌ workoutId never checked to even be a UUID
}
```

## Summary

| Do | Don't |
|---|---|
| Call `db.insert()`/`update()`/`delete()` only from a helper in `src/data/` | Call Drizzle write methods from a Server Action, page, or component |
| Put every Server Action in a colocated `actions.ts` file with `"use server"` | Define actions inline in a component body or scatter them across other filenames |
| Give every Server Action explicit, typed parameters | Accept a `FormData` parameter |
| Parse every Server Action's arguments with a Zod schema before use | Trust the caller's TypeScript types alone at runtime |
| Call `await auth.protect()` inside every Server Action and use its `userId` | Take `userId` as a Server Action parameter or trust a layout's `auth.protect()` to cover it |
