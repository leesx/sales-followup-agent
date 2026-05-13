import { describe, expect, it } from "vitest";
import { analyzeCustomer, buildManagerBrief, buildTaskDashboard, parseFollowupRecord } from "./agentEngine.js";

const baseCustomer = {
  id: "test",
  company: "测试客户",
  contact: "王总",
  title: "负责人",
  owner: "销售",
  industry: "软件",
  stage: "方案评估",
  dealValue: 300000,
  probability: 45,
  lastContactDays: 15,
  expectedCloseDays: 10,
  painPoints: ["销售过程不可控"],
  objections: ["预算需要审批"],
  signals: [],
  activities: ["完成初次演示"],
};

describe("agentEngine", () => {
  it("marks overdue high-value deals as high risk", () => {
    const result = analyzeCustomer(baseCustomer);

    expect(result.riskLevel).toBe("high");
    expect(result.nextAction.priority).toBe("P0");
    expect(result.reasons.join(" ")).toContain("15 天未跟进");
  });

  it("creates a useful next-action draft with customer context", () => {
    const result = analyzeCustomer(baseCustomer);

    expect(result.nextAction.draft).toContain("王总");
    expect(result.nextAction.draft).toContain("销售过程不可控");
  });

  it("builds manager brief counts and priority queue", () => {
    const highRisk = analyzeCustomer(baseCustomer);
    const lowRisk = analyzeCustomer({
      ...baseCustomer,
      id: "low",
      dealValue: 50000,
      probability: 88,
      lastContactDays: 1,
      expectedCloseDays: 45,
      objections: [],
      signals: ["已确认预算"],
    });

    const brief = buildManagerBrief([highRisk, lowRisk]);

    expect(brief.highRiskCount).toBe(1);
    expect(brief.overdueCount).toBe(1);
    expect(brief.priorityQueue).toHaveLength(1);
  });

  it("uses follow-up records to refresh customer status and reduce stale-contact risk", () => {
    const result = analyzeCustomer({
      ...baseCustomer,
      followups: [
        {
          id: "f-1",
          content: "客户确认预算已通过，希望下周安排采购和技术一起评审合同。",
          sentiment: "positive",
          nextStep: "安排合同评审会",
          createdAt: "2026-05-13T09:00:00.000Z",
        },
      ],
    });

    expect(result.lastContactDays).toBe(0);
    expect(result.summary).toContain("最新跟进显示");
    expect(result.reasons.join(" ")).not.toContain("15 天未跟进");
  });

  it("generates a task from the latest follow-up next step", () => {
    const result = analyzeCustomer({
      ...baseCustomer,
      followups: [
        {
          id: "f-1",
          content: "客户要求补充 ROI 测算并发给采购。",
          sentiment: "neutral",
          nextStep: "补充 ROI 测算",
          createdAt: "2026-05-13T09:00:00.000Z",
        },
      ],
    });

    expect(result.generatedTask.title).toBe("补充 ROI 测算");
    expect(result.generatedTask.customerId).toBe("test");
    expect(result.generatedTask.status).toBe("open");
  });

  it("parses follow-up content into sentiment, blockers, next step, and due text", () => {
    const parsed = parseFollowupRecord(
      "客户确认预算已通过，但采购要求下周三前补充 ROI 测算和合同条款。",
      baseCustomer,
    );

    expect(parsed.sentiment).toBe("positive");
    expect(parsed.blockers).toContain("采购要求");
    expect(parsed.nextStep).toBe("补充 ROI 测算和合同条款");
    expect(parsed.dueText).toBe("下周三前");
  });

  it("uses parsed due text when generating task from unstructured follow-up", () => {
    const parsed = parseFollowupRecord("客户担心实施周期，要求明天上午发实施排期。", baseCustomer);
    const result = analyzeCustomer({
      ...baseCustomer,
      followups: [
        {
          id: "f-2",
          content: parsed.content,
          sentiment: parsed.sentiment,
          nextStep: parsed.nextStep,
          dueText: parsed.dueText,
          blockers: parsed.blockers,
          createdAt: "2026-05-13T09:00:00.000Z",
        },
      ],
    });

    expect(result.generatedTask.title).toBe("发实施排期");
    expect(result.generatedTask.dueText).toBe("明天上午");
    expect(result.reasons.join(" ")).toContain("客户担心实施周期");
  });

  it("builds a task dashboard sorted by status and priority", () => {
    const dashboard = buildTaskDashboard(
      [
        { id: "t-1", customerId: "test", title: "低优先级", priority: "P2", dueText: "本周内", status: "open" },
        { id: "t-2", customerId: "low", title: "已完成", priority: "P0", dueText: "今天", status: "done" },
        { id: "t-3", customerId: "test", title: "高优先级", priority: "P0", dueText: "今天", status: "open" },
      ],
      [
        { id: "test", company: "测试客户", owner: "销售" },
        { id: "low", company: "低风险客户", owner: "销售" },
      ],
    );

    expect(dashboard.openCount).toBe(2);
    expect(dashboard.doneCount).toBe(1);
    expect(dashboard.todayCount).toBe(2);
    expect(dashboard.tasks[0].title).toBe("高优先级");
    expect(dashboard.tasks[0].company).toBe("测试客户");
  });
});
