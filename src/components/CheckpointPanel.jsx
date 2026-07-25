import { useEffect, useState } from 'react';
import VisualAssetFrame from './VisualAssetFrame';
import DesignStatementReview from './DesignStatementReview';
import {
  selectConceptCandidates,
  selectSelectedVisuals,
  selectVisualCandidates,
} from '../blueprint/blueprintSelectors';

const CONCEPT_VISUAL_FALLBACKS = {
  A: './demo-images/aerial.jpg',
  B: './demo-images/awn.jpg',
  C: './demo-images/elderly.jpg',
};

const VISUAL_REASON_OPTIONS = [
  '更符合前期居民偏好',
  '与总平空间关系更一致',
  '尺度感更可信',
  '家长看护关系更清晰',
  '更利于后期维护',
  '视觉体验更有特色',
];

function conceptVisual(concept, blueprint) {
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
    ...(concept.referenceVisual || concept.visual || {}),
    status: blueprint.agentRuns?.[2]?.status === 'stale' ? '已失效' : '演示案例',
  };
}

export default function CheckpointPanel({
  blueprint,
  checkpoint,
  onConfirm,
  onAssumptionDecision,
  onSaveFacts,
  onRegenerate,
  onReviewDesignStatementSection,
  onRegenerateDesignStatementSection,
  onApproveRemainingDesignStatementSections,
  designStatementBusySections = [],
}) {
  const conceptCandidates = selectConceptCandidates(blueprint);
  const visualCandidates = selectVisualCandidates(blueprint, 'children');
  const confirmedVisual = selectSelectedVisuals(blueprint, 'children')[0] || null;
  const [decisionDraft, setDecisionDraft] = useState(blueprint.designerDecision || {});
  const [visualDraft, setVisualDraft] = useState({
    candidateId: '',
    reasons: [],
    comment: '',
  });
  const [error, setError] = useState('');
  useEffect(() => {
    const next = {
      selectedConceptId: blueprint.designerDecision?.selectedConceptId || '',
      acceptedRecommendation: Boolean(blueprint.designerDecision?.acceptedRecommendation),
      fusionRequirements: blueprint.designerDecision?.fusionRequirements || '',
      modificationNotes: blueprint.designerDecision?.modificationNotes || '',
      decisionReason: blueprint.designerDecision?.decisionReason || '',
    };
    setDecisionDraft(next);
  }, [blueprint.designerDecision?.selectedConceptId, blueprint.designerDecision?.acceptedRecommendation, blueprint.designerDecision?.fusionRequirements, blueprint.designerDecision?.modificationNotes, blueprint.designerDecision?.decisionReason]);
  useEffect(() => {
    setVisualDraft({
      candidateId: confirmedVisual?.candidateId || '',
      reasons: confirmedVisual?.reasons || [],
      comment: confirmedVisual?.comment || '',
    });
  }, [confirmedVisual?.candidateId, confirmedVisual?.comment, JSON.stringify(confirmedVisual?.reasons || [])]);
  if (!checkpoint || !['待确认', '需重新确认'].includes(checkpoint.status)) return null;

  const designStatement = blueprint.deliverableArtifacts?.designStatement;
  const canConfirmGate3 = Boolean(
    designStatement?.sections?.length
    && designStatement.sections.every((section) => section.reviewStatus === 'approved')
    && !designStatementBusySections.length
    && !['regenerating', 'needsRevision', 'stale'].includes(designStatement.status)
  );

  const handleConfirm = () => {
    setError('');
    try {
      if (checkpoint.id === 'checkpoint-2') {
        if (!decisionDraft.selectedConceptId) throw new Error('请先选择 A / B / C 中的一个概念方向。');
        onConfirm(checkpoint.id, { designerDecision: decisionDraft });
      } else if (checkpoint.id === 'checkpoint-4') {
        if (!visualDraft.candidateId) throw new Error('请先选择一个视觉候选。');
        if (!visualDraft.reasons.length) throw new Error('请至少选择一项视觉判断理由。');
        const candidate = visualCandidates.find((item) => item.id === visualDraft.candidateId);
        onConfirm(checkpoint.id, {
          visualSelection: {
            scene: 'children',
            visualTaskId: candidate?.visualTaskId || 'VT-CHILDREN',
            candidateId: visualDraft.candidateId,
            reasons: visualDraft.reasons,
            comment: visualDraft.comment,
            sourceBlueprintFields: candidate?.sourceBlueprintFields || [],
          },
        });
      } else {
        if (checkpoint.id === 'checkpoint-3' && !canConfirmGate3) throw new Error('请先完成设计说明书全部分项复核。');
        onConfirm(checkpoint.id);
      }
    } catch (err) { setError(err.message); }
  };

  return (
    <div className="checkpoint-panel mt-6 rounded-2xl p-5" data-testid={`checkpoint-${checkpoint.order}`}>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="text-xs font-bold tracking-widest text-[var(--lf-gold)]">DESIGNER CHECKPOINT · GATE {checkpoint.order}</div>
          <h3 className="text-lg font-bold text-[var(--lf-brand-950)] mt-1">{checkpoint.name}</h3>
          <p className="text-sm text-[var(--lf-muted)] mt-1">{checkpoint.description}</p>
        </div>
        <span className="text-xs px-3 py-1 rounded-full bg-white border border-amber-200 text-[var(--lf-gold)] font-semibold whitespace-nowrap">◆ 设计师决策 · 强制暂停</span>
      </div>

      {checkpoint.id === 'checkpoint-1' && (
        <div className="rounded-xl border border-violet-100 bg-white p-4">
          <p className="text-sm font-semibold text-[var(--lf-brand-950)]">请确认上方项目事实、设计偏好、专业判断与待复核项的状态边界。</p>
          <p className="mt-2 text-xs leading-6 text-[var(--lf-muted)]">待补充信息和合理假设会保留在蓝本中，不会被伪装为已确认事实。确认后将形成 v2，供后续五个 Agent 统一读取。</p>
        </div>
      )}

      {checkpoint.id === 'checkpoint-2' && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {conceptCandidates.map((concept) => (
              <button key={concept.id} onClick={() => setDecisionDraft((prev) => ({ ...prev, selectedConceptId: concept.id, acceptedRecommendation: concept.id === blueprint.agentRecommendation?.conceptId }))} className="rounded-xl border p-2 text-left transition-all" style={{ borderColor: decisionDraft.selectedConceptId === concept.id ? 'var(--lf-brand-500)' : 'var(--lf-border)', background: decisionDraft.selectedConceptId === concept.id ? 'var(--lf-brand-100)' : '#FFFFFF', boxShadow: decisionDraft.selectedConceptId === concept.id ? '0 6px 16px rgba(64,56,167,.10)' : 'none' }}>
                <VisualAssetFrame asset={conceptVisual(concept, blueprint)} showMeta={false} allowZoom={false} />
                <span className="mt-2 block text-xs font-bold text-[var(--lf-brand-700)]">方案 {concept.code || concept.id}</span><p className="text-sm font-semibold text-[var(--lf-text)] mt-1">{concept.name}</p>
              </button>
            ))}
          </div>
          <button onClick={() => setDecisionDraft((prev) => ({ ...prev, selectedConceptId: blueprint.agentRecommendation?.conceptId, acceptedRecommendation: true }))} className="btn-gold text-xs px-3 py-2">接受 Agent 推荐：{blueprint.agentRecommendation?.conceptId} {blueprint.agentRecommendation?.conceptName}</button>
          <button onClick={onRegenerate} className="ml-2 text-xs px-3 py-2 rounded-lg bg-white border border-rose-200 text-rose-700">退回重新生成三个概念</button>
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
            <label className="text-[11px] text-gray-600">融合要求<textarea rows="3" className="form-input resize-none mt-1 !text-xs" value={decisionDraft.fusionRequirements || ''} onChange={(event) => setDecisionDraft((prev) => ({ ...prev, fusionRequirements: event.target.value }))} placeholder="例如：采用方案 B 的公共核心策略，同时融合方案 C 的慢行体验逻辑。" /></label>
            <label className="text-[11px] text-gray-600">修改意见<textarea rows="3" className="form-input resize-none mt-1 !text-xs" value={decisionDraft.modificationNotes || ''} onChange={(event) => setDecisionDraft((prev) => ({ ...prev, modificationNotes: event.target.value }))} placeholder="记录设计师对下一阶段的明确要求…" /></label>
            <label className="text-[11px] text-gray-600">最终选择理由<textarea rows="3" className="form-input resize-none mt-1 !text-xs" value={decisionDraft.decisionReason || ''} onChange={(event) => setDecisionDraft((prev) => ({ ...prev, decisionReason: event.target.value }))} placeholder="说明接受或不接受 AI 推荐的专业判断…" /></label>
          </div>
          <p className="rounded-xl bg-white border border-violet-100 p-3 text-xs text-[var(--lf-muted)]">当前草稿：方案 {decisionDraft.selectedConceptId || '未选择'}。选择和文本仅保留在当前页面，点击“确认方向并继续”后才写入 Blueprint。</p>
          <p className="text-[10px] text-gray-500">空间推演将严格读取设计师最终选择，不会默认采用 Agent 推荐。</p>
        </div>
      )}

      {checkpoint.id === 'checkpoint-3' && (
        <DesignStatementReview
          statement={designStatement}
          busySectionKeys={designStatementBusySections}
          onApprove={(sectionKey) => onReviewDesignStatementSection(sectionKey, { reviewStatus: 'approved', comment: '', reviewedBy: 'designer' })}
          onRequestRevision={onRegenerateDesignStatementSection}
          onApproveRemaining={onApproveRemainingDesignStatementSections}
        />
      )}

      {checkpoint.id === 'checkpoint-4' && (
        <div className="space-y-4" data-testid="gate4-visual-review">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {visualCandidates.map((candidate) => {
              const selected = visualDraft.candidateId === candidate.id;
              return <div key={candidate.id} className={`rounded-2xl border-2 bg-white p-3 transition ${selected ? 'border-violet-400 shadow-lg shadow-violet-100' : 'border-violet-100'}`} data-testid={`gate4-candidate-${candidate.id.toLowerCase()}`}>
                <VisualAssetFrame asset={{ ...candidate, title: candidate.name, sourceAgent: 'Cached Demo Asset Provider', status: candidate.url ? '演示案例' : '待生成', aspectRatio: '16:9' }} compact />
                <div className="mt-3 flex items-start justify-between gap-2"><div><p className="text-base font-bold text-[var(--lf-brand-950)]">{candidate.name}</p><p className="mt-1 text-xs leading-5 text-[var(--lf-muted)]">{candidate.coreIntent}</p></div><span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${selected ? 'bg-violet-100 text-violet-700' : 'bg-slate-100 text-slate-500'}`}>{selected ? '当前草稿' : '待选择'}</span></div>
                <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-xl bg-emerald-50 p-3"><p className="font-bold text-emerald-800">优势</p>{candidate.pros?.map((item) => <p key={item} className="mt-1 leading-5 text-emerald-700">· {item}</p>)}</div>
                  <div className="rounded-xl bg-amber-50 p-3"><p className="font-bold text-amber-800">关注点</p>{candidate.concerns?.map((item) => <p key={item} className="mt-1 leading-5 text-amber-700">· {item}</p>)}</div>
                </div>
                <button type="button" onClick={() => setVisualDraft((previous) => ({ ...previous, candidateId: candidate.id }))} className={`mt-3 w-full rounded-xl px-4 py-2.5 text-sm font-semibold ${selected ? 'bg-violet-100 text-violet-700' : 'bg-[var(--lf-brand-700)] text-white'}`}>{selected ? '已选为本地草稿' : `选择 ${candidate.id}`}</button>
              </div>;
            })}
          </div>
          <div className="rounded-xl border border-violet-100 bg-white p-4">
            <p className="text-sm font-bold text-[var(--lf-brand-950)]">选择理由（可多选，无默认值）</p>
            <div className="mt-3 flex flex-wrap gap-2">{VISUAL_REASON_OPTIONS.map((reason) => {
              const selected = visualDraft.reasons.includes(reason);
              return <button key={reason} type="button" onClick={() => setVisualDraft((previous) => ({ ...previous, reasons: selected ? previous.reasons.filter((item) => item !== reason) : [...previous.reasons, reason] }))} className={`rounded-full border px-3 py-2 text-xs ${selected ? 'border-violet-300 bg-violet-50 text-violet-700' : 'border-slate-200 bg-white text-slate-500'}`}>{selected ? '✓ ' : ''}{reason}</button>;
            })}</div>
            <label className="mt-4 block text-xs text-[var(--lf-muted)]">补充说明（可选）<textarea value={visualDraft.comment} onChange={(event) => setVisualDraft((previous) => ({ ...previous, comment: event.target.value }))} rows="3" className="form-input mt-1 resize-none" placeholder="补充记录本次视觉选择的专业判断…" /></label>
          </div>
          <p className="rounded-xl border border-cyan-100 bg-cyan-50 p-3 text-xs leading-5 text-cyan-800" data-testid="gate4-draft-status">当前页面草稿：{visualDraft.candidateId || '尚未选择'}。只有点击下方“确认视觉方案并继续”后，候选、理由与说明才会写入 Blueprint；视觉内容不会被解析为项目事实。</p>
        </div>
      )}

      {checkpoint.id === 'checkpoint-5' && (
        <div className="space-y-2">
          {blueprint.qualityReview.map((item, index) => (
            <div key={`${item.check}-${index}`} className="flex items-start justify-between gap-3 rounded-lg bg-white border border-amber-100 p-2.5"><div><p className="text-xs font-medium text-gray-800">{item.check}</p><p className="text-[10px] text-gray-500 mt-0.5">{item.result}</p></div><span className={`text-[9px] px-2 py-0.5 rounded-full ${item.level === 'pass' ? 'bg-green-50 text-green-700' : 'bg-amber-100 text-amber-800'}`}>{item.level === 'pass' ? '通过' : '需注意'}</span></div>
          ))}
        </div>
      )}

      {error && <p className="text-xs text-red-600 mt-3">{error}</p>}
      <div className="flex justify-end mt-4">
        <button disabled={checkpoint.id === 'checkpoint-3' && !canConfirmGate3} onClick={handleConfirm} className="btn-primary px-6 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-40">{checkpoint.id === 'checkpoint-1' ? '确认设计方向并开始设计' : checkpoint.id === 'checkpoint-2' ? '确认方向并继续' : checkpoint.id === 'checkpoint-3' ? '确认设计说明书并继续' : checkpoint.id === 'checkpoint-4' ? '确认视觉方案并继续' : '确认最终成果并完成项目'}</button>
      </div>
    </div>
  );
}
