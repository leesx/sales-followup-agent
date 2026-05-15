import { Building2, Plus, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { buildCustomerFromForm, createEmptyCustomerForm, customerToFormState } from "../lib/customerForm.js";

const stages = ["初步接触", "需求确认", "方案评估", "试用中", "商务谈判", "决策审批", "成交"];

export function CustomerManager({ customer, modeLabel, onDelete, onSave }) {
  const [form, setForm] = useState(createEmptyCustomerForm());
  const isEditing = Boolean(form.id);

  useEffect(() => {
    setForm(customer ? customerToFormState(customer) : createEmptyCustomerForm());
  }, [customer]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!form.company.trim() || !form.contact.trim() || !form.owner.trim()) return;
    const savedCustomer = await onSave(buildCustomerFromForm(form));
    setForm(customerToFormState(savedCustomer));
  }

  async function handleDelete() {
    if (!customer) return;
    await onDelete(customer);
    setForm(createEmptyCustomerForm());
  }

  return (
    <section className="panel customer-manager">
      <div className="panel-header">
        <div>
          <h2>客户管理</h2>
          <p className="muted">新增、编辑和删除{modeLabel}中的客户</p>
        </div>
        <Building2 size={22} />
      </div>

      <form className="customer-form" onSubmit={handleSubmit}>
        <div className="customer-form-toolbar">
          <button onClick={() => setForm(createEmptyCustomerForm())} type="button">
            <Plus size={15} />
            新客户
          </button>
          {customer ? (
            <button className="danger-button" onClick={handleDelete} type="button">
              <Trash2 size={15} />
              删除当前
            </button>
          ) : null}
        </div>

        <div className="customer-form-grid">
          <Field label="公司" value={form.company} onChange={(value) => updateField("company", value)} />
          <Field label="联系人" value={form.contact} onChange={(value) => updateField("contact", value)} />
          <Field label="职位" value={form.title} onChange={(value) => updateField("title", value)} />
          <Field label="销售负责人" value={form.owner} onChange={(value) => updateField("owner", value)} />
          <Field label="行业" value={form.industry} onChange={(value) => updateField("industry", value)} />
          <label>
            <span>阶段</span>
            <select value={form.stage} onChange={(event) => updateField("stage", event.target.value)}>
              {stages.map((stage) => (
                <option key={stage} value={stage}>
                  {stage}
                </option>
              ))}
            </select>
          </label>
          <Field label="金额" type="number" value={form.dealValue} onChange={(value) => updateField("dealValue", value)} />
          <Field label="概率" type="number" value={form.probability} onChange={(value) => updateField("probability", value)} />
          <Field
            label="预计成交天数"
            type="number"
            value={form.expectedCloseDays}
            onChange={(value) => updateField("expectedCloseDays", value)}
          />
        </div>

        <div className="customer-textarea-grid">
          <Textarea label="痛点" value={form.painPointsText} onChange={(value) => updateField("painPointsText", value)} />
          <Textarea label="异议" value={form.objectionsText} onChange={(value) => updateField("objectionsText", value)} />
          <Textarea label="信号" value={form.signalsText} onChange={(value) => updateField("signalsText", value)} />
          <Textarea label="活动记录" value={form.activitiesText} onChange={(value) => updateField("activitiesText", value)} />
        </div>

        <button className="primary-button" type="submit">
          <Save size={16} />
          {isEditing ? "保存客户" : "创建客户"}
        </button>
      </form>
    </section>
  );
}

function Field({ label, onChange, type = "text", value }) {
  return (
    <label>
      <span>{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function Textarea({ label, onChange, value }) {
  return (
    <label>
      <span>{label}</span>
      <textarea rows={3} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}
