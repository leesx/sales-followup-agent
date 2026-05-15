export const DATA_SNAPSHOT_VERSION = 1;

export function createDataSnapshot({ followups = [], tasks = [], stageOverrides = [] }, exportedAt = new Date().toISOString()) {
  return {
    version: DATA_SNAPSHOT_VERSION,
    exportedAt,
    followups,
    tasks,
    stageOverrides,
  };
}

export function validateDataSnapshot(value) {
  if (!value || typeof value !== "object") {
    return { ok: false, error: "导入文件不是有效 JSON 对象" };
  }

  if (value.version !== DATA_SNAPSHOT_VERSION) {
    return { ok: false, error: "导入文件版本不兼容" };
  }

  if (!Array.isArray(value.followups) || !Array.isArray(value.tasks) || !Array.isArray(value.stageOverrides)) {
    return { ok: false, error: "导入文件缺少 followups、tasks 或 stageOverrides 数组" };
  }

  return {
    ok: true,
    data: {
      followups: value.followups,
      tasks: value.tasks,
      stageOverrides: value.stageOverrides,
    },
  };
}

export function buildLocalDataSummary({ followups = [], tasks = [], stageOverrides = [] }) {
  const timestamps = [
    ...followups.map((item) => item.createdAt),
    ...tasks.map((item) => item.completedAt).filter(Boolean),
    ...stageOverrides.map((item) => item.confirmedAt),
  ].filter(Boolean);
  const lastUpdatedAt = timestamps.length
    ? timestamps.sort((a, b) => new Date(b) - new Date(a))[0]
    : null;

  return {
    followupCount: followups.length,
    taskCount: tasks.length,
    openTaskCount: tasks.filter((task) => task.status === "open").length,
    doneTaskCount: tasks.filter((task) => task.status === "done").length,
    stageOverrideCount: stageOverrides.length,
    lastUpdatedAt,
  };
}

export function createDemoDataset(now = new Date().toISOString()) {
  const followups = [
    {
      id: "demo-followup-c-001",
      customerId: "c-001",
      content: "客户确认预算已通过，采购要求下周三前补充 ROI 测算和合同条款。",
      sentiment: "positive",
      nextStep: "补充 ROI 测算和合同条款",
      dueText: "下周三前",
      blockers: ["采购要求", "预算"],
      createdAt: now,
    },
    {
      id: "demo-followup-c-006",
      customerId: "c-006",
      content: "CEO 已确认方案，采购发起供应商准入流程，今天同步最终合同版本。",
      sentiment: "positive",
      nextStep: "同步最终合同版本",
      dueText: "今天",
      blockers: [],
      createdAt: now,
    },
    {
      id: "demo-followup-c-003",
      customerId: "c-003",
      content: "客户担心实施周期，要求明天上午发实施排期。",
      sentiment: "negative",
      nextStep: "发实施排期",
      dueText: "明天上午",
      blockers: ["客户担心实施周期"],
      createdAt: now,
    },
  ];

  const tasks = [
    {
      id: "task-c-001-demo-followup-c-001",
      customerId: "c-001",
      title: "补充 ROI 测算和合同条款",
      dueText: "下周三前",
      priority: "P1",
      status: "open",
      sourceFollowupId: "demo-followup-c-001",
    },
    {
      id: "task-c-006-demo-followup-c-006",
      customerId: "c-006",
      title: "同步最终合同版本",
      dueText: "今天",
      priority: "P1",
      status: "open",
      sourceFollowupId: "demo-followup-c-006",
    },
    {
      id: "task-c-003-demo-followup-c-003",
      customerId: "c-003",
      title: "发实施排期",
      dueText: "明天上午",
      priority: "P0",
      status: "open",
      sourceFollowupId: "demo-followup-c-003",
    },
  ];

  const stageOverrides = [
    {
      customerId: "c-001",
      stage: "商务谈判",
      previousStage: "方案评估",
      reason: "预算或采购材料已经进入讨论，商机可以从方案评估推进到商务谈判。",
      confirmedAt: now,
    },
    {
      customerId: "c-006",
      stage: "决策审批",
      previousStage: "决策审批",
      reason: "关键决策和采购流程已经启动，保持决策审批阶段重点推进。",
      confirmedAt: now,
    },
  ];

  return { followups, tasks, stageOverrides };
}
