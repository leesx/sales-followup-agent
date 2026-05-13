# Sales Followup Agent

销售跟进 Agent 原型。它基于模拟 CRM 数据，自动生成客户风险判断、下一步跟进动作、话术草稿和主管日报，用来演示传统 CRM 如何升级成“主动推进业务”的 Agent CRM。

线上演示：[https://sales-followup-agent.vercel.app](https://sales-followup-agent.vercel.app)

## 项目定位

传统 CRM 主要帮助销售团队记录客户、商机和跟进过程。本项目在 CRM 数据之上增加一个 Agent 分析层，让系统不只是展示数据，还能主动回答：

- 哪些商机今天最需要处理？
- 为什么这个客户有成交风险？
- 销售下一步应该做什么？
- 应该通过什么渠道、在什么时间跟进？
- 可以直接发给客户的话术是什么？
- 主管今天应该关注哪些客户？

当前版本是纯前端 MVP，使用规则引擎模拟 Agent 分析，不依赖后端、数据库或大模型 API。

## 核心功能

- **商机队列**：按 Agent 判断的风险优先级排序客户。
- **客户画像**：展示行业、阶段、金额、联系人、预计成交时间和最近动态。
- **Agent 分析**：生成客户摘要、风险等级和风险原因。
- **跟进记录录入**：销售只需输入沟通内容，Agent 自动解析客户态度、阻塞点、下一步任务和截止时间。
- **下一步动作**：给出优先级、渠道、时机和推进目标。
- **跟进话术**：根据客户痛点和异议生成可直接使用的沟通草稿。
- **本地任务管理**：Agent 根据最新跟进记录生成任务，支持本地勾选完成。
- **任务中心**：集中展示所有客户任务，统计待处理、今日相关和已完成任务，并可点击任务跳转客户。
- **主管日报**：汇总总管道、加权预测、高风险商机、逾期跟进和优先队列。

## 技术栈

- Vite
- React
- JavaScript
- Vitest
- lucide-react

## 快速开始

```bash
npm install
npm run dev
```

默认开发地址：

```text
http://localhost:5174
```

如果端口被占用，可以手动指定：

```bash
npm run dev -- --port 5175
```

## 常用命令

```bash
# 启动开发服务
npm run dev

# 运行单元测试
npm test -- --run

# 生产构建
npm run build

# 本地预览生产构建
npm run preview
```

## 项目结构

```text
sales-followup-agent/
├── docs/
│   └── superpowers/
│       ├── plans/
│       └── specs/
├── src/
│   ├── components/
│   │   ├── CustomerList.jsx
│   │   ├── CustomerProfile.jsx
│   │   ├── FollowupComposer.jsx
│   │   ├── InsightPanel.jsx
│   │   ├── ManagerBrief.jsx
│   │   ├── TaskDashboard.jsx
│   │   └── TaskPanel.jsx
│   ├── data/
│   │   └── mockCrm.js
│   ├── lib/
│   │   ├── agentEngine.js
│   │   └── agentEngine.test.js
│   ├── App.jsx
│   ├── main.jsx
│   └── styles.css
├── index.html
├── package.json
└── vite.config.js
```

## Agent 分析逻辑

核心逻辑在 `src/lib/agentEngine.js`。

当前规则包括：

- 最新跟进记录会刷新客户状态，并将客户视为当天已触达。
- 跟进记录中的下一步动作会优先转成任务。
- 跟进内容会自动识别积极/消极信号、采购要求、客户担心、预算、合规、实施周期等关键信息。
- 跟进内容会自动识别今天、明天、明天上午、本周内、下周三前等时间表达。
- 超过 7 天未跟进会提高风险。
- 超过 14 天未跟进会显著提高风险。
- 高金额商机但成交概率不足时会提高风险。
- 临近预计成交日期但概率不足时会提高风险。
- 存在客户异议时会提高风险。
- 出现 CEO、财务等关键决策信号时会降低部分风险。

主要导出函数：

- `analyzeCustomer(customer)`：分析单个客户，生成风险、摘要和下一步动作。
- `analyzeCustomers(customers)`：批量分析并按风险排序。
- `buildManagerBrief(analyzedCustomers)`：生成主管日报。
- `buildTaskDashboard(tasks, customers)`：生成全局任务中心数据。
- `formatCurrency(value)`：格式化人民币金额。

## 模拟数据

模拟 CRM 数据在 `src/data/mockCrm.js`，目前包含 6 个客户，覆盖制造业、餐饮连锁、软件服务、医疗、教育培训和新能源等场景。

每个客户包含：

- 公司和联系人
- 销售负责人
- 所属行业
- 商机阶段
- 商机金额
- 成交概率
- 距离上次跟进天数
- 预计成交天数
- 客户痛点
- 客户异议
- 积极信号
- 最近动态

## 浏览器本地存储

项目使用浏览器自带的 IndexedDB 保存用户输入的数据，不需要后端服务。

本地数据库封装在：

```text
src/lib/browserDb.js
```

当前保存两类数据：

- `followups`：销售新增的跟进记录。
- `tasks`：Agent 根据跟进记录生成的下一步任务。

这些数据只保存在当前浏览器中。清理浏览器站点数据后，新增跟进记录和任务会被清空，模拟 CRM 客户数据不受影响。

## 测试

测试文件：

```text
src/lib/agentEngine.test.js
```

当前覆盖：

- 逾期高金额商机应被判断为高风险。
- 下一步话术应包含客户联系人和业务痛点。
- 主管日报应正确统计高风险和逾期跟进数量。
- 最新跟进记录应刷新客户状态。
- 最新跟进记录中的下一步动作应生成任务。
- 自然语言跟进记录应被解析成客户态度、阻塞点、下一步任务和截止时间。
- 任务中心应按状态和优先级排序，并补齐客户名称。

运行：

```bash
npm test -- --run
```

## 部署

项目已部署到 Vercel：

[https://sales-followup-agent.vercel.app](https://sales-followup-agent.vercel.app)

手动部署命令：

```bash
vercel --prod
```

Vercel 会自动识别 Vite 项目，构建命令为：

```bash
npm run build
```

输出目录为：

```text
dist
```

## 后续演进方向

- 接入真实 CRM 数据库。
- 将规则型 `agentEngine` 替换为 LLM 分析服务。
- 增加销售跟进记录自动总结和异议提取。
- 增加客户阶段自动更新建议。
- 增加任务创建、提醒和审批流。
- 增加“人确认后执行”的半自动 Agent 操作。
- 增加多角色视图：销售、主管、运营。
- 增加权限、租户和团队配置，演进成 SaaS 产品。

## 适合演示的产品话术

这个项目展示的不是一个新的 CRM 表格，而是一个 CRM Agent 层：

> CRM 负责沉淀客户数据，Agent 负责解释数据、发现风险、建议动作，并帮助销售推进下一步。

第一版只做规则分析，是为了让产品形态快速跑通。后续接入大模型后，可以让分析更接近真实销售经理的判断。
