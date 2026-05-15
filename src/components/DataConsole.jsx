import { Database, Download, RotateCcw, Upload } from "lucide-react";
import { useRef } from "react";

export function DataConsole({ summary, onClear, onExport, onImport, onLoadDemo }) {
  const fileRef = useRef(null);

  function handleImportFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => onImport(String(reader.result ?? ""));
    reader.readAsText(file);
    event.target.value = "";
  }

  return (
    <section className="panel data-console">
      <div className="panel-header">
        <div>
          <h2>数据控制台</h2>
          <p className="muted">管理浏览器 IndexedDB 中的演示数据</p>
        </div>
        <Database size={22} />
      </div>

      <div className="data-summary-grid">
        <Summary label="跟进记录" value={summary.followupCount} />
        <Summary label="任务" value={summary.taskCount} />
        <Summary label="待处理" value={summary.openTaskCount} />
        <Summary label="阶段变更" value={summary.stageOverrideCount} />
      </div>

      <div className="data-console-footer">
        <span>{summary.lastUpdatedAt ? `最后更新 ${formatDisplayTime(summary.lastUpdatedAt)}` : "暂无本地数据"}</span>
        <div className="data-actions">
          <button onClick={onLoadDemo} type="button">
            <RotateCcw size={15} />
            推荐演示
          </button>
          <button onClick={onExport} type="button">
            <Download size={15} />
            导出
          </button>
          <button onClick={() => fileRef.current?.click()} type="button">
            <Upload size={15} />
            导入
          </button>
          <button className="danger-button" onClick={onClear} type="button">
            清空
          </button>
        </div>
        <input accept="application/json,.json" hidden onChange={handleImportFile} ref={fileRef} type="file" />
      </div>
    </section>
  );
}

function Summary({ label, value }) {
  return (
    <div className="data-summary-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function formatDisplayTime(value) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
