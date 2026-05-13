import { describe, expect, it } from "vitest";
import { analyzeCustomer, buildManagerBrief } from "./agentEngine.js";

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
});
