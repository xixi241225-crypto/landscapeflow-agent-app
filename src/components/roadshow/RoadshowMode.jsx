import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ROADSHOW_IMAGE_URLS, ROADSHOW_STAGES, roadshowProject } from '../../data/roadshowProject';
import { DEMO_CASE, DEMO_FILES } from '../../data/demoCase';
import { createBlueprint } from '../../blueprint/blueprintModel';
import { migrateBlueprintToV2 } from '../../blueprint/blueprintMigration';
import {
  selectAgent1ExecutionSummary,
  selectAgent2ExecutionSummary,
  selectConceptCandidate,
  selectConceptCandidates,
  selectCoreConstraints,
  selectDesignPrinciples,
  selectProjectGoals,
} from '../../blueprint/blueprintSelectors';
import { confirmProjectDefinitionBlueprint, runProjectDefinitionAgent } from '../../agents/projectDefinitionAgent';
import { runConceptGenerationAgent } from '../../agents/conceptGenerationAgent';
import { loadActiveProject } from '../../lib/projectStorage';

const STORAGE_KEY = 'landscapeflow_v2_roadshow_state';
const AGENT_DURATION = 680;
const defaultAgentStates = () => roadshowProject.agentExecution.map(() => '等待');
const demoInput = () => ({ ...DEMO_CASE, siteFiles: DEMO_FILES });
const demoDraftBlueprint = () => createBlueprint(demoInput(), 'P-SL-001');
const demoConfirmedBlueprint = () => confirmProjectDefinitionBlueprint(runProjectDefinitionAgent(demoInput(), demoDraftBlueprint()).blueprint).blueprint;
const activeOrDemoBlueprint = () => loadActiveProject()?.blueprint || demoConfirmedBlueprint();

function getSavedState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (!saved || !ROADSHOW_STAGES.some((item) => item.id === saved.stage)) return null;
    return {
      stage: saved.stage,
      projectLoaded: Boolean(saved.projectLoaded),
      blueprintConfirmed: Boolean(saved.blueprintConfirmed),
      agentStates: Array.isArray(saved.agentStates) && saved.agentStates.length === 6
        ? saved.agentStates.map((status) => status === '执行中' ? '等待' : status)
        : defaultAgentStates(),
      executionComplete: Boolean(saved.executionComplete),
      resultsTab: saved.resultsTab || 'ppt',
      blueprint: migrateBlueprintToV2(saved.blueprint || demoDraftBlueprint()),
    };
  } catch {
    return null;
  }
}

function initialState() {
  return getSavedState() || {
    stage: 'ready',
    projectLoaded: false,
    blueprintConfirmed: false,
    agentStates: defaultAgentStates(),
    executionComplete: false,
    resultsTab: 'ppt',
    blueprint: demoDraftBlueprint(),
  };
}

const delay = (duration) => new Promise((resolve) => setTimeout(resolve, duration));

