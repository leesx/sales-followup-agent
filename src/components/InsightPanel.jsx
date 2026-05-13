import { Bot, ClipboardCheck, GitBranch, MessageSquareText, ShieldAlert } from "lucide-react";

export function InsightPanel({ customer, onConfirmStage }) {
  return (
    <section className="panel insight-panel">
      <div className="panel-header">
        <div>
          <h2>Agent 分析</h2>
          <p className="muted">规则引擎生成，后续可替换为 LLM</p>
        </div>
        <Bot size={22} />
      </div>

      <div className="insight-body">
        <div className="agent-summary">
          <h3>客户摘要</h3>
          <p>{customer.summary}</p>
        </div>

        <div className="section-block">
          <h3>
            <ShieldAlert size={17} />
            风险原因
          </h3>
          <ul className="reason-list">
            {customer.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </div>

        {customer.stageSuggestion ? (
          <div className="stage-suggestion">
            <div>
              <h3>
                <GitBranch size={17} />
                阶段建议
              </h3>
              <span>{Math.round(customer.stageSuggestion.confidence * 100)}%</span>
            </div>
            <dl>
              <div>
                <dt>当前阶段</dt>
                <dd>{customer.stageSuggestion.currentStage}</dd>
              </div>
              <div>
                <dt>建议阶段</dt>
                <dd>{customer.stageSuggestion.suggestedStage}</dd>
              </div>
            </dl>
            <p>{customer.stageSuggestion.reason}</p>
            <button className="secondary-button" onClick={() => onConfirmStage(customer.stageSuggestion)} type="button">
              确认变更
            </button>
          </div>
        ) : null}

        <div className="action-box">
          <div>
            <h3>
              <ClipboardCheck size={17} />
              下一步动作
            </h3>
            <span className="priority-pill">{customer.nextAction.priority}</span>
          </div>
          <strong>{customer.nextAction.title}</strong>
          <dl>
            <div>
              <dt>渠道</dt>
              <dd>{customer.nextAction.channel}</dd>
            </div>
            <div>
              <dt>时机</dt>
              <dd>{customer.nextAction.timing}</dd>
            </div>
          </dl>
        </div>

        <div className="message-draft">
          <h3>
            <MessageSquareText size={17} />
            跟进话术
          </h3>
          <p>{customer.nextAction.draft}</p>
        </div>
      </div>
    </section>
  );
}
