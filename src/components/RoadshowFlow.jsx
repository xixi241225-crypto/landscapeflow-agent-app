import {
  BLUEPRINT_STATUS_LABELS,
  selectCoreConstraints,
  selectDesignPrinciples,
  selectProjectDefinitionDetails,
  selectProjectGoals,
  selectRoadshowAgentSummaries,
} from '../blueprint/blueprintSelectors';

const GLOBAL_STAGES = ['项目资料', '设计蓝本', 'Agent 协作', '完整成果'];

export function RoadshowStageRail({ stage }) {
  return (
    <div className="roadshow-global-stage-rail" aria-label="路演全局阶段">
      {GLOBAL_STAGES.map((label, index) => (
        <div key={label} className={`roadshow-global-stage ${index === stage ? 'active' : ''} ${index < stage ? 'done' : ''}`}>
          <span>{index < stage ? '✓' : `0${index + 1}`}</span>
          <p>{label}</p>
        </div>
      ))}
    </div>
  );
}

function BlueprintList({ number, title, items, tone }) {
  return (
    <section className={`roadshow-draft-card ${tone}`}>
      <div className="flex items-center gap-3">
        <span>{number}</span>
        <h3>{title}</h3>
      </div>
      <ul>
        {items.map((item, index) => (
          <li key={item.id || `${title}-${index}`}>
            <i>✓</i>
            <p>{item.value || item.label || item}</p>
            {item.status === 'assumption' && <small className="ml-auto shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">合理假设</small>}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function RoadshowBlueprintDraft({ blueprint, onOpenBlueprint }) {
  const basic = blueprint.projectBasicInfo || {};
  const details = selectProjectDefinitionDetails(blueprint);
  const goals = selectProjectGoals(blueprint);
  const constraints = selectCoreConstraints(blueprint);
  const principles = selectDesignPrinciples(blueprint);
  return (
    <div className="roadshow-draft-page">
      <div className="roadshow-draft-heading">
        <div>
          <p className="text-xs font-bold tracking-[0.16em] text-[var(--lf-brand-600)]">LANDSCAPE DESIGN BRIEF</p>
          <h2>项目设计蓝本草案</h2>
          <p>Agent 1 已将项目资料整理为统一的项目定义基线，请确认后启动后续设计。</p>
        </div>
        <span>Blueprint {blueprint.milestoneVersion || 'v1'} · r{blueprint.revision ?? blueprint.currentVersion}</span>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-cyan-200 bg-cyan-50 px-5 py-4">
        <div>
          <p className="text-sm font-bold text-cyan-900">已写入项目设计蓝本 {blueprint.milestoneVersion || 'v1'}</p>
          <p className="mt-1 text-xs text-cyan-800">本次新增：项目事实、项目目标、核心约束、设计原则、待补充事项。</p>
        </div>
        <button type="button" onClick={onOpenBlueprint} className="btn-secondary px-4 py-2 text-sm">查看本次更新</button>
      </div>

      <div className="roadshow-draft-grid">
        <BlueprintList number="01" title="项目目标" tone="violet" items={goals} />
        <BlueprintList number="02" title="核心约束" tone="gold" items={constraints} />
        <BlueprintList number="03" title="设计原则" tone="cyan" items={principles} />
      </div>

      <details className="roadshow-draft-evidence">
        <summary>查看整理依据与待补充信息 <span>展开</span></summary>
        <div className="grid gap-5 pt-5 md:grid-cols-2 xl:grid-cols-3">
          <div>
            <h4>项目基本事实</h4>
            {details.facts.map((item) => <p key={item.id}>{item.label}：{item.value} <small>（{BLUEPRINT_STATUS_LABELS[item.status] || item.status}）</small></p>)}
          </div>
          <div>
            <h4>业主与使用者</h4>
            {details.stakeholders.map((item) => <p key={item.id}>{item.value}</p>)}
          </div>
          <div>
            <h4>场地条件</h4>
            {details.siteConditions.slice(0, 6).map((item) => <p key={item.id}>{item.value}</p>)}
          </div>
          <div>
            <h4>资料来源</h4>
            {details.sourceDocuments.map((item) => <p key={item.id}>{item.fileName} · {item.status}</p>)}
          </div>
          <div>
            <h4>成功标准</h4>
            {details.successCriteria.map((item) => <p key={item.id}>{item.value}</p>)}
          </div>
          <div>
            <h4>合理假设</h4>
            {details.latentGoals.filter((item) => item.status === 'assumption').map((item) => <p key={item.id}>{item.value}</p>)}
          </div>
          <div>
            <h4>待补充信息</h4>
            {details.openItems.map((item) => <p key={item.id}>{item.label}：{item.value}</p>)}
          </div>
          <div>
            <h4>冲突信息</h4>
            {details.conflicts.length ? details.conflicts.map((item) => <p key={item.id}>{item.value}</p>) : <p>当前未识别到信息冲突</p>}
          </div>
        </div>
      </details>

      <p className="roadshow-confirm-hint">确认后，六个专业 Agent 将围绕同一份项目设计蓝本连续工作。</p>
    </div>
  );
}

export function RoadshowAgentTrack({ states, blueprint }) {
  const completed = states.filter((status) => status === '已完成').length;
  const running = states.some((status) => status === '执行中');
  const agents = selectRoadshowAgentSummaries(blueprint);
  return (
    <div className="roadshow-track-page">
      <div className="text-center">
        <p className="text-xs font-bold tracking-[0.16em] text-[var(--lf-brand-600)]">ONE BLUEPRINT · SIX AGENTS</p>
        <h2>六个专业 Agent 正在协同完成方案</h2>
        <p>所有 Agent 均读取同一份项目设计蓝本，无需重复输入项目要求。</p>
      </div>
      <div className="roadshow-track-progress">
        <span style={{ width: `${completed / 6 * 100}%` }} />
      </div>
      <div className="roadshow-track-list">
        {agents.map((agent, index) => {
          const status = states[index] || '等待';
          return (
            <article key={agent.id} className={`roadshow-track-row ${status === '执行中' ? 'working' : ''} ${status === '已完成' ? 'done' : ''}`}>
              <span className="roadshow-track-number">0{agent.id}</span>
              <div className="min-w-0 flex-1">
                <h3>{agent.name}</h3>
                <p>{agent.result}</p>
              </div>
              <span className="roadshow-track-status">
                {status === '已完成' ? '✓' : status === '执行中' ? '●' : '○'} {status}
              </span>
            </article>
          );
        })}
      </div>
      <p className={`roadshow-track-caption ${completed === 6 ? 'complete' : ''}`}>
        {completed === 6 ? '六个专业 Agent 已完成协作，完整成果已解锁。' : running ? '正在生成完整方案……' : '等待设计师确认设计方向。'}
      </p>
    </div>
  );
}
