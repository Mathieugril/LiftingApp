-- Example seed data for user_id = 'user_3JxQgzG4OdNY3judJMeIQMqfztI'
-- NOT executed automatically. Review, then run manually (e.g. via Neon MCP run_sql
-- or `psql $DATABASE_URL -f src/db/seed-example-data.sql`) once approved.

-- ---- exercises ----
INSERT INTO exercises (id, name, category, muscle_group, equipment) VALUES
  ('e1111111-1111-1111-1111-111111111111', 'Barbell Back Squat', 'legs',    'quads',     'barbell'),
  ('e2222222-2222-2222-2222-222222222222', 'Bench Press',        'push',    'chest',     'barbell'),
  ('e3333333-3333-3333-3333-333333333333', 'Deadlift',           'pull',    'hamstrings','barbell'),
  ('e4444444-4444-4444-4444-444444444444', 'Overhead Press',     'push',    'shoulders', 'barbell'),
  ('e5555555-5555-5555-5555-555555555555', 'Barbell Row',        'pull',    'back',      'barbell'),
  ('e6666666-6666-6666-6666-666666666666', 'Pull-up',            'pull',    'lats',      'bodyweight'),
  ('e7777777-7777-7777-7777-777777777777', 'Dumbbell Lunge',     'legs',    'quads',     'dumbbell'),
  ('e8888888-8888-8888-8888-888888888888', 'Plank',              'core',    'core',      'bodyweight')
ON CONFLICT (name) DO NOTHING;

-- ---- workouts (all for user_3JxQgzG4OdNY3judJMeIQMqfztI) ----
INSERT INTO workouts (id, user_id, name, notes, scheduled_at, performed_at) VALUES
  ('a1111111-1111-1111-1111-111111111111', 'user_3JxQgzG4OdNY3judJMeIQMqfztI', 'Push Day', 'Felt strong on bench today.',            '2026-09-22 09:00:00+00', '2026-09-22 09:45:00+00'),
  ('a2222222-2222-2222-2222-222222222222', 'user_3JxQgzG4OdNY3judJMeIQMqfztI', 'Pull Day', 'Grip gave out on last set of rows.',     '2026-09-24 09:00:00+00', '2026-09-24 09:50:00+00'),
  ('a3333333-3333-3333-3333-333333333333', 'user_3JxQgzG4OdNY3judJMeIQMqfztI', 'Leg Day',  NULL,                                      '2026-09-30 09:00:00+00', NULL);

-- ---- workout_exercises ----
INSERT INTO workout_exercises (id, workout_id, exercise_id, "order", notes) VALUES
  -- Push Day
  ('b1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'e2222222-2222-2222-2222-222222222222', 0, NULL),
  ('b1111111-1111-1111-1111-111111111112', 'a1111111-1111-1111-1111-111111111111', 'e4444444-4444-4444-4444-444444444444', 1, NULL),
  ('b1111111-1111-1111-1111-111111111113', 'a1111111-1111-1111-1111-111111111111', 'e8888888-8888-8888-8888-888888888888', 2, 'Finisher'),
  -- Pull Day
  ('b2222222-2222-2222-2222-222222222221', 'a2222222-2222-2222-2222-222222222222', 'e3333333-3333-3333-3333-333333333333', 0, NULL),
  ('b2222222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-222222222222', 'e5555555-5555-5555-5555-555555555555', 1, NULL),
  ('b2222222-2222-2222-2222-222222222223', 'a2222222-2222-2222-2222-222222222222', 'e6666666-6666-6666-6666-666666666666', 2, 'Bodyweight, added band assist on last set'),
  -- Leg Day (not yet performed)
  ('b3333333-3333-3333-3333-333333333331', 'a3333333-3333-3333-3333-333333333333', 'e1111111-1111-1111-1111-111111111111', 0, NULL),
  ('b3333333-3333-3333-3333-333333333332', 'a3333333-3333-3333-3333-333333333333', 'e7777777-7777-7777-7777-777777777777', 1, NULL);

-- ---- sets ----
INSERT INTO sets (workout_exercise_id, "order", reps, weight, unit, rpe, rest_seconds) VALUES
  -- Bench Press (Push Day)
  ('b1111111-1111-1111-1111-111111111111', 0, 8, 60.0, 'kg', 7.0, 120),
  ('b1111111-1111-1111-1111-111111111111', 1, 6, 70.0, 'kg', 8.0, 120),
  ('b1111111-1111-1111-1111-111111111111', 2, 5, 75.0, 'kg', 9.0, 150),
  -- Overhead Press (Push Day)
  ('b1111111-1111-1111-1111-111111111112', 0, 8, 35.0, 'kg', 7.0, 90),
  ('b1111111-1111-1111-1111-111111111112', 1, 8, 35.0, 'kg', 7.5, 90),
  ('b1111111-1111-1111-1111-111111111112', 2, 6, 40.0, 'kg', 8.5, 90),
  -- Plank (Push Day, finisher — reps/weight null, hold tracked via notes)
  ('b1111111-1111-1111-1111-111111111113', 0, NULL, NULL, 'kg', 6.0, 60),

  -- Deadlift (Pull Day)
  ('b2222222-2222-2222-2222-222222222221', 0, 5, 100.0, 'kg', 7.0, 180),
  ('b2222222-2222-2222-2222-222222222221', 1, 5, 120.0, 'kg', 8.0, 180),
  ('b2222222-2222-2222-2222-222222222221', 2, 3, 140.0, 'kg', 9.0, 210),
  -- Barbell Row (Pull Day)
  ('b2222222-2222-2222-2222-222222222222', 0, 10, 50.0, 'kg', 7.0, 90),
  ('b2222222-2222-2222-2222-222222222222', 1, 8, 55.0, 'kg', 8.0, 90),
  ('b2222222-2222-2222-2222-222222222222', 2, 6, 60.0, 'kg', 9.0, 90),
  -- Pull-up (Pull Day)
  ('b2222222-2222-2222-2222-222222222223', 0, 10, NULL, 'kg', 7.0, 90),
  ('b2222222-2222-2222-2222-222222222223', 1, 8, NULL, 'kg', 8.0, 90),
  ('b2222222-2222-2222-2222-222222222223', 2, 5, NULL, 'kg', 9.5, 90);

  -- Leg Day sets intentionally omitted: workout hasn't been performed yet
  -- (performed_at IS NULL), so no completed sets exist for it.
