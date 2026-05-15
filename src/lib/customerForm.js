const DEFAULT_STAGE = "初步接触";

export function createEmptyCustomerForm() {
  return {
    id: "",
    company: "",
    contact: "",
    title: "",
    owner: "",
    industry: "",
    stage: DEFAULT_STAGE,
    dealValue: "0",
    probability: "20",
    expectedCloseDays: "30",
    painPointsText: "",
    objectionsText: "",
    signalsText: "",
    activitiesText: "",
  };
}

export function customerToFormState(customer) {
  return {
    id: customer.id,
    company: customer.company,
    contact: customer.contact,
    title: customer.title,
    owner: customer.owner,
    industry: customer.industry,
    stage: customer.stage,
    dealValue: String(customer.dealValue),
    probability: String(customer.probability),
    expectedCloseDays: String(customer.expectedCloseDays),
    painPointsText: toText(customer.painPoints),
    objectionsText: toText(customer.objections),
    signalsText: toText(customer.signals),
    activitiesText: toText(customer.activities),
  };
}

export function buildCustomerFromForm(form) {
  return {
    id: form.id || `c-${Date.now().toString(36)}`,
    company: form.company.trim(),
    contact: form.contact.trim(),
    title: form.title.trim(),
    owner: form.owner.trim(),
    industry: form.industry.trim(),
    stage: form.stage || DEFAULT_STAGE,
    dealValue: toNumber(form.dealValue, 0),
    probability: clamp(toNumber(form.probability, 20), 0, 100),
    lastContactDays: 0,
    expectedCloseDays: Math.max(toNumber(form.expectedCloseDays, 30), 1),
    painPoints: toList(form.painPointsText),
    objections: toList(form.objectionsText),
    signals: toList(form.signalsText),
    activities: toList(form.activitiesText),
  };
}

function toList(value) {
  return String(value ?? "")
    .split(/\n|,|，/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function toText(value = []) {
  return value.join("\n");
}

function toNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
