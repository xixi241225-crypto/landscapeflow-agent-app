import VisualAssetFrame from './VisualAssetFrame';
import { CONTENT_STATUS, getBlueprintStatusCounts } from '../blueprint/blueprintModel';
import { roadshowProject } from '../data/roadshowProject';

const conceptFallbacks = { A: './demo-images/aerial.jpg', B: './demo-images/awn.jpg', C: './demo-images/elderly.jpg' };

function Pill({ children, tone = 'violet' }) {
  const tones = {
    violet: 'bg-violet-50 text-violet-700',
    cyan: 'bg-cyan-50 text-cyan-700',
    green: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-800',
    red: 'bg-rose-50 text-rose-700',
  };
  return <span className={`rounded-full px-2 py-1 text-xs font-semibold ${tones[tone]}`}>{children}</span>;
}

function MiniList({ items, empty = '等待本阶段写入' }) {
  if (!items?.length) return <p className="text-xs text-slate-400">{empty}</p>;
  return (
    <div className="space-y-2">
      {items.slice(0, 5).map((item, index) => (
        <div key={item.id || item.title || item.name || index} className="border-l-2 border-violet-100 pl-2">
          <p className="text-xs font-semibold text-[var(--lf-text)]">{item.label || item.title || item.name || `条目 ${index + 1}`}</p>
          <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-[var(--lf-muted)]">{item.value || item.function || item.concept || item.prompt}</p>
        </div>
      ))}
    </div>
  );
}

function BlueprintSection({ number, title, status, children, open = false }) {
  const tone = status === '已确认' ? 'green' : status === '已失效' ? 'red' : status === '待确认' ? 'amber' : 'violet';
  return (
    <details className="blueprint-stage-section border-b border-violet-100 py-3" open={open}>
      <summary className="flex cursor-pointer list-none items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--lf-brand-100)] text-xs font-bold text-[var(--lf-brand-700)]">{number}</span>
        <span className="min-w-0 flex-1 text-sm font-bold text-[var(--lf-brand-950)]">{title}</span>
        <Pill tone={tone}>{status}</Pill>
      </summary>
      <div className="pt-3">{children}</div>
    </details>
  );
}

function runStatus(blueprint, id) {
  const run = blueprint.agentRuns?.[id];
  if (run?.status === 'stale') return '已失效';
  if (id === 2 && blueprint.checkpoints?.find((item) => item.id === 'checkpoint-2')?.status !== '已确认') return run?.status === 'done' ? '待确认' : '待写入';
  if (run?.status === 'done') {
    const checkpoint = blueprint.checkpoints?.find((item) => item.afterAgent === id);
    return checkpoint && checkpoint.status !== '已确认' ? '待确认' : '已确认';
  }
  return '待写入';
}

