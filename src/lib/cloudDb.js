export function customerToRow(customer, userId) {
  return {
    id: customer.id,
    user_id: userId,
    company: customer.company,
    contact: customer.contact,
    title: customer.title,
    owner: customer.owner,
    industry: customer.industry,
    stage: customer.stage,
    deal_value: customer.dealValue,
    probability: customer.probability,
    last_contact_days: customer.lastContactDays,
    expected_close_days: customer.expectedCloseDays,
    pain_points: customer.painPoints ?? [],
    objections: customer.objections ?? [],
    signals: customer.signals ?? [],
    activities: customer.activities ?? [],
  };
}

export function customerFromRow(row) {
  return {
    id: row.id,
    company: row.company,
    contact: row.contact,
    title: row.title,
    owner: row.owner,
    industry: row.industry,
    stage: row.stage,
    dealValue: row.deal_value,
    probability: row.probability,
    lastContactDays: row.last_contact_days,
    expectedCloseDays: row.expected_close_days,
    painPoints: row.pain_points ?? [],
    objections: row.objections ?? [],
    signals: row.signals ?? [],
    activities: row.activities ?? [],
  };
}

export function followupToRow(followup, userId) {
  return {
    id: followup.id,
    user_id: userId,
    customer_id: followup.customerId,
    content: followup.content,
    sentiment: followup.sentiment,
    next_step: followup.nextStep,
    due_text: followup.dueText,
    blockers: followup.blockers ?? [],
    created_at: followup.createdAt,
  };
}

export function followupFromRow(row) {
  return {
    id: row.id,
    customerId: row.customer_id,
    content: row.content,
    sentiment: row.sentiment,
    nextStep: row.next_step,
    dueText: row.due_text,
    blockers: row.blockers ?? [],
    createdAt: row.created_at,
  };
}

export function taskToRow(task, userId) {
  return {
    id: task.id,
    user_id: userId,
    customer_id: task.customerId,
    title: task.title,
    due_text: task.dueText,
    priority: task.priority,
    status: task.status,
    source_followup_id: task.sourceFollowupId,
    completed_at: task.completedAt,
    created_at: task.createdAt ?? new Date().toISOString(),
  };
}

export function taskFromRow(row) {
  return {
    id: row.id,
    customerId: row.customer_id,
    title: row.title,
    dueText: row.due_text,
    priority: row.priority,
    status: row.status,
    sourceFollowupId: row.source_followup_id,
    completedAt: row.completed_at,
    createdAt: row.created_at,
  };
}

export function stageOverrideToRow(stageOverride, userId) {
  return {
    customer_id: stageOverride.customerId,
    user_id: userId,
    stage: stageOverride.stage,
    previous_stage: stageOverride.previousStage,
    reason: stageOverride.reason,
    confirmed_at: stageOverride.confirmedAt,
  };
}

export function stageOverrideFromRow(row) {
  return {
    customerId: row.customer_id,
    stage: row.stage,
    previousStage: row.previous_stage,
    reason: row.reason,
    confirmedAt: row.confirmed_at,
  };
}

export async function ensureCloudCustomers(supabase, userId, customers) {
  const rows = customers.map((customer) => customerToRow(customer, userId));
  const { error } = await supabase.from("customers").upsert(rows, { onConflict: "id" });
  if (error) throw error;
  return customers;
}

export async function getCloudData(supabase, userId, fallbackCustomers) {
  await ensureCloudCustomers(supabase, userId, fallbackCustomers);

  const [customersResult, followupsResult, tasksResult, stageOverridesResult] = await Promise.all([
    supabase.from("customers").select("*").eq("user_id", userId).order("created_at", { ascending: true }),
    supabase.from("followups").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    supabase.from("tasks").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    supabase.from("stage_overrides").select("*").eq("user_id", userId).order("confirmed_at", { ascending: false }),
  ]);

  for (const result of [customersResult, followupsResult, tasksResult, stageOverridesResult]) {
    if (result.error) throw result.error;
  }

  return {
    customers: customersResult.data.map(customerFromRow),
    followups: followupsResult.data.map(followupFromRow),
    tasks: tasksResult.data.map(taskFromRow),
    stageOverrides: stageOverridesResult.data.map(stageOverrideFromRow),
  };
}

export async function saveCloudFollowup(supabase, userId, followup) {
  const { data, error } = await supabase.from("followups").upsert(followupToRow(followup, userId)).select("*").single();
  if (error) throw error;
  return followupFromRow(data);
}

export async function saveCloudTask(supabase, userId, task) {
  const { data, error } = await supabase.from("tasks").upsert(taskToRow(task, userId)).select("*").single();
  if (error) throw error;
  return taskFromRow(data);
}

export async function updateCloudTaskStatus(supabase, userId, taskId, status) {
  const completedAt = status === "done" ? new Date().toISOString() : null;
  const { data, error } = await supabase
    .from("tasks")
    .update({ status, completed_at: completedAt })
    .eq("id", taskId)
    .eq("user_id", userId)
    .select("*")
    .single();
  if (error) throw error;
  return taskFromRow(data);
}

export async function saveCloudStageOverride(supabase, userId, stageOverride) {
  const { data, error } = await supabase
    .from("stage_overrides")
    .upsert(stageOverrideToRow(stageOverride, userId), { onConflict: "customer_id" })
    .select("*")
    .single();
  if (error) throw error;
  return stageOverrideFromRow(data);
}

export async function replaceCloudData(supabase, userId, { followups = [], tasks = [], stageOverrides = [] }) {
  const deleteResults = await Promise.all([
    supabase.from("followups").delete().eq("user_id", userId),
    supabase.from("tasks").delete().eq("user_id", userId),
    supabase.from("stage_overrides").delete().eq("user_id", userId),
  ]);
  for (const result of deleteResults) {
    if (result.error) throw result.error;
  }

  const insertResults = await Promise.all([
    followups.length ? supabase.from("followups").insert(followups.map((followup) => followupToRow(followup, userId))) : null,
    tasks.length ? supabase.from("tasks").insert(tasks.map((task) => taskToRow(task, userId))) : null,
    stageOverrides.length
      ? supabase.from("stage_overrides").insert(stageOverrides.map((stageOverride) => stageOverrideToRow(stageOverride, userId)))
      : null,
  ]);
  for (const result of insertResults.filter(Boolean)) {
    if (result.error) throw result.error;
  }

  return { followups, tasks, stageOverrides };
}

export async function clearCloudData(supabase, userId) {
  await replaceCloudData(supabase, userId, {});
}
