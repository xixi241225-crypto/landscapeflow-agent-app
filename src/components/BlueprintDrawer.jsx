import { AnimatePresence, motion } from 'framer-motion';
import { CONTENT_STATUS, getBlueprintStatusCounts } from '../blueprint/blueprintModel';
import VisualAssetFrame from './VisualAssetFrame';

const CONCEPT_VISUAL_FALLBACKS = {
  A: './demo-images/aerial.jpg',
  B: './demo-images/awn.jpg',
  C: './demo-images/elderly.jpg',
};

function conceptAsset(concept, blueprint) {
  if (!concept) return {};
  return {
    id: `C${concept.id}`,
    title: `${concept.name}概念图`,
    assetType: '最终概念方向',
    url: CONCEPT_VISUAL_FALLBACKS[concept.id],
    aspectRatio: '16:9',
    sourceAgent: 'Agent 2｜概念生成',
    blueprintVersion: concept._meta?.version || blueprint.currentVersion,
    ...(concept.visual || {}),
    status: blueprint.agentRuns?.[2]?.status === 'stale' ? '已失效' : concept.visual?.status || '演示案例',
  };
}

function planAsset(blueprint) {
  const spatial = blueprint.spatialStructure || {};
  return {
    id: 'SP01',
    title: spatial.title ? `${spatial.title}｜空间策略总平面` : '空间策略总平面',
    assetType: '总平面图',
    url: spatial.planImage,
    sourceAgent: 'Agent 4｜空间推演',
    blueprintVersion: spatial._meta?.version || blueprint.currentVersion,
    ...(spatial.planAsset || {}),
    aspectRatio: '4:3',
    objectFit: 'contain',
    status: blueprint.agentRuns?.[4]?.status === 'stale' ? '已失效' : spatial.planAsset?.status || (spatial.planImage ? '演示案例' : '待生成'),
  };
}

const statusStyle = {
  [CONTENT_STATUS.CONFIRMED]: { color: '#166534', background: '#DCFCE7' },
  [CONTENT_STATUS.AI_SUGGESTED]: { color: '#1D4ED8', background: '#DBEAFE' },
  [CONTENT_STATUS.ASSUMPTION]: { color: '#92400E', background: '#FEF3C7' },
  [CONTENT_STATUS.PENDING]: { color: '#9A3412', background: '#FFEDD5' },
  [CONTENT_STATUS.INVALID]: { color: '#991B1B', background: '#FEE2E2' },
  [CONTENT_STATUS.REJECTED]: { color: '#6B7280', background: '#F3F4F6' },
};

function StatusPill({ status }) {
  if (!status) return null;
  return <span className="text-[9px] px-1.5 py-0.5 rounded-full whitespace-nowrap" style={statusStyle[status] || statusStyle[CONTENT_STATUS.PENDING]}>{status}</span>;
}

function RecordList({ items, titleKey = 'title', valueKey = 'value', empty = '暂无内容' }) {
  if (!items?.length) return <p className="text-[11px] text-gray-400">{empty}</p>;
  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div key={item.id || `${item[titleKey]}-${index}`} className="rounded-xl p-3 bg-white border border-violet-100">
          <div className="flex items-start justify-between gap-2">
            <span className="text-xs font-semibold text-[var(--lf-text)]">{item[titleKey] || item.name || item.label || `条目 ${index + 1}`}</span>
            <StatusPill status={item.status} />
          </div>
          {item[valueKey] && <p className="text-xs leading-relaxed text-[var(--lf-muted)] mt-1">{item[valueKey]}</p>}
          {item._meta && <p className="text-xs text-slate-400 mt-1">{item._meta.sourceAgent} · v{item._meta.version} · {item._meta.reason}</p>}
        </div>
      ))}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="border-b border-violet-100 pb-4 mb-4">
      <h4 className="text-sm font-bold text-[var(--lf-brand-950)] mb-2 tracking-wide">{title}</h4>
      {children}
    </section>
  );
}

