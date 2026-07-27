import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import CheckpointPanel from './CheckpointPanel';
import ComparisonTable from './ComparisonTable';
import PresentationDeliverable from './PresentationDeliverable';
import VisualAssetFrame from './VisualAssetFrame';
import { getDemoAssetBinding } from '../data/demoAssetBindings';
import {
  selectConceptCandidates,
  selectSelectedVisuals,
  selectVisualCandidates,
} from '../blueprint/blueprintSelectors';

const CONCEPT_LABELS = {
  A: '方案 1',
  B: '方案 2',
  C: '方案 3',
};

const PRESENTATION_OUTLINE = [
  ['01', '封面', '建立项目与方案的第一识别。'],
  ['02', '项目概况与场地认知', '明确项目边界与当前资料可信度。'],
  ['03', '设计命题', '把项目目标转译为可执行的设计问题。'],
  ['04', '设计概念', '以“社区共享环”统领空间与体验。'],
  ['05', '一心一环多点', '形成中心共享、环形串联与节点支撑的空间骨架。'],
  ['06', '尺度与功能校核', '在概念阶段校核空间关系与功能适配。'],
  ['07', '空间体验', '通过连续慢行串联不同强度的公共体验。'],
  ['08', '全龄功能', '让不同活动在共享结构中有分有合。'],
  ['09', '中央共享草坪', '以弹性共享空间承载日常与社区活动。'],
  ['10', '儿童活动空间', '采用已确认的浅层、安全、可视、可控亲水方向。'],
  ['11', '老人康体', '形成舒适可达、便于停留的康体空间。'],
  ['12', '植物空间策略', '以空间骨架、季相连续与后期维护组织植物设计。'],
  ['13', '夜间氛围', '以安全、克制的照明支持夜间使用。'],
  ['14', '方案总结', '汇总当前成果并保留后续深化边界。'],
];

const DEFAULT_VISUAL_SCENES = [
  ['overall', '总体鸟瞰', './demo-images/aerial.jpg'],
  ['lawn', '中央共享草坪', './demo-images/awn.jpg'],
  ['children', '儿童活动空间', './demo-images/children.jpg'],
  ['elderly', '老人康体空间', './demo-images/elderly.jpg'],
  ['entrance', '公园入口', './demo-images/entrance.jpg'],
  ['planting', '植物空间', './demo-images/planting.jpg'],
  ['night', '夜间氛围', './demo-images/night.jpg'],
];

function designerFacingStatement(text = '') {
  return text
    .replace(/设计师选择 B｜([^。]+)。/g, '设计师选择“方案 2｜$1”。')
    .replace(/设计师选择 A｜([^。]+)。/g, '设计师选择“方案 1｜$1”。')
    .replace(/设计师选择 C｜([^。]+)。/g, '设计师选择“方案 3｜$1”。')
    .replace(/measurement\s*\/\s*pendingVerification/gi, '工具量测，待正式资料复核')
    .replace(/\bpendingVerification\b/g, '待后续资料确认');
}

