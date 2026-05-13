import { SendHorizonal } from "lucide-react";
import { useMemo, useState } from "react";
import { parseFollowupRecord } from "../lib/agentEngine.js";

export function FollowupComposer({ customer, onSave }) {
  const [content, setContent] = useState("");
  const parsedFollowup = useMemo(
    () => (content.trim() ? parseFollowupRecord(content, customer) : null),
    [content, customer],
  );

  function handleSubmit(event) {
    event.preventDefault();
    if (!parsedFollowup) return;

    onSave({
      id: `followup-${customer.id}-${Date.now()}`,
      customerId: customer.id,
      content: parsedFollowup.content,
      nextStep: parsedFollowup.nextStep,
      sentiment: parsedFollowup.sentiment,
      dueText: parsedFollowup.dueText,
      blockers: parsedFollowup.blockers,
      createdAt: new Date().toISOString(),
    });

    setContent("");
  }

  return (
    <section className="panel followup-composer">
      <div className="panel-header">
        <div>
          <h2>新增跟进记录</h2>
          <p className="muted">保存后 Agent 会重新分析客户状态并生成任务</p>
        </div>
      </div>

      <form className="followup-form" onSubmit={handleSubmit}>
        <label>
          <span>沟通内容</span>
          <textarea
            onChange={(event) => setContent(event.target.value)}
            placeholder="例如：客户确认预算已通过，但采购要求下周三前补充 ROI 测算和合同条款。"
            rows={5}
            value={content}
          />
        </label>

        {parsedFollowup ? <ParsedPreview parsed={parsedFollowup} /> : null}

        <button className="primary-button" type="submit">
          <SendHorizonal size={16} />
          保存并分析
        </button>
      </form>
    </section>
  );
}

function ParsedPreview({ parsed }) {
  const sentimentLabel = {
    positive: "积极",
    neutral: "中性",
    negative: "消极",
  }[parsed.sentiment];

  return (
    <div className="parsed-preview">
      <div>
        <span>客户态度</span>
        <strong>{sentimentLabel}</strong>
      </div>
      <div>
        <span>下一步任务</span>
        <strong>{parsed.nextStep}</strong>
      </div>
      <div>
        <span>截止时间</span>
        <strong>{parsed.dueText}</strong>
      </div>
      <div>
        <span>识别阻塞</span>
        <strong>{parsed.blockers.length ? parsed.blockers.join("、") : "暂无明显阻塞"}</strong>
      </div>
    </div>
  );
}
