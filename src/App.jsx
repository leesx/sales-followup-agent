import { useEffect, useMemo, useState } from "react";
import { customers as demoCustomers } from "./data/mockCrm.js";
import {
  analyzeCustomers,
  buildManagerBrief,
  buildOwnerDashboard,
  buildTaskDashboard,
  getOwnerOptions,
} from "./lib/agentEngine.js";
import {
  clearLocalData,
  getFollowups,
  getStageOverrides,
  getTasks,
  replaceLocalData,
  saveFollowup,
  saveStageOverride,
  saveTask,
  updateTaskStatus,
} from "./lib/browserDb.js";
import {
  clearCloudData,
  deleteCloudCustomer,
  getCloudData,
  replaceCloudData,
  saveCloudCustomer,
  saveCloudFollowup,
  saveCloudStageOverride,
  saveCloudTask,
  updateCloudTaskStatus,
} from "./lib/cloudDb.js";
import {
  buildLocalDataSummary,
  createDataSnapshot,
  createDemoDataset,
  validateDataSnapshot,
} from "./lib/dataManagement.js";
import { getSupabaseClient } from "./lib/supabaseClient.js";
import { CustomerList } from "./components/CustomerList.jsx";
import { CustomerProfile } from "./components/CustomerProfile.jsx";
import { CloudAccountPanel } from "./components/CloudAccountPanel.jsx";
import { CustomerManager } from "./components/CustomerManager.jsx";
import { DataConsole } from "./components/DataConsole.jsx";
import { FollowupComposer } from "./components/FollowupComposer.jsx";
import { InsightPanel } from "./components/InsightPanel.jsx";
import { ManagerBrief } from "./components/ManagerBrief.jsx";
import { OwnerDashboard } from "./components/OwnerDashboard.jsx";
import { TaskDashboard } from "./components/TaskDashboard.jsx";
import { TaskPanel } from "./components/TaskPanel.jsx";

