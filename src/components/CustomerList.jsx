import { AlertTriangle, CheckCircle2, Clock3 } from "lucide-react";
import { formatCurrency } from "../lib/agentEngine.js";

const riskIcon = {
  high: AlertTriangle,
  medium: Clock3,
  low: CheckCircle2,
};

export function CustomerList({ customers, selectedId, onSelect }) {
  return (
    <aside className="panel customer-list">
      <div className="panel-header">
        <div>
          <h2>商机队列</h2>
          <p className="muted">按 Agent 风险排序</p>
        </div>
      </div>
      <div className="customer-items">
        {customers.map((customer) => {
          const RiskIcon = riskIcon[customer.riskLevel];

          return (
            <button
              className={`customer-card ${selectedId === customer.id ? "is-selected" : ""}`}
              key={customer.id}
              onClick={() => onSelect(customer.id)}
              type="button"
            >
              <div className="customer-card-main">
                <div>
                  <strong>{customer.company}</strong>
                  <span>{customer.contact} · {customer.owner}</span>
                </div>
                <span className={`risk-pill ${customer.riskLevel}`}>
                  <RiskIcon size={14} />
                  {customer.riskLabel}
                </span>
              </div>
              <div className="customer-meta">
                <span>{customer.stage}</span>
                <span>{formatCurrency(customer.dealValue)}</span>
                <span>{customer.probability}%</span>
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
