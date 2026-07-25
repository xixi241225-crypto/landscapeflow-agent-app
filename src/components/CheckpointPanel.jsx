import { useEffect, useRef, useState } from 'react';
import VisualAssetFrame from './VisualAssetFrame';
import { selectConceptCandidate, selectConceptCandidates } from '../blueprint/blueprintSelectors';

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

function planVisual(blueprint) {
  const spatial = blueprint.spatialStructure || {};
  return {
    id: 'SP01',
    title: spatial.title ? `${spatial.title}｜空间策略总平面` : '空间策略总平面',
    assetType: '总平面图',
    url: spatial.planImage,
    aspectRatio: '3:4',
    objectFit: 'contain',
    sourceAgent: 'Agent 4｜空间推演',
    blueprintVersion: spatial._meta?.version || blueprint.currentVersion,
    ...(spatial.planAsset || {}),
    status: blueprint.agentRuns?.[4]?.status === 'stale' ? '已失效' : spatial.planAsset?.status || (spatial.planImage ? '演示案例' : '待生成'),
  };
}

export default function CheckpointPanel({ blueprint, checkpoint, onConfirm, onUpdateDecision, onAssumptionDecision, onSaveFacts, onRegenerate }) {
  const conceptCandidates = selectConceptCandidates(blueprint);
  const [decisionDraft, setDecisionDraft] = useState(blueprint.designerDecision || {});
  const lastSavedDecision = useRef(JSON.stringify(blueprint.designerDecision || {}));
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
    lastSavedDecision.current = JSON.stringify(next);
  }, [blueprint.designerDecision?.selectedConceptId, blueprint.designerDecision?.acceptedRecommendation, blueprint.designerDecision?.fusionRequirements, blueprint.designerDecision?.modificationNotes, blueprint.designerDecision?.decisionReason]);
  if (!checkpoint || !['待确认', '需重新确认'].includes(checkpoint.status)) return null;

  const saveDecision = () => {
    if (!decisionDraft.selectedConceptId) {
      setError('请先选择 A / B / C 中的一个概念方向。');
      return false;
    }
    const serialized = JSON.stringify(decisionDraft);
    if (serialized !== lastSavedDecision.current) {
      onUpdateDecision(decisionDraft);
      lastSavedDecision.current = serialized;
    }
    setError('');
    return true;
  };

  const handleConfirm = () => {
    setError('');
    try {
      if (checkpoint.id === 'checkpoint-2') {
        if (!decisionDraft.selectedConceptId) throw new Error('请先选择 A / B / C 中的一个概念方向。');
        onConfirm(checkpoint.id, { designerDecision: decisionDraft });
        lastSavedDecision.current = JSON.stringify(decisionDraft);
      } else onConfirm(checkpoint.id);
    } catch (err) { setError(err.message); }
  };

  return (
    <div className="checkpoint-panel mt-6 rounded-2xl p-5" data-testid={`checkpoint-${checkpoint.order}`}>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="text-xs font-bold tracking-widest text-[var(--lf-gold)]">DESIGNER CHECKPOINT · {checkpoint.order} / 4</div>
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
            <label className="text-[11px] text-gray-600">融合要求<textarea rows="3" className="form-input resize-none mt-1 !text-xs" value={decisionDraft.fusionRequirements || ''} onChange={(event) => setDecisionDraft((prev) => ({ ...prev, fusionRequirements: event.target.value }))} onBlur={saveDecision} placeholder="例如：采用方案 B 的公共核心策略，同时融合方案 C 的慢行体验逻辑。" /></label>
            <label className="text-[11px] text-gray-600">修改意见<textarea rows="3" className="form-input resize-none mt-1 !text-xs" value={decisionDraft.modificationNotes || ''} onChange={(event) => setDecisionDraft((prev) => ({ ...prev, modificationNotes: event.target.value }))} onBlur={saveDecision} placeholder="记录设计师对下一阶段的明确要求…" /></label>
            <label className="text-[11px] text-gray-600">最终选择理由<textarea rows="3" className="form-input resize-none mt-1 !text-xs" value={decisionDraft.decisionReason || ''} onChange={(event) => setDecisionDraft((prev) => ({ ...prev, decisionReason: event.target.value }))} onBlur={saveDecision} placeholder="说明接受或不接受 AI 推荐的专业判断…" /></label>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-xl bg-white border border-violet-100 p-3">
            <p className="text-xs text-[var(--lf-muted)]">当前草稿：方案 {decisionDraft.selectedConceptId || '未选择'}，文本在失焦或点击保存时统一写入蓝本。</p>
            <button onClick={saveDecision} className="btn-primary shrink-0 text-xs px-4 py-2">保存决策</button>
          </div>
          <p className="text-[10px] text-gray-500">空间推演将严格读取设计师最终选择，不会默认采用 Agent 推荐。</p>
        </div>
      )}

      {checkpoint.id === 'checkpoint-3' && (
        <div>
          <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-violet-200 bg-white p-3">
            <div><p className="text-xs font-semibold text-[var(--lf-brand-600)]">当前项目设计蓝本 · {blueprint.milestoneVersion}</p><p className="mt-1 text-sm font-bold text-[var(--lf-brand-950)]">人工选择概念：{selectConceptCandidate(blueprint, blueprint.designerDecision?.selectedConceptId)?.code || '待选择'}｜{selectConceptCandidate(blueprint, blueprint.designerDecision?.selectedConceptId)?.name || '待确认'}</p></div>
            <span className="rounded-full bg-cyan-50 px-3 py-1.5 text-xs font-semibold text-cyan-700">11 项空间及专业策略待确认</span>
          </div>
          <div className="grid gap-4 lg:grid-cols-[minmax(260px,2fr)_minmax(0,3fr)]">
            <div>
              <VisualAssetFrame asset={planVisual(blueprint)} aspectRatio="3:4" />
              <p className="mt-2 text-xs leading-5 text-[var(--lf-muted)]">总平面保持完整显示，不裁切图纸；确认内容以右侧当前 Blueprint 字段为准。</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <ConfirmItem label="核心叙事" value={blueprint.coreNarrative?.value} />
              <ConfirmItem label="空间结构" value={blueprint.spatialStructure?.value} />
              <ConfirmItem label="功能分区" value={blueprint.functionalZones.map((item) => `${item.name}（${item.area}）`).join('、')} />
              <ConfirmItem label="动线策略" value={blueprint.circulationStrategy?.value} />
              <ConfirmItem label="植物策略" value={blueprint.professionalStrategies?.plant} />
              <ConfirmItem label="材料策略" value={blueprint.professionalStrategies?.material} />
              <ConfirmItem label="生态策略" value={blueprint.professionalStrategies?.ecology} />
              <ConfirmItem label="竖向策略" value={blueprint.professionalStrategies?.grading} />
              <ConfirmItem label="排水策略" value={blueprint.professionalStrategies?.drainage} />
              <ConfirmItem label="运营与活动策略" value={blueprint.professionalStrategies?.operations} />
              <ConfirmItem label="特色节点" value={blueprint.featureNodes.map((item) => item.name).join('、')} />
              <div className="col-span-2 text-xs text-[var(--lf-gold)]">确认后才允许进入视觉表达与 PPT 生产。若需要修改上游内容，请在项目设计蓝本中查看影响范围，或返回前序阶段修改。</div>
            </div>
          </div>
        </div>
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
        <button onClick={handleConfirm} className="btn-primary px-6 py-3 text-sm">{checkpoint.id === 'checkpoint-1' ? '确认设计方向并开始设计' : checkpoint.id === 'checkpoint-2' ? '确认方向并写入 Blueprint' : checkpoint.id === 'checkpoint-3' ? '确认空间方案并写入 Blueprint' : '确认最终成果并完成项目'}</button>
      </div>
    </div>
  );
}

function ConfirmItem({ label, value }) {
  return <div className="rounded-xl bg-white border border-violet-100 p-3.5"><p className="text-xs font-semibold text-[var(--lf-brand-600)]">{label}</p><p className="text-sm text-[var(--lf-text)] mt-1 leading-relaxed">{value || '待补充'}</p></div>;
}
