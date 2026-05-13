const currencyFormatter = new Intl.NumberFormat("zh-CN", {
  style: "currency",
  currency: "CNY",
  maximumFractionDigits: 0,
});

const riskRank = {
  high: 3,
  medium: 2,
  low: 1,
};

export function formatCurrency(value) {
  return currencyFormatter.format(value);
}

export function analyzeCustomer(customer) {
  const reasons = [];
  let riskScore = 0;

  if (customer.lastContactDays >= 14) {
    riskScore += 35;
    reasons.push(`已 ${customer.lastContactDays} 天未跟进，客户热度可能下降`);
  } else if (customer.lastContactDays >= 7) {
    riskScore += 22;
    reasons.push(`已 ${customer.lastContactDays} 天未跟进，需要尽快恢复节奏`);
  }

  if (customer.dealValue >= 250000 && customer.probability < 70) {
    riskScore += 18;
    reasons.push("高金额商机仍未进入稳定成交区间");
  }

  if (customer.expectedCloseDays <= 14 && customer.probability < 85) {
    riskScore += 18;
    reasons.push("预计成交窗口临近，但成交概率仍有缺口");
  }

  if (customer.objections.length > 0) {
    riskScore += Math.min(customer.objections.length * 10, 20);
    reasons.push(`存在异议：${customer.objections.join("、")}`);
  }

  if (customer.signals.some((signal) => signal.includes("CEO") || signal.includes("财务"))) {
    riskScore -= 8;
  }

  const riskLevel = riskScore >= 52 ? "high" : riskScore >= 28 ? "medium" : "low";
  const nextAction = buildNextAction(customer, riskLevel);

  return {
    ...customer,
    riskScore: Math.max(0, riskScore),
    riskLevel,
    riskLabel: riskLevel === "high" ? "高风险" : riskLevel === "medium" ? "中风险" : "低风险",
    reasons: reasons.length ? reasons : ["跟进节奏正常，暂无明显阻塞"],
    summary: buildSummary(customer, riskLevel),
    nextAction,
  };
}

export function analyzeCustomers(customers) {
  return customers
    .map(analyzeCustomer)
    .sort((a, b) => riskRank[b.riskLevel] - riskRank[a.riskLevel] || b.dealValue - a.dealValue);
}

export function buildManagerBrief(analyzedCustomers) {
  const highRisk = analyzedCustomers.filter((customer) => customer.riskLevel === "high");
  const overdue = analyzedCustomers.filter((customer) => customer.lastContactDays >= 7);
  const weightedPipeline = analyzedCustomers.reduce(
    (sum, customer) => sum + customer.dealValue * (customer.probability / 100),
    0,
  );
  const priorityQueue = analyzedCustomers
    .filter((customer) => customer.riskLevel !== "low" || customer.expectedCloseDays <= 14)
    .slice(0, 4);

  return {
    totalPipeline: analyzedCustomers.reduce((sum, customer) => sum + customer.dealValue, 0),
    weightedPipeline,
    highRiskCount: highRisk.length,
    overdueCount: overdue.length,
    priorityQueue,
    headline:
      highRisk.length > 0
        ? `今天优先处理 ${highRisk.length} 个高风险商机，避免大额机会降温。`
        : "今天没有高风险商机，重点推进临近成交客户。",
  };
}

function buildSummary(customer, riskLevel) {
  const riskTone = riskLevel === "high" ? "需要主管介入" : riskLevel === "medium" ? "需要销售加速推进" : "可按计划推进";
  return `${customer.company} 处于${customer.stage}阶段，金额 ${formatCurrency(customer.dealValue)}，预计 ${customer.expectedCloseDays} 天内决策。客户核心关注 ${customer.painPoints[0]}，当前判断为${riskTone}。`;
}

function buildNextAction(customer, riskLevel) {
  if (riskLevel === "high") {
    return {
      priority: "P0",
      channel: "电话 + 微信",
      timing: "今天 18:00 前",
      title: "恢复客户互动并锁定下一次会议",
      draft: `${customer.contact}，我把您上次提到的「${customer.painPoints[0]}」整理成了一个推进方案。今天想和您确认两个点：当前决策卡在哪里，以及我们是否可以约一次 30 分钟会议把阻塞项一次性清掉。`,
    };
  }

  if (customer.expectedCloseDays <= 14) {
    return {
      priority: "P1",
      channel: "邮件",
      timing: "明天上午",
      title: "补齐成交材料并推动审批",
      draft: `${customer.contact}，我会把合同、ROI、实施排期和您关心的「${customer.objections[0] ?? customer.painPoints[0]}」整理成一页审批材料，方便您内部同步。`,
    };
  }

  return {
    priority: "P2",
    channel: "微信",
    timing: "本周内",
    title: "延续需求共识并安排下一次演示",
    draft: `${customer.contact}，基于您关注的「${customer.painPoints[0]}」，我建议下次直接演示对应场景，并带上可落地的试用路径。您看本周哪个时间方便？`,
  };
}
