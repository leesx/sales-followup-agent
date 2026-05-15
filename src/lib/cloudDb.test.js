import { describe, expect, it } from "vitest";
import {
  customerToRow,
  followupFromRow,
  followupToRow,
  stageOverrideFromRow,
  stageOverrideToRow,
  taskFromRow,
  taskToRow,
} from "./cloudDb.js";

describe("cloudDb mapping", () => {
  it("keeps stable text customer ids when mapping customers to Supabase rows", () => {
    expect(customerToRow({ id: "c-001", company: "华东智造集团" }, "user-1")).toMatchObject({
      id: "c-001",
      user_id: "user-1",
      company: "华东智造集团",
    });
  });

  it("maps followups between app objects and Supabase rows", () => {
    const followup = {
      id: "followup-c-001",
      customerId: "c-001",
      content: "客户要求补充 ROI",
      sentiment: "positive",
      nextStep: "发送 ROI",
      dueText: "明天",
      blockers: ["预算"],
      createdAt: "2026-05-15T01:00:00.000Z",
    };

    const row = followupToRow(followup, "user-1");

    expect(row).toMatchObject({
      id: "followup-c-001",
      user_id: "user-1",
      customer_id: "c-001",
      next_step: "发送 ROI",
      due_text: "明天",
      created_at: "2026-05-15T01:00:00.000Z",
    });
    expect(followupFromRow(row)).toEqual(followup);
  });

  it("maps tasks and stage overrides between app objects and Supabase rows", () => {
    const task = {
      id: "task-c-001",
      customerId: "c-001",
      title: "发送报价",
      dueText: "今天",
      priority: "P1",
      status: "open",
      sourceFollowupId: "followup-c-001",
      completedAt: null,
      createdAt: "2026-05-15T01:00:00.000Z",
    };
    const stageOverride = {
      customerId: "c-001",
      stage: "商务谈判",
      previousStage: "方案评估",
      reason: "客户讨论预算",
      confirmedAt: "2026-05-15T02:00:00.000Z",
    };

    expect(taskFromRow(taskToRow(task, "user-1"))).toEqual(task);
    expect(stageOverrideFromRow(stageOverrideToRow(stageOverride, "user-1"))).toEqual(stageOverride);
  });
});
