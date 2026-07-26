import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const AGENTS = [
  { id: '01', name: '前期分析', detail: '确认事实、需求、条件与资料缺口' },
  { id: '02', name: '概念生成', detail: '生成差异化 A / B / C 概念方向' },
  { id: '03', name: '方案比选', detail: '专业比选，辅助设计师最终决策' },
  { id: '04', name: '空间推演', detail: '深化空间结构与专业策略' },
  { id: '05', name: '视觉表达', detail: '组织分析成果、视觉候选与选择依据' },
  { id: '06', name: '成果输出', detail: '登记并校验 14 页方案汇报成果' },
];

const CHECKPOINTS = ['项目理解确认', '方案方向决策', '设计说明书分项确认', '视觉方案挑选', '汇报成果确认'];

export default function Hero() {
  const navigate = useNavigate();
  return (
    <div className="app-shell landscape-contours min-h-screen overflow-x-hidden">
      <header className="sticky top-0 z-20 border-b border-[var(--lf-border)] bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-[68px] max-w-[1440px] items-center justify-between px-6 lg:px-10">
          <button onClick={() => navigate('/')} className="flex items-center gap-3 text-left">
            <span className="brand-mark h-10 w-10 rounded-xl">L</span>
            <span>
              <span className="brand-gradient-text block text-base font-bold">LandscapeFlow AI</span>
              <span className="block text-xs text-slate-500">景观方案设计总监智能体</span>
            </span>
          </button>
          <span className="hidden rounded-full border border-violet-100 bg-violet-50/70 px-3 py-1.5 text-xs font-medium text-[var(--lf-muted)] md:inline-flex">
            腾讯云黑客松 · AI智能体争霸赛
          </span>
        </div>
      </header>

      <main>
        <section className="mx-auto flex min-h-[650px] max-w-[1120px] items-center justify-center px-6 py-16 text-center">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <p className="brand-gradient-text text-3xl font-bold tracking-tight md:text-4xl">LandscapeFlow AI</p>
            <h1 className="mt-3 font-serif text-4xl font-bold tracking-tight text-[var(--lf-brand-950)] md:text-6xl">
              景观方案设计总监智能体
            </h1>
            <p className="mx-auto mt-7 max-w-4xl text-lg leading-8 text-slate-600 md:text-xl">
              1 名设计总监智能体 × 6 个专业 Agent × 1 份持续演进的项目设计蓝本
            </p>
            <div className="mx-auto mt-8 grid max-w-2xl gap-3 md:grid-cols-2">
              <p className="rounded-2xl border border-violet-100 bg-white/90 px-5 py-4 text-base font-bold text-[var(--lf-brand-900)] shadow-sm">
                对资深设计师，一人即团队
              </p>
              <p className="rounded-2xl border border-amber-100 bg-white/90 px-5 py-4 text-base font-bold text-[var(--lf-brand-900)] shadow-sm">
                对年轻设计师，随身设计导师
              </p>
            </div>
            <div className="mt-9 flex justify-center">
              <button onClick={() => navigate('/workbench', { state: { newProject: true, presentationMode: true } })} className="btn-primary min-w-[210px] px-9 py-4 text-base">开始方案设计</button>
            </div>
            <p className="mt-5 text-sm text-[var(--lf-muted)]">从项目资料开始，六阶段推进；关键判断始终由设计师确认。</p>
          </motion.div>
        </section>

        <section className="border-y border-[var(--lf-border)] bg-white/80 py-16" data-testid="product-mechanism">
          <div className="mx-auto max-w-[1240px] px-6 lg:px-10">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-xs font-bold tracking-[0.2em] text-[var(--lf-brand-600)]">1 + 6 + 1 + N COLLABORATION</p>
              <h2 className="mt-3 font-serif text-3xl font-bold text-[var(--lf-brand-950)]">LandscapeFlow AI 是怎么工作的？</h2>
              <p className="mt-3 text-base leading-7 text-[var(--lf-muted)]">一个设计总监，带六个专业 Agent，围绕同一份项目蓝本完成方案</p>
              <p className="mt-2 text-sm font-semibold text-[var(--lf-brand-700)]">AI 负责生产，设计师在 2 次决策 + 3 次复核中掌握关键方向</p>
            </div>

            <div
              className="mx-auto mt-10 max-w-5xl"
              data-product-mechanism-asset="./product-mechanism/landscapeflow-product-mechanism-latest.png"
            >
              <div className="architecture-connector mx-auto max-w-2xl rounded-2xl bg-[var(--lf-brand-950)] px-6 py-5 text-center text-white shadow-lg">
                <p className="text-xs font-semibold tracking-[0.18em] text-violet-200">1｜景观设计总监智能体</p>
                <p className="mt-2 text-sm text-violet-100">匠心内核：设计智库 · 判断引擎 · 调度引擎</p>
              </div>
              <div className="mt-8">
                <p className="mb-3 text-center text-xs font-bold tracking-[0.16em] text-[var(--lf-brand-600)]">6｜六个专业 Agent</p>
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
                {AGENTS.map((agent) => (
                  <div key={agent.id} className="agent-card min-h-[150px] p-4">
                    <span className="text-xs font-bold text-[var(--lf-brand-500)]">{agent.id}</span>
                    <p className="mt-3 text-base font-bold text-[var(--lf-brand-950)]">{agent.name}</p>
                    <p className="mt-2 text-sm leading-6 text-[var(--lf-muted)]">{agent.detail}</p>
                  </div>
                ))}
                </div>
              </div>
              <div className="architecture-connector mx-auto mt-8 max-w-2xl rounded-2xl border border-cyan-200 bg-cyan-50 px-6 py-5 text-center">
                <p className="text-xs font-semibold tracking-[0.18em] text-cyan-700">1｜项目设计蓝本 Blueprint</p>
                <p className="mt-2 text-sm text-[var(--lf-muted)]">唯一设计依据 · 持续回写 · 版本演进 · 影响可追溯</p>
              </div>
              <div className="mt-8 grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center">
                  <p className="text-xs font-bold tracking-[0.15em] text-emerald-700">正式成果</p>
                  <p className="mt-2 text-sm text-emerald-900">设计说明 · 专业分析 · 视觉成果 · 方案汇报</p>
                </div>
                <div className="rounded-2xl border border-violet-200 bg-violet-50 p-5 text-center">
                  <p className="text-xs font-bold tracking-[0.15em] text-violet-700">设计执行轨迹 DESIGN TRACE</p>
                  <p className="mt-2 text-sm text-violet-900">关键选择、修改意见与成果版本可追溯</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-center">
                  <p className="text-xs font-bold tracking-[0.15em] text-slate-600">N｜能力底座</p>
                  <p className="mt-2 text-sm text-slate-700">Skills · 模型 · 专业工具</p>
                </div>
              </div>
              <div className="mt-8 rounded-2xl border border-amber-200 bg-[var(--lf-gold-soft)] p-5">
                <div className="grid gap-2 md:grid-cols-3">
                  {CHECKPOINTS.map((item, index) => <div key={item} className="rounded-xl border border-amber-100 bg-white px-4 py-3 text-sm font-semibold text-[var(--lf-text)]"><span className="mr-2 text-[var(--lf-gold)]">0{index + 1}</span>{item}</div>)}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-[1120px] gap-5 px-6 py-16 text-center md:grid-cols-3">
          {[
            ['从项目开始', '先整理资料和任务边界，再进入方案推演。'],
            ['让判断可追溯', '每次 Agent 写入、设计师确认与失效影响都有版本记录。'],
            ['让成果可延续', '蓝本、方案、视觉与最终汇报成果始终来自同一项目依据。'],
          ].map(([title, text]) => (
            <div key={title} className="surface-card p-6">
              <h3 className="text-lg font-bold text-[var(--lf-brand-950)]">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--lf-muted)]">{text}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
