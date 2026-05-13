import { AlertCircle, CircleDollarSign, ListChecks, TimerReset } from "lucide-react";
import { formatCurrency } from "../lib/agentEngine.js";

export function ManagerBrief({ brief }) {
  return (
    <section className="panel manager-brief">
      <div className="brief-head">
        <div>
          <h2>主管日报</h2>
          <p>{brief.headline}</p>
        </div>
        <ListChecks size={24} />
      </div>

      <div className="brief-metrics">
        <BriefMetric icon={CircleDollarSign} label="总管道" value={formatCurrency(brief.totalPipeline)} />
        <BriefMetric icon={CircleDollarSign} label="加权预测" value={formatCurrency(brief.weightedPipeline)} />
        <BriefMetric icon={AlertCircle} label="高风险" value={`${brief.highRiskCount} 个`} />
        <BriefMetric icon={TimerReset} label="逾期跟进" value={`${brief.overdueCount} 个`} />
      </div>

      <div className="priority-table">
        {brief.priorityQueue.map((customer) => (
          <div className="priority-row" key={customer.id}>
            <span className={`risk-dot ${customer.riskLevel}`} />
            <strong>{customer.company}</strong>
            <span>{customer.nextAction.title}</span>
            <em>{customer.nextAction.timing}</em>
          </div>
        ))}
      </div>
    </section>
  );
}

function BriefMetric({ icon: Icon, label, value }) {
  return (
    <div className="brief-metric">
      <Icon size={17} />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
