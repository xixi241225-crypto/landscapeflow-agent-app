import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import CheckpointPanel from './CheckpointPanel';
import ComparisonTable from './ComparisonTable';
import ImageModal from './ImageModal';
import VisualAssetFrame from './VisualAssetFrame';
import ProjectDefinitionWizard from './ProjectDefinitionWizard';
import { RoadshowAgentTrack, RoadshowBlueprintDraft, RoadshowStageRail } from './RoadshowFlow';
import { AGENTS, CONTENT_STATUS } from '../blueprint/blueprintModel';
import {
  selectConceptCandidate,
  selectConceptCandidates,
  selectConceptGenerationInput,
  selectCoreConstraints,
  selectProjectGoals,
} from '../blueprint/blueprintSelectors';

const stepGoals = [
  '提取事实、来源、缺口、假设、约束与核心设计问题',
  '基于已确认事实生成三个差异化概念候选',
  '动态专业比选并等待设计师作最终选择',
  '严格基于设计师选择落实空间与专业策略',
  '组织视觉任务书并展示演示案例视觉成果',
  '从 Blueprint 生成报告、12 页 PPT 结构并完成质量复核',
];

const CONCEPT_VISUAL_FALLBACKS = {
  A: './demo-images/aerial.jpg',
  B: './demo-images/awn.jpg',
  C: './demo-images/elderly.jpg',
};

function getConceptVisual(concept, blueprint, statusOverride) {
  if (!concept) return {};
  const code = concept.code || concept.id;
  const conceptVersion = String(blueprint.agentRuns?.[2]?.blueprintVersionWritten || blueprint.milestoneVersion || 'v3').replace(/^v/, '');
  return {
    id: `C${code}`,
    title: `${concept.name}概念图`,
    assetType: '概念氛围图',
    url: CONCEPT_VISUAL_FALLBACKS[code],
    aspectRatio: '16:9',
    sourceAgent: 'Agent 2｜概念生成',
    blueprintVersion: concept._meta?.version || conceptVersion,
    isDemoAsset: true,
    ...(concept.referenceVisual || concept.visual || {}),
    status: concept.referenceVisual?.status === 'demo-reference' ? '演示案例' : concept.visual?.status || '演示案例',
    ...(statusOverride ? { status: statusOverride } : {}),
  };
}

function getPlanAsset(blueprint, statusOverride) {
  const spatial = blueprint.spatialStructure || {};
  return {
    id: 'SP01',
    title: spatial.title ? `${spatial.title}｜空间策略总平面` : '空间策略总平面',
    assetType: '总平面图',
    url: spatial.planImage,
    aspectRatio: '3:4',
    objectFit: 'contain',
    status: spatial.planImage ? '演示案例' : '待生成',
    sourceAgent: 'Agent 4｜空间推演',
    blueprintVersion: spatial._meta?.version || blueprint.currentVersion,
    isDemoAsset: Boolean(spatial.planImage),
    ...(spatial.planAsset || {}),
    ...(statusOverride ? { status: statusOverride } : {}),
  };
}

function getProjectMaterialAssets(project = {}, blueprintVersion = 1) {
  const isDemo = Boolean(project.siteFiles?.some((file) => file.demo));
  const source = isDemo ? '演示案例项目资料' : '设计师上传';
  return [
    {
      id: 'D01',
      title: '场地现状照片',
      assetType: '现状资料',
      url: isDemo ? './demo-images/entrance.jpg' : '',
      aspectRatio: '4:3',
      status: isDemo ? '演示案例' : '待上传',
      sourceAgent: source,
      blueprintVersion,
      isDemoAsset: isDemo,
    },
    {
      id: 'D02',
      title: '区位及周边关系图',
      assetType: '区位分析图',
      url: isDemo ? './demo-images/aerial.jpg' : '',
      aspectRatio: '4:3',
      status: isDemo ? '演示案例' : '待上传',
      sourceAgent: source,
      blueprintVersion,
      isDemoAsset: isDemo,
    },
    {
      id: 'D03',
      title: 'CAD / 总平面 / 红线底图',
      assetType: '设计底图',
      url: isDemo ? './demo-images/plan.jpg' : '',
      aspectRatio: '4:3',
      objectFit: 'contain',
      status: isDemo ? '演示案例' : '待上传',
      sourceAgent: source,
      blueprintVersion,
      isDemoAsset: isDemo,
    },
  ];
}

