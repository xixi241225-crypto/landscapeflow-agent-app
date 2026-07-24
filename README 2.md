# LandscapeFlow AI · 景观方案总监智能体

> 六个AI Agent协作，输入场地条件即可完成景观设计方案全流程工作。

## 在线体验

- Demo 地址：https://xixi241225-crypto.github.io/landscapeflow-agent-app/
- 代码仓库：https://github.com/xixi241225-crypto/landscapeflow-agent-app

## 作品定位

LandscapeFlow AI 是面向景观设计师的 AI 方案生成工作台。用户输入项目条件并上传场地现状图后，系统通过六个 Agent 协作完成项目定义、概念生成、方案选择、空间推演、视觉表达和成果输出。

## 为什么这是 Agent 工作流

本作品不是静态展示网页，而是一个通过 Web 工作台呈现的端到端 Agent 应用。系统将景观概念方案流程拆解为六个连续阶段：项目定义、概念生成、方案选择、空间推演、视觉表达、输出成果。每个阶段承担独立任务，并将上一步结果传递给下一阶段，最终形成方案报告、PPT 大纲、视觉成果和 Prompt 指令包。

## 技术栈

| 类别 | 技术 |
|------|------|
| 前端框架 | React 18 |
| 构建工具 | Vite 5 |
| 样式方案 | Tailwind CSS 3.4 |
| 动画库 | Framer Motion 11 |
| 路由 | React Router v6 (HashRouter) |
| 数据持久化 | localStorage |
| 部署平台 | GitHub Pages |

## 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 启动开发服务器
npm run dev

# 3. 打开浏览器访问
# http://localhost:5173
```

## 构建与部署

```bash
# 生产构建
npm run build

# 部署到 GitHub Pages
npm run deploy
```

## Agent 工作流架构

```
用户输入项目条件 + 场地现状图
        ↓
  ① 项目定义 Agent
     → 解析场地条件  → 识别缺失信息  → 做出合理假设
     → 确定设计目标  → 明确约束条件  → 形成项目简报
        ↓
  ② 概念生成 Agent
     → 生成三个差异化概念方案 A/B/C（不同策略方向）
        ↓
  ③ 方案选择 Agent
     → 六维度加权打分  → 推荐最优方案
        ↓
  ④ 空间推演 Agent
     → 功能分区深化  → 游线组织展开  → 空间序列设计
        ↓
  ⑤ 视觉表达 Agent
     → 实时生成 + 精选成果库 + Prompt 指令包
        ↓
  ⑥ 输出成果 Agent
     → Markdown 方案报告
     → PPT 汇报大纲（8页结构）
     → 视觉成果汇总包
        ↓
    ─────── 全流程完成 ───────
```

## 项目结构

```
landscapeflow-agent-app/
├── index.html              # 入口 HTML
├── package.json            # 项目配置
├── vite.config.js          # Vite 配置
├── tailwind.config.js      # Tailwind 配置
├── postcss.config.js       # PostCSS 配置
├── .gitignore
├── README.md
├── public/
│   └── demo-images/        # 效果图素材
└── src/
    ├── main.jsx            # 应用入口
    ├── App.jsx             # 路由配置
    ├── index.css           # 全局样式
    ├── data/
    │   └── demoCase.js     # 演示案例数据
    ├── lib/
    │   ├── agentEngine.js  # Agent 引擎核心逻辑
    │   ├── reportExporter.js # 报告导出
    │   └── storage.js      # localStorage 管理
    └── components/
        ├── Hero.jsx           # 首页
        ├── Workbench.jsx      # 主工作台
        ├── ProjectForm.jsx    # 项目条件表单
        ├── AgentTimeline.jsx  # Agent 时间轴
        ├── SchemeCards.jsx    # 方案卡片
        ├── ComparisonTable.jsx # 方案对比表
        ├── DeepenPlan.jsx     # 方案深化
        ├── OutputTabs.jsx     # 成果输出标签页
        ├── HistoryPanel.jsx   # 历史记录面板
        ├── DemoConsole.jsx    # 分步演示控制台
        ├── AgentContent.jsx   # Agent 内容区
        ├── AgentSidebar.jsx   # Agent 侧边栏
        └── ImageModal.jsx     # 图片预览弹窗
```

## 核心功能

### 已完成功能（MVP）

- ✅ 项目条件输入表单（城市/面积/类型/风格/特殊要求）
- ✅ 6 个 Agent 完整工作流（项目定义→概念生成→方案选择→空间推演→视觉表达→输出成果）
- ✅ 三套差异化概念方案 A/B/C 自动生成与对比
- ✅ 六维度加权评分方案选择系统
- ✅ 空间策略深化（功能分区/游线组织/节点设计/种植策略）
- ✅ 视觉成果库（精选效果图 + AI 生成 + Prompt 指令包）
- ✅ PPT 汇报大纲自动生成（8 页标准结构）
- ✅ Markdown 方案报告一键导出
- ✅ 本地存储（localStorage）历史记录
- ✅ 分步演示模式 + 一键全自动运行模式

### MVP 未包含功能

| 功能 | 说明 |
|------|------|
| 真实 LLM API 对接 | 当前使用内置演示数据，可接入 WorkBuddy / DeepSeek / OpenAI 等 API |
| PPTX 文件下载 | 可集成 pptxgenjs 库实现真实 PPTX 导出 |
| CAD 图纸解析 | 可接入 OCR / 矢量化服务处理场地现状 DWG 图纸 |
| 用户认证系统 | 可接入腾讯云 / GitHub OAuth 等身份验证 |

---

_Made with 🌿 for Landscape Designers · 腾讯云黑客松参赛作品_
