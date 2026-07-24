import { AnimatePresence, motion } from 'framer-motion';
import {
  BLUEPRINT_CHAPTERS,
  BLUEPRINT_STATUS_LABELS,
  selectProjectDefinitionDetails,
} from '../blueprint/blueprintSelectors';

const stageLabels = {
  'project-input': '项目资料',
  'project-definition': '项目定义',
  'agent-collaboration': 'Agent 协作',
  deliverables: '成果输出',
};

const conditionLabels = {
  existingAssets: '现状资源',
  existingProblems: '现状问题',
  surroundings: '周边关系',
  climateAndEcology: '气候与生态',
  accessAndMobility: '交通与可达性',
  terrainAndWater: '竖向与水文',
  interfaces: '跨专业接口',
};

function ItemStatus({ status }) {
  const tone = status === 'confirmed' ? 'bg-emerald-50 text-emerald-700'
    : status === 'assumption' ? 'bg-amber-50 text-amber-800'
      : status === 'conflict' ? 'bg-rose-50 text-rose-700'
        : 'bg-violet-50 text-violet-700';
  return <span className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-semibold ${tone}`}>{BLUEPRINT_STATUS_LABELS[status] || status || '待确认'}</span>;
}

function SourceLine({ item }) {
  if (!item.sourceRefs?.length) return <p className="mt-2 text-xs text-slate-400">来源：待补充</p>;
  return (
    <p className="mt-2 text-xs leading-5 text-slate-500">
      来源：{item.sourceRefs.map((source) => `${source.fileName}${source.location ? ` · ${source.location}` : ''}`).join('；')}
    </p>
  );
}

function DefinitionItems({ items, empty = '暂无内容' }) {
  if (!items?.length) return <p className="rounded-xl border border-dashed border-violet-100 px-4 py-5 text-sm text-slate-400">{empty}</p>;
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {items.map((item) => (
        <article key={item.id} className="rounded-xl border border-violet-100 bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-[var(--lf-brand-600)]">{item.label}</p>
              <p className="mt-1 text-sm leading-6 text-[var(--lf-text)]">{item.value}</p>
            </div>
            <ItemStatus status={item.status} />
          </div>
          <SourceLine item={item} />
          <p className="mt-1 text-[11px] text-slate-400">置信度 {Math.round((item.confidence || 0) * 100)}% · {item.updatedBy || 'agent-1'}</p>
        </article>
      ))}
    </div>
  );
}

function DefinitionSection({ title, items, empty }) {
  return (
    <section className="border-b border-violet-100 py-5">
      <h4 className="mb-3 text-base font-bold text-[var(--lf-brand-950)]">{title}</h4>
      <DefinitionItems items={items} empty={empty} />
    </section>
  );
}

function ProjectDefinitionChapter({ blueprint }) {
  const details = selectProjectDefinitionDetails(blueprint);
  const groupedConditions = Object.entries(conditionLabels).map(([key, label]) => ({
    label,
    items: details.siteConditions.filter((item) => item.group === key),
  })).filter((group) => group.items.length);
  return (
    <div>
      <DefinitionSection title="项目事实" items={details.facts} />
      <DefinitionSection title="业主与主要使用者" items={details.stakeholders} />
      <DefinitionSection title="显性目标" items={details.explicitGoals} />
      <DefinitionSection title="深层诉求" items={details.latentGoals} />
      <section className="border-b border-violet-100 py-5">
        <h4 className="mb-3 text-base font-bold text-[var(--lf-brand-950)]">场地条件</h4>
        {groupedConditions.length ? groupedConditions.map((group) => (
          <div key={group.label} className="mb-4">
            <p className="mb-2 text-xs font-bold text-[var(--lf-brand-600)]">{group.label}</p>
            <DefinitionItems items={group.items} />
          </div>
        )) : <DefinitionItems items={[]} empty="场地条件等待真实资料解析" />}
      </section>
      <DefinitionSection title="核心约束" items={details.constraints} />
      <DefinitionSection title="设计原则" items={details.designPrinciples} />
      <DefinitionSection title="成功标准" items={details.successCriteria} />
      <DefinitionSection title="核心设计问题" items={details.coreQuestions} />
      <DefinitionSection title="待确认事项" items={details.openItems} empty="暂无待确认事项" />
      <DefinitionSection title="冲突信息" items={details.conflicts} empty="当前未识别到信息冲突" />
      <section className="py-5">
        <h4 className="mb-3 text-base font-bold text-[var(--lf-brand-950)]">资料来源</h4>
        <div className="grid gap-2 md:grid-cols-2">
          {details.sourceDocuments.map((source) => (
            <div key={source.id} className="rounded-xl border border-violet-100 bg-white p-3">
              <p className="truncate text-sm font-semibold text-[var(--lf-text)]" title={source.fileName}>{source.fileName}</p>
              <p className="mt-1 text-xs text-[var(--lf-muted)]">{source.fileType} · {source.fileSize || '未知大小'} · {source.status}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function VersionHistory({ versions, onRestore }) {
  return (
    <section className="mt-6 rounded-2xl border border-violet-100 bg-[var(--lf-brand-50)] p-4">
      <h4 className="text-base font-bold text-[var(--lf-brand-950)]">版本记录</h4>
      <div className="mt-3 space-y-2">
        {(versions || []).map((version) => (
          <article key={version.id} className="flex items-center justify-between gap-4 rounded-xl border border-violet-100 bg-white p-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-cyan-50 px-2 py-1 text-xs font-bold text-cyan-700">{version.milestoneVersion || `v${version.version}`}</span>
                <p className="truncate text-sm font-semibold text-[var(--lf-text)]">{version.title || version.reason}</p>
              </div>
              <p className="mt-1 text-xs text-[var(--lf-muted)]">{version.summary || version.reason}</p>
              <p className="mt-1 text-[11px] text-slate-400">r{version.revision ?? version.version} · {version.createdBy || 'system'} · {new Date(version.createdAt).toLocaleString('zh-CN')}</p>
            </div>
            <button type="button" onClick={() => onRestore(version.id)} className="btn-secondary shrink-0 px-3 py-2 text-xs">恢复</button>
          </article>
        ))}
      </div>
    </section>
  );
}

export default function BlueprintDrawer({ open, onClose, blueprint, versions, onRestore }) {
  if (!blueprint) return null;
  const basic = blueprint.projectBasicInfo || {};
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button className="fixed inset-0 z-40 bg-black/20" aria-label="关闭项目设计蓝本" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
          <motion.aside
            className="blueprint-surface workspace-readable fixed bottom-0 right-0 top-0 z-50 flex w-[880px] max-w-[96vw] flex-col border-l shadow-2xl"
            initial={{ x: 900 }} animate={{ x: 0 }} exit={{ x: 900 }} transition={{ type: 'spring', stiffness: 320, damping: 32 }}
          >
            <header className="border-b border-violet-100 bg-white px-6 py-5">
              <div className="flex items-start justify-between gap-5">
                <div>
                  <p className="text-xs font-bold tracking-[0.16em] text-[var(--lf-brand-600)]">PROJECT DESIGN BLUEPRINT</p>
                  <h2 className="mt-1 text-2xl font-bold text-[var(--lf-brand-950)]">{basic.projectName || '未命名项目'}</h2>
                  <p className="mt-1 text-sm text-[var(--lf-muted)]">六个专业 Agent 共同读取与回写的唯一项目设计依据</p>
                </div>
                <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500">✕</button>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                {[
                  ['Blueprint ID', blueprint.blueprintId || blueprint.id],
                  ['正式版本', blueprint.milestoneVersion || 'v0'],
                  ['内部修订', `r${blueprint.revision ?? blueprint.currentVersion}`],
                  ['阶段 / 状态', `${stageLabels[blueprint.stage] || blueprint.stage} · ${blueprint.status}`],
                ].map(([label, value]) => <div key={label} className="rounded-xl bg-[var(--lf-brand-50)] p-3"><p className="text-xs text-[var(--lf-muted)]">{label}</p><p className="mt-1 truncate text-sm font-semibold text-[var(--lf-brand-950)]" title={String(value)}>{value}</p></div>)}
              </div>
              <p className="mt-3 text-xs text-slate-500">最近更新：{blueprint.updatedBy || 'system'} · {new Date(blueprint.updatedAt).toLocaleString('zh-CN')}</p>
            </header>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {BLUEPRINT_CHAPTERS.map(([key, label], index) => {
                const complete = Boolean(blueprint.chapters?.[key]);
                return (
                  <details key={key} open={index === 0} className="mb-3 rounded-2xl border border-violet-100 bg-white">
                    <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4">
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--lf-brand-100)] text-xs font-bold text-[var(--lf-brand-700)]">0{index + 1}</span>
                      <span className="min-w-0 flex-1 text-base font-bold text-[var(--lf-brand-950)]">第{index + 1}章｜{label}</span>
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${complete ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-500'}`}>{complete ? '已写入' : '等待相应 Agent 写入'}</span>
                    </summary>
                    {complete && key === 'projectDefinition' && <div className="border-t border-violet-100 px-5"><ProjectDefinitionChapter blueprint={blueprint} /></div>}
                    {complete && key !== 'projectDefinition' && <div className="border-t border-violet-100 px-5 py-5 text-sm text-[var(--lf-muted)]">本章已由相应 Agent 写入；当前轮次不调整其专业内容。</div>}
                    {!complete && <div className="border-t border-violet-100 px-5 py-8 text-center text-sm text-slate-400">等待相应 Agent 写入</div>}
                  </details>
                );
              })}
              <VersionHistory versions={versions} onRestore={onRestore} />
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
