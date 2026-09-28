import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  numeric,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { defineRelations } from 'drizzle-orm';

export const weightUnitEnum = pgEnum('weight_unit', ['kg', 'lb']);

export const exercises = pgTable('exercises', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  category: text('category'), // e.g. "push", "pull", "legs"
  muscleGroup: text('muscle_group'), // e.g. "chest", "quads"
  equipment: text('equipment'), // e.g. "barbell", "dumbbell", "machine"
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const workouts = pgTable(
  'workouts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id').notNull(), // Clerk userId
    name: text('name'),
    notes: text('notes'),
    scheduledAt: timestamp('scheduled_at', { withTimezone: true }).notNull().defaultNow(),
    performedAt: timestamp('performed_at', { withTimezone: true }), // null until actually done
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('workouts_user_id_idx').on(t.userId),
    index('workouts_user_id_scheduled_at_idx').on(t.userId, t.scheduledAt),
  ],
);

export const workoutExercises = pgTable(
  'workout_exercises',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workoutId: uuid('workout_id')
      .notNull()
      .references(() => workouts.id, { onDelete: 'cascade' }),
    exerciseId: uuid('exercise_id')
      .notNull()
      .references(() => exercises.id, { onDelete: 'restrict' }),
    order: integer('order').notNull().default(0),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('workout_exercises_workout_id_idx').on(t.workoutId),
    index('workout_exercises_exercise_id_idx').on(t.exerciseId),
  ],
);

export const sets = pgTable(
  'sets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workoutExerciseId: uuid('workout_exercise_id')
      .notNull()
      .references(() => workoutExercises.id, { onDelete: 'cascade' }),
    order: integer('order').notNull().default(0),
    reps: integer('reps'), // null until the set is actually performed
    weight: numeric('weight', { precision: 6, scale: 2 }), // null for bodyweight or not-yet-performed
    unit: weightUnitEnum('unit').notNull().default('kg'),
    rpe: numeric('rpe', { precision: 3, scale: 1 }), // optional perceived-exertion rating
    restSeconds: integer('rest_seconds').notNull().default(90), // changeable per set
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('sets_workout_exercise_id_idx').on(t.workoutExerciseId)],
);

// ---- relations() for the query API ----

export const schema = { exercises, workouts, workoutExercises, sets };

export const dbRelations = defineRelations(schema, (r) => ({
  exercises: {
    workoutExercises: r.many.workoutExercises(),
  },
  workouts: {
    workoutExercises: r.many.workoutExercises(),
  },
  workoutExercises: {
    workout: r.one.workouts({
      from: r.workoutExercises.workoutId,
      to: r.workouts.id,
    }),
    exercise: r.one.exercises({
      from: r.workoutExercises.exerciseId,
      to: r.exercises.id,
    }),
    sets: r.many.sets(),
  },
  sets: {
    workoutExercise: r.one.workoutExercises({
      from: r.sets.workoutExerciseId,
      to: r.workoutExercises.id,
    }),
  },
}));
