import { roadshowProject } from '../data/roadshowProject';

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
        {items.map((item) => <li key={item}><i>✓</i><p>{item}</p></li>)}
      </ul>
    </section>
  );
}

export function RoadshowBlueprintDraft({ blueprint }) {
  const design = roadshowProject.designBlueprint;
  const basic = blueprint.projectBasicInfo || {};
  const facts = blueprint.confirmedFacts || [];
  return (
    <div className="roadshow-draft-page">
      <div className="roadshow-draft-heading">
        <div>
          <p className="text-xs font-bold tracking-[0.16em] text-[var(--lf-brand-600)]">LANDSCAPE DESIGN BRIEF</p>
          <h2>项目设计蓝本草案</h2>
          <p>设计总监智能体已将项目资料归纳为目标、约束与可执行策略。</p>
        </div>
        <span>Blueprint v{blueprint.currentVersion}</span>
      </div>

      <div className="roadshow-draft-grid">
        <BlueprintList number="01" title="项目目标" tone="violet" items={design.goals} />
        <BlueprintList
          number="02"
          title="核心约束"
          tone="gold"
          items={[
            '保留主要活动功能',
            '减少高维护水景和大面积石材铺装',
            '满足安全、无障碍和生态设计要求',
          ]}
        />
        <BlueprintList
          number="03"
          title="推荐设计策略"
          tone="cyan"
          items={[
            '以低维护植物形成空间主体',
            '减少大面积硬质铺装',
            '优先采用生态、再生或在地材料',
            '保留核心活动空间与景观识别性',
          ]}
        />
      </div>

      <details className="roadshow-draft-evidence">
        <summary>查看整理依据与待补充信息 <span>展开</span></summary>
        <div className="grid gap-5 pt-5 md:grid-cols-2 xl:grid-cols-3">
          <div>
            <h4>项目基本事实</h4>
            <p>{basic.projectName || '待补充'} · {basic.projectType || '待补充'}</p>
            <p>{basic.city || '待补充'} · {basic.area ? `${basic.area}㎡` : '面积待补充'}</p>
          </div>
          <div>
            <h4>资料来源</h4>
            {(blueprint.informationSources || []).slice(0, 4).map((item) => <p key={item.id}>{item.name}</p>)}
          </div>
          <div>
            <h4>资料缺口</h4>
            {(blueprint.unconfirmedInfo || []).slice(0, 4).map((item) => <p key={item.id}>{item.label || item.value}</p>)}
          </div>
          <div>
            <h4>系统合理假设</h4>
            {(blueprint.systemAssumptions || []).slice(0, 4).map((item) => <p key={item.id}>{item.title || item.value}</p>)}
          </div>
          <div>
            <h4>未确认信息</h4>
            {facts.filter((item) => item.status !== '已确认').slice(0, 4).map((item) => <p key={item.id}>{item.label}：{item.value}</p>)}
            {!facts.length && <p>等待项目资料整理</p>}
          </div>
        </div>
      </details>

      <p className="roadshow-confirm-hint">确认后，六个专业 Agent 将围绕同一份项目设计蓝本连续工作。</p>
    </div>
  );
}

export function RoadshowAgentTrack({ states }) {
  const completed = states.filter((status) => status === '已完成').length;
  const running = states.some((status) => status === '执行中');
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
        {roadshowProject.agentExecution.map((agent, index) => {
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
