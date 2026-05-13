import { CheckCircle2, Circle, ListTodo } from "lucide-react";

export function TaskDashboard({ dashboard, onSelectCustomer, onToggle }) {
  return (
    <section className="panel task-dashboard">
      <div className="panel-header">
        <div>
          <h2>任务中心</h2>
          <p className="muted">汇总全部客户的下一步任务</p>
        </div>
        <ListTodo size={22} />
      </div>

      <div className="task-summary-grid">
        <Summary label="待处理" value={dashboard.openCount} />
        <Summary label="今日相关" value={dashboard.todayCount} />
        <Summary label="已完成" value={dashboard.doneCount} />
      </div>

      <div className="global-task-list">
        {dashboard.tasks.length ? (
          dashboard.tasks.map((task) => (
            <div className={`global-task-row ${task.status === "done" ? "is-done" : ""}`} key={task.id}>
              <button className="task-check" onClick={() => onToggle(task)} type="button">
                {task.status === "done" ? <CheckCircle2 size={18} /> : <Circle size={18} />}
              </button>
              <button className="task-content" onClick={() => onSelectCustomer(task.customerId)} type="button">
                <strong>{task.title}</strong>
                <span>{task.company} · {task.owner}</span>
              </button>
              <em>{task.priority} · {task.dueText}</em>
            </div>
          ))
        ) : (
          <p className="empty-state">暂无全局任务。保存客户跟进记录后，这里会出现任务队列。</p>
        )}
      </div>
    </section>
  );
}

function Summary({ label, value }) {
  return (
    <div className="task-summary-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