export default function BlueprintPanel({ blueprint, versions, viewedStep, onOpenVersions, onInitiateModification, presentationMode = false, presentationStage = 0, presentationAgentStates = [] }) {
  const counts = getBlueprintStatusCounts(blueprint);
  const completed = Object.values(blueprint.agentRuns || {}).filter((item) => item.status === 'done').length;
  const concept = blueprint.conceptCandidates?.find((item) => item.id === blueprint.designerDecision?.selectedConceptId);
  const plan = blueprint.spatialStructure?.planAsset || (blueprint.spatialStructure?.planImage ? {
    id: 'SP01', title: '当前空间总平面', assetType: '总平面图', url: blueprint.spatialStructure.planImage,
    aspectRatio: '4:3', objectFit: 'contain', status: '演示案例', sourceAgent: 'Agent 4｜空间推演',
    blueprintVersion: blueprint.spatialStructure?._meta?.version || blueprint.currentVersion,
  } : null);
  const latest = blueprint.changeLog?.[0];

  if (presentationMode) {
    const design = roadshowProject.designBlueprint;
    const presentationCompleted = presentationStage === 0
      ? 15
      : presentationStage === 1
        ? 35
        : presentationStage === 2
          ? 35 + Math.round((presentationAgentStates.filter((status) => status === '已完成').length / 6) * 55)
          : 100;
    return (
      <aside className="blueprint-panel blueprint-surface flex h-full min-h-0 flex-col border-l border-violet-100">
        <div className="border-b border-violet-100 bg-white/90 p-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-base font-bold text-[var(--lf-brand-950)]">项目设计蓝本</p>
              <p className="mt-0.5 text-xs text-[var(--lf-muted)]">六 Agent 的共同设计依据</p>
            </div>
            <Pill tone="cyan">v{blueprint.currentVersion}</Pill>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs font-semibold">
            <span className="text-[var(--lf-muted)]">当前完成度</span>
            <span className="text-[var(--lf-brand-700)]">{presentationCompleted}%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-violet-100">
            <div className="h-full rounded-full bg-gradient-to-r from-[var(--lf-brand-600)] to-cyan-500 transition-all" style={{ width: `${presentationCompleted}%` }} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {[
            ['项目目标', design.goals],
            ['核心约束', ['保留主要活动功能', '减少高维护水景和大面积石材铺装', '满足安全、无障碍和生态设计要求']],
            ['设计策略', ['低维护植物形成空间主体', '减少大面积硬质铺装', '采用生态、再生或在地材料', '保留活动空间与景观识别性']],
          ].map(([title, items], index) => (
            <section key={title} className="mb-3 rounded-xl border border-violet-100 bg-white p-3">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[var(--lf-brand-100)] text-[10px] font-bold text-[var(--lf-brand-700)]">0{index + 1}</span>
                <h3 className="text-sm font-bold text-[var(--lf-brand-950)]">{title}</h3>
              </div>
              <div className="mt-3 space-y-2">
                {items.map((item) => <p key={item} className="text-xs leading-5 text-[var(--lf-muted)]">· {item}</p>)}
              </div>
            </section>
          ))}
          <details className="rounded-xl border border-violet-100 bg-violet-50/50 p-3">
            <summary className="cursor-pointer text-xs font-semibold text-[var(--lf-brand-700)]">查看完整蓝本状态</summary>
            <p className="mt-3 text-xs leading-5 text-[var(--lf-muted)]">{completed}/6 Agent 已写入 · {versions.length} 个版本记录 · {blueprint.invalidatedOutputs.length} 项需更新</p>
          </details>
        </div>

        <div className="grid grid-cols-2 gap-2 border-t border-violet-100 bg-white p-3">
          <button onClick={onOpenVersions} className="btn-secondary px-3 py-2 text-xs">版本记录（{versions.length}）</button>
          <button onClick={onInitiateModification} className="btn-gold px-3 py-2 text-xs">补充资料</button>
        </div>
      </aside>
    );
  }

  return (
    <aside className="blueprint-panel blueprint-surface flex h-full min-h-0 flex-col border-l border-violet-100">
      <div className="border-b border-violet-100 bg-white/90 p-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-base font-bold text-[var(--lf-brand-950)]">项目设计蓝本</p>
            <p className="mt-0.5 text-xs text-[var(--lf-muted)]">项目唯一设计依据</p>
          </div>
          <Pill tone="cyan">v{blueprint.currentVersion}</Pill>
        </div>
        <p className="mt-3 text-xs text-[var(--lf-muted)]">最后更新：{new Date(blueprint.updatedAt).toLocaleString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-violet-100">
          <div className="h-full bg-gradient-to-r from-[var(--lf-brand-600)] to-cyan-500" style={{ width: `${completed / 6 * 100}%` }} />
        </div>
        <div className="mt-2 flex items-center justify-between text-xs">
          <span className="font-semibold text-[var(--lf-brand-700)]">{completed}/6 阶段完成</span>
          <span className="text-[var(--lf-muted)]">{Math.round(completed / 6 * 100)}%</span>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="rounded-lg bg-emerald-50 p-2 text-center"><b className="block text-sm text-emerald-700">{counts[CONTENT_STATUS.CONFIRMED]}</b><span className="text-xs text-emerald-700">已确认</span></div>
          <div className="rounded-lg bg-amber-50 p-2 text-center"><b className="block text-sm text-amber-800">{counts[CONTENT_STATUS.PENDING]}</b><span className="text-xs text-amber-800">待确认</span></div>
          <div className="rounded-lg bg-rose-50 p-2 text-center"><b className="block text-sm text-rose-700">{blueprint.invalidatedOutputs.length}</b><span className="text-xs text-rose-700">已失效</span></div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4">
        {latest && (
          <div className="my-3 rounded-xl border border-cyan-100 bg-cyan-50 p-3">
            <p className="text-xs font-bold text-cyan-800">当前阶段新增</p>
            <p className="mt-1 text-xs leading-5 text-cyan-800">{latest.sourceAgent} 写入 {latest.fields.join('、')}</p>
          </div>
        )}

        <BlueprintSection number="01" title="项目定义" status={runStatus(blueprint, 1)} open={viewedStep === 0}>
          <MiniList items={blueprint.confirmedFacts} />
          {blueprint.unconfirmedInfo?.length > 0 && <p className="mt-2 text-xs font-semibold text-amber-700">资料缺口 {blueprint.unconfirmedInfo.length} 项</p>}
        </BlueprintSection>

        <BlueprintSection number="02" title="候选概念" status={runStatus(blueprint, 2)} open={viewedStep === 1}>
          <MiniList items={blueprint.conceptCandidates} />
          {blueprint.conceptCandidates?.length > 0 && <p className="mt-2 text-xs text-amber-700">候选，尚未确认；最终判断在 Agent 3 完成。</p>}
        </BlueprintSection>

        <BlueprintSection number="03" title="方案决策" status={runStatus(blueprint, 3)} open={viewedStep === 2}>
          {concept ? (
            <div>
              <VisualAssetFrame compact asset={{ ...concept.visual, url: concept.visual?.url || conceptFallbacks[concept.id], title: `${concept.id}｜${concept.name}`, assetType: '最终概念方向', status: blueprint.agentRuns?.[3]?.status === 'stale' ? '已失效' : '演示案例' }} />
              <p className="mt-2 text-xs font-bold text-[var(--lf-brand-900)]">设计师选择：方案 {concept.id}</p>
              <p className="mt-1 text-xs text-[var(--lf-muted)]">AI 推荐：方案 {blueprint.agentRecommendation?.conceptId || '—'}</p>
              <p className="mt-1 text-xs text-[var(--lf-gold)]">融合：{blueprint.designerDecision.fusionRequirements || '无'}</p>
            </div>
          ) : <p className="text-xs text-slate-400">等待设计师最终选择</p>}
        </BlueprintSection>

        <BlueprintSection number="04" title="空间与专业策略" status={runStatus(blueprint, 4)} open={viewedStep === 3}>
          {plan && <VisualAssetFrame compact asset={{ ...plan, status: blueprint.agentRuns?.[4]?.status === 'stale' ? '已失效' : plan.status }} />}
          <div className="mt-2"><MiniList items={blueprint.functionalZones} /></div>
        </BlueprintSection>

        <BlueprintSection number="05" title="视觉任务与成果" status={runStatus(blueprint, 5)} open={viewedStep === 4}>
          <p className="text-xs text-[var(--lf-muted)]">{blueprint.visualTasks.length} 项任务书 · {blueprint.visualAssets.length} 项视觉资产</p>
          <MiniList items={blueprint.visualTasks} />
        </BlueprintSection>

        <BlueprintSection number="06" title="方案文案与 PPT" status={runStatus(blueprint, 6)} open={viewedStep === 5}>
          <p className="text-xs text-[var(--lf-muted)]">{blueprint.schemeNarrative?.sections?.length || 0} 个文案章节 · {blueprint.pptOutline?.length || 0} 页 PPT</p>
          <MiniList items={blueprint.pptOutline} />
        </BlueprintSection>

        {blueprint.invalidatedOutputs.length > 0 && (
          <div className="my-3 rounded-xl border border-rose-200 bg-rose-50 p-3">
            <p className="text-xs font-bold text-rose-800">影响范围</p>
            {blueprint.invalidatedOutputs.map((item) => <p key={item.id} className="mt-1 text-xs text-rose-700">Agent {item.targetAgent} {item.targetName}：需要重新生成</p>)}
            {blueprint.agentRuns?.[5]?.status === 'stale' && <p className="mt-1 text-xs text-rose-700">已采用视觉成果已失效</p>}
            {blueprint.agentRuns?.[6]?.status === 'stale' && <p className="mt-1 text-xs text-rose-700">PPT 第 3、5、8 页等关联页面需要更新</p>}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 border-t border-violet-100 bg-white p-3">
        <button onClick={onOpenVersions} className="btn-secondary px-3 py-2 text-xs">版本记录（{versions.length}）</button>
        <button onClick={onInitiateModification} className="btn-gold px-3 py-2 text-xs">发起修改</button>
      </div>
    </aside>
  );
}