function CheckIcon({ className = 'h-5 w-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m5 12 4 4L19 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowIcon({ direction = 'right' }) {
  return (
    <svg className={`h-4 w-4 ${direction === 'left' ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m9 5 7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RoadshowImage({ src, alt, fit = 'cover', className = '', placeholder = '专业图纸槽位｜演示预览' }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className={`roadshow-image-placeholder ${className}`} role="img" aria-label={placeholder}>
        <div className="roadshow-placeholder-lines" aria-hidden="true" />
        <svg className="h-10 w-10 text-[var(--lf-brand-500)]/55" viewBox="0 0 48 48" fill="none" aria-hidden="true">
          <path d="M7 36c6-10 11-15 18-15 6 0 10 4 16 13M8 40h32" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M31 9c0 5-3 9-8 9s-8-4-8-9M23 6v16M17 11l12 6M29 11l-12 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
        <span>{placeholder}</span>
      </div>
    );
  }
  return <img src={src} alt={alt} className={className} style={{ objectFit: fit }} onError={() => setFailed(true)} />;
}

function BlueprintStatusBar({ blueprint }) {
  return (
    <div className="roadshow-blueprint-status">
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white"><CheckIcon className="h-4 w-4" /></span>
      <span className="font-bold text-[var(--lf-brand-950)]">项目设计蓝本 {blueprint.milestoneVersion || 'v0'}</span>
      <span className="hidden h-4 w-px bg-violet-200 sm:block" />
      <span className="text-emerald-700">已由设计师确认</span>
      <span className="hidden h-4 w-px bg-violet-200 md:block" />
      <span className="hidden text-[var(--lf-muted)] md:inline">项目目标、核心约束与设计原则已同步至 6 个专业 Agent</span>
    </div>
  );
}

function RoadshowHeader({ stage, blueprintConfirmed, onHome, compactResults = false }) {
  const stageInfo = ROADSHOW_STAGES.find((item) => item.id === stage);
  const compactStages = ['项目资料', '设计蓝本', 'Agent 协作', '完整成果'];
  return (
    <header className="roadshow-header">
      <button onClick={onHome} className="flex shrink-0 items-center gap-3 text-left" aria-label="返回产品首页">
        <span className="brand-mark h-10 w-10 rounded-xl">L</span>
        <span>
          <span className="brand-gradient-text block text-base font-bold">LandscapeFlow AI</span>
          <span className="block text-xs text-slate-500">景观方案设计总监智能体</span>
        </span>
      </button>
      <div className="roadshow-stage-nav" aria-label="路演进度">
        {(compactResults ? compactStages.map((label, index) => ({ id: label, index: index + 1, shortLabel: label })) : ROADSHOW_STAGES).map((item) => {
          const active = item.id === stage;
          const done = compactResults ? item.index < 4 : item.index < (stageInfo?.index || 1);
          const isActive = compactResults ? item.index === 4 : active;
          return (
            <div key={item.id} className={`roadshow-stage-item ${isActive ? 'active' : ''} ${done ? 'done' : ''}`}>
              <span>{done ? <CheckIcon className="h-3.5 w-3.5" /> : item.index}</span>
              <p>{item.shortLabel}</p>
            </div>
          );
        })}
      </div>
      <div className="hidden shrink-0 text-right lg:block">
        <p className="text-xs font-bold text-[var(--lf-brand-700)]">腾讯云黑客松 · 现场路演</p>
        <p className="mt-0.5 text-xs text-[var(--lf-muted)]">{blueprintConfirmed ? 'Blueprint 已确认' : '离线确定性演示'}</p>
      </div>
    </header>
  );
}

function ProjectLoadPage({ loading, loadingStep, onLoad }) {
  const { projectInfo, inputDocuments, loadingSteps } = roadshowProject;
  return (
    <section className="roadshow-content roadshow-centered-page">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mx-auto w-full max-w-[1180px]">
        <div className="mb-7 flex items-center justify-center gap-2">
          <span className="rounded-full border border-violet-200 bg-white px-3 py-1.5 text-sm font-bold text-[var(--lf-brand-700)]">真实脱敏项目</span>
          <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-sm font-semibold text-cyan-700">本地资料 · 离线可运行</span>
        </div>
        <div className="text-center">
          <p className="text-sm font-bold tracking-[0.18em] text-[var(--lf-brand-600)]">ROADSHOW PROJECT</p>
          <h1 className="mt-3 font-serif text-4xl font-bold text-[var(--lf-brand-950)] lg:text-5xl">{projectInfo.name}</h1>
          <p className="mt-4 text-xl font-semibold text-slate-600">{projectInfo.meta}</p>
          <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-[var(--lf-muted)]">{projectInfo.task}</p>
        </div>

        <div className="mx-auto mt-9 grid max-w-5xl gap-4 md:grid-cols-4">
          {inputDocuments.map((item) => (
            <div key={item.id} className="roadshow-input-chip">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--lf-brand-100)] text-sm font-extrabold text-[var(--lf-brand-700)]">{item.count}</span>
              <div><p>{item.title}</p><span>{item.count} 份资料</span></div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <p className="mb-5 text-base font-semibold text-emerald-700">{projectInfo.privacyNote}</p>
          <button onClick={onLoad} disabled={loading} className="btn-primary min-w-[220px] px-9 py-4 text-lg disabled:cursor-wait disabled:opacity-85">
            {loading ? '正在载入项目资料…' : '载入路演项目'}
          </button>
        </div>

        <AnimatePresence>
          {loading && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mx-auto mt-7 max-w-2xl rounded-2xl border border-violet-100 bg-white/95 p-5 shadow-sm">
              <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-violet-100">
                <motion.div className="h-full rounded-full bg-gradient-to-r from-[var(--lf-brand-700)] to-cyan-500" initial={{ width: '8%' }} animate={{ width: `${((loadingStep + 1) / loadingSteps.length) * 100}%` }} />
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {loadingSteps.map((step, index) => (
                  <div key={step} className={`text-center text-sm font-semibold ${index <= loadingStep ? 'text-[var(--lf-brand-700)]' : 'text-slate-400'}`}>
                    <span className={`mx-auto mb-2 flex h-7 w-7 items-center justify-center rounded-full ${index < loadingStep ? 'bg-emerald-500 text-white' : index === loadingStep ? 'bg-[var(--lf-brand-600)] text-white animate-pulse' : 'bg-slate-100'}`}>
                      {index < loadingStep ? <CheckIcon className="h-4 w-4" /> : index + 1}
                    </span>
                    {step}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </section>
  );
}

function ProjectOverviewPage({ generating, onGenerate }) {
  return (
    <section className="roadshow-content roadshow-page-scroll">
      <div className="mx-auto max-w-[1320px] px-6 py-8 lg:px-10">
        <div className="roadshow-title-row">
          <div>
            <p className="roadshow-eyebrow">完整项目输入</p>
            <h1>项目资料总览</h1>
            <p>系统读取的是 12 份真实脱敏项目资料，而不是一句简单 Prompt。</p>
          </div>
          <div className="roadshow-metric"><strong>12</strong><span>份资料已解析</span></div>
        </div>
        <div className="mt-7 grid gap-5 lg:grid-cols-2">
          {roadshowProject.inputDocuments.map((item) => (
            <motion.article key={item.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="roadshow-document-card">
              <div className="roadshow-document-preview">
                <RoadshowImage src={item.preview} alt={item.title} className="h-full w-full" fit={item.id === 'site' ? 'contain' : 'cover'} placeholder={`${item.title}｜资料预览`} />
                <span className="roadshow-status-pill success"><CheckIcon className="h-3.5 w-3.5" />已解析</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <h2>{item.title}</h2>
                  <span className="shrink-0 text-sm font-bold text-[var(--lf-brand-600)]">{item.count} 份</span>
                </div>
                <div className="mt-3 space-y-1.5">
                  {item.files.slice(0, 2).map((file) => <p key={file} className="truncate text-sm text-slate-500">· {file}</p>)}
                </div>
                <p className="mt-4 border-t border-[var(--lf-border)] pt-3 text-base leading-7 text-[var(--lf-text)]">{item.result}</p>
              </div>
            </motion.article>
          ))}
        </div>
        <div className="mt-7 text-center">
          <button onClick={onGenerate} disabled={generating} className="btn-primary min-w-[260px] px-9 py-4 text-lg disabled:cursor-wait disabled:opacity-80">
            {generating ? '正在形成项目设计蓝本…' : '生成项目设计蓝本'}
          </button>
        </div>
      </div>
    </section>
  );
}

function BlueprintPage({ blueprint, confirmed, onConfirm }) {
  const groups = [
    { number: '01', title: '项目目标', tone: 'violet', items: selectProjectGoals(blueprint) },
    { number: '02', title: '核心约束', tone: 'gold', items: selectCoreConstraints(blueprint) },
    { number: '03', title: '设计原则', tone: 'cyan', items: selectDesignPrinciples(blueprint) },
  ];
  return (
    <section className="roadshow-content roadshow-page-scroll">
      <div className="mx-auto max-w-[1360px] px-6 py-7 lg:px-10">
        <div className="roadshow-title-row">
          <div>
            <p className="roadshow-eyebrow">景观设计总监智能体 · 专业判断</p>
            <h1>项目设计蓝本 {blueprint.milestoneVersion || 'v1'}</h1>
            <p>将零散业主要求转化为六个专业 Agent 共同执行的唯一设计依据。</p>
          </div>
          <div className="roadshow-metric"><strong>12 → 1</strong><span>份资料 · 一份蓝本</span></div>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-[0.85fr_0.95fr_1.2fr]">
          {groups.map((group) => (
            <article key={group.title} className={`roadshow-blueprint-card ${group.tone}`}>
              <div className="flex items-center gap-3">
                <span>{group.number}</span>
                <h2>{group.title}</h2>
              </div>
              <ul>
                {group.items.map((item) => <li key={item.id}><CheckIcon className="mt-0.5 h-4 w-4 shrink-0" /><span>{item.value}</span></li>)}
              </ul>
            </article>
          ))}
        </div>

        <div className="mt-6 text-center">
          {confirmed ? (
            <div className="mx-auto max-w-2xl rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-5 text-left">
              <div className="flex items-center gap-3 text-emerald-800"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-white"><CheckIcon /></span><strong className="text-lg">设计方向已确认</strong></div>
              <div className="mt-3 grid gap-2 text-sm text-emerald-800 sm:grid-cols-2">
                <p>项目目标与约束已确认</p><p>六个专业 Agent 即将连续工作</p>
              </div>
            </div>
          ) : (
            <div>
              <button onClick={onConfirm} className="btn-primary min-w-[300px] px-9 py-4 text-lg">确认设计方向并开始设计</button>
              <p className="mt-3 text-sm text-[var(--lf-muted)]">确认后，六个专业 Agent 将围绕同一份项目设计蓝本连续工作。</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function ExecutionPage({ agentStates, running, complete, onStart, onResults, blueprint }) {
  const currentIndex = agentStates.findIndex((status) => status === '执行中');
  const completedCount = agentStates.filter((status) => status === '已完成').length;
  return (
    <section className="roadshow-content roadshow-page-scroll">
      <div className="mx-auto max-w-[1460px] px-6 py-7 lg:px-10">
        <div className="text-center">
          <p className="roadshow-eyebrow">1 名景观设计总监智能体统筹</p>
          <h1 className="mt-2 font-serif text-4xl font-bold text-[var(--lf-brand-950)]">景观设计总监智能体</h1>
          <p className="mt-3 text-lg text-[var(--lf-muted)]">正在依据项目设计蓝本组织六个专业 Agent 连续执行</p>
        </div>
        <div className="mx-auto mt-6 max-w-3xl">
          <div className="flex items-center justify-between text-sm font-semibold text-[var(--lf-muted)]">
            <span>六 Agent 协作进度</span><span className="text-[var(--lf-brand-700)]">{completedCount} / 6</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-violet-100">
            <motion.div className="h-full rounded-full bg-gradient-to-r from-[var(--lf-brand-700)] to-cyan-500" animate={{ width: `${(completedCount / 6) * 100}%` }} />
          </div>
        </div>

        <div className="roadshow-agent-grid">
          {roadshowProject.agentExecution.map((agent, index) => {
            const status = agentStates[index];
            return (
              <motion.article key={agent.id} animate={{ opacity: status === '等待' ? 0.58 : 1, y: status === '执行中' ? -5 : 0 }} className={`roadshow-agent-card ${status === '执行中' ? 'active' : ''} ${status === '已完成' ? 'done' : ''}`}>
                <div className="flex items-start justify-between gap-2">
                  <span className="roadshow-agent-number">0{agent.id}</span>
                  <span className={`roadshow-status-pill ${status === '已完成' ? 'success' : status === '执行中' ? 'working' : ''}`}>
                    {status === '已完成' && <CheckIcon className="h-3.5 w-3.5" />}{status}
                  </span>
                </div>
                <h2>{agent.name}</h2>
                <p>{status === '已完成' ? (agent.id === 1 ? selectAgent1ExecutionSummary(blueprint) : agent.id === 2 ? selectAgent2ExecutionSummary(blueprint) : agent.result) : status === '执行中' ? `正在读取 Blueprint ${blueprint.milestoneVersion || 'v2'} 并执行专业任务…` : '等待景观设计总监智能体调度'}</p>
                {status === '执行中' && <div className="mt-5 flex gap-1.5"><i /><i /><i /></div>}
              </motion.article>
            );
          })}
        </div>

        <div className="mt-7 text-center">
          {!running && !complete && <p className="text-base font-semibold text-[var(--lf-brand-700)]">正在准备六 Agent 协作……</p>}
          {running && <p className="text-base font-semibold text-[var(--lf-brand-700)]">当前执行：{currentIndex >= 0 ? roadshowProject.agentExecution[currentIndex].name : '正在组织协作'}，请稍候…</p>}
          {complete && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <p className="mb-4 inline-flex items-center gap-2 text-lg font-bold text-emerald-700"><CheckIcon />6 个专业 Agent 已完成协作</p>
              <div><button onClick={onResults} className="btn-primary min-w-[240px] px-9 py-4 text-lg">查看完整成果</button></div>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}

function ResultsTabs({ active, onChange }) {
  const tabs = [
    ['definition', '项目定义与概念'],
    ['spatial', '总平面与分析'],
    ['visual', '视觉表达'],
    ['ppt', '可编辑汇报 PPT'],
  ];
  return (
    <div className="roadshow-results-tabs">
      {tabs.map(([id, label]) => <button key={id} onClick={() => onChange(id)} className={active === id ? 'active' : ''}>{label}</button>)}
    </div>
  );
}

function DefinitionResult({ blueprint }) {
  const item = roadshowProject.deliverables.projectDefinition;
  const concept = selectConceptCandidate(blueprint, blueprint.designerDecision?.selectedConceptId) || selectConceptCandidates(blueprint)[0];
  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <article className="roadshow-result-panel p-7">
        <p className="roadshow-eyebrow">PROJECT DEFINITION</p>
        <h2 className="mt-2 text-3xl font-bold text-[var(--lf-brand-950)]">{item.positioning}</h2>
        <div className="mt-6 rounded-2xl bg-[var(--lf-brand-950)] p-6 text-white">
          <p className="text-sm font-semibold text-violet-200">核心概念</p>
          <p className="mt-2 font-serif text-4xl font-bold">{concept?.name || '概念方向待生成'}</p>
          <p className="mt-3 text-base leading-7 text-violet-100">{concept?.proposition || concept?.narrative || '等待 Agent 2 写入概念章节'}</p>
        </div>
        <div className="mt-6 space-y-3">
          {[concept?.strategicFocus, ...(concept?.keyScenes || []).slice(0, 3)].filter(Boolean).map((strategy, index) => <p key={strategy} className="flex gap-3 text-base leading-7"><span className="font-extrabold text-[var(--lf-brand-600)]">0{index + 1}</span><span>{strategy}</span></p>)}
        </div>
      </article>
      <div className="roadshow-result-panel overflow-hidden">
        <RoadshowImage src={concept?.referenceVisual?.url || item.image} alt={`${concept?.name || '概念方向'}演示意向`} className="h-full min-h-[470px] w-full" />
      </div>
    </div>
  );
}

function SpatialResult() {
  const { masterplan, analysisDiagrams } = roadshowProject.deliverables;
  return (
    <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
      <article className="roadshow-result-panel overflow-hidden">
        <div className="flex items-center justify-between border-b border-[var(--lf-border)] px-6 py-4">
          <div><h2 className="text-xl font-bold text-[var(--lf-brand-950)]">{masterplan.title}</h2><p className="mt-1 text-sm text-[var(--lf-muted)]">{masterplan.structure}</p></div>
          <span className="roadshow-status-pill success"><CheckIcon className="h-3.5 w-3.5" />演示成果</span>
        </div>
        <RoadshowImage src={masterplan.image} alt={masterplan.title} fit="contain" className="h-[580px] w-full bg-slate-50" />
      </article>
      <div className="grid gap-4">
        {analysisDiagrams.map((item) => (
          <article key={item.id} className="roadshow-result-panel grid grid-cols-[44%_1fr] overflow-hidden">
            <RoadshowImage src={item.image} alt={item.title} fit="contain" className="h-full min-h-[170px] w-full" placeholder={`${item.type}｜待替换真实素材`} />
            <div className="flex flex-col justify-center p-5"><span className="text-xs font-bold text-[var(--lf-brand-600)]">{item.id}</span><h3 className="mt-2 text-xl font-bold">{item.title}</h3><p className="mt-2 text-sm leading-6 text-[var(--lf-muted)]">{item.subtitle}</p></div>
          </article>
        ))}
      </div>
    </div>
  );
}

function VisualResult() {
  const { renderings, plantStrategy, materialStrategy } = roadshowProject.deliverables;
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {renderings.map((item) => (
        <article key={item.id} className="roadshow-result-panel overflow-hidden">
          <RoadshowImage src={item.image} alt={item.title} className="aspect-video w-full" />
          <div className="p-5"><div className="flex items-center justify-between"><h2 className="text-2xl font-bold">{item.title}</h2><span className="roadshow-status-pill demo">演示案例</span></div><p className="mt-2 text-base text-[var(--lf-muted)]">{item.subtitle}</p></div>
        </article>
      ))}
      {[plantStrategy, materialStrategy].map((item) => (
        <article key={item.title} className="roadshow-result-panel grid overflow-hidden sm:grid-cols-[42%_1fr]">
          <RoadshowImage src={item.image} alt={item.title} className="h-full min-h-[230px] w-full" />
          <div className="flex flex-col justify-center p-6"><p className="roadshow-eyebrow">PROFESSIONAL STRATEGY</p><h2 className="mt-2 text-2xl font-bold">{item.title}</h2><p className="mt-3 text-base leading-7 text-[var(--lf-muted)]">{item.description}</p></div>
        </article>
      ))}
    </div>
  );
}

function PptResult({ onDownload, blueprint }) {
  const ppt = roadshowProject.deliverables.editablePpt;
  const concept = selectConceptCandidate(blueprint, blueprint.designerDecision?.selectedConceptId) || selectConceptCandidates(blueprint)[0];
  return (
    <div>
      <article className="roadshow-ppt-file">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[var(--lf-brand-950)] text-lg font-black text-white">PPT</div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-2xl font-bold text-[var(--lf-brand-950)]">{ppt.fileName}</h2>
            <span className="roadshow-status-pill demo">原生可编辑 · 目标交付</span>
            <span className="roadshow-status-pill pending">PPTX 待接入</span>
          </div>
          <p className="mt-2 text-base text-[var(--lf-muted)]">{ppt.pageCount} 页｜{ppt.format}｜{ppt.status}</p>
        </div>
        <button onClick={onDownload} className="btn-secondary shrink-0 px-6 py-3 text-base">下载可编辑 PPT</button>
      </article>

      <div className="mt-6 flex items-end justify-between gap-4">
        <div><p className="roadshow-eyebrow">18-SLIDE NATIVE DECK</p><h2 className="mt-1 text-2xl font-bold text-[var(--lf-brand-950)]">完整汇报 PPT 缩略图总览</h2></div>
        <p className="hidden text-sm text-[var(--lf-muted)] md:block">演示缩略图使用本地素材 · 正式 PPTX 待接入指定路径</p>
      </div>
      <div className="roadshow-slide-grid">
        {ppt.slides.map((slide) => {
          const conceptSlide = slide.number === 5
            ? { ...slide, kicker: concept?.name || '概念方向待生成', image: concept?.referenceVisual?.url || slide.image }
            : slide.number === 6
              ? { ...slide, kicker: concept?.strategicFocus || '概念策略待生成' }
              : slide;
          return (
          <article key={slide.number} className="roadshow-slide">
            <div className="roadshow-slide-visual">
              <RoadshowImage src={conceptSlide.image} alt={conceptSlide.title} className="h-full w-full" fit={conceptSlide.number === 7 ? 'contain' : 'cover'} placeholder={`${conceptSlide.visual}｜待替换真实素材`} />
              <span>{String(conceptSlide.number).padStart(2, '0')}</span>
              <i>LandscapeFlow AI</i>
            </div>
            <div className="p-3.5">
              <h3>{conceptSlide.title}</h3>
              <p>{conceptSlide.kicker}</p>
              <small>建议视觉：{conceptSlide.visual}</small>
            </div>
          </article>
          );
        })}
      </div>
    </div>
  );
}

function ResultsPage({ activeTab, onTabChange, onDownload, blueprint }) {
  const { projectInfo, deliverables } = roadshowProject;
  return (
    <section className="roadshow-content roadshow-page-scroll">
      <div className="mx-auto max-w-[1500px] px-6 py-7 lg:px-10">
        <div className="roadshow-title-row">
          <div>
            <p className="roadshow-eyebrow">COMPLETE LANDSCAPE SCHEME</p>
            <h1>{projectInfo.name}</h1>
            <p className="font-semibold text-emerald-700">完整景观方案成果已生成</p>
          </div>
          <div className="hidden rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-right md:block">
            <p className="text-sm font-semibold text-emerald-700">不是一张效果图</p>
            <p className="mt-1 text-lg font-bold text-emerald-900">是一套完整景观方案</p>
          </div>
        </div>
        <div className="roadshow-results-summary">
          {deliverables.summary.map(([value, label]) => <div key={label}><strong>{value}</strong><span>{label}</span></div>)}
        </div>
        <ResultsTabs active={activeTab} onChange={onTabChange} />
        <div className="mt-6">
          {activeTab === 'definition' && <DefinitionResult blueprint={blueprint} />}
          {activeTab === 'spatial' && <SpatialResult />}
          {activeTab === 'visual' && <VisualResult />}
          {activeTab === 'ppt' && <PptResult onDownload={onDownload} blueprint={blueprint} />}
        </div>
      </div>
    </section>
  );
}

function DemoControls({ stage, disabled, onReset, onPrevious, onNext, onResults }) {
  const currentIndex = ROADSHOW_STAGES.findIndex((item) => item.id === stage);
  return (
    <aside className="roadshow-demo-controls" aria-label="路演控制">
      <button onClick={onReset} title="重新开始（R）">↻ <span>重新开始</span></button>
      <button onClick={onPrevious} disabled={disabled || currentIndex <= 0} title="上一步（←）"><ArrowIcon direction="left" /><span>上一步</span></button>
      <button onClick={onNext} disabled={disabled || currentIndex >= ROADSHOW_STAGES.length - 1} title="下一步（→ / Space）"><span>下一步</span><ArrowIcon /></button>
      <button onClick={onResults} disabled={disabled} className="accent" title="直接进入成果中心">成果中心</button>
    </aside>
  );
}

export default function RoadshowMode() {
  const navigate = useNavigate();
  const location = useLocation();
  const directResults = Boolean(location.state?.openResults);
  const initial = useRef(directResults ? {
    ...initialState(),
    stage: 'results',
    projectLoaded: true,
    blueprintConfirmed: true,
    agentStates: Array(6).fill('已完成'),
    executionComplete: true,
    resultsTab: 'ppt',
    blueprint: activeOrDemoBlueprint(),
  } : initialState()).current;
  const [stage, setStage] = useState(initial.stage);
  const [projectLoaded, setProjectLoaded] = useState(initial.projectLoaded);
  const [blueprintConfirmed, setBlueprintConfirmed] = useState(initial.blueprintConfirmed);
  const [agentStates, setAgentStates] = useState(initial.agentStates);
  const [executionComplete, setExecutionComplete] = useState(initial.executionComplete);
  const [resultsTab, setResultsTab] = useState(initial.resultsTab);
  const [blueprint, setBlueprint] = useState(initial.blueprint);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [generatingBlueprint, setGeneratingBlueprint] = useState(false);
  const [runningAgents, setRunningAgents] = useState(false);
  const [notice, setNotice] = useState('');
  const operationToken = useRef(0);

  const persistentState = useMemo(() => ({ stage, projectLoaded, blueprintConfirmed, agentStates, executionComplete, resultsTab, blueprint }), [agentStates, blueprint, blueprintConfirmed, executionComplete, projectLoaded, resultsTab, stage]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persistentState));
  }, [persistentState]);

  useEffect(() => {
    ROADSHOW_IMAGE_URLS.forEach((url) => {
      const image = new Image();
      image.src = url;
    });
  }, []);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(''), 4800);
    return () => clearTimeout(timer);
  }, [notice]);

  useEffect(() => () => { operationToken.current += 1; }, []);

  const goToStage = useCallback((nextStage) => {
    operationToken.current += 1;
    setLoading(false);
    setGeneratingBlueprint(false);
    setRunningAgents(false);
    setAgentStates((states) => states.map((status) => status === '执行中' ? '等待' : status));
    setStage(nextStage);
    if (nextStage === 'results') setResultsTab('ppt');
  }, []);

  const resetDemo = useCallback(() => {
    operationToken.current += 1;
    setStage('ready');
    setProjectLoaded(false);
    setBlueprintConfirmed(false);
    setAgentStates(defaultAgentStates());
    setExecutionComplete(false);
    setResultsTab('ppt');
    setLoading(false);
    setGeneratingBlueprint(false);
    setRunningAgents(false);
    localStorage.removeItem(STORAGE_KEY);
    setNotice('路演状态已完全重置。');
  }, []);

  const loadProject = useCallback(async () => {
    if (loading) return;
    const token = operationToken.current + 1;
    operationToken.current = token;
    setLoading(true);
    setLoadingStep(0);
    for (let index = 0; index < roadshowProject.loadingSteps.length; index += 1) {
      setLoadingStep(index);
      await delay(430);
      if (operationToken.current !== token) return;
    }
    setProjectLoaded(true);
    setLoading(false);
    setStage('projectOverview');
  }, [loading]);

  const generateBlueprint = useCallback(async () => {
    if (generatingBlueprint) return;
    const token = operationToken.current + 1;
    operationToken.current = token;
    setGeneratingBlueprint(true);
    await delay(850);
    if (operationToken.current !== token) return;
    setBlueprint(runProjectDefinitionAgent(demoInput(), blueprint).blueprint);
    setGeneratingBlueprint(false);
    setStage('blueprintPending');
  }, [blueprint, generatingBlueprint]);

  const confirmBlueprint = useCallback(async () => {
    if (blueprintConfirmed) return;
    const token = operationToken.current + 1;
    operationToken.current = token;
    setBlueprint((current) => confirmProjectDefinitionBlueprint(current).blueprint);
    setBlueprintConfirmed(true);
    setNotice('项目设计蓝本 v2 已确认，六个专业 Agent 将以该版本为统一设计基线。');
    await delay(1050);
    if (operationToken.current === token) setStage('agentExecuting');
  }, [blueprintConfirmed]);

  const executeAgents = useCallback(async () => {
    if (runningAgents) return;
    const token = operationToken.current + 1;
    operationToken.current = token;
    setRunningAgents(true);
    setExecutionComplete(false);
    setAgentStates(defaultAgentStates());
    let workingBlueprint = blueprint;
    for (let index = 0; index < roadshowProject.agentExecution.length; index += 1) {
      setAgentStates((states) => states.map((status, itemIndex) => itemIndex === index ? '执行中' : status));
      await delay(AGENT_DURATION);
      if (operationToken.current !== token) return;
      if (index === 1) {
        const result = runConceptGenerationAgent(workingBlueprint, { mode: 'demo', designerBrief: '' });
        workingBlueprint = result.blueprint;
        setBlueprint(workingBlueprint);
        if (!workingBlueprint.chapters?.conceptGeneration || workingBlueprint.milestoneVersion !== 'v3' || !workingBlueprint.agentExecutions?.some((item) => item.agentId === 'agent-2')) {
          throw new Error('Agent 2 未完成真实 Blueprint v3 写入');
        }
      }
      setAgentStates((states) => states.map((status, itemIndex) => itemIndex === index ? '已完成' : status));
    }
    await delay(450);
    if (operationToken.current !== token) return;
    setRunningAgents(false);
    setExecutionComplete(true);
  }, [blueprint, runningAgents]);

  useEffect(() => {
    if (stage !== 'agentExecuting' || !blueprintConfirmed || executionComplete || runningAgents) return undefined;
    const timer = setTimeout(executeAgents, 260);
    return () => clearTimeout(timer);
  }, [blueprintConfirmed, executeAgents, executionComplete, runningAgents, stage]);

  const previousStage = useCallback(() => {
    const index = ROADSHOW_STAGES.findIndex((item) => item.id === stage);
    if (index > 0) goToStage(ROADSHOW_STAGES[index - 1].id);
  }, [goToStage, stage]);

  const nextStage = useCallback(() => {
    const index = ROADSHOW_STAGES.findIndex((item) => item.id === stage);
    if (index < ROADSHOW_STAGES.length - 1) goToStage(ROADSHOW_STAGES[index + 1].id);
  }, [goToStage, stage]);

  const handlePptDownload = useCallback(() => {
    const ppt = roadshowProject.deliverables.editablePpt;
    if (ppt.fileUrl) {
      const link = document.createElement('a');
      link.href = ppt.fileUrl;
      link.download = ppt.fileName;
      link.click();
      return;
    }
    setNotice(`18 页 PPT 内容与缩略图已准备完成；真实 .pptx 文件待放入 ${ppt.replacementPath} 后启用下载。`);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      const target = event.target;
      if (target instanceof HTMLElement && (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable)) return;
      if (event.key === 'ArrowRight' || event.key === ' ') {
        event.preventDefault();
        if (!loading && !generatingBlueprint && !runningAgents) nextStage();
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        if (!loading && !generatingBlueprint && !runningAgents) previousStage();
      } else if (event.key.toLowerCase() === 'r') {
        event.preventDefault();
        resetDemo();
      } else if (/^[1-5]$/.test(event.key)) {
        event.preventDefault();
        goToStage(ROADSHOW_STAGES[Number(event.key) - 1].id);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [generatingBlueprint, goToStage, loading, nextStage, previousStage, resetDemo, runningAgents]);

  return (
    <div className="roadshow-shell">
      <RoadshowHeader stage={stage} blueprintConfirmed={blueprintConfirmed} compactResults={directResults} onHome={() => navigate('/')} />
      {blueprintConfirmed && ['agentExecuting', 'results'].includes(stage) && <BlueprintStatusBar blueprint={blueprint} />}
      {notice && <div className="roadshow-notice">{notice}</div>}

      <AnimatePresence mode="wait">
        <motion.main key={stage} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.22 }} className="min-h-0 flex-1">
          {stage === 'ready' && <ProjectLoadPage loading={loading} loadingStep={loadingStep} onLoad={loadProject} />}
          {stage === 'projectOverview' && <ProjectOverviewPage generating={generatingBlueprint} onGenerate={generateBlueprint} />}
          {stage === 'blueprintPending' && <BlueprintPage blueprint={blueprint} confirmed={blueprintConfirmed} onConfirm={confirmBlueprint} />}
          {stage === 'agentExecuting' && <ExecutionPage blueprint={blueprint} agentStates={agentStates} running={runningAgents} complete={executionComplete} onStart={executeAgents} onResults={() => goToStage('results')} />}
          {stage === 'results' && <ResultsPage activeTab={resultsTab} onTabChange={setResultsTab} onDownload={handlePptDownload} blueprint={blueprint} />}
        </motion.main>
      </AnimatePresence>

      {!directResults && (
        <>
          <DemoControls
            stage={stage}
            disabled={loading || generatingBlueprint || runningAgents}
            onReset={resetDemo}
            onPrevious={previousStage}
            onNext={nextStage}
            onResults={() => goToStage('results')}
          />
          <div className="roadshow-shortcuts">← / → / Space 翻页 · R 重置 · 1–5 跳转</div>
        </>
      )}
      {directResults && (
        <div className="roadshow-results-bottom">
          <button onClick={() => navigate('/workbench', { state: { returnToTrack: true } })} className="btn-secondary px-6 py-3 text-sm">返回执行轨迹</button>
          <button onClick={() => setResultsTab('ppt')} className="btn-primary px-7 py-3 text-base">打开可编辑 PPT</button>
        </div>
      )}
    </div>
  );
}
