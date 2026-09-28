import { describe, expect, it } from "vitest";
import { fromDateParam, parseDateParam, parseTimeZone, toDateParam } from "@/lib/dates";

describe("parseDateParam", () => {
  it("accepts a valid YYYY-MM-DD date", () => {
    expect(parseDateParam("2026-09-22")).toBe("2026-09-22");
    expect(parseDateParam("2024-02-29")).toBe("2024-02-29");
  });

  it("rejects impossible dates", () => {
    expect(parseDateParam("2026-02-30")).toBeNull();
    expect(parseDateParam("2025-02-29")).toBeNull();
    expect(parseDateParam("2026-13-01")).toBeNull();
  });

  it("rejects malformed and non-string values", () => {
    expect(parseDateParam("2026-9-22")).toBeNull();
    expect(parseDateParam("22/09/2026")).toBeNull();
    expect(parseDateParam("2026-09-22'; drop table workouts;--")).toBeNull();
    expect(parseDateParam(undefined)).toBeNull();
    expect(parseDateParam(["2026-09-22"])).toBeNull();
  });
});

describe("parseTimeZone", () => {
  it("accepts valid IANA zones", () => {
    expect(parseTimeZone("Europe/Paris")).toBe("Europe/Paris");
    expect(parseTimeZone("UTC")).toBe("UTC");
  });

  it("falls back to UTC for invalid values", () => {
    expect(parseTimeZone("Not/AZone")).toBe("UTC");
    expect(parseTimeZone("")).toBe("UTC");
    expect(parseTimeZone(undefined)).toBe("UTC");
    expect(parseTimeZone(["Europe/Paris"])).toBe("UTC");
  });
});

describe("toDateParam / fromDateParam", () => {
  it("formats using the local calendar day with zero padding", () => {
    expect(toDateParam(new Date(2026, 0, 5, 23, 59))).toBe("2026-01-05");
  });

  it("round-trips", () => {
    expect(toDateParam(fromDateParam("2026-09-22"))).toBe("2026-09-22");
  });
});
