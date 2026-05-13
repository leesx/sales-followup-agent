import { SendHorizonal } from "lucide-react";
import { useState } from "react";

export function FollowupComposer({ customer, onSave }) {
  const [content, setContent] = useState("");
  const [nextStep, setNextStep] = useState("");
  const [sentiment, setSentiment] = useState("neutral");

  function handleSubmit(event) {
    event.preventDefault();
    if (!content.trim() || !nextStep.trim()) return;

    onSave({
      id: `followup-${customer.id}-${Date.now()}`,
      customerId: customer.id,
      content: content.trim(),
      nextStep: nextStep.trim(),
      sentiment,
      createdAt: new Date().toISOString(),
    });

    setContent("");
    setNextStep("");
    setSentiment("neutral");
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
            placeholder="例如：客户确认预算已通过，但希望补充 ROI 测算给采购评审。"
            rows={4}
            value={content}
          />
        </label>

        <div className="form-row">
          <label>
            <span>下一步任务</span>
            <input
              onChange={(event) => setNextStep(event.target.value)}
              placeholder="例如：补充 ROI 测算"
              value={nextStep}
            />
          </label>

          <label>
            <span>客户态度</span>
            <select onChange={(event) => setSentiment(event.target.value)} value={sentiment}>
              <option value="positive">积极</option>
              <option value="neutral">中性</option>
              <option value="negative">消极</option>
            </select>
          </label>
        </div>

        <button className="primary-button" type="submit">
          <SendHorizonal size={16} />
          保存并分析
        </button>
      </form>
    </section>
  );
}
