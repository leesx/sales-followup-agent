import { CheckCircle2, Circle } from "lucide-react";

export function TaskPanel({ tasks, onToggle }) {
  return (
    <section className="panel task-panel">
      <div className="panel-header">
        <div>
          <h2>下一步任务</h2>
          <p className="muted">来自 Agent 建议和已保存跟进</p>
        </div>
      </div>

      <div className="task-list">
        {tasks.length ? (
          tasks.map((task) => (
            <button
              className={`task-item ${task.status === "done" ? "is-done" : ""}`}
              key={task.id}
              onClick={() => onToggle(task)}
              type="button"
            >
              {task.status === "done" ? <CheckCircle2 size={18} /> : <Circle size={18} />}
              <span>
                <strong>{task.title}</strong>
                <em>{task.priority} · {task.dueText}</em>
              </span>
            </button>
          ))
        ) : (
          <p className="empty-state">暂无任务，保存一条跟进记录后会自动生成。</p>
        )}
      </div>
    </section>
  );
}
