import { UsersRound } from "lucide-react";

export function OwnerDashboard({ dashboard, ownerOptions, selectedOwner, onOwnerChange }) {
  return (
    <section className="panel owner-dashboard">
      <div className="panel-header">
        <div>
          <h2>负责人看板</h2>
          <p className="muted">按销售负责人查看客户、风险和任务负载</p>
        </div>
        <UsersRound size={22} />
      </div>

      <div className="owner-filter">
        {ownerOptions.map((owner) => (
          <button
            className={selectedOwner === owner ? "is-active" : ""}
            key={owner}
            onClick={() => onOwnerChange(owner)}
            type="button"
          >
            {owner}
          </button>
        ))}
      </div>

      <div className="owner-metrics">
        <Metric label="负责客户" value={dashboard.customerCount} />
        <Metric label="高风险" value={dashboard.highRiskCount} />
        <Metric label="待处理任务" value={dashboard.pendingTaskCount} />
        <Metric label="应跟进" value={dashboard.followupDueCount} />
        <Metric label="阶段推进" value={dashboard.stageProgressCount} />
      </div>
    </section>
  );
}

function Metric({ label, value }) {
  return (
    <div className="owner-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
