import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { WorkoutList } from "@/app/dashboard/_components/workout-list";
import type { WorkoutWithDetails } from "@/db/queries/workouts";

const createdAt = new Date("2026-09-22T09:00:00Z");

const pushDay: WorkoutWithDetails = {
  id: "w1",
  userId: "user_1",
  name: "Push Day",
  notes: "Felt strong on bench today.",
  scheduledAt: createdAt,
  performedAt: new Date("2026-09-22T09:45:00Z"),
  createdAt,
  workoutExercises: [
    {
      id: "we1",
      workoutId: "w1",
      exerciseId: "e1",
      order: 0,
      notes: null,
      createdAt,
      exercise: {
        id: "e1",
        name: "Bench Press",
        category: "push",
        muscleGroup: "chest",
        equipment: "barbell",
        createdAt,
      },
      sets: [
        {
          id: "s1",
          workoutExerciseId: "we1",
          order: 0,
          reps: 8,
          weight: "60.00",
          unit: "kg",
          rpe: "7.0",
          restSeconds: 120,
          createdAt,
        },
      ],
    },
    {
      id: "we2",
      workoutId: "w1",
      exerciseId: "e2",
      order: 1,
      notes: "Finisher",
      createdAt,
      exercise: {
        id: "e2",
        name: "Pull-up",
        category: "pull",
        muscleGroup: "lats",
        equipment: "bodyweight",
        createdAt,
      },
      sets: [
        {
          id: "s2",
          workoutExerciseId: "we2",
          order: 0,
          reps: 10,
          weight: null,
          unit: "kg",
          rpe: null,
          restSeconds: 90,
          createdAt,
        },
      ],
    },
  ],
};

const untitled: WorkoutWithDetails = {
  ...pushDay,
  id: "w2",
  name: null,
  notes: null,
  workoutExercises: [],
};

describe("WorkoutList", () => {
  it("renders one row per workout with name and exercise count", () => {
    render(<WorkoutList workouts={[pushDay, untitled]} />);

    expect(screen.getByRole("button", { name: /Push Day/ })).toHaveTextContent("2 exercises");
    expect(screen.getByRole("button", { name: /Untitled workout/ })).toHaveTextContent(
      "0 exercises",
    );
  });

  it("opens a modal with the workout's exercises and sets when a row is clicked", async () => {
    render(<WorkoutList workouts={[pushDay, untitled]} />);

    fireEvent.click(screen.getByRole("button", { name: /Push Day/ }));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Push Day")).toBeInTheDocument();
    expect(within(dialog).getByText("Felt strong on bench today.")).toBeInTheDocument();
    expect(within(dialog).getByText("Bench Press")).toBeInTheDocument();
    expect(within(dialog).getByText("60 kg")).toBeInTheDocument();
    expect(within(dialog).getByText("2m")).toBeInTheDocument();
    expect(within(dialog).getByText("Pull-up")).toBeInTheDocument();
    expect(within(dialog).getByText("Finisher")).toBeInTheDocument();
    expect(within(dialog).getByText("BW")).toBeInTheDocument();
  });
});
