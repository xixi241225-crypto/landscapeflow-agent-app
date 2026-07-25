import { useEffect, useState } from 'react';
import VisualAssetFrame from './VisualAssetFrame';
import DesignStatementReview from './DesignStatementReview';
import { selectConceptCandidates } from '../blueprint/blueprintSelectors';

const CONCEPT_VISUAL_FALLBACKS = {
  A: './demo-images/aerial.jpg',
  B: './demo-images/awn.jpg',
  C: './demo-images/elderly.jpg',
};

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
  const [decisionDraft, setDecisionDraft] = useState(blueprint.designerDecision || {});
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
          <p className="text-sm font-semibold text-[var(--lf-brand-950)]">请确认上方项目目标、核心约束与设计原则。</p>
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
        <div className="space-y-2">
          {blueprint.qualityReview.map((item, index) => (
            <div key={`${item.check}-${index}`} className="flex items-start justify-between gap-3 rounded-lg bg-white border border-amber-100 p-2.5"><div><p className="text-xs font-medium text-gray-800">{item.check}</p><p className="text-[10px] text-gray-500 mt-0.5">{item.result}</p></div><span className={`text-[9px] px-2 py-0.5 rounded-full ${item.level === 'pass' ? 'bg-green-50 text-green-700' : 'bg-amber-100 text-amber-800'}`}>{item.level === 'pass' ? '通过' : '需注意'}</span></div>
          ))}
          <p className="text-[10px] text-amber-800">确认后状态将更新为“演示方案已完成｜正式成果可继续深化”。</p>
        </div>
      )}

      {error && <p className="text-xs text-red-600 mt-3">{error}</p>}
      <div className="flex justify-end mt-4">
        <button disabled={checkpoint.id === 'checkpoint-3' && !canConfirmGate3} onClick={handleConfirm} className="btn-primary px-6 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-40">{checkpoint.id === 'checkpoint-1' ? '确认设计方向并开始设计' : checkpoint.id === 'checkpoint-2' ? '确认方向并继续' : checkpoint.id === 'checkpoint-3' ? '确认设计说明书并继续' : '确认最终成果并完成项目'}</button>
      </div>
    </div>
  );
}
