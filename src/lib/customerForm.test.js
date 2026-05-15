import { describe, expect, it } from "vitest";
import { buildCustomerFromForm, customerToFormState, createEmptyCustomerForm } from "./customerForm.js";

describe("customerForm", () => {
  it("builds a customer from compact form fields", () => {
    const customer = buildCustomerFromForm({
      id: "",
      company: "南方零售集团",
      contact: "许青",
      title: "增长负责人",
      owner: "周敏",
      industry: "零售",
      stage: "需求确认",
      dealValue: "120000",
      probability: "42",
      expectedCloseDays: "30",
      painPointsText: "线索分散\n复购低",
      objectionsText: "预算待批",
      signalsText: "愿意提供数据",
      activitiesText: "完成首次沟通\n约下周演示",
    });

    expect(customer).toMatchObject({
      company: "南方零售集团",
      contact: "许青",
      dealValue: 120000,
      probability: 42,
      lastContactDays: 0,
      expectedCloseDays: 30,
      painPoints: ["线索分散", "复购低"],
      activities: ["完成首次沟通", "约下周演示"],
    });
    expect(customer.id).toMatch(/^c-/);
  });

  it("round trips a customer into editable form state", () => {
    const formState = customerToFormState({
      id: "c-001",
      company: "华东智造集团",
      contact: "林可",
      title: "销售运营总监",
      owner: "周敏",
      industry: "制造业",
      stage: "方案评估",
      dealValue: 286000,
      probability: 64,
      lastContactDays: 10,
      expectedCloseDays: 21,
      painPoints: ["线索分配慢"],
      objections: ["担心实施周期"],
      signals: ["主动索要竞品对比表"],
      activities: ["发送初版报价"],
    });

    expect(formState).toMatchObject({
      id: "c-001",
      dealValue: "286000",
      probability: "64",
      painPointsText: "线索分配慢",
    });
    expect(buildCustomerFromForm(formState).id).toBe("c-001");
  });

  it("provides a usable empty form", () => {
    expect(createEmptyCustomerForm()).toMatchObject({
      stage: "初步接触",
      probability: "20",
      expectedCloseDays: "30",
    });
  });
});