function ConceptDiagram({ code }) {
  if (code === 'A') {
    return (
      <svg viewBox="0 0 480 250" className="h-full w-full" role="img" aria-label="分区式多个功能岛概念示意">
        <rect width="480" height="250" rx="20" fill="#f5f7f4" />
        {[[70, 68, 48], [190, 62, 58], [315, 75, 50], [125, 172, 55], [280, 170, 64]].map(([x, y, r], index) => <circle key={index} cx={x} cy={y} r={r} fill={index % 2 ? '#9bc5a8' : '#bfd8b5'} opacity="0.95" />)}
        <path d="M30 126 C110 110 162 138 240 123 S370 104 450 132" stroke="#406c52" strokeWidth="11" fill="none" strokeLinecap="round" />
      </svg>
    );
  }
  if (code === 'B') {
    return (
      <svg viewBox="0 0 480 250" className="h-full w-full" role="img" aria-label="中心加环加节点概念示意">
        <rect width="480" height="250" rx="20" fill="#f5f7f4" />
        <ellipse cx="240" cy="125" rx="150" ry="86" fill="none" stroke="#49795c" strokeWidth="16" />
        <circle cx="240" cy="125" r="58" fill="#b8d8a9" />
        {[[92, 125], [240, 38], [388, 125], [240, 212]].map(([x, y], index) => <circle key={index} cx={x} cy={y} r="19" fill="#d7b56d" />)}
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 480 250" className="h-full w-full" role="img" aria-label="自然漫游式连续绿地概念示意">
      <rect width="480" height="250" rx="20" fill="#f5f7f4" />
      <path d="M28 188 C76 80 142 212 206 102 S330 36 452 72 L452 218 L28 218 Z" fill="#b6d4ae" />
      <path d="M20 164 C105 46 156 221 237 105 S361 45 458 90" stroke="#49795c" strokeWidth="12" fill="none" strokeLinecap="round" />
      <path d="M32 178 C117 60 168 231 249 115 S373 55 470 100" stroke="#f6efe1" strokeWidth="5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function Agent1Review({ blueprint, onOpenBlueprint }) {
  return (
    <div className="roadshow-ux-page">
      <div className="roadshow-ux-hero">
        <p>AGENT 01 · COMPLETE</p>
        <h2>前期分析已完成</h2>
        <span>项目资料已整理为统一设计蓝本，项目理解已经设计师确认。</span>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {[
          ['项目基本信息', `${blueprint.projectBasicInfo.projectName} · ${blueprint.projectBasicInfo.city}`],
          ['设计目标', blueprint.explicitRequirements?.[0]?.value || blueprint.projectBasicInfo.designGoals || '已整理'],
          ['待确认事项', `${blueprint.unconfirmedInfo?.length || blueprint.pendingVerification?.length || 0} 项将在后续资料中复核`],
        ].map(([title, value]) => <article key={title} className="surface-card p-5"><p className="text-xs font-bold text-[var(--lf-brand-600)]">{title}</p><p className="mt-2 text-sm leading-6 text-[var(--lf-text)]">{value}</p></article>)}
      </div>
      <div className="flex justify-end"><button type="button" onClick={onOpenBlueprint} className="btn-secondary px-5 py-2.5 text-sm">查看前期分析</button></div>
    </div>
  );
}

function ConceptGeneration({ blueprint, requirement, onRequirement, onRegenerate, onEnterComparison }) {
  const candidates = selectConceptCandidates(blueprint);
  if (!candidates.length) {
    return <div className="flex min-h-[460px] items-center justify-center" data-testid="roadshow-agent2-generating"><div className="text-center"><span className="mx-auto block h-12 w-12 animate-spin rounded-full border-4 border-violet-100 border-t-violet-600" /><h2 className="mt-5 text-2xl font-bold text-[var(--lf-brand-950)]">正在生成三个概念方向……</h2><p className="mt-2 text-sm text-[var(--lf-muted)]">Agent 2 正在基于已确认的项目理解组织差异化方向。</p></div></div>;
  }
  return (
    <div className="roadshow-ux-page" data-testid="roadshow-agent2">
      <div className="roadshow-ux-hero">
        <p>AGENT 02 · CONCEPT GENERATION</p>
        <h2>三个概念方向已经形成</h2>
        <span>本阶段只负责产生差异化方向，不评分、不推荐，也不替设计师做选择。</span>
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        {candidates.map((concept) => {
          const code = concept.code || concept.id;
          return (
            <motion.article key={concept.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="surface-card overflow-hidden p-0">
              <div className="aspect-[16/7] bg-[#f5f7f4]"><ConceptDiagram code={code} /></div>
              <div className="p-5">
                <div className="flex items-center justify-between"><span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700">{CONCEPT_LABELS[code]}</span><span className="text-[11px] text-slate-400">概念示意</span></div>
                <h3 className="mt-3 text-xl font-bold text-[var(--lf-brand-950)]">{CONCEPT_LABELS[code]}｜{concept.name}</h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-[var(--lf-brand-700)]">{concept.proposition}</p>
                <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                  <p><b className="text-slate-800">空间组织：</b>{concept.spatialHypothesis}</p>
                  <p><b className="text-slate-800">主要优势：</b>{concept.advantages?.slice(0, 2).join('；')}</p>
                </div>
              </div>
            </motion.article>
          );
        })}
      </div>
      <details className="rounded-2xl border border-violet-100 bg-white p-4">
        <summary className="cursor-pointer text-sm font-bold text-[var(--lf-brand-800)]">需要调整概念生成要求？</summary>
        <textarea value={requirement} onChange={(event) => onRequirement(event.target.value)} className="form-input mt-3 min-h-[70px]" placeholder="可补充新的概念生成要求。" />
        <button type="button" onClick={onRegenerate} className="btn-secondary mt-3 px-4 py-2 text-xs">按新要求重新生成</button>
      </details>
      <div className="roadshow-action-area">
        <p>三个方向将交给 Agent 3 进行专业比选。</p>
        <div className="roadshow-action-buttons">
          <button type="button" onClick={onEnterComparison} className="btn-primary px-7 py-3 text-base">进入方案比选</button>
        </div>
      </div>
    </div>
  );
}

function Comparison({ blueprint, checkpoint, checkpointProps }) {
  const candidates = selectConceptCandidates(blueprint);
  const recommendedId = blueprint.agentRecommendation?.conceptId;
  return (
    <div className="roadshow-ux-page" data-testid="roadshow-agent3">
      <div className="roadshow-ux-hero">
        <p>AGENT 03 · SCHEME COMPARISON</p>
        <h2>方案比选与设计师决策</h2>
        <span>Agent 3 从功能空间、实施维护和综合体验三个层面组织比选。</span>
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        {candidates.map((concept) => {
          const code = concept.code || concept.id;
          const recommended = concept.id === recommendedId;
          return (
            <article key={concept.id} className={`surface-card p-5 ${recommended ? 'ring-2 ring-emerald-300 shadow-lg shadow-emerald-100' : 'opacity-80'}`}>
              <div className="flex items-center justify-between"><span className="text-xs font-bold text-violet-700">{CONCEPT_LABELS[code]}</span>{recommended && <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">推荐方案</span>}</div>
              <h3 className="mt-2 text-xl font-bold text-[var(--lf-brand-950)]">{concept.name}</h3>
              <div className="mt-4 grid gap-2 text-sm">
                <p className="rounded-xl bg-violet-50 p-3"><b>功能与空间</b><br />{concept.proposition}</p>
                <p className="rounded-xl bg-slate-50 p-3"><b>实施与维护</b><br />{concept.applicableConditions?.[0] || '需结合后续资料复核'}</p>
                <p className="rounded-xl bg-cyan-50 p-3"><b>综合体验</b><br />{concept.experienceIntent}</p>
              </div>
            </article>
          );
        })}
      </div>
      <section className="rounded-2xl border border-[var(--lf-border)] bg-white p-5" data-testid="agent3-professional-scores">
        <p className="text-xs font-bold tracking-[0.14em] text-[var(--lf-brand-600)]">PROFESSIONAL COMPARISON</p>
        <h3 className="mt-2 text-xl font-bold text-[var(--lf-brand-950)]">六项专业评分</h3>
        <div className="mt-4">
          <ComparisonTable
            comparison={blueprint.comparison}
            highlightSchemeId={recommendedId}
            showRecommendation={false}
            totalLabel="综合评分"
          />
        </div>
      </section>
      <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
        <p className="text-xs font-bold tracking-[0.14em] text-emerald-700">推荐方案</p>
        <h3 className="mt-2 text-xl font-bold text-emerald-950">方案 2｜社区共享环</h3>
        <p className="mt-2 text-sm leading-6 text-emerald-800">在有限场地中兼顾共享融合、空间尺度和多年龄使用关系。</p>
        <p className="mt-3 text-xs leading-6 text-emerald-800">Agent 推荐仅提供专业判断参考，最终方向仍由设计师在下方确认。</p>
      </section>
      <CheckpointPanel blueprint={blueprint} checkpoint={checkpoint} {...checkpointProps} />
    </div>
  );
}

function SpatialReview({ blueprint, onOpenImage, onGenerateStatement }) {
  const binding = getDemoAssetBinding(blueprint.project?.demoAssetBinding);
  const assets = binding?.analysisAssets || blueprint.analysisAssets || [];
  return (
    <div className="roadshow-ux-page" data-testid="roadshow-agent4-spatial">
      <div className="roadshow-ux-hero">
        <p>AGENT 04 · SPATIAL DEVELOPMENT</p>
        <h2>空间推演成果</h2>
        <span>基于当前方案方向，系统完成空间结构、使用关系与尺度校核推演。</span>
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        {assets.map((asset) => (
          <article key={asset.id} className="surface-card p-3" data-testid={`agent4-${asset.id.toLowerCase()}`}>
            <button type="button" className="block w-full text-left" onClick={() => onOpenImage({ src: asset.url, title: asset.title })}>
              <VisualAssetFrame asset={{ ...asset, title: asset.title, sourceAgent: 'Agent 4｜空间推演', aspectRatio: '16:9', objectFit: 'contain' }} showMeta={false} showBadges={false} allowZoom={false} />
            </button>
            <h3 className="mt-3 text-base font-bold text-[var(--lf-brand-950)]">{asset.id}｜{asset.title}</h3>
            <p className="mt-1 text-xs leading-5 text-[var(--lf-muted)]">{asset.id === 'A01' ? '总体空间结构' : asset.id === 'A02' ? '使用关系与共享组织' : '尺度与功能校核'}</p>
            <button type="button" onClick={() => onOpenImage({ src: asset.url, title: asset.title })} className="btn-secondary mt-3 px-3 py-2 text-xs">查看大图</button>
          </article>
        ))}
      </div>
      <div className="roadshow-action-area">
        <p>空间推演完成后，将基于同一 Blueprint 生成正式设计说明。</p>
        <div className="roadshow-action-buttons">
          <button type="button" onClick={onGenerateStatement} className="btn-primary px-7 py-3 text-base">生成设计说明</button>
        </div>
      </div>
    </div>
  );
}

function DesignStatementGate({ blueprint, checkpoint, checkpointProps }) {
  return (
    <div className="roadshow-ux-page" data-testid="roadshow-design-statement-review">
      <div className="roadshow-ux-hero"><p>GATE 3 · PROFESSIONAL REVIEW</p><h2>设计说明书分项确认</h2><span>设计师逐项通过，或提出专业修改意见并只重新生成对应分项。</span></div>
      <CheckpointPanel blueprint={blueprint} checkpoint={checkpoint} {...checkpointProps} />
    </div>
  );
}

function FullDesignStatement({ blueprint, onContinue }) {
  const statement = blueprint.deliverableArtifacts?.designStatement;
  return (
    <div className="roadshow-ux-page" data-testid="design-statement-full">
      <div className="roadshow-ux-hero"><p>APPROVED DESIGN STATEMENT</p><h2>设计说明</h2><span>当前方案的正式设计说明成果</span></div>
      <article className="surface-card p-7">
        <div className="columns-1 gap-8 xl:columns-2">
          {(statement?.sections || []).map((section, index) => (
            <section key={section.key} className="mb-6 break-inside-avoid">
              <p className="text-xs font-bold text-emerald-700">{String(index + 1).padStart(2, '0')} · 已通过</p>
              <h3 className="mt-1 text-lg font-bold text-[var(--lf-brand-950)]">{section.title}</h3>
              <p className="mt-2 whitespace-pre-line text-sm leading-7 text-slate-650">{designerFacingStatement(section.body)}</p>
            </section>
          ))}
        </div>
      </article>
      <div className="roadshow-action-area"><p>11 个分项已通过并合并为连续设计说明。</p><div className="roadshow-action-buttons"><button type="button" onClick={onContinue} className="btn-primary px-7 py-3 text-base">确认设计说明并继续</button></div></div>
    </div>
  );
}

function buildPrompt(sceneName, blueprint) {
  const concept = selectConceptCandidates(blueprint).find((item) => item.id === blueprint.designerDecision?.selectedConceptId);
  return `${sceneName}围绕“${concept?.name || '当前方案'}”的空间意图展开，遵循已通过设计说明与专业策略；画面用于方案表达，不作为项目事实。`;
}

function VisualTasks({ blueprint, promptReady, onGeneratePrompts, onStartGeneration }) {
  const [scenes, setScenes] = useState(DEFAULT_VISUAL_SCENES.map(([id, name]) => ({ id, name })));
  const [newScene, setNewScene] = useState('');
  const addScene = () => {
    const name = newScene.trim();
    if (!name) return;
    setScenes((items) => [...items, { id: `custom-${Date.now()}`, name }]);
    setNewScene('');
  };
  return (
    <div className="roadshow-ux-page" data-testid="roadshow-agent5-tasks">
      <div className="roadshow-ux-hero"><p>AGENT 05 · VISUAL EXPRESSION</p><h2>{promptReady ? '视觉提示词已生成' : '视觉任务清单'}</h2><span>把已确认的设计方案转化为视觉成果；分析图已在空间推演阶段完成。</span></div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {scenes.map((scene, index) => <article key={scene.id} className="surface-card flex items-center gap-3 p-4"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-sm font-bold text-emerald-700">✓</span><div className="min-w-0 flex-1"><p className="text-sm font-bold text-[var(--lf-brand-950)]">{index + 1}. {scene.name}</p>{promptReady && <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--lf-muted)]">{buildPrompt(scene.name, blueprint)}</p>}</div><button type="button" onClick={() => setScenes((items) => items.filter((item) => item.id !== scene.id))} className="text-xs text-slate-400">删除</button></article>)}
      </div>
      {!promptReady && <div className="flex gap-2 rounded-2xl border border-dashed border-violet-200 bg-white p-4"><input value={newScene} onChange={(event) => setNewScene(event.target.value)} className="form-input" placeholder="增加一个效果图场景" /><button type="button" onClick={addScene} className="btn-secondary shrink-0 px-4 py-2 text-sm">＋ 增加效果图</button></div>}
      {promptReady && <details className="rounded-2xl border border-violet-100 bg-white p-4"><summary className="cursor-pointer text-sm font-bold text-[var(--lf-brand-800)]">查看完整提示词</summary><div className="mt-3 space-y-3">{scenes.map((scene) => <p key={scene.id} className="rounded-xl bg-violet-50 p-3 text-xs leading-6 text-slate-700"><b>{scene.name}：</b>{buildPrompt(scene.name, blueprint)}</p>)}</div></details>}
      <div className="roadshow-action-area">
        <p>{promptReady ? '视觉任务已经设计师确认后才会进入生成。' : '系统将基于 Blueprint 与已通过设计说明组织每个场景的提示词。'}</p>
        <div className="roadshow-action-buttons">
          <button type="button" onClick={promptReady ? onStartGeneration : onGeneratePrompts} className="btn-primary px-7 py-3 text-base">{promptReady ? '确认并开始生成' : '生成视觉提示词'}</button>
        </div>
      </div>
    </div>
  );
}

function VisualResults({ blueprint, checkpoint, checkpointProps, onOpenImage, onEnterOutput }) {
  const candidates = selectVisualCandidates(blueprint, 'children');
  const selected = selectSelectedVisuals(blueprint, 'children')[0];
  const supporting = (blueprint.visualAssets || []).filter((asset) => asset.role === 'supportingVisual');
  return (
    <div className="roadshow-ux-page" data-testid="roadshow-agent5-results">
      <div className="roadshow-ux-hero"><p>AGENT 05 · VISUAL RESULTS</p><h2>视觉成果已完成</h2><span>儿童活动空间保留候选选择，其余六个场景作为当前方案的 supporting visuals 一次完成。</span></div>
      <section>
        <h3 className="text-lg font-bold text-[var(--lf-brand-950)]">儿童活动空间｜选择一个视觉方向</h3>
        <div className="mt-3 grid gap-4 lg:grid-cols-2">
          {candidates.map((candidate, index) => <article key={candidate.id} className="surface-card p-3"><button type="button" onClick={() => onOpenImage({ src: candidate.url, title: `视觉方案 ${index + 1}` })}><VisualAssetFrame asset={{ ...candidate, title: `视觉方案 ${index + 1}` }} showMeta={false} showBadges={false} allowZoom={false} /></button><p className="mt-3 text-xs font-bold text-violet-700">视觉方案 {index + 1}</p><h4 className="mt-1 text-base font-bold text-[var(--lf-brand-950)]">{candidate.coreIntent.includes('亲水') ? '浅层安全亲水' : '自然探索'}</h4></article>)}
        </div>
      </section>
      {!selected && <CheckpointPanel blueprint={blueprint} checkpoint={checkpoint} {...checkpointProps} />}
      <section>
        <h3 className="text-lg font-bold text-[var(--lf-brand-950)]">其他视觉成果</h3>
        <div className="mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {supporting.map((asset) => <button key={asset.id} type="button" onClick={() => onOpenImage({ src: asset.url, title: asset.name || asset.title })} className="surface-card overflow-hidden p-0 text-left"><img src={asset.url} alt={asset.name || asset.title} className="aspect-video w-full object-cover" /><p className="p-3 text-sm font-bold text-[var(--lf-brand-950)]">{asset.name || asset.title}</p></button>)}
        </div>
      </section>
      {selected && (
        <div className="roadshow-action-area">
          <p>儿童视觉方向与其余六个 supporting visuals 已归入当前方案。</p>
          <div className="roadshow-action-buttons">
            <button type="button" onClick={onEnterOutput} className="btn-primary px-7 py-3 text-base">进入成果输出</button>
          </div>
        </div>
      )}
    </div>
  );
}

function PresentationOutline({ blueprint, onConfirmContent }) {
  const artifact = blueprint.deliverableArtifacts?.presentation;
  return (
    <div className="roadshow-ux-page" data-testid="roadshow-agent6-outline">
      <div className="roadshow-ux-hero"><p>AGENT 06 · PRESENTATION DIRECTOR</p><h2>汇报内容组织</h2><span>系统已经根据当前设计成果组织好 14 页设计院专业方案汇报内容。</span></div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {PRESENTATION_OUTLINE.map(([page, title, conclusion]) => (
          <details key={page} className="surface-card p-4">
            <summary className="cursor-pointer list-none"><span className="text-xl font-bold text-violet-600">{page}</span><h3 className="mt-1 text-base font-bold text-[var(--lf-brand-950)]">{title}</h3><p className="mt-2 text-xs leading-5 text-[var(--lf-muted)]">{conclusion}</p></summary>
            <div className="mt-3 border-t border-violet-100 pt-3 text-xs leading-6 text-slate-600"><p><b>正文摘要：</b>{conclusion}</p><p><b>对应图片：</b>{artifact?.pages?.[Number(page) - 1]?.title || title}</p></div>
          </details>
        ))}
      </div>
      <div className="roadshow-action-area"><p>固定采用“设计院专业方案汇报型”，不增加风格选择。</p><div className="roadshow-action-buttons"><button type="button" onClick={onConfirmContent} className="btn-primary px-7 py-3 text-base">确认汇报内容</button></div></div>
    </div>
  );
}

function GeneratingPresentation() {
  return <div className="flex min-h-[460px] items-center justify-center" data-testid="roadshow-agent6-generating"><div className="text-center"><span className="mx-auto block h-12 w-12 animate-spin rounded-full border-4 border-violet-100 border-t-violet-600" /><h2 className="mt-5 text-2xl font-bold text-[var(--lf-brand-950)]">正在生成方案汇报……</h2><p className="mt-2 text-sm text-[var(--lf-muted)]">正在调用已登记的汇报生产能力并校验 14 页成果。</p></div></div>;
}

export default function RoadshowAgentWorkspace({
  blueprint,
  viewedStep,
  activeCheckpoint,
  conceptRequirement,
  roadshowUi,
  outputWorkflowStep,
  presentationBusy,
  checkpointProps,
  onOpenBlueprint,
  onRequirement,
  onRegenerateConcepts,
  onEnterComparison,
  onGenerateDesignStatement,
  onContinueFromStatement,
  onGenerateVisualPrompts,
  onStartVisualGeneration,
  onEnterOutput,
  onConfirmPresentationContent,
  onOpenResults,
  onOpenImage,
}) {
  const checkpoint = activeCheckpoint;
  const content = useMemo(() => {
    if (viewedStep === 0) return <Agent1Review blueprint={blueprint} onOpenBlueprint={onOpenBlueprint} />;
    if (viewedStep === 1) return <ConceptGeneration blueprint={blueprint} requirement={conceptRequirement} onRequirement={onRequirement} onRegenerate={onRegenerateConcepts} onEnterComparison={onEnterComparison} />;
    if (viewedStep === 2) return <Comparison blueprint={blueprint} checkpoint={checkpoint} checkpointProps={checkpointProps} />;
    if (viewedStep === 3) {
      if (blueprint.checkpoints?.find((item) => item.id === 'checkpoint-3')?.status === '已确认') return <FullDesignStatement blueprint={blueprint} onContinue={onContinueFromStatement} />;
      if (roadshowUi.agent4View === 'review') return <DesignStatementGate blueprint={blueprint} checkpoint={checkpoint} checkpointProps={checkpointProps} />;
      return <SpatialReview blueprint={blueprint} onOpenImage={onOpenImage} onGenerateStatement={onGenerateDesignStatement} />;
    }
    if (viewedStep === 4) {
      if (blueprint.agentRuns?.[5]?.status === 'done') return <VisualResults blueprint={blueprint} checkpoint={checkpoint} checkpointProps={checkpointProps} onOpenImage={onOpenImage} onEnterOutput={onEnterOutput} />;
      return <VisualTasks blueprint={blueprint} promptReady={roadshowUi.visualPromptReady} onGeneratePrompts={onGenerateVisualPrompts} onStartGeneration={onStartVisualGeneration} />;
    }
    if (presentationBusy || outputWorkflowStep === 1) return <GeneratingPresentation />;
    if (blueprint.agentRuns?.[6]?.status === 'done') return <div className="roadshow-ux-page"><PresentationDeliverable blueprint={blueprint} onOpenResults={onOpenResults} /><CheckpointPanel blueprint={blueprint} checkpoint={checkpoint} {...checkpointProps} /></div>;
    return <PresentationOutline blueprint={blueprint} onConfirmContent={onConfirmPresentationContent} />;
  }, [
    activeCheckpoint,
    blueprint,
    checkpoint,
    checkpointProps,
    conceptRequirement,
    onConfirmPresentationContent,
    onContinueFromStatement,
    onEnterComparison,
    onEnterOutput,
    onGenerateDesignStatement,
    onGenerateVisualPrompts,
    onOpenBlueprint,
    onOpenImage,
    onOpenResults,
    onRegenerateConcepts,
    onRequirement,
    onStartVisualGeneration,
    outputWorkflowStep,
    presentationBusy,
    roadshowUi.agent4View,
    roadshowUi.visualPromptReady,
    viewedStep,
  ]);

  return (
    <div data-testid="roadshow-single-agent-workspace">
      <motion.div key={`${viewedStep}-${roadshowUi.agent4View}-${roadshowUi.visualPromptReady}-${outputWorkflowStep}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24 }}>
        {content}
      </motion.div>
    </div>
  );
}
