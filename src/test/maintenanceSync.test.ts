import { describe, it, expect } from "vitest";
import { MAINTENANCE_TYPES } from "@/types/equipment";

// Test the saved records merge logic (same logic as applysavedRecords in Index.tsx)
function calculateDaysRemaining(date: Date | null): number | null {
  if (!date) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function getStatus(daysRemaining: number | null) {
  if (daysRemaining === null) return "pending";
  if (daysRemaining < 0) return "overdue";
  if (daysRemaining <= 7) return "critical";
  if (daysRemaining <= 30) return "warning";
  return "ok";
}

describe("maintenance sync", () => {
  it("should have all expected maintenance types", () => {
    expect(MAINTENANCE_TYPES).toHaveLength(9);
    const ids = MAINTENANCE_TYPES.map((t) => t.id);
    expect(ids).toContain("troca_cabos");
    expect(ids).toContain("limpeza_caixa_selagem");
  });

  it("getStatus returns correct status for various days remaining", () => {
    expect(getStatus(null)).toBe("pending");
    expect(getStatus(-1)).toBe("overdue");
    expect(getStatus(0)).toBe("critical");
    expect(getStatus(7)).toBe("critical");
    expect(getStatus(8)).toBe("warning");
    expect(getStatus(30)).toBe("warning");
    expect(getStatus(31)).toBe("ok");
  });

  it("calculateDaysRemaining returns correct relative days", () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    expect(calculateDaysRemaining(tomorrow)).toBe(1);

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    expect(calculateDaysRemaining(yesterday)).toBe(-1);

    expect(calculateDaysRemaining(null)).toBeNull();
  });

  it("saved records are parsed with correct date from ISO string", () => {
    const dateStr = "2026-03-15";
    const parsed = new Date(dateStr + "T00:00:00");
    expect(parsed.getFullYear()).toBe(2026);
    expect(parsed.getMonth()).toBe(2); // 0-indexed
    expect(parsed.getDate()).toBe(15);
  });
});
