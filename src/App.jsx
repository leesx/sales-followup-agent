import { useEffect, useMemo, useState } from "react";
import { customers } from "./data/mockCrm.js";
import { analyzeCustomers, buildManagerBrief, buildTaskDashboard } from "./lib/agentEngine.js";
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
  buildLocalDataSummary,
  createDataSnapshot,
  createDemoDataset,
  validateDataSnapshot,
} from "./lib/dataManagement.js";
import { CustomerList } from "./components/CustomerList.jsx";
import { CustomerProfile } from "./components/CustomerProfile.jsx";
import { DataConsole } from "./components/DataConsole.jsx";
import { FollowupComposer } from "./components/FollowupComposer.jsx";
import { InsightPanel } from "./components/InsightPanel.jsx";
import { ManagerBrief } from "./components/ManagerBrief.jsx";
import { TaskDashboard } from "./components/TaskDashboard.jsx";
import { TaskPanel } from "./components/TaskPanel.jsx";

export default function App() {
  const [followups, setFollowups] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [stageOverrides, setStageOverrides] = useState([]);
  const [storageReady, setStorageReady] = useState(false);

  useEffect(() => {
    Promise.all([getFollowups(), getTasks(), getStageOverrides()])
      .then(([savedFollowups, savedTasks, savedStageOverrides]) => {
        setFollowups(savedFollowups);
        setTasks(savedTasks);
        setStageOverrides(savedStageOverrides);
      })
      .finally(() => setStorageReady(true));
  }, []);

  const customersWithFollowups = useMemo(
    () =>
      customers.map((customer) => ({
        ...customer,
        stage: stageOverrides.find((override) => override.customerId === customer.id)?.stage ?? customer.stage,
        followups: followups.filter((followup) => followup.customerId === customer.id),
      })),
    [followups, stageOverrides],
  );
  const analyzedCustomers = useMemo(() => analyzeCustomers(customersWithFollowups), [customersWithFollowups]);
  const brief = useMemo(() => buildManagerBrief(analyzedCustomers), [analyzedCustomers]);
  const taskDashboard = useMemo(() => buildTaskDashboard(tasks, customers), [tasks]);
  const dataSummary = useMemo(
    () => buildLocalDataSummary({ followups, tasks, stageOverrides }),
    [followups, tasks, stageOverrides],
  );
  const [selectedId, setSelectedId] = useState(analyzedCustomers[0]?.id);
  const selectedCustomer = analyzedCustomers.find((customer) => customer.id === selectedId);
  const selectedTasks = tasks.filter((task) => task.customerId === selectedId);

  async function handleSaveFollowup(followup) {
    const savedFollowup = await saveFollowup(followup);
    const customer = customers.find((item) => item.id === followup.customerId);
    const analyzedCustomer = analyzeCustomers([{ ...customer, followups: [savedFollowup] }])[0];
    const savedTask = await saveTask(analyzedCustomer.generatedTask);

    setFollowups((current) => [savedFollowup, ...current]);
    setTasks((current) => [savedTask, ...current.filter((task) => task.id !== savedTask.id)]);
  }

  async function handleToggleTask(task) {
    const nextStatus = task.status === "done" ? "open" : "done";
    const updatedTask = await updateTaskStatus(task.id, nextStatus);
    if (!updatedTask) return;

    setTasks((current) => current.map((item) => (item.id === updatedTask.id ? updatedTask : item)));
  }

  async function handleConfirmStage(suggestion) {
    const savedStageOverride = await saveStageOverride({
      customerId: suggestion.customerId,
      stage: suggestion.suggestedStage,
      previousStage: suggestion.currentStage,
      reason: suggestion.reason,
      confirmedAt: new Date().toISOString(),
    });

    setStageOverrides((current) => [
      savedStageOverride,
      ...current.filter((override) => override.customerId !== savedStageOverride.customerId),
    ]);
  }

  async function applyLocalData(nextData) {
    const savedData = await replaceLocalData(nextData);
    setFollowups(savedData.followups);
    setTasks(savedData.tasks);
    setStageOverrides(savedData.stageOverrides);
  }

  async function handleClearLocalData() {
    if (!window.confirm("确认清空本地跟进记录、任务和阶段变更？")) return;

    await clearLocalData();
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
            <span>{storageReady ? "IndexedDB 已启用" : "加载本地库"}</span>
            <strong>{analyzedCustomers.length}</strong>
            <span>个商机</span>
          </div>
        </header>

        <div className="dashboard-grid">
          <CustomerList
            customers={analyzedCustomers}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
          <div className="detail-column">
            <DataConsole
              summary={dataSummary}
              onClear={handleClearLocalData}
              onExport={handleExportLocalData}
              onImport={handleImportLocalData}
              onLoadDemo={handleLoadDemoData}
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
