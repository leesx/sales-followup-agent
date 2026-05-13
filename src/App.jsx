import { useEffect, useMemo, useState } from "react";
import { customers } from "./data/mockCrm.js";
import { analyzeCustomers, buildManagerBrief, buildTaskDashboard } from "./lib/agentEngine.js";
import { getFollowups, getTasks, saveFollowup, saveTask, updateTaskStatus } from "./lib/browserDb.js";
import { CustomerList } from "./components/CustomerList.jsx";
import { CustomerProfile } from "./components/CustomerProfile.jsx";
import { FollowupComposer } from "./components/FollowupComposer.jsx";
import { InsightPanel } from "./components/InsightPanel.jsx";
import { ManagerBrief } from "./components/ManagerBrief.jsx";
import { TaskDashboard } from "./components/TaskDashboard.jsx";
import { TaskPanel } from "./components/TaskPanel.jsx";

export default function App() {
  const [followups, setFollowups] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [storageReady, setStorageReady] = useState(false);

  useEffect(() => {
    Promise.all([getFollowups(), getTasks()])
      .then(([savedFollowups, savedTasks]) => {
        setFollowups(savedFollowups);
        setTasks(savedTasks);
      })
      .finally(() => setStorageReady(true));
  }, []);

  const customersWithFollowups = useMemo(
    () =>
      customers.map((customer) => ({
        ...customer,
        followups: followups.filter((followup) => followup.customerId === customer.id),
      })),
    [followups],
  );
  const analyzedCustomers = useMemo(() => analyzeCustomers(customersWithFollowups), [customersWithFollowups]);
  const brief = useMemo(() => buildManagerBrief(analyzedCustomers), [analyzedCustomers]);
  const taskDashboard = useMemo(() => buildTaskDashboard(tasks, customers), [tasks]);
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
                  <InsightPanel customer={selectedCustomer} />
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
