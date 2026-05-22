# 景观方案总监 Agent 应用 / LandscapeFlow AI

> 🏆 腾讯云黑客松 · AI 智能体争霸赛 Agent 助理赛道
>
> 从场地现状到汇报成果，六个 AI Agent 协作完成景观概念方案

## 作品信息

| 项目 | 内容 |
|------|------|
| **中文作品名** | 景观方案总监 Agent 应用 |
| **英文名** | LandscapeFlow AI |
| **赛道** | 腾讯云黑客松 · AI 智能体争霸赛 Agent 助理赛道 |
| **使用产品** | WorkBuddy / CodeBuddy Agent 应用生成 |
| **后续扩展** | ClawPro / 腾讯云智能体开发平台 |

## 场景价值

景观方案前期需要大量项目理解、概念生成、方案比选、视觉表达和汇报整理。传统流程中这些步骤分散在不同阶段，依赖设计师个人经验，效率低且质量波动大。

**LandscapeFlow AI 把这些步骤串成端到端 Agent 工作流**——六个专业化 Agent 按序协作，从接收项目条件到输出完整汇报成果包，让设计师回到设计本身。

---

## 当前 MVP 已实现

- ✅ 项目条件输入（含场地现状图文件信息接入）
- ✅ 六阶段 Agent 工作流
  - 项目定义 Agent → 概念生成 Agent → 方案选择 Agent → 空间推演 Agent → 视觉表达 Agent → 输出成果 Agent
- ✅ 三方案生成（A/B/C 差异化策略）
- ✅ 六维度加权方案比选
- ✅ 推荐方案深化（功能区/游线/植物/材料/照明/运维）
- ✅ 视觉表达双轨制（实时生成 + 精选成果库 + Prompt 指令包）
- ✅ PPT 汇报大纲（8 页结构）
- ✅ Markdown 报告导出
- ✅ localStorage 历史记录
- ✅ 演示模式（一键填入案例 + 启动六 Agent）

## 当前 MVP 边界

| 能力 | 说明 |
|------|------|
| 实时图片生成 | 由 WorkBuddy 演示完成，前端应用不直接调用真实图像 API |
| PPTX 生成 | 当前输出大纲结构，可通过 WorkBuddy 或 pptxgenjs 接入 |
| 场地现状图 | 当前记录文件信息，后续接入多模态识别（CAD/DWG 自动分析） |
| API Key | 不暴露在前端，真实模型调用通过腾讯云函数 / EdgeOne Functions / ClawPro 工具节点完成 |

---

## 如何运行

```bash
# 1. 安装依赖
npm install

# 2. 启动开发服务器
npm run dev

# 3. 打开浏览器访问
# http://localhost:5173
```

---

## Agent 工作流

```
用户输入项目条件 + 上传场地现状图
            ↓
  🎬 项目定义 Agent
  · 项目类型判断 · 场地核心矛盾
  · 气候与地域判断 · 目标人群需求
  · 甲方关注点解析 · 场地现状图处理
            ↓
  💡 概念生成 Agent
  · 缺失信息识别 · 合理假设
  · 三方案生成（A/B/C 差异化）
            ↓
  📊 方案选择 Agent
  · 六维度加权打分
  · 推荐最优方案
            ↓
  🎯 空间推演 Agent
  · 功能分区 · 游线组织
  · 老幼友好策略 · 植物/材料/照明/运维
            ↓
  🖼️ 视觉表达 Agent（双轨制）
  ├─ Track 1: 实时生成结果 (WorkBuddy)
  ├─ Track 2: 精选成果库 (6张高质量)
  └─ Track 3: Prompt 指令包 (5条专业)
            ↓
  📦 输出成果 Agent（三类别）
  ├─ 可下载 Markdown 报告
  ├─ PPT 汇报大纲 (PPTX 接口预留)
  └─ 视觉表达成果
            ↓
  保存历史记录 → 导出 → 演示
```

---

## 演示视频脚本

| 镜头 | 内容 | 时长 |
|------|------|------|
| 1 | 首页 → 进入工作台 | 10s |
| 2 | 点击「⚡ 演示模式」，自动填入案例 + 加载文件 | 5s |
| 3 | 项目定义 Agent 执行（场地解析 + 现状图处理） | 10s |
| 4 | 概念生成 Agent + 方案选择 Agent（三方案 + 比选） | 15s |
| 5 | 空间推演 Agent（深化方案展开） | 10s |
| 6 | 视觉表达 Agent（实时生成 + 精选成果库 + Prompt 包） | 15s |
| 7 | 输出成果 Agent（报告导出 + PPT 大纲） | 10s |
| 8 | 历史记录与总结 | 5s |

---

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | React 18 |
| 构建工具 | Vite 5 |
| 样式 | Tailwind CSS 3.4 |
| 动画 | Framer Motion 11 |
| 路由 | React Router v6 (HashRouter) |
| 存储 | localStorage |
| 部署 | 静态文件 / EdgeOne Pages / GitHub Pages |

---

## 文件结构

```
landscapeflow-agent-app/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── .gitignore
├── README.md
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── index.css
    ├── data/
    │   └── demoCase.js
    ├── lib/
    │   ├── agentEngine.js      ← Agent 引擎（核心）
    │   ├── reportExporter.js   ← 导出工具
    │   └── storage.js          ← localStorage 管理
    └── components/
        ├── Hero.jsx            ← 首页
        ├── Workbench.jsx       ← 工作台主页
        ├── ProjectForm.jsx     ← 项目输入（含文件上传）
        ├── AgentTimeline.jsx   ← Agent 执行时间线
        ├── SchemeCards.jsx     ← 三方案卡片
        ├── ComparisonTable.jsx ← 方案比选表
        ├── DeepenPlan.jsx      ← 推荐方案深化
        ├── OutputTabs.jsx      ← 成果输出
        └── HistoryPanel.jsx    ← 历史记录
```

---

## 后续接入真实 API

```javascript
// src/lib/agentEngine.js — 预留 generateWithLLM()
export async function generateWithLLM(prompt, options = {}) {
  // 接入 DeepSeek / OpenAI / Claude
  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${options.apiKey}` },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  return (await response.json()).choices[0].message.content;
}
```

> ⚠️ API Key 不暴露在前端，真实模型调用通过腾讯云函数 / EdgeOne Functions / ClawPro 工具节点完成。

---

_Made with 🌿 for Landscape Designers · 腾讯云黑客松参赛作品_
