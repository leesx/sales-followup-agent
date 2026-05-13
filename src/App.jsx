import { useMemo, useState } from "react";
import { customers } from "./data/mockCrm.js";
import { analyzeCustomers, buildManagerBrief } from "./lib/agentEngine.js";
import { CustomerList } from "./components/CustomerList.jsx";
import { CustomerProfile } from "./components/CustomerProfile.jsx";
import { InsightPanel } from "./components/InsightPanel.jsx";
import { ManagerBrief } from "./components/ManagerBrief.jsx";

export default function App() {
  const analyzedCustomers = useMemo(() => analyzeCustomers(customers), []);
  const brief = useMemo(() => buildManagerBrief(analyzedCustomers), [analyzedCustomers]);
  const [selectedId, setSelectedId] = useState(analyzedCustomers[0]?.id);
  const selectedCustomer = analyzedCustomers.find((customer) => customer.id === selectedId);

  return (
    <main className="app-shell">
      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">CRM Copilot</p>
            <h1>销售跟进 Agent</h1>
          </div>
          <div className="topbar-status">
            <span>模拟数据</span>
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
            {selectedCustomer ? (
              <div className="detail-grid">
                <CustomerProfile customer={selectedCustomer} />
                <InsightPanel customer={selectedCustomer} />
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}
