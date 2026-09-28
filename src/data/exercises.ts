import "server-only";
import { db } from "@/db";

export async function getExercises() {
  return db.query.exercises.findMany({
    orderBy: { name: "asc" },
  });
}

export type Exercise = Awaited<ReturnType<typeof getExercises>>[number];
