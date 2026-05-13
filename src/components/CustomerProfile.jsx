import { Building2, CalendarClock, CircleDollarSign, UserRound } from "lucide-react";
import { formatCurrency } from "../lib/agentEngine.js";

export function CustomerProfile({ customer }) {
  return (
    <section className="panel profile-panel">
      <div className="panel-header">
        <div>
          <h2>{customer.company}</h2>
          <p className="muted">{customer.industry} · {customer.stage}</p>
        </div>
        <span className={`risk-pill ${customer.riskLevel}`}>{customer.riskLabel}</span>
      </div>

      <div className="profile-body">
        <div className="metric-grid">
          <Metric icon={UserRound} label="关键联系人" value={`${customer.contact} · ${customer.title}`} />
          <Metric icon={CircleDollarSign} label="商机金额" value={formatCurrency(customer.dealValue)} />
          <Metric icon={CalendarClock} label="上次跟进" value={`${customer.lastContactDays} 天前`} />
          <Metric icon={Building2} label="预计成交" value={`${customer.expectedCloseDays} 天内`} />
        </div>

        <div className="section-block">
          <h3>客户关注</h3>
          <div className="tag-list">
            {customer.painPoints.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>

        <div className="section-block">
          <h3>最近动态</h3>
          <ol className="timeline">
            {customer.activities.map((activity) => (
              <li key={activity}>{activity}</li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

function Metric({ icon: Icon, label, value }) {
  return (
    <div className="metric-card">
      <Icon size={18} />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
