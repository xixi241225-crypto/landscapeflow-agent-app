import { useEffect, useState } from 'react';
import VisualAssetFrame from './VisualAssetFrame';
import DesignStatementReview from './DesignStatementReview';
import {
  selectConceptCandidates,
  selectSelectedVisuals,
  selectVisualCandidates,
} from '../blueprint/blueprintSelectors';

const GATE5_CHECKS = [
  ['contentComplete', '汇报内容完整', '14 页内容已覆盖当前方案汇报所需的核心章节。'],
  ['schemeConsistent', '图文与当前方案一致', '汇报内容与 Gate 2 方案、Design Statement、分析图和 Gate 4 视觉选择一致。'],
  ['pendingPreserved', '待深化事项已正确保留', '待核实信息未被写成已确认事实，视觉成果未反向覆盖 Blueprint。'],
  ['filesComplete', '14 页成果文件完整可查看', 'P01–P14 均可打开，并可下载完整成果包。'],
];

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
  const [presentationReview, setPresentationReview] = useState({
    checks: Object.fromEntries(GATE5_CHECKS.map(([key]) => [key, true])),
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
  const canConfirmGate5 = GATE5_CHECKS.every(([key]) => presentationReview.checks[key]);

  const handleConfirm = () => {
    setError('');
    try {
      if (checkpoint.id === 'checkpoint-2') {
        if (!decisionDraft.selectedConceptId) throw new Error('请先选择一个概念方向。');
        onConfirm(checkpoint.id, { designerDecision: decisionDraft });
      } else if (checkpoint.id === 'checkpoint-4') {
        if (!visualDraft.candidateId) throw new Error('请先选择一个视觉候选。');
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
      } else if (checkpoint.id === 'checkpoint-5') {
        if (!canConfirmGate5) throw new Error('请逐项完成汇报成果复核。');
        onConfirm(checkpoint.id, { presentationReview });
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
        <span className="text-xs px-3 py-1 rounded-full bg-white border border-amber-200 text-[var(--lf-gold)] font-semibold whitespace-nowrap">◆ 需要设计师确认</span>
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
              <button key={concept.id} onClick={() => setDecisionDraft((prev) => ({ ...prev, selectedConceptId: concept.id, acceptedRecommendation: concept.id === blueprint.agentRecommendation?.conceptId }))} className="rounded-xl border p-4 text-left transition-all" style={{ borderColor: decisionDraft.selectedConceptId === concept.id ? 'var(--lf-brand-500)' : 'var(--lf-border)', background: decisionDraft.selectedConceptId === concept.id ? 'var(--lf-brand-100)' : '#FFFFFF', boxShadow: decisionDraft.selectedConceptId === concept.id ? '0 6px 16px rgba(64,56,167,.10)' : 'none' }}>
                <span className="block text-xs font-bold text-[var(--lf-brand-700)]">方案 {['A', 'B', 'C'].indexOf(concept.code || concept.id) + 1}</span><p className="mt-1 text-sm font-semibold text-[var(--lf-text)]">{concept.name}</p>
              </button>
            ))}
          </div>
          <button onClick={() => setDecisionDraft((prev) => ({ ...prev, selectedConceptId: blueprint.agentRecommendation?.conceptId, acceptedRecommendation: true }))} className="btn-gold px-4 py-2 text-xs">采用推荐方案｜{blueprint.agentRecommendation?.conceptName}</button>
          <p className="rounded-xl border border-violet-100 bg-white p-3 text-xs text-[var(--lf-muted)]">当前草稿：{decisionDraft.selectedConceptId ? `方案 ${['A', 'B', 'C'].indexOf(decisionDraft.selectedConceptId) + 1}` : '未选择'}。点击确认后才会写入 Blueprint。</p>
          <p className="text-[10px] text-gray-500">空间推演将严格读取设计师最终选择，不会默认采用 Agent 推荐。</p>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-amber-200 pt-4">
            <button onClick={onRegenerate} className="rounded-xl border border-rose-200 bg-white px-4 py-3 text-sm font-semibold text-rose-700">三个方案都不满意，重新生成</button>
          </div>
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
            {visualCandidates.map((candidate, candidateIndex) => {
              const selected = visualDraft.candidateId === candidate.id;
              return <div key={candidate.id} className={`rounded-2xl border-2 bg-white p-3 transition ${selected ? 'border-violet-400 shadow-lg shadow-violet-100' : 'border-violet-100'}`} data-testid={`gate4-candidate-${candidate.id.toLowerCase()}`}>
                <VisualAssetFrame asset={{ ...candidate, title: `视觉方案 ${candidateIndex + 1}`, status: candidate.url ? '演示案例' : '待生成', aspectRatio: '16:9' }} showMeta={false} showBadges={false} compact />
                <div className="mt-3 flex items-start justify-between gap-2"><div><p className="text-xs font-bold text-violet-700">视觉方案 {visualCandidates.indexOf(candidate) + 1}</p><p className="mt-1 text-base font-bold text-[var(--lf-brand-950)]">{candidate.coreIntent.includes('亲水') ? '浅层安全亲水' : '自然探索'}</p><p className="mt-1 text-xs leading-5 text-[var(--lf-muted)]">{candidate.coreIntent}</p></div><span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${selected ? 'bg-violet-100 text-violet-700' : 'bg-slate-100 text-slate-500'}`}>{selected ? '已选择' : '待选择'}</span></div>
                <button type="button" onClick={() => setVisualDraft((previous) => ({ ...previous, candidateId: candidate.id }))} className={`mt-3 w-full rounded-xl px-4 py-2.5 text-sm font-semibold ${selected ? 'bg-violet-100 text-violet-700' : 'bg-[var(--lf-brand-700)] text-white'}`}>{selected ? '当前选择' : `选择视觉方案 ${visualCandidates.indexOf(candidate) + 1}`}</button>
              </div>;
            })}
          </div>
          <p className="rounded-xl border border-cyan-100 bg-cyan-50 p-3 text-xs leading-5 text-cyan-800" data-testid="gate4-draft-status">当前页面草稿：{visualDraft.candidateId ? `视觉方案 ${visualCandidates.findIndex((item) => item.id === visualDraft.candidateId) + 1}` : '尚未选择'}。只有点击下方“确认视觉方案”后才会写入 Blueprint；视觉内容不会被解析为项目事实。</p>
        </div>
      )}

      {checkpoint.id === 'checkpoint-5' && (
        <div className="space-y-3" data-testid="gate5-presentation-review">
          {GATE5_CHECKS.map(([key, label, description]) => (
            <div key={key} className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3" data-testid={`gate5-check-${key}`}>
              <span className="mt-0.5 font-bold text-emerald-700">✓</span>
              <span><strong className="block text-sm text-[var(--lf-brand-950)]">{label}</strong><span className="mt-1 block text-xs leading-5 text-[var(--lf-muted)]">{description}</span></span>
            </div>
          ))}
          <label className="block text-xs text-[var(--lf-muted)]">复核说明（可选）
            <textarea
              rows="3"
              value={presentationReview.comment}
              onChange={(event) => setPresentationReview((previous) => ({ ...previous, comment: event.target.value }))}
              className="form-input mt-1 resize-none"
              placeholder="记录本次汇报成果确认的补充意见…"
            />
          </label>
        </div>
      )}

      {error && <p className="text-xs text-red-600 mt-3">{error}</p>}
      <div className="flex justify-end mt-4">
        <button disabled={(checkpoint.id === 'checkpoint-3' && !canConfirmGate3) || (checkpoint.id === 'checkpoint-5' && !canConfirmGate5)} onClick={handleConfirm} className="btn-primary px-6 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-40">{checkpoint.id === 'checkpoint-1' ? '确认项目理解并继续' : checkpoint.id === 'checkpoint-2' ? `确认${decisionDraft.selectedConceptId ? `方案 ${['A', 'B', 'C'].indexOf(decisionDraft.selectedConceptId) + 1}` : '设计方向'}` : checkpoint.id === 'checkpoint-3' ? '确认设计说明书' : checkpoint.id === 'checkpoint-4' ? '确认视觉方案' : '确认最终成果'}</button>
      </div>
    </div>
  );
}
