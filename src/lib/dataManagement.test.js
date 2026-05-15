import { describe, expect, it } from "vitest";
import {
  buildLocalDataSummary,
  createDataSnapshot,
  createDemoDataset,
  validateDataSnapshot,
} from "./dataManagement.js";

describe("dataManagement", () => {
  it("creates and validates an exportable local data snapshot", () => {
    const snapshot = createDataSnapshot(
      {
        followups: [{ id: "f-1", customerId: "c-001" }],
        tasks: [{ id: "t-1", customerId: "c-001", status: "open" }],
        stageOverrides: [{ customerId: "c-001", stage: "商务谈判" }],
      },
      "2026-05-15T08:00:00.000Z",
    );

    const validated = validateDataSnapshot(snapshot);

    expect(snapshot.version).toBe(1);
    expect(snapshot.exportedAt).toBe("2026-05-15T08:00:00.000Z");
    expect(validated.ok).toBe(true);
    expect(validated.data.tasks).toHaveLength(1);
  });

  it("rejects incompatible snapshots", () => {
    const validated = validateDataSnapshot({ version: 999, followups: [], tasks: [], stageOverrides: [] });

    expect(validated.ok).toBe(false);
    expect(validated.error).toContain("版本");
  });

  it("builds local data summary counts and latest update time", () => {
    const summary = buildLocalDataSummary({
      followups: [{ createdAt: "2026-05-15T07:00:00.000Z" }],
      tasks: [
        { status: "open" },
        { status: "done", completedAt: "2026-05-15T09:00:00.000Z" },
      ],
      stageOverrides: [{ confirmedAt: "2026-05-15T08:00:00.000Z" }],
    });

    expect(summary.followupCount).toBe(1);
    expect(summary.taskCount).toBe(2);
    expect(summary.openTaskCount).toBe(1);
    expect(summary.doneTaskCount).toBe(1);
    expect(summary.stageOverrideCount).toBe(1);
    expect(summary.lastUpdatedAt).toBe("2026-05-15T09:00:00.000Z");
  });

  it("creates a demo dataset with followups, tasks, and stage overrides", () => {
    const demo = createDemoDataset("2026-05-15T08:00:00.000Z");

    expect(demo.followups.length).toBeGreaterThan(0);
    expect(demo.tasks.length).toBeGreaterThan(0);
    expect(demo.stageOverrides.length).toBeGreaterThan(0);
  });
});
