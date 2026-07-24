import { AGENTS } from '../blueprint/blueprintModel';
import { selectConceptCandidate } from '../blueprint/blueprintSelectors';

const descriptions = [
  '事实、来源、缺口与核心问题',
  '三个真实差异化概念方向',
  '动态比选与设计师最终选择',
  '基于人工选择落实空间方案',
  '视觉任务与演示案例成果',
  '报告、12页 PPT 与质量复核',
];

export default function AgentSidebar({ blueprint, viewedStep, currentStep, onStepClick }) {
  const completedCount = Object.values(blueprint.agentRuns || {}).filter((item) => item.status === 'done').length;
  const concept = selectConceptCandidate(blueprint, blueprint.designerDecision?.selectedConceptId);
  return (
    <div className="h-full flex flex-col bg-[#F7F8FF]">
      <div className="px-5 py-4 border-b border-[var(--lf-border)] bg-white">
        <p className="text-xs font-bold tracking-[0.12em] text-[var(--lf-brand-700)]">1 名设计总监 · 6 个专业 Agent</p>
        <p className="text-xs text-[var(--lf-muted)] mt-1">共同读取并回写 1 份项目设计蓝本</p>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {AGENTS.map((agent, index) => {
          const run = blueprint.agentRuns?.[agent.id] || {};
          const isViewed = viewedStep === index;
          const isRunning = currentStep === index && run.status === 'working';
          const checkpoint = blueprint.checkpoints.find((item) => item.afterAgent === agent.id);
          const stale = run.status === 'stale';
          const statusLabel = stale
            ? '需要重新生成'
            : isRunning
              ? '进行中'
              : checkpoint && ['待确认', '需重新确认'].includes(checkpoint.status)
                ? '待设计师确认'
                : run.status === 'done'
                  ? '已完成'
                  : index === 0 || blueprint.agentRuns?.[index]?.status === 'done'
                    ? '未开始'
                    : '未解锁';
          return (
            <button key={agent.id} onClick={() => onStepClick(index)} className={`agent-nav-button mb-1 w-full rounded-xl px-2 pt-2 flex gap-3 text-left group ${isViewed ? 'active' : ''}`}>
              <div className="flex flex-col items-center w-7 shrink-0">
                {index > 0 && <div className={`w-px h-3 ${run.status === 'done' ? 'bg-emerald-500' : 'bg-[var(--lf-border)]'}`} />}
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all" style={{ background: run.status === 'done' ? 'var(--lf-success)' : isRunning ? 'var(--lf-cyan-soft)' : stale ? 'var(--lf-danger-soft)' : isViewed ? 'var(--lf-brand-100)' : '#EEF0F7', color: run.status === 'done' ? '#FFF' : isRunning ? 'var(--lf-cyan)' : stale ? 'var(--lf-danger)' : isViewed ? 'var(--lf-brand-700)' : 'var(--lf-muted)', border: isViewed && run.status !== 'done' ? '1px solid rgba(81,71,217,.28)' : '1px solid transparent' }}>
                  {isRunning ? '↻' : run.status === 'done' ? '✓' : stale ? '!' : String(agent.id).padStart(2, '0')}
                </div>
                {index < AGENTS.length - 1 && <div className={`w-px flex-1 min-h-8 ${run.status === 'done' ? 'bg-emerald-500' : 'bg-[var(--lf-border)]'}`} />}
              </div>
              <div className="flex-1 pb-4 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className={`text-sm font-semibold ${isViewed ? 'text-[var(--lf-brand-900)]' : run.status === 'done' ? 'text-[var(--lf-success)]' : 'text-slate-600'}`}>{agent.id}. {agent.name}</p>
                  <span className={`rounded px-1.5 py-0.5 text-xs ${stale ? 'bg-rose-50 text-rose-700' : isRunning ? 'bg-cyan-50 text-cyan-700' : statusLabel === '待设计师确认' ? 'bg-amber-50 text-amber-800' : run.status === 'done' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{statusLabel}</span>
                </div>
                <p className="text-xs text-[var(--lf-muted)] mt-1 leading-relaxed">{descriptions[index]}</p>
                {checkpoint && <p className={`text-xs mt-1.5 font-medium ${checkpoint.status === '已确认' ? 'text-[var(--lf-success)]' : checkpoint.status === '未到达' ? 'text-slate-400' : 'text-[var(--lf-gold)]'}`}>◆ {checkpoint.name} · {checkpoint.status}</p>}
              </div>
            </button>
          );
        })}
      </div>
      <div className="p-4 border-t border-[var(--lf-border)] bg-white">
        <div className="blueprint-surface rounded-xl border p-3.5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold tracking-widest text-[var(--lf-brand-600)]">当前项目</p>
            <span className="rounded-full bg-cyan-50 px-2 py-1 text-xs font-bold text-cyan-700">{blueprint.milestoneVersion || 'v0'} · r{blueprint.revision ?? blueprint.currentVersion}</span>
          </div>
          <p className="text-sm font-semibold text-[var(--lf-text)] mt-2 truncate">{blueprint.projectBasicInfo.projectName || '未命名项目'}</p>
          <p className="text-xs text-[var(--lf-muted)] mt-1 truncate">{blueprint.projectBasicInfo.city || '地点待填写'} · {blueprint.projectBasicInfo.area || '面积待填写'}</p>
          <p className="text-xs text-[var(--lf-gold)] mt-1.5 truncate">{concept ? `${concept.code || concept.id}｜${concept.name}` : '概念方向待设计师确认'}</p>
          <div className="h-2 rounded-full bg-white mt-3 overflow-hidden"><div className="h-full bg-[var(--lf-success)] transition-all" style={{ width: `${completedCount / 6 * 100}%` }} /></div>
          <p className="text-xs font-medium text-[var(--lf-success)] mt-2">{completedCount} / 6 Agent 已完成</p>
        </div>
      </div>
    </div>
  );
}