export default function App() {
  const supabase = getSupabaseClient();
  const [session, setSession] = useState(null);
  const [crmCustomers, setCrmCustomers] = useState(demoCustomers);
  const [followups, setFollowups] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [stageOverrides, setStageOverrides] = useState([]);
  const [storageReady, setStorageReady] = useState(false);
  const [storageError, setStorageError] = useState("");
  const [selectedOwner, setSelectedOwner] = useState("全部销售");
  const isCloudMode = Boolean(supabase && session?.user);
  const storageModeLabel = isCloudMode ? "Supabase PostgreSQL" : "浏览器 IndexedDB";

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setStorageReady(false);
      setStorageError("");

      try {
        if (isCloudMode) {
          const cloudData = await getCloudData(supabase, session.user.id, demoCustomers);
          if (cancelled) return;
          setCrmCustomers(cloudData.customers);
          setFollowups(cloudData.followups);
          setTasks(cloudData.tasks);
          setStageOverrides(cloudData.stageOverrides);
          return;
        }

        const [savedFollowups, savedTasks, savedStageOverrides] = await Promise.all([
          getFollowups(),
          getTasks(),
          getStageOverrides(),
        ]);
        if (cancelled) return;
        setCrmCustomers(demoCustomers);
        setFollowups(savedFollowups);
        setTasks(savedTasks);
        setStageOverrides(savedStageOverrides);
      } catch (error) {
        if (!cancelled) {
          setStorageError(error instanceof Error ? error.message : "数据加载失败");
        }
      } finally {
        if (!cancelled) setStorageReady(true);
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, [isCloudMode, session?.user?.id, supabase]);

  const customersWithFollowups = useMemo(
    () =>
      crmCustomers.map((customer) => ({
        ...customer,
        stage: stageOverrides.find((override) => override.customerId === customer.id)?.stage ?? customer.stage,
        followups: followups.filter((followup) => followup.customerId === customer.id),
      })),
    [crmCustomers, followups, stageOverrides],
  );
  const analyzedCustomers = useMemo(() => analyzeCustomers(customersWithFollowups), [customersWithFollowups]);
  const ownerOptions = useMemo(() => getOwnerOptions(crmCustomers), [crmCustomers]);
  const ownerDashboard = useMemo(
    () =>
      buildOwnerDashboard({
        customers: analyzedCustomers,
        tasks,
        stageOverrides,
        owner: selectedOwner,
      }),
    [analyzedCustomers, tasks, stageOverrides, selectedOwner],
  );
  const filteredCustomerIds = useMemo(
    () => new Set(ownerDashboard.customers.map((customer) => customer.id)),
    [ownerDashboard.customers],
  );
  const filteredTasks = useMemo(
    () => tasks.filter((task) => filteredCustomerIds.has(task.customerId)),
    [tasks, filteredCustomerIds],
  );
  const brief = useMemo(() => buildManagerBrief(ownerDashboard.customers), [ownerDashboard.customers]);
  const taskDashboard = useMemo(() => buildTaskDashboard(filteredTasks, ownerDashboard.customers), [filteredTasks, ownerDashboard.customers]);
  const dataSummary = useMemo(
    () => buildLocalDataSummary({ followups, tasks, stageOverrides }),
    [followups, tasks, stageOverrides],
  );
  const [selectedId, setSelectedId] = useState(analyzedCustomers[0]?.id);
  const selectedCustomer = analyzedCustomers.find((customer) => customer.id === selectedId);
  const selectedTasks = tasks.filter((task) => task.customerId === selectedId);

  useEffect(() => {
    if (analyzedCustomers.length && !analyzedCustomers.some((customer) => customer.id === selectedId)) {
      setSelectedId(analyzedCustomers[0].id);
    }
  }, [analyzedCustomers, selectedId]);

  function handleOwnerChange(owner) {
    setSelectedOwner(owner);
    const nextCustomers = buildOwnerDashboard({
      customers: analyzedCustomers,
      tasks,
      stageOverrides,
      owner,
    }).customers;
    if (nextCustomers.length && !nextCustomers.some((customer) => customer.id === selectedId)) {
      setSelectedId(nextCustomers[0].id);
    }
  }

  async function handleSaveFollowup(followup) {
    const savedFollowup = isCloudMode
      ? await saveCloudFollowup(supabase, session.user.id, followup)
      : await saveFollowup(followup);
    const customer = crmCustomers.find((item) => item.id === followup.customerId);
    const analyzedCustomer = analyzeCustomers([{ ...customer, followups: [savedFollowup] }])[0];
    const savedTask = isCloudMode
      ? await saveCloudTask(supabase, session.user.id, analyzedCustomer.generatedTask)
      : await saveTask(analyzedCustomer.generatedTask);

    setFollowups((current) => [savedFollowup, ...current]);
    setTasks((current) => [savedTask, ...current.filter((task) => task.id !== savedTask.id)]);
  }

  async function handleSaveCustomer(customer) {
    const savedCustomer = isCloudMode ? await saveCloudCustomer(supabase, session.user.id, customer) : customer;
    setCrmCustomers((current) => [
      savedCustomer,
      ...current.filter((item) => item.id !== savedCustomer.id),
    ]);
    setSelectedId(savedCustomer.id);
    return savedCustomer;
  }

  async function handleDeleteCustomer(customer) {
    if (!window.confirm(`确认删除客户「${customer.company}」？相关跟进和任务也会移除。`)) return;
    if (isCloudMode) {
      await deleteCloudCustomer(supabase, session.user.id, customer.id);
    }

    setCrmCustomers((current) => current.filter((item) => item.id !== customer.id));
    setFollowups((current) => current.filter((item) => item.customerId !== customer.id));
    setTasks((current) => current.filter((item) => item.customerId !== customer.id));
    setStageOverrides((current) => current.filter((item) => item.customerId !== customer.id));
    const nextCustomer = crmCustomers.find((item) => item.id !== customer.id);
    setSelectedId(nextCustomer?.id);
  }

  async function handleToggleTask(task) {
    const nextStatus = task.status === "done" ? "open" : "done";
    const updatedTask = isCloudMode
      ? await updateCloudTaskStatus(supabase, session.user.id, task.id, nextStatus)
      : await updateTaskStatus(task.id, nextStatus);
    if (!updatedTask) return;

    setTasks((current) => current.map((item) => (item.id === updatedTask.id ? updatedTask : item)));
  }

  async function handleConfirmStage(suggestion) {
    const stageOverride = {
      customerId: suggestion.customerId,
      stage: suggestion.suggestedStage,
      previousStage: suggestion.currentStage,
      reason: suggestion.reason,
      confirmedAt: new Date().toISOString(),
    };
    const savedStageOverride = isCloudMode
      ? await saveCloudStageOverride(supabase, session.user.id, stageOverride)
      : await saveStageOverride(stageOverride);

    setStageOverrides((current) => [
      savedStageOverride,
      ...current.filter((override) => override.customerId !== savedStageOverride.customerId),
    ]);
  }

  async function applyLocalData(nextData) {
    const savedData = isCloudMode
      ? await replaceCloudData(supabase, session.user.id, nextData)
      : await replaceLocalData(nextData);
    setFollowups(savedData.followups);
    setTasks(savedData.tasks);
    setStageOverrides(savedData.stageOverrides);
  }

  async function handleClearLocalData() {
    if (!window.confirm(`确认清空${storageModeLabel}中的跟进记录、任务和阶段变更？`)) return;

    if (isCloudMode) {
      await clearCloudData(supabase, session.user.id);
    } else {
      await clearLocalData();
    }
    setFollowups([]);
    setTasks([]);
    setStageOverrides([]);
  }

  function handleExportLocalData() {
    const snapshot = createDataSnapshot({ followups, tasks, stageOverrides });
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sales-followup-agent-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function handleImportLocalData(fileContent) {
    try {
      const parsed = JSON.parse(fileContent);
      const validated = validateDataSnapshot(parsed);
      if (!validated.ok) {
        window.alert(validated.error);
        return;
      }

      await applyLocalData(validated.data);
    } catch {
      window.alert("导入文件不是有效 JSON");
    }
  }

  async function handleLoadDemoData() {
    if (!window.confirm("加载推荐演示数据会覆盖当前本地数据，是否继续？")) return;

    await applyLocalData(createDemoDataset());
  }

  return (
    <main className="app-shell">
      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">CRM Copilot</p>
            <h1>销售跟进 Agent</h1>
          </div>
          <div className="topbar-status">
            <span>{storageReady ? storageModeLabel : "加载数据"}</span>
            <strong>{analyzedCustomers.length}</strong>
            <span>个商机</span>
          </div>
        </header>
        {storageError ? <p className="storage-error">数据同步失败：{storageError}</p> : null}

        <div className="dashboard-grid">
          <CustomerList
            customers={ownerDashboard.customers}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
          <div className="detail-column">
            <CloudAccountPanel onSessionChange={setSession} />
            <DataConsole
              modeLabel={storageModeLabel}
              summary={dataSummary}
              onClear={handleClearLocalData}
              onExport={handleExportLocalData}
              onImport={handleImportLocalData}
              onLoadDemo={handleLoadDemoData}
            />
            <CustomerManager
              customer={selectedCustomer}
              modeLabel={storageModeLabel}
              onDelete={handleDeleteCustomer}
              onSave={handleSaveCustomer}
            />
            <OwnerDashboard
              dashboard={ownerDashboard}
              ownerOptions={ownerOptions}
              selectedOwner={selectedOwner}
              onOwnerChange={handleOwnerChange}
            />
            <ManagerBrief brief={brief} />
            <TaskDashboard
              dashboard={taskDashboard}
              onSelectCustomer={setSelectedId}
              onToggle={handleToggleTask}
            />
            {selectedCustomer ? (
              <div className="detail-grid">
                <div className="stack-column">
                  <CustomerProfile customer={selectedCustomer} />
                  <FollowupComposer customer={selectedCustomer} onSave={handleSaveFollowup} />
                </div>
                <div className="stack-column">
                  <InsightPanel customer={selectedCustomer} onConfirmStage={handleConfirmStage} />
                  <TaskPanel tasks={selectedTasks} onToggle={handleToggleTask} />
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}
