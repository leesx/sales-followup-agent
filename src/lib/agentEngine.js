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

const positiveSignals = ["确认", "通过", "同意", "愿意", "推进", "预算已", "已批", "已参加"];
const negativeSignals = ["担心", "暂缓", "拒绝", "压价", "不确定", "延期", "没有预算", "风险"];
const blockerPatterns = ["采购要求", "客户担心", "担心", "需要审批", "预算", "压价", "合规", "安全", "实施周期"];
const duePatterns = ["今天", "明天上午", "明天", "后天", "本周内", "下周一前", "下周二前", "下周三前", "下周四前", "下周五前", "下周前"];
const actionVerbs = ["补充", "发送", "发", "安排", "确认", "整理", "同步", "提供", "约"];

export function formatCurrency(value) {
  return currencyFormatter.format(value);
}

export function parseFollowupRecord(content, customer) {
  const normalizedContent = content.trim();
  const sentiment = detectSentiment(normalizedContent);
  const blockers = detectBlockers(normalizedContent);
  const dueText = detectDueText(normalizedContent);
  const nextStep = detectNextStep(normalizedContent, customer);

  return {
    content: normalizedContent,
    sentiment,
    blockers,
    nextStep,
    dueText,
  };
}

export function analyzeCustomer(customer) {
  const latestFollowup = getLatestFollowup(customer.followups);
  const effectiveLastContactDays = latestFollowup ? 0 : customer.lastContactDays;
  const reasons = [];
  let riskScore = 0;

  if (effectiveLastContactDays >= 14) {
    riskScore += 35;
    reasons.push(`已 ${effectiveLastContactDays} 天未跟进，客户热度可能下降`);
  } else if (effectiveLastContactDays >= 7) {
    riskScore += 22;
    reasons.push(`已 ${effectiveLastContactDays} 天未跟进，需要尽快恢复节奏`);
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

  if (latestFollowup?.sentiment === "positive") {
    riskScore -= 10;
  }

  if (latestFollowup?.sentiment === "negative") {
    riskScore += 16;
  }

  if (latestFollowup?.blockers?.length) {
    riskScore += 12;
    reasons.push(`最新跟进发现阻塞：${latestFollowup.blockers.join("、")}`);
  }

  if (customer.signals.some((signal) => signal.includes("CEO") || signal.includes("财务"))) {
    riskScore -= 8;
  }

  const riskLevel = riskScore >= 52 ? "high" : riskScore >= 28 ? "medium" : "low";
  const nextAction = buildNextAction(customer, riskLevel);

  return {
    ...customer,
    lastContactDays: effectiveLastContactDays,
    riskScore: Math.max(0, riskScore),
    riskLevel,
    riskLabel: riskLevel === "high" ? "高风险" : riskLevel === "medium" ? "中风险" : "低风险",
    reasons: reasons.length ? reasons : ["跟进节奏正常，暂无明显阻塞"],
    summary: buildSummary(customer, riskLevel, latestFollowup),
    nextAction,
    generatedTask: buildGeneratedTask(customer, nextAction, latestFollowup),
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

function buildSummary(customer, riskLevel, latestFollowup) {
  const riskTone = riskLevel === "high" ? "需要主管介入" : riskLevel === "medium" ? "需要销售加速推进" : "可按计划推进";
  const followupSummary = latestFollowup ? `最新跟进显示：${latestFollowup.content}` : "";
  return `${customer.company} 处于${customer.stage}阶段，金额 ${formatCurrency(customer.dealValue)}，预计 ${customer.expectedCloseDays} 天内决策。客户核心关注 ${customer.painPoints[0]}，当前判断为${riskTone}。${followupSummary}`;
}

function buildNextAction(customer, riskLevel) {
  const latestFollowup = getLatestFollowup(customer.followups);
  if (latestFollowup?.nextStep) {
    return {
      priority: riskLevel === "high" ? "P0" : riskLevel === "medium" ? "P1" : "P2",
      channel: "微信 + 任务提醒",
      timing: latestFollowup.dueText ?? "今天完成",
      title: latestFollowup.nextStep,
      draft: `${customer.contact}，我根据我们最新沟通先推进「${latestFollowup.nextStep}」。完成后我会把关键材料同步给您，方便您继续内部推进。`,
    };
  }

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

function buildGeneratedTask(customer, nextAction, latestFollowup) {
  return {
    id: `task-${customer.id}-${latestFollowup?.id ?? "suggested"}`,
    customerId: customer.id,
    title: latestFollowup?.nextStep ?? nextAction.title,
    dueText: nextAction.timing,
    priority: nextAction.priority,
    status: "open",
    sourceFollowupId: latestFollowup?.id ?? null,
  };
}

function getLatestFollowup(followups = []) {
  return [...followups].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0] ?? null;
}

function detectSentiment(content) {
  const positiveScore = positiveSignals.filter((signal) => content.includes(signal)).length;
  const negativeScore = negativeSignals.filter((signal) => content.includes(signal)).length;

  if (positiveScore > negativeScore) return "positive";
  if (negativeScore > positiveScore) return "negative";
  return "neutral";
}

function detectBlockers(content) {
  const concernMatch = content.match(/客户担心[^，。；;,.]+/);
  const blockers = concernMatch ? [concernMatch[0]] : [];

  blockerPatterns.forEach((pattern) => {
    if (content.includes(pattern) && !blockers.some((blocker) => blocker.includes(pattern))) {
      blockers.push(pattern);
    }
  });

  return blockers;
}

function detectDueText(content) {
  return duePatterns.find((pattern) => content.includes(pattern)) ?? "今天完成";
}

function detectNextStep(content, customer) {
  const dueText = detectDueText(content);
  const contentAfterDue = dueText === "今天完成" ? content : content.slice(content.indexOf(dueText) + dueText.length);
  const actionPattern = new RegExp(`(${actionVerbs.join("|")})([^，。；;,.]+)`);
  const dueMatch = contentAfterDue.match(actionPattern);
  if (dueMatch?.[0]) return cleanupAction(dueMatch[0]);

  const matches = [...content.matchAll(new RegExp(`(${actionVerbs.join("|")})([^，。；;,.]+)`, "g"))];
  const actionableMatch = matches.findLast((match) => !match[0].includes("预算已通过"));
  if (actionableMatch?.[0]) return cleanupAction(actionableMatch[0]);

  if (content.includes("合同")) return "整理合同材料";
  if (content.includes("ROI")) return "补充 ROI 测算";
  if (content.includes("演示")) return "安排场景演示";
  if (content.includes("报价")) return "更新报价方案";

  return `跟进${customer.painPoints[0]}`;
}

function cleanupAction(action) {
  return action
    .replace(/^(要求|希望|需要|请|要)/, "")
    .replace(/给采购.*$/, "给采购")
    .replace(/给客户.*$/, "给客户")
    .trim();
}