function Badge({ children, tone = 'green' }) {
  const styles = { green: 'bg-emerald-50 text-emerald-700 border-emerald-100', amber: 'bg-amber-50 text-amber-800 border-amber-100', blue: 'bg-cyan-50 text-cyan-700 border-cyan-100', purple: 'bg-violet-50 text-violet-700 border-violet-100', red: 'bg-rose-50 text-rose-700 border-rose-100', gray: 'bg-slate-50 text-slate-500 border-slate-100' };
  return <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${styles[tone]}`}>{children}</span>;
}

function Card({ title, children, accent = 'var(--lf-brand-600)', className = '' }) {
  return <div className={`surface-card p-4 ${className}`}><div className="flex items-center gap-2 mb-3"><span className="w-1 h-4 rounded" style={{ background: accent }} /><h3 className="text-sm font-semibold text-[var(--lf-text)]">{title}</h3></div>{children}</div>;
}

export default function AgentContent({
  blueprint,
  formData,
  viewedStep,
  currentStep,
  runState,
  agentProgress,
  conceptRequirement,
  visualWorkflowStep,
  outputWorkflowStep,
  projectInputStep,
  projectInputLoading,
  projectInputLoadingStep,
  presentationMode = false,
  presentationStage = 0,
  presentationAgentStates = [],
  onFormUpdate,
  onFillDemoBasic,
  onFillDemoFiles,
  onFillDemoAll,
  onProjectInputStep,
  onReviewProjectMaterials,
  onConfirmProjectMaterials,
  onRunAgent,
  onConceptRequirement,
  onConfirmVisualBrief,
  onGenerateVisuals,
  onAdvanceOutput,
  onConfirmCheckpoint,
  onUpdateDecision,
  onAssumptionDecision,
  onSaveFacts,
  onExportJSON,
  onExportMarkdown,
  onNavigate,
  onRegenerateConcepts,
  onNotice,
  onOpenBlueprint,
}) {
  const [modalImage, setModalImage] = useState(null);
  const agent = AGENTS[viewedStep];
  const run = blueprint.agentRuns[agent.id];
  const checkpoint = blueprint.checkpoints.find((item) => item.afterAgent === agent.id && item.id === blueprint.currentCheckpoint);
  const visibleCheckpoint = checkpoint?.id === 'checkpoint-4' && outputWorkflowStep < 4 ? null : checkpoint;
  const isIdle = runState === 'idle' && !Object.values(blueprint.agentRuns).some((item) => item.status === 'done');
  const showProjectWizard = presentationMode
    ? presentationStage === 0
    : viewedStep === 0 && isIdle && run.status === 'pending' && !run.blueprintVersionWritten;
  const presentationTitles = [
    ['项目资料', '输入项目基本信息并整理核心资料'],
    ['项目设计蓝本草案', '确认设计总监智能体对目标、约束与策略的理解'],
    ['Agent 协作', '六个专业 Agent 围绕同一份项目设计蓝本连续执行'],
    ['完整成果', '查看完整方案与可编辑汇报 PPT'],
  ];
  const presentationTitle = presentationTitles[presentationStage] || presentationTitles[0];

  return (
    <div className="h-full flex flex-col">
      {presentationMode && <RoadshowStageRail stage={presentationStage} />}
      <div className="mx-5 mt-4 rounded-2xl border border-[var(--lf-border)] bg-white px-4 py-3 flex items-center gap-3 shadow-sm shrink-0">
        <div className="brand-mark w-9 h-9 rounded-xl text-xs">{presentationMode ? `0${presentationStage + 1}` : String(agent.id).padStart(2, '0')}</div>
        <div className="flex-1">
          <h2 className="text-base font-semibold text-[var(--lf-brand-950)]">{presentationMode ? presentationTitle[0] : `${String(agent.id).padStart(2, '0')} ${agent.name}`}</h2>
          <p className="text-xs text-[var(--lf-muted)] mt-0.5">{presentationMode ? presentationTitle[1] : viewedStep === 0 ? '梳理基本信息、项目资料与设计边界' : stepGoals[viewedStep]}</p>
        </div>
        {presentationMode ? (
          <Badge tone={presentationStage === 2 && presentationAgentStates.some((status) => status === '执行中') ? 'blue' : presentationStage > 0 ? 'green' : 'gray'}>
            {presentationStage === 2 && presentationAgentStates.some((status) => status === '执行中') ? '执行中' : presentationStage > 0 ? '已就绪' : '资料准备'}
          </Badge>
        ) : (
          <>
            <Badge tone={run.status === 'done' ? 'green' : run.status === 'stale' ? 'red' : run.status === 'working' ? 'blue' : 'gray'}>{run.status === 'done' ? '已完成' : run.status === 'stale' ? '需要重新生成' : run.status === 'working' ? '执行中' : '待执行'}</Badge>
            {run.blueprintVersionRead && <span className="text-xs text-[var(--lf-muted)]">读取 {run.blueprintVersionRead} → 写入 {run.blueprintVersionWritten}</span>}
          </>
        )}
      </div>

      <div className={`flex-1 overflow-y-auto px-5 py-4 ${showProjectWizard ? 'pb-5' : 'pb-28'}`}>
        <div className="max-w-6xl mx-auto">
          {!presentationMode && agentProgress?.agentId === agent.id && <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-4 mb-4"><div className="flex items-center justify-between"><p className="text-sm font-semibold text-cyan-900">{agent.name} 正在分析</p><span className="text-xs text-cyan-700">{Math.round(((agentProgress.step + 1) / agentProgress.actions.length) * 100)}%</span></div><div className="h-2 rounded-full bg-white mt-3 overflow-hidden"><motion.div className="h-full bg-cyan-500" animate={{ width: `${((agentProgress.step + 1) / agentProgress.actions.length) * 100}%` }} /></div><div className="grid grid-cols-3 gap-2 mt-3">{agentProgress.actions.map((action, index) => <div key={action} className={`text-xs ${index <= agentProgress.step ? 'text-cyan-800' : 'text-slate-400'}`}>{index <= agentProgress.step ? '●' : '○'} {action}</div>)}</div></div>}

          {!presentationMode && run.status === 'stale' && <div className="rounded-xl p-4 bg-red-50 border-2 border-red-200 mb-4"><p className="text-sm font-semibold text-red-900">已失效，不属于当前方案</p><p className="text-[10px] text-red-700 mt-1">旧成果保留用于对比。请重新运行 Agent，使其读取最新 Blueprint 并恢复为当前成果。</p></div>}

          {presentationMode ? (
            <>
              {presentationStage === 0 && (
                <ProjectDefinitionWizard
                  formData={formData}
                  step={projectInputStep}
                  organizing={projectInputLoading}
                  organizingStep={projectInputLoadingStep}
                  onFormUpdate={onFormUpdate}
                  onFillDemoBasic={onFillDemoBasic}
                  onFillDemoFiles={onFillDemoFiles}
                  onFillDemoAll={onFillDemoAll}
                  onSetStep={onProjectInputStep}
                  onReviewMaterials={onReviewProjectMaterials}
                  onConfirmAndGenerate={onConfirmProjectMaterials}
                  onNotice={onNotice}
                />
              )}
              {presentationStage === 1 && <RoadshowBlueprintDraft blueprint={blueprint} onOpenBlueprint={onOpenBlueprint} />}
              {presentationStage === 2 && <RoadshowAgentTrack states={presentationAgentStates} blueprint={blueprint} />}
            </>
          ) : viewedStep === 0 && (showProjectWizard ? (
            <ProjectDefinitionWizard
              formData={formData}
              step={projectInputStep}
              organizing={projectInputLoading}
              organizingStep={projectInputLoadingStep}
              onFormUpdate={onFormUpdate}
              onFillDemoBasic={onFillDemoBasic}
              onFillDemoFiles={onFillDemoFiles}
              onFillDemoAll={onFillDemoAll}
              onSetStep={onProjectInputStep}
              onReviewMaterials={onReviewProjectMaterials}
              onConfirmAndGenerate={onConfirmProjectMaterials}
              onNotice={onNotice}
            />
          ) : run.status === 'working' ? null : (
            <ProjectDefinition blueprint={blueprint} onOpenBlueprint={onOpenBlueprint} />
          ))}

          {!presentationMode && viewedStep === 1 && <Concepts blueprint={blueprint} requirement={conceptRequirement} onRequirement={onConceptRequirement} onRun={() => onRunAgent(2)} onRegenerate={onRegenerateConcepts} onEnterComparison={() => { onNavigate(2); if (!blueprint.comparison) onRunAgent(3); }} onOpenBlueprint={onOpenBlueprint} />}
          {!presentationMode && viewedStep === 2 && <Comparison blueprint={blueprint} />}
          {!presentationMode && viewedStep === 3 && <SpatialPlan blueprint={blueprint} onOpenImage={setModalImage} onModifyUpstream={() => onNavigate(0)} onUpdateDecision={onUpdateDecision} onRun={() => onRunAgent(4)} />}
          {!presentationMode && viewedStep === 4 && <VisualResults blueprint={blueprint} workflowStep={visualWorkflowStep} onConfirmBrief={onConfirmVisualBrief} onGenerate={onGenerateVisuals} onOpenImage={setModalImage} />}
          {!presentationMode && viewedStep === 5 && <Outputs blueprint={blueprint} workflowStep={outputWorkflowStep} onAdvance={onAdvanceOutput} onExportJSON={onExportJSON} onExportMarkdown={onExportMarkdown} onNotice={onNotice} />}

          {!presentationMode && viewedStep !== 1 && run.status === 'pending' && !isIdle && <EmptyState text={`Agent ${agent.id} 尚未执行。请完成前置确认后从底部控制栏继续。`} />}

          {!presentationMode && <CheckpointPanel
            blueprint={blueprint}
            checkpoint={visibleCheckpoint}
            onConfirm={onConfirmCheckpoint}
            onUpdateDecision={onUpdateDecision}
            onAssumptionDecision={onAssumptionDecision}
            onSaveFacts={onSaveFacts}
            onRegenerate={onRegenerateConcepts}
          />}
        </div>
      </div>
      {modalImage && <ImageModal src={modalImage.src} title={modalImage.title} onClose={() => setModalImage(null)} />}
    </div>
  );
}

function ProjectMaterialPreview({ project, blueprintVersion, className = '' }) {
  const assets = getProjectMaterialAssets(project, blueprintVersion);
  return (
    <Card title="项目资料预览" accent="var(--lf-cyan)" className={className}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-xs text-[var(--lf-muted)]">资料解析能力尚未接入，当前区域用于保持现状、区位和设计底图的稳定视觉槽位。</p>
        <Badge tone={assets.some((item) => item.isDemoAsset) ? 'amber' : 'purple'}>{assets.some((item) => item.isDemoAsset) ? '演示案例资料' : '等待项目资料'}</Badge>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {assets.map((asset) => <VisualAssetFrame key={asset.id} asset={asset} compact />)}
      </div>
    </Card>
  );
}

function ProjectDefinition({ blueprint, onOpenBlueprint }) {
  return <RoadshowBlueprintDraft blueprint={blueprint} onOpenBlueprint={onOpenBlueprint} />;
}

function Concepts({ blueprint, requirement, onRequirement, onRun, onRegenerate, onEnterComparison, onOpenBlueprint }) {
  const candidates = selectConceptCandidates(blueprint);
  if (!candidates.length) {
    const input = selectConceptGenerationInput(blueprint);
    const goals = selectProjectGoals(blueprint).map((item) => item.value).join('；');
    const constraints = selectCoreConstraints(blueprint).map((item) => item.value).join('；');
    const readItems = ['项目事实', '项目目标', '场地条件', '核心约束', '设计原则', '成功标准', '待补充事项'];
    return <div className="space-y-4">
      <div className="rounded-2xl border border-violet-200 bg-[var(--lf-brand-50)] p-5">
        <p className="text-xs font-bold tracking-[0.14em] text-[var(--lf-brand-600)]">AGENT 02 · CONCEPT GENERATION</p>
        <h2 className="mt-2 text-2xl font-bold text-[var(--lf-brand-950)]">概念方向生成</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--lf-muted)]">Agent 2 将基于已确认的项目设计蓝本 v2，生成三个策略本质不同的概念候选。</p>
        <div className="mt-4 flex flex-wrap gap-2">{readItems.map((item) => <span key={item} className="rounded-full border border-violet-100 bg-white px-3 py-1.5 text-xs font-semibold text-[var(--lf-brand-700)]">✓ {item}</span>)}</div>
      </div>
      <Card title="已确认的概念生成基线">
        <div className="grid gap-3 md:grid-cols-3">
          <div><p className="text-xs font-semibold text-[var(--lf-brand-700)]">项目目标</p><p className="mt-1 text-sm text-[var(--lf-muted)]">{goals || '待确认'}</p></div>
          <div><p className="text-xs font-semibold text-[var(--lf-brand-700)]">主要使用者</p><p className="mt-1 text-sm text-[var(--lf-muted)]">{input.stakeholders.map((item) => item.value).join('、') || '待确认'}</p></div>
          <div><p className="text-xs font-semibold text-[var(--lf-brand-700)]">核心约束</p><p className="mt-1 text-sm text-[var(--lf-muted)]">{constraints || '待确认'}</p></div>
        </div>
      </Card>
      <Card title="概念生成补充要求（可选）">
        <textarea value={requirement} onChange={(event) => onRequirement(event.target.value)} className="form-input min-h-[100px]" placeholder="例如：希望更突出林下活动，避免过度商业化表达。" />
        <div className="mt-3 flex justify-end"><button onClick={onRun} className="btn-primary px-6 py-3 text-sm">生成三个概念方向</button></div>
      </Card>
    </div>;
  }
  const conceptTone = { A: 'var(--lf-brand-700)', B: '#7c3aed', C: 'var(--lf-cyan)' };
  const stale = blueprint.agentRuns?.[2]?.status === 'stale';
  return <div className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-cyan-100 bg-cyan-50 p-4">
      <div><p className="text-base font-semibold text-cyan-900">已写入项目设计蓝本 v3｜三个概念候选</p><p className="mt-1 text-sm text-cyan-800">三个方向均为候选，尚未评分、推荐或形成最终方案。来源 Blueprint {blueprint.agentRuns?.[2]?.blueprintVersionRead || 'v2'} → v3。</p></div>
      <button type="button" onClick={onOpenBlueprint} className="btn-secondary px-4 py-2 text-xs">查看本次更新</button>
    </div>
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
      {candidates.map((concept) => {
        const code = concept.code || concept.id;
        return <motion.article key={concept.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="surface-card overflow-hidden p-0">
          <div className="h-1.5" style={{ background: conceptTone[code] }} />
          <VisualAssetFrame asset={getConceptVisual(concept, blueprint, stale ? '已失效' : undefined)} className="m-3 mb-0" compact />
          <div className="p-4">
            <div className="flex items-center justify-between"><span className="flex h-9 w-9 items-center justify-center rounded-xl font-bold text-white" style={{ background: conceptTone[code] }}>{code}</span><Badge tone="amber">候选 · 未比选</Badge></div>
            <h3 className="mt-3 text-lg font-serif font-bold text-[var(--lf-brand-950)]">{concept.name}</h3>
            <p className="mt-2 text-sm font-semibold leading-6 text-[var(--lf-brand-700)]">{concept.proposition}</p>
            <p className="mt-2 text-xs leading-5 text-slate-600">{concept.narrative}</p>
            <div className="mt-3 rounded-xl bg-[var(--lf-brand-50)] p-3"><p className="text-xs font-bold text-[var(--lf-brand-700)]">核心策略</p><p className="mt-1 text-xs leading-5 text-slate-700">{concept.strategicFocus}</p></div>
            <div className="mt-3"><p className="text-xs font-bold text-[var(--lf-muted)]">概念级空间组织假设</p><p className="mt-1 text-xs leading-5 text-slate-700">{concept.spatialHypothesis}</p></div>
            <div className="mt-3"><p className="text-xs font-bold text-[var(--lf-muted)]">关键场景</p><p className="mt-1 text-xs leading-5 text-slate-700">{concept.keyScenes.join(' · ')}</p></div>
            <div className="mt-3 grid grid-cols-1 gap-2">
              <p className="text-xs leading-5 text-emerald-700"><b>优势：</b>{concept.advantages.join('；')}</p>
              <p className="text-xs leading-5 text-rose-700"><b>风险：</b>{concept.risks.join('；')}</p>
              <p className="text-xs leading-5 text-violet-700"><b>适用：</b>{concept.applicableConditions.join('；')}</p>
            </div>
            <details className="mt-3 rounded-xl border border-violet-100 bg-white p-3">
              <summary className="cursor-pointer text-xs font-bold text-[var(--lf-brand-700)]">查看与项目设计蓝本的对应关系</summary>
              <div className="mt-3 space-y-2">{concept.responseMappings.map((mapping) => <p key={`${concept.id}-${mapping.sourceItemId}`} className="text-xs leading-5 text-slate-600"><b>{mapping.sourceLabel}</b>（{mapping.sourceStatus === 'assumption' ? '合理假设' : mapping.sourceStatus === 'pending' ? '待确认' : '已确认'}）：{mapping.response}</p>)}</div>
              {concept.dependencies.length > 0 && <div className="mt-3 border-t border-violet-100 pt-3"><p className="text-xs font-bold text-amber-700">待复核资料</p>{concept.dependencies.map((item) => <p key={item.id} className="mt-1 text-xs text-amber-700">· {item.value}</p>)}</div>}
            </details>
          </div>
        </motion.article>;
      })}
    </div>
    <Card title="方向差异摘要">
      <div className="grid gap-3 lg:grid-cols-3">{candidates.map((concept) => <div key={`summary-${concept.id}`} className="rounded-xl border border-violet-100 bg-white p-3"><p className="text-sm font-bold text-[var(--lf-brand-900)]">{concept.code}｜{concept.name}</p><div className="mt-2 space-y-1.5 text-xs leading-5 text-[var(--lf-muted)]"><p><b>核心问题：</b>{concept.proposition}</p><p><b>策略重点：</b>{concept.strategicFocus}</p><p><b>体验倾向：</b>{concept.experienceIntent}</p><p><b>实施倾向：</b>{concept.applicableConditions[0]}</p></div></div>)}</div>
    </Card>
    <Card title="补充生成条件与下一步">
      <textarea value={requirement} onChange={(event) => onRequirement(event.target.value)} className="form-input min-h-[74px]" placeholder="补充要求后将完整重新生成三个方向，不会静默追加。" />
      <div className="mt-3 flex justify-end gap-2"><button onClick={onRegenerate} className="btn-secondary px-4 py-2 text-xs">补充要求并重新生成</button><button onClick={onEnterComparison} className="btn-primary px-5 py-2 text-xs">进入方案比选</button></div>
    </Card>
  </div>;
}

function Comparison({ blueprint }) {
  if (!blueprint.comparison) return <EmptyState text="等待概念生成后运行方案选择 Agent。" />;
  const candidates = selectConceptCandidates(blueprint);
  const tone = { A: 'var(--lf-brand-700)', B: '#7c3aed', C: 'var(--lf-cyan)' };
  const conceptsStale = blueprint.agentRuns?.[2]?.status === 'stale';
  return <div className="space-y-4">
    <div className="grid grid-cols-3 gap-3">
      {candidates.map((concept) => <div key={concept.id} className={`surface-card border-t-4 p-3 ${blueprint.designerDecision.selectedConceptId === concept.id ? 'ring-2 ring-violet-200' : ''}`} style={{ borderTopColor: tone[concept.code || concept.id] }}><VisualAssetFrame asset={getConceptVisual(concept, blueprint, conceptsStale ? '已失效' : undefined)} compact /><div className="mt-3 flex items-center justify-between"><span className="text-xs font-bold" style={{ color: tone[concept.code || concept.id] }}>方案 {concept.code || concept.id}</span>{blueprint.agentRecommendation.conceptId === concept.id && <Badge tone="amber">推荐</Badge>}</div><p className="mt-2 text-base font-bold text-[var(--lf-brand-950)]">{concept.name}</p><p className="mt-1 line-clamp-2 text-xs text-[var(--lf-muted)]">{concept.proposition || concept.narrative}</p>{blueprint.designerDecision.selectedConceptId === concept.id && <p className="mt-3 text-xs font-semibold text-[var(--lf-success)]">✓ 设计师当前选择</p>}</div>)}
    </div>
    <div className="rounded-2xl border border-amber-200 bg-[var(--lf-gold-soft)] p-4"><div className="flex items-center gap-2"><Badge tone="amber">Agent 推荐意见</Badge><strong className="text-sm text-amber-950">{blueprint.agentRecommendation.conceptId}｜{blueprint.agentRecommendation.conceptName}</strong><span className="text-xs text-amber-700">{blueprint.agentRecommendation.score} 分</span></div><p className="text-xs text-amber-800 mt-2">{blueprint.agentRecommendation.reason}</p><p className="text-xs text-rose-600 mt-2">推荐仅供参考，必须由设计师最终选择。</p></div>
    <ComparisonTable comparison={blueprint.comparison} />
    {blueprint.designerDecision.selectedConceptId && <div className="rounded-xl bg-[var(--lf-brand-50)] border border-violet-200 p-4"><p className="text-sm font-semibold text-[var(--lf-brand-800)]">设计师当前选择：方案 {blueprint.designerDecision.selectedConceptId}</p><p className="text-xs text-[var(--lf-muted)] mt-1">融合要求：{blueprint.designerDecision.fusionRequirements || '无'}｜修改意见：{blueprint.designerDecision.modificationNotes || '无'}</p></div>}
  </div>;
}

function SpatialPlan({ blueprint, onOpenImage, onModifyUpstream, onUpdateDecision, onRun }) {
  const [revision, setRevision] = useState('');
  const [affected, setAffected] = useState(['功能分区', '动线系统']);
  if (!blueprint.spatialStructure) return <EmptyState text="等待设计师确认概念方向后运行空间推演 Agent。" />;
  const strategyLabels = { plant: '植物', material: '材料', ecology: '生态', grading: '竖向', drainage: '排水', operations: '运营与活动' };
  const stale = blueprint.agentRuns?.[4]?.status === 'stale';
  const planAsset = getPlanAsset(blueprint, stale ? '已失效' : undefined);
  const analysisAssets = blueprint.spatialStructure.analysisAssets || [
    { id: 'AN01', title: '功能分区图', assetType: '功能分区分析图', aspectRatio: '4:3', status: '待深化', sourceAgent: 'Agent 4｜空间推演', blueprintVersion: blueprint.currentVersion },
    { id: 'AN02', title: '动线组织图', assetType: '动线组织分析图', aspectRatio: '4:3', status: '待深化', sourceAgent: 'Agent 4｜空间推演', blueprintVersion: blueprint.currentVersion },
    { id: 'AN03', title: '生态与植物策略图', assetType: '生态/植物策略分析图', aspectRatio: '4:3', status: '待深化', sourceAgent: 'Agent 4｜空间推演', blueprintVersion: blueprint.currentVersion },
  ];
  return <div className="space-y-4">
    <div className="rounded-2xl border border-violet-200 bg-[var(--lf-brand-50)] p-4 flex items-start justify-between gap-4"><div><p className="text-sm font-semibold text-[var(--lf-brand-700)]">正在依据已确认的方案 {blueprint.designerDecision.selectedConceptId} 和 Blueprint v{blueprint.agentRuns?.[4]?.blueprintVersionRead || blueprint.currentVersion} 进行空间推演。</p><h3 className="text-lg font-bold text-[var(--lf-brand-950)] mt-2">{blueprint.coreNarrative?.title}</h3><p className="text-sm text-[var(--lf-brand-800)] mt-1">{blueprint.coreNarrative?.value}</p></div><button onClick={onModifyUpstream} className="shrink-0 text-xs px-3 py-2 rounded-lg bg-white border border-rose-200 text-rose-700">修改上游内容</button></div>
    <div className="grid grid-cols-12 gap-4 items-start">
      <div className="col-span-12 xl:col-span-6 space-y-3">
        <VisualAssetFrame asset={planAsset} aspectRatio="4:3" />
        <p className="text-sm leading-6 text-[var(--lf-muted)]">{blueprint.spatialStructure.value}</p>
      </div>
      <div className="col-span-12 xl:col-span-6 grid grid-cols-2 gap-3">
        <Card title="功能分区" className="col-span-2">{blueprint.functionalZones.map((zone) => <div key={zone.id} className="border-b border-[var(--lf-border)] py-2"><div className="flex justify-between gap-2"><p className="text-sm font-medium text-[var(--lf-text)]">{zone.name}</p><span className="text-xs text-[var(--lf-brand-600)]">{zone.area}</span></div><p className="text-xs text-[var(--lf-muted)] mt-1">{zone.function}</p></div>)}</Card>
        <Card title="动线策略" className="col-span-2"><p className="text-sm font-medium text-[var(--lf-text)]">{blueprint.circulationStrategy.title}</p><p className="text-xs text-[var(--lf-muted)] mt-1">{blueprint.circulationStrategy.value}</p></Card>
        {Object.keys(strategyLabels).map((key) => <div key={key} className="surface-card p-3"><p className="text-xs font-bold text-[var(--lf-brand-700)]">{strategyLabels[key]}策略</p><p className="text-xs leading-5 text-[var(--lf-muted)] mt-1">{blueprint.professionalStrategies[key]}</p></div>)}
      </div>
    </div>
    <Card title="特色节点"><div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{blueprint.featureNodes.map((item) => <div key={item.id} className="rounded-xl bg-[var(--lf-brand-50)] border border-violet-100 p-3"><p className="text-sm font-medium text-[var(--lf-brand-900)]">{item.name}</p><p className="text-xs text-[var(--lf-muted)] mt-1">{item.value}</p></div>)}</div></Card>
    <Card title="辅助分析图槽位" accent="var(--lf-cyan)"><div className="grid grid-cols-1 md:grid-cols-3 gap-3">{analysisAssets.map((asset) => <VisualAssetFrame key={asset.id} asset={{ ...asset, status: stale ? '已失效' : asset.status }} compact />)}</div></Card>
    <Card title="设计师统一修改与重新推演" accent="var(--lf-gold)">
      <textarea value={revision} onChange={(event) => setRevision(event.target.value)} className="form-input min-h-[86px]" placeholder="统一填写空间方案修改意见，不需要逐项编辑所有策略。" />
      <div className="mt-3 flex flex-wrap gap-2">{['空间结构', '功能分区', '动线系统', '节点体系', '植物策略', '材料策略', '生态策略', '竖向排水', '运营活动'].map((item) => <button key={item} onClick={() => setAffected((prev) => prev.includes(item) ? prev.filter((value) => value !== item) : [...prev, item])} className={`rounded-lg border px-3 py-1.5 text-xs ${affected.includes(item) ? 'border-violet-300 bg-violet-50 text-violet-700' : 'border-gray-200 bg-white text-gray-500'}`}>{affected.includes(item) ? '✓ ' : ''}{item}</button>)}</div>
      <div className="mt-3 flex justify-end"><button disabled={!revision.trim() || !affected.length} onClick={() => { onUpdateDecision({ modificationNotes: `${revision}｜受影响：${affected.join('、')}` }); setTimeout(onRun, 0); }} className="btn-secondary px-5 py-2 text-xs disabled:opacity-40">重新推演相关内容</button></div>
    </Card>
  </div>;
}

function VisualResults({ blueprint, workflowStep, onConfirmBrief, onGenerate, onOpenImage }) {
  if (!blueprint.visualTasks.length) return <EmptyState text="等待项目设计蓝本确认后运行视觉表达 Agent。" />;
  const stale = blueprint.agentRuns?.[5]?.status === 'stale';
  const labels = [
    ['01', '生成视觉任务书'],
    ['02', '设计师确认任务书'],
    ['03', '生成视觉成果'],
  ];
  return <div className="space-y-4">
    <div className="grid grid-cols-3 gap-2">{labels.map(([id, label], index) => <div key={id} className={`rounded-xl border p-3 ${workflowStep >= index + 1 ? 'border-violet-200 bg-violet-50' : 'border-gray-200 bg-white'}`}><p className="text-xs font-bold text-[var(--lf-brand-600)]">{id}</p><p className="mt-1 text-sm font-semibold text-[var(--lf-text)]">{label}</p></div>)}</div>
    <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-4"><p className="text-sm font-semibold text-cyan-900">当前任务：先确认画面任务书，再生成对应成果</p><p className="text-xs text-cyan-800 mt-1">所有演示图均保留 asset id、来源 Agent、Blueprint 版本和演示案例状态。</p></div>
    <Card title="第一步｜视觉任务书">
      <div className="space-y-3">{blueprint.visualTasks.map((task) => <div key={task.id} className="rounded-xl border border-violet-100 bg-[var(--lf-brand-50)] p-4"><div className="flex items-center justify-between"><p className="text-sm font-bold text-[var(--lf-brand-950)]">{task.id}｜{task.title}</p><Badge tone="blue">{task.angle}</Badge></div><div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 xl:grid-cols-5">{[['季节', task.season], ['时间', task.time], ['光线', task.light], ['人物', task.people], ['活动', task.activity], ['植物', task.plant], ['材质', task.material], ['氛围', task.atmosphere], ['必须表达', task.mustInclude], ['禁止出现', task.avoid]].map(([label, value]) => <div key={label}><p className="text-xs font-semibold text-[var(--lf-brand-600)]">{label}</p><p className="mt-0.5 text-xs leading-5 text-[var(--lf-muted)]">{value}</p></div>)}</div><p className="mt-3 rounded-lg bg-white p-2 text-xs leading-5 text-[var(--lf-muted)]">Prompt：{task.prompt}</p></div>)}</div>
      {workflowStep === 1 && <div className="mt-4 flex justify-end"><button onClick={onConfirmBrief} className="btn-primary px-6 py-3 text-sm">确认视觉任务书</button></div>}
    </Card>
    {workflowStep === 2 && <Card title="第二步｜任务书已确认" accent="var(--lf-gold)"><p className="text-sm text-[var(--lf-muted)]">可以统一修改或回到具体画面任务；本次路演按当前任务书生成演示案例视觉成果。</p><div className="mt-3 flex justify-end"><button onClick={onGenerate} className="btn-primary px-6 py-3 text-sm">生成视觉成果</button></div></Card>}
    {workflowStep >= 3 && <Card title="第三步｜任务书与视觉成果逐项对应" accent="var(--lf-gold)"><div className="space-y-4">{blueprint.visualAssets.map((asset) => {
      const task = blueprint.visualTasks.find((item) => item.id === asset.id);
      return <div key={asset.id} className="grid gap-4 rounded-xl border border-violet-100 bg-white p-3 xl:grid-cols-[minmax(0,1fr)_minmax(280px,1fr)]"><div><div className="flex items-center justify-between"><p className="text-sm font-bold text-[var(--lf-brand-900)]">{task?.id}｜{task?.title}</p><Badge tone="green">已采用</Badge></div><p className="mt-2 text-xs leading-5 text-[var(--lf-muted)]">{task?.prompt}</p><div className="mt-3 flex flex-wrap gap-2"><button className="btn-secondary px-3 py-1.5 text-xs">重新生成</button><button className="btn-gold px-3 py-1.5 text-xs">标记采用</button><button onClick={() => onOpenImage({ src: asset.url, title: asset.title })} className="btn-secondary px-3 py-1.5 text-xs">查看大图</button></div></div><VisualAssetFrame asset={{ ...asset, status: stale ? '已失效' : '演示案例' }} compact /></div>;
    })}</div></Card>}
  </div>;
}

function normalizeVisualAsset(asset, blueprint, invalid = false) {
  if (!asset) return {};
  return {
    ...asset,
    assetType: asset.assetType || (asset.angle === '正投影' ? '空间策略总平面' : asset.angle === '分析图' ? '策略分析图' : '景观效果图'),
    status: invalid ? '已失效' : [CONTENT_STATUS.PENDING, CONTENT_STATUS.AI_SUGGESTED].includes(asset.status) ? '演示案例' : asset.status || '演示案例',
    sourceAgent: asset.sourceAgent || 'Agent 5｜视觉表达',
    blueprintVersion: asset.blueprintVersion || asset._meta?.version || blueprint.currentVersion,
  };
}

function PptPlaceholder({ label, status = '待生成', blueprint, invalid = false }) {
  return <VisualAssetFrame asset={{ title: label, assetType: label, status: invalid ? '已失效' : status, aspectRatio: '16:9', sourceAgent: 'Agent 6｜成果输出', blueprintVersion: blueprint.currentVersion }} showMeta={false} allowZoom={false} className="h-full" visualClassName="h-full" placeholder={`${label}｜${invalid ? '已失效' : status}`} />;
}

function PptSlideVisual({ page, blueprint, invalid }) {
  const assets = Object.fromEntries((blueprint.visualAssets || []).map((asset) => [asset.id, normalizeVisualAsset(asset, blueprint, invalid)]));
  const concept = selectConceptCandidate(blueprint, blueprint.designerDecision.selectedConceptId);
  const concepts = selectConceptCandidates(blueprint);
  const plan = getPlanAsset(blueprint, invalid ? '已失效' : undefined);
  const frame = (asset, extra = {}) => <VisualAssetFrame asset={{ ...asset, ...extra, status: invalid ? '已失效' : extra.status || asset?.status }} showMeta={false} allowZoom={false} className="h-full" visualClassName="h-full" />;

  if (page.page === '01') return frame(assets.V01 || { url: './demo-images/aerial.jpg', title: '项目鸟瞰主视觉', assetType: '鸟瞰效果图', status: '演示案例' });
  if (page.page === '02') return <PptPlaceholder label="区位图" blueprint={blueprint} invalid={invalid} />;
  if (page.page === '03') return <div className="grid h-full grid-cols-2 gap-1.5"><PptPlaceholder label="场地现状照片" blueprint={blueprint} invalid={invalid} /><PptPlaceholder label="问题分析图" status="待深化" blueprint={blueprint} invalid={invalid} /></div>;
  if (page.page === '04') return <div className={`ppt-visual-placeholder flex h-full items-center justify-center rounded-lg p-2 ${invalid ? 'opacity-60' : ''}`}><div className="grid w-full grid-cols-3 gap-1.5">{['目标', '约束', '价值'].map((item, index) => <div key={item} className="rounded-md bg-white px-2 py-2 text-center shadow-sm"><span className="mx-auto flex h-6 w-6 items-center justify-center rounded-full bg-[var(--lf-brand-100)] text-[10px] font-bold text-[var(--lf-brand-700)]">{index + 1}</span><p className="mt-1 text-[10px] font-semibold text-[var(--lf-text)]">{item}信息图</p></div>)}</div></div>;
  if (page.page === '05') return concept ? frame(getConceptVisual(concept, blueprint, invalid ? '已失效' : undefined)) : <PptPlaceholder label="概念主视觉" blueprint={blueprint} invalid={invalid} />;
  if (page.page === '06') return <div className="grid h-full grid-cols-3 gap-1.5">{concepts.map((item) => <div key={item.id} className="relative overflow-hidden rounded-lg">{frame(getConceptVisual(item, blueprint, invalid ? '已失效' : undefined))}<span className="absolute bottom-1 left-1 rounded bg-white/90 px-1.5 py-0.5 text-[9px] font-bold text-[var(--lf-brand-700)]">方案 {item.id}</span></div>)}</div>;
  if (page.page === '07') return frame(plan, { aspectRatio: '16:9', objectFit: 'contain' });
  if (page.page === '08') return <div className="grid h-full grid-cols-2 gap-1.5"><PptPlaceholder label="功能分区分析图" status="待深化" blueprint={blueprint} invalid={invalid} /><PptPlaceholder label="动线组织图" status="待深化" blueprint={blueprint} invalid={invalid} /></div>;
  if (page.page === '09') return <div className="grid h-full grid-cols-3 gap-1.5">{frame(assets.V07 || { url: './demo-images/planting.jpg', title: '植物策略图', assetType: '植物策略分析图', status: '演示案例' })}<PptPlaceholder label="材料样板" status="待深化" blueprint={blueprint} invalid={invalid} /><PptPlaceholder label="生态策略剖面" blueprint={blueprint} invalid={invalid} /></div>;
  if (page.page === '10') return <div className="grid h-full grid-cols-2 gap-1.5">{frame(plan, { aspectRatio: '16:9', objectFit: 'contain' })}{frame(assets.V03 || { url: './demo-images/awn.jpg', title: '核心场景', assetType: '节点效果图', status: '演示案例' })}</div>;
  if (page.page === '11') return <div className="grid h-full grid-cols-4 gap-1">{(blueprint.visualAssets.length ? blueprint.visualAssets.slice(0, 4) : [
    { id: 'V01', url: './demo-images/aerial.jpg', title: '鸟瞰' },
    { id: 'V02', url: './demo-images/entrance.jpg', title: '入口' },
    { id: 'V03', url: './demo-images/awn.jpg', title: '核心' },
    { id: 'V04', url: './demo-images/children.jpg', title: '活动' },
  ]).map((asset) => <div key={asset.id} className="overflow-hidden rounded-md">{frame(normalizeVisualAsset({ ...asset, status: '演示案例' }, blueprint, invalid))}</div>)}</div>;
  return <div className={`ppt-visual-placeholder flex h-full items-center rounded-lg px-3 ${invalid ? 'opacity-60' : ''}`}><div className="w-full"><div className="flex items-center justify-between">{['生态价值', '社会价值', '实施价值', '文化价值'].map((item) => <div key={item} className="text-center"><span className="mx-auto block h-6 w-6 rounded-full border-2 border-violet-200 bg-white" /><p className="mt-1 text-[9px] text-[var(--lf-muted)]">{item}</p></div>)}</div><div className="relative mt-3 h-px bg-violet-200"><span className="absolute -top-1 left-[12%] h-2 w-2 rounded-full bg-[var(--lf-brand-500)]" /><span className="absolute -top-1 left-1/2 h-2 w-2 rounded-full bg-cyan-500" /><span className="absolute -top-1 right-[12%] h-2 w-2 rounded-full bg-[var(--lf-gold)]" /></div><p className="mt-2 text-center text-[9px] font-semibold text-[var(--lf-brand-700)]">下一步深化时间线</p></div></div>;
}

function Outputs({ blueprint, workflowStep, onAdvance, onExportJSON, onExportMarkdown, onNotice }) {
  const pptOutline = blueprint.pptOutline?.length ? blueprint.pptOutline : blueprint.pptStructure;
  if (!pptOutline?.length) return <EmptyState text="等待视觉表达完成后运行成果输出 Agent。" />;
  const selectedConcept = selectConceptCandidate(blueprint, blueprint.designerDecision?.selectedConceptId);
  const narrativeFocus = blueprint.coreNarrative?.value || selectedConcept?.proposition || selectedConcept?.narrative || '待设计师补充';
  const emphasis = selectedConcept
    ? `${selectedConcept.name}${selectedConcept.keyScenes?.length ? `：${selectedConcept.keyScenes.join('、')}` : ''}`
    : '待设计师补充';
  const hasInvalid = blueprint.invalidatedOutputs.length > 0;
  const pptInvalid = blueprint.agentRuns?.[6]?.status === 'stale';
  const artifactIcons = { json: 'BL', markdown: 'RP', visual: 'VI', ppt: 'PT' };
  const steps = ['完整方案文案', '设计师确认文案', 'PPT 结构与逐页文案', '完整 PPT 预览'];
  return <div className="space-y-5">
    <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">{steps.map((label, index) => <div key={label} className={`rounded-xl border p-3 ${workflowStep >= index + 1 ? 'border-violet-200 bg-violet-50' : 'border-gray-200 bg-white'}`}><p className="text-xs font-bold text-[var(--lf-brand-600)]">0{index + 1}</p><p className="mt-1 text-sm font-semibold text-[var(--lf-text)]">{label}</p></div>)}</div>
    {hasInvalid && <div className="rounded-xl border border-rose-200 bg-rose-50 p-4"><p className="text-sm font-semibold text-rose-800">导出前提示：存在 {blueprint.invalidatedOutputs.length} 项需要重新生成的成果</p><p className="text-xs text-rose-700 mt-1">旧成果仍可查看对比，但不属于当前方案；请重新运行受影响 Agent 后再完成最终确认。</p></div>}
    {blueprint.officialPackageStatus.includes('已完成') && <div className="rounded-2xl bg-[var(--lf-brand-900)] text-white p-5"><p className="text-xl font-serif font-bold">演示方案已完成｜正式成果可继续深化</p><p className="text-sm text-violet-100 mt-2">四个设计师确认节点已完成，所有成果来自当前项目设计蓝本。</p></div>}
    <Card title="步骤 1｜生成完整方案文案">
      <div className="grid gap-3 md:grid-cols-2">{blueprint.schemeNarrative?.sections?.map((section) => <div key={section.title} className="rounded-xl border border-violet-100 bg-[var(--lf-brand-50)] p-3"><p className="text-sm font-bold text-[var(--lf-brand-900)]">{section.title}</p><p className="mt-1 text-xs leading-5 text-[var(--lf-muted)]">{section.value}</p></div>)}</div>
      {workflowStep === 1 && <div className="mt-4 flex justify-end"><button onClick={onAdvance} className="btn-primary px-6 py-3 text-sm">进入文案确认</button></div>}
    </Card>
    {workflowStep >= 2 && <Card title="步骤 2｜设计师确认方案文案" accent="var(--lf-gold)"><div className="grid gap-3 md:grid-cols-2"><label className="text-xs text-[var(--lf-muted)]">叙事重点<textarea className="form-input mt-1 min-h-[72px]" defaultValue={blueprint.coreNarrative?.title || selectedConcept?.name || '待设计师补充'} /></label><label className="text-xs text-[var(--lf-muted)]">汇报口径与甲方表达<textarea className="form-input mt-1 min-h-[72px]" defaultValue={narrativeFocus} /></label><label className="text-xs text-[var(--lf-muted)]">页面篇幅<input className="form-input mt-1" defaultValue={`${pptOutline.length} 页，控制在 8–10 分钟汇报`} /></label><label className="text-xs text-[var(--lf-muted)]">强调内容<input className="form-input mt-1" defaultValue={emphasis} /></label></div>{workflowStep === 2 && <div className="mt-4 flex justify-end"><button onClick={onAdvance} className="btn-primary px-6 py-3 text-sm">确认文案并生成 PPT 结构</button></div>}</Card>}
    {workflowStep >= 3 && <Card title={`步骤 3｜PPT 结构与逐页文案 · ${pptOutline.length} 页`}><div className="space-y-2">{pptOutline.map((page) => <details key={page.id || page.page} className="rounded-xl border border-violet-100 bg-white p-3"><summary className="cursor-pointer text-sm font-bold text-[var(--lf-brand-900)]">{String(page.page).padStart(2, '0')}｜{page.title}</summary><div className="mt-3 grid gap-2 md:grid-cols-2"><p className="text-xs leading-5 text-[var(--lf-muted)]"><b>核心结论／上屏文案：</b>{page.upScreenCopy || page.content}</p><p className="text-xs leading-5 text-[var(--lf-muted)]"><b>建议视觉：</b>{page.suggestedVisual}</p><p className="text-xs leading-5 text-[var(--lf-muted)]"><b>数据来源：</b>{page.sourceFields?.join(' · ')}</p><p className="text-xs leading-5 text-[var(--lf-muted)]"><b>演讲提示：</b>{page.speechNotes}</p></div></details>)}</div>{workflowStep === 3 && <div className="mt-4 flex justify-end"><button onClick={onAdvance} className="btn-primary px-6 py-3 text-sm">生成并预览完整 PPT</button></div>}</Card>}
    {workflowStep >= 4 && <Card title={`步骤 4｜完整 PPT 预览 · ${pptOutline.length} 页`} accent="var(--lf-brand-600)">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">{pptOutline.map((page) => <div key={page.id || page.page} className="ppt-card aspect-video min-h-0 overflow-hidden rounded-xl p-3 flex flex-col"><div className="flex items-center justify-between"><div className="flex min-w-0 items-center gap-2"><span className="text-xl font-serif font-bold text-[var(--lf-brand-600)]">{String(page.page).padStart(2, '0')}</span><p className="truncate text-sm font-serif font-bold text-[var(--lf-brand-950)]">{page.title}</p></div><Badge tone={pptInvalid ? 'red' : 'purple'}>{pptInvalid ? '已失效' : 'PPT'}</Badge></div><div className="mt-2 min-h-0 flex-1"><PptSlideVisual page={page} blueprint={blueprint} invalid={pptInvalid} /></div><p className="mt-2 line-clamp-1 text-[10px] text-slate-600">{page.content}</p><p className="mt-1 truncate border-t border-violet-100 pt-1 text-[9px] text-[var(--lf-muted)]">数据源：{page.sourceFields?.join(' · ') || 'Blueprint'}</p></div>)}</div>
    </Card>}
    {workflowStep >= 4 && <div><div className="flex items-end justify-between mb-3"><div><p className="text-lg font-bold text-[var(--lf-brand-950)]">最终交付清单</p><p className="text-xs text-[var(--lf-muted)] mt-1">蓝本、完整文案、视觉成果、PPT、决策与版本记录统一来自当前版本。</p></div><Badge tone="blue">Blueprint v{blueprint.currentVersion}</Badge></div><div className="grid grid-cols-2 gap-3 xl:grid-cols-4">{blueprint.outputArtifacts.map((item) => <div key={item.id || item.type} className="surface-card min-h-[154px] p-4 flex flex-col"><div className="flex items-center justify-between"><span className="w-10 h-10 rounded-xl bg-[var(--lf-brand-100)] text-[var(--lf-brand-700)] flex items-center justify-center text-xs font-bold">{artifactIcons[item.action] || 'LF'}</span><Badge tone={item.action === 'visual' ? 'amber' : 'blue'}>{item.state}</Badge></div><p className="text-sm font-semibold text-[var(--lf-text)] mt-3">{item.type}</p>{item.action === 'json' && <button data-testid="export-json" onClick={onExportJSON} className="btn-secondary w-full mt-auto py-2 text-xs">导出设计蓝本 JSON</button>}{item.action === 'markdown' && <button data-testid="export-md" onClick={onExportMarkdown} className="btn-gold w-full mt-auto py-2 text-xs">导出方案报告 Markdown</button>}{item.action === 'visual' && <button onClick={() => onNotice('视觉成果集已在 Agent 5“视觉表达”中展示。')} className="btn-secondary w-full mt-auto py-2 text-xs">查看成果说明</button>}{item.action === 'ppt' && <button data-testid="prepare-ppt" onClick={() => onNotice('PPT内容与页面结构已准备完成，可在最终成果阶段生成可编辑文件。')} className="btn-primary w-full mt-auto py-2 text-xs">生成可编辑 PPT</button>}</div>)}</div></div>}
    {workflowStep >= 4 && <Card title="质量复核"><div className="space-y-2">{blueprint.qualityReview.map((item, index) => <div key={`${item.check}-${index}`} className="flex items-start justify-between gap-3 border-b border-[var(--lf-border)] pb-2"><div><p className="text-sm font-medium text-[var(--lf-text)]">{item.check}</p><p className="text-xs text-[var(--lf-muted)] mt-1">{item.result}</p></div><Badge tone={item.level === 'pass' ? 'green' : 'amber'}>{item.level === 'pass' ? '通过' : '待深化'}</Badge></div>)}</div></Card>}
  </div>;
}

function EmptyState({ text }) { return <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 min-h-[260px] flex items-center justify-center"><p className="text-sm text-gray-400">{text}</p></div>; }