export default function BlueprintDrawer({ open, onClose, blueprint, versions, onRestore }) {
  if (!blueprint) return null;
  const counts = getBlueprintStatusCounts(blueprint);
  const concept = blueprint.conceptCandidates?.find((item) => item.id === blueprint.designerDecision?.selectedConceptId);
  const checkpoint = blueprint.checkpoints?.find((item) => item.id === blueprint.currentCheckpoint);
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button className="fixed inset-0 z-40 bg-black/15" aria-label="关闭项目设计蓝本" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
          <motion.aside
            className="blueprint-surface workspace-readable fixed right-0 top-0 bottom-0 z-50 w-[500px] max-w-[92vw] border-l flex flex-col shadow-2xl"
            initial={{ x: 480 }} animate={{ x: 0 }} exit={{ x: 480 }} transition={{ type: 'spring', stiffness: 320, damping: 32 }}
          >
            <div className="p-5 border-b border-violet-100 bg-white/90 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-[var(--lf-brand-950)]">项目设计蓝本</h3>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-cyan-50 text-cyan-700 font-bold">v{blueprint.currentVersion}</span>
                </div>
                <p className="text-xs text-[var(--lf-muted)] mt-1">六 Agent 共同读取与回写的唯一项目主档</p>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-lg bg-gray-100 text-gray-500">✕</button>
            </div>

            <div className="grid grid-cols-4 gap-2 p-4 border-b border-violet-100 bg-[var(--lf-brand-50)]">
              {[
                ['已确认', counts[CONTENT_STATUS.CONFIRMED], '#166534'],
                ['待确认', counts[CONTENT_STATUS.PENDING], '#C2410C'],
                ['系统假设', counts[CONTENT_STATUS.ASSUMPTION], '#92400E'],
                ['需重新生成', blueprint.invalidatedOutputs.length, '#B91C1C'],
              ].map(([label, count, color]) => (
                <div key={label} className="rounded-xl bg-white border border-violet-100 p-2.5 text-center">
                  <div className="text-base font-bold" style={{ color }}>{count}</div>
                  <div className="text-xs text-[var(--lf-muted)]">{label}</div>
                </div>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <Section title="当前状态">
                <div className="rounded-xl p-3 bg-white border border-violet-100">
                  <p className="text-sm font-semibold text-[var(--lf-brand-800)]">{checkpoint ? `等待：${checkpoint.name}` : blueprint.officialPackageStatus}</p>
                  <p className="text-xs text-[var(--lf-muted)] mt-1">{checkpoint?.description || `当前成果状态：${blueprint.officialPackageStatus}`}</p>
                </div>
              </Section>

              <Section title="关键项目事实">
                <RecordList items={blueprint.confirmedFacts} titleKey="label" />
              </Section>

              <Section title="最终概念方向">
                {concept ? (
                  <div className="rounded-xl p-3 bg-white border border-violet-100">
                    <VisualAssetFrame asset={conceptAsset(concept, blueprint)} compact />
                    <div className="mt-3 flex items-center justify-between"><strong className="text-sm text-[var(--lf-brand-900)]">{concept.id}｜{concept.name}</strong><StatusPill status={blueprint.designerDecision.status} /></div>
                    <p className="text-xs text-[var(--lf-muted)] mt-1">{concept.concept}</p>
                    <p className="text-xs text-[var(--lf-gold)] mt-2">融合要求：{blueprint.designerDecision.fusionRequirements || '无'}</p>
                  </div>
                ) : <p className="text-[11px] text-gray-400">尚未由设计师选择</p>}
              </Section>

              <Section title="空间结构">
                <VisualAssetFrame asset={planAsset(blueprint)} compact />
                <div className="mt-2">{blueprint.spatialStructure ? <RecordList items={[blueprint.spatialStructure]} /> : <p className="text-[11px] text-gray-400">尚未生成</p>}</div>
                <div className="mt-2"><RecordList items={blueprint.functionalZones} titleKey="name" valueKey="function" /></div>
              </Section>

              <Section title="专业策略">
                <RecordList items={['plant', 'material', 'ecology', 'grading', 'drainage'].filter((key) => blueprint.professionalStrategies?.[key]).map((key) => ({ title: ({ plant: '植物', material: '材料', ecology: '生态', grading: '竖向', drainage: '排水' })[key], value: blueprint.professionalStrategies[key], status: blueprint.spatialStructure?.status }))} />
              </Section>

              <Section title="视觉任务">
                <RecordList items={blueprint.visualTasks} titleKey="title" valueKey="prompt" />
              </Section>

              <Section title="PPT 逐页结构">
                <RecordList items={blueprint.pptOutline?.length ? blueprint.pptOutline : blueprint.pptStructure} titleKey="title" valueKey="content" />
              </Section>

              <Section title="已失效 / 需重新生成">
                {blueprint.invalidatedOutputs.length ? blueprint.invalidatedOutputs.map((item) => (
                  <div key={item.id} className="rounded-lg p-2.5 mb-2 bg-red-50 border border-red-100">
                    <p className="text-[11px] font-medium text-red-800">Agent {item.targetAgent}｜{item.targetName}</p>
                    <p className="text-[10px] text-red-700 mt-1">{item.reason}</p>
                  </div>
                )) : <p className="text-[11px] text-gray-400">暂无失效成果</p>}
              </Section>

              <Section title="下一步任务">
                <RecordList items={blueprint.nextTasks} />
              </Section>

              <Section title="分阶段风险">
                <RecordList items={blueprint.risks} />
              </Section>

              <Section title="修改历史">
                <div className="space-y-2">
                  {blueprint.changeLog.slice(0, 12).map((entry) => (
                    <div key={entry.id} className="pl-3 border-l-2 border-violet-200">
                      <p className="text-[10px] text-gray-700"><strong>{entry.sourceAgent}</strong> 写入 {entry.fields.join('、')}</p>
                      <p className="text-[9px] text-gray-400">v{entry.version} · {entry.reason} · {new Date(entry.modifiedAt).toLocaleString('zh-CN')}</p>
                    </div>
                  ))}
                </div>
              </Section>

              <Section title="版本历史与恢复">
                <div className="space-y-2">
                  {(versions || []).map((version) => (
                    <div key={version.id} className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 p-2.5">
                      <div className="min-w-0">
                        <p className="text-[11px] font-medium text-gray-700">v{version.version}｜{version.reason}</p>
                        <p className="text-[9px] text-gray-400">{new Date(version.createdAt).toLocaleString('zh-CN')}</p>
                      </div>
                      <button onClick={() => onRestore(version.id)} className="text-[10px] px-2 py-1 rounded-lg border border-amber-200 text-amber-700 hover:bg-amber-50">恢复</button>
                    </div>
                  ))}
                </div>
              </Section>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
