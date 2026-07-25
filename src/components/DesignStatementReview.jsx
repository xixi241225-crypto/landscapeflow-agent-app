import { useEffect, useMemo, useState } from 'react';

const CONTENT_STATUS_LABELS = {
  confirmed: ['已确认', 'bg-emerald-50 text-emerald-700'],
  assumption: ['合理假设', 'bg-violet-50 text-violet-700'],
  pending: ['待复核', 'bg-amber-50 text-amber-700'],
  conflict: ['存在冲突', 'bg-rose-50 text-rose-700'],
};

const REVIEW_STATUS_LABELS = {
  pending: ['待复核', 'text-slate-500'],
  approved: ['已通过', 'text-emerald-700'],
  needsRevision: ['需调整', 'text-rose-700'],
};

const GROUP_ORDER = ['positioning', 'designContent', 'professionalDesign'];
const GROUP_LABELS = {
  positioning: '定位与原则',
  designContent: '设计内容',
  professionalDesign: '专项设计',
};

export default function DesignStatementReview({
  statement,
  busySectionKeys = [],
  onApprove,
  onRequestRevision,
  onApproveRemaining,
}) {
  const sections = statement?.sections || [];
  const [selectedKey, setSelectedKey] = useState(sections[0]?.key || '');
  const [revisionOpen, setRevisionOpen] = useState(false);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!sections.some((section) => section.key === selectedKey)) setSelectedKey(sections[0]?.key || '');
  }, [sections, selectedKey]);

  const selected = sections.find((section) => section.key === selectedKey) || sections[0];
  const grouped = useMemo(() => Object.fromEntries(GROUP_ORDER.map((group) => [
    group,
    sections.filter((section) => section.group === group),
  ])), [sections]);
  const busy = selected ? busySectionKeys.includes(selected.key) : false;
  const pendingCount = sections.filter((section) => section.reviewStatus === 'pending' && !busySectionKeys.includes(section.key)).length;

  const handleApprove = () => {
    if (!selected || busy) return;
    setError('');
    try {
      onApprove(selected.key);
      setRevisionOpen(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSubmitRevision = async () => {
    if (!selected || busy) return;
    const value = comment.trim();
    if (!value) {
      setError('请填写一句明确的专业修改意见。');
      return;
    }
    setError('');
    try {
      await onRequestRevision(selected.key, value);
      setRevisionOpen(false);
      setComment('');
    } catch (err) {
      setError(err.message);
    }
  };

  if (!statement || !sections.length) {
    return <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">设计说明书尚未生成。</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-cyan-200 bg-cyan-50 p-3">
        <div>
          <p className="text-xs font-semibold text-cyan-700">DESIGN STATEMENT · DS-{statement.statementRevision}</p>
          <p className="mt-1 text-sm font-bold text-cyan-950">设计说明书分项专业复核</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="rounded-full bg-white px-3 py-1.5 text-slate-600">{sections.filter((section) => section.reviewStatus === 'approved').length} / {sections.length} 已通过</span>
          <span className={`rounded-full px-3 py-1.5 font-semibold ${statement.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : statement.status === 'needsRevision' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
            {statement.status === 'approved' ? '全部通过' : statement.status === 'needsRevision' ? '存在需调整项' : '复核中'}
          </span>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(220px,0.9fr)_minmax(0,2.1fr)]">
        <div className="space-y-3 rounded-xl border border-violet-100 bg-white p-3">
          {GROUP_ORDER.map((group) => (
            <div key={group}>
              <p className="mb-1.5 px-2 text-[11px] font-bold tracking-wider text-[var(--lf-brand-600)]">{GROUP_LABELS[group]}</p>
              <div className="space-y-1">
                {grouped[group].map((section) => {
                  const status = REVIEW_STATUS_LABELS[section.reviewStatus] || REVIEW_STATUS_LABELS.pending;
                  const isBusy = busySectionKeys.includes(section.key);
                  return (
                    <button
                      key={section.key}
                      type="button"
                      onClick={() => {
                        setSelectedKey(section.key);
                        setRevisionOpen(false);
                        setComment('');
                        setError('');
                      }}
                      className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-xs transition ${selected?.key === section.key ? 'bg-violet-50 ring-1 ring-violet-200' : 'hover:bg-slate-50'}`}
                    >
                      <span className="font-medium text-slate-800">{section.title}</span>
                      <span className={isBusy ? 'text-cyan-700' : status[1]}>{isBusy ? '重新生成中' : status[0]}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {selected && (
          <div className="rounded-xl border border-violet-100 bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-[var(--lf-brand-600)]">{GROUP_LABELS[selected.group]} · Section r{selected.revision}</p>
                <h4 className="mt-1 text-lg font-bold text-[var(--lf-brand-950)]">{selected.title}</h4>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${(CONTENT_STATUS_LABELS[selected.contentStatus] || CONTENT_STATUS_LABELS.pending)[1]}`}>
                  内容：{(CONTENT_STATUS_LABELS[selected.contentStatus] || CONTENT_STATUS_LABELS.pending)[0]}
                </span>
                <span className={`rounded-full bg-slate-50 px-2.5 py-1 text-xs font-semibold ${(REVIEW_STATUS_LABELS[selected.reviewStatus] || REVIEW_STATUS_LABELS.pending)[1]}`}>
                  复核：{(REVIEW_STATUS_LABELS[selected.reviewStatus] || REVIEW_STATUS_LABELS.pending)[0]}
                </span>
              </div>
            </div>

            <p className="mt-4 whitespace-pre-line rounded-xl bg-[var(--lf-brand-50)] p-4 text-sm leading-7 text-slate-700">{selected.body}</p>
            <p className="mt-3 text-[11px] leading-5 text-slate-500">来源：{selected.sourceFields.join('、')} · Blueprint r{selected.sourceRevision}</p>
            {selected.reviewComment && <p className="mt-3 rounded-lg border border-amber-100 bg-amber-50 p-3 text-xs leading-5 text-amber-800">最近设计师意见：{selected.reviewComment}</p>}

            {busy ? (
              <div className="mt-4 rounded-xl border border-cyan-200 bg-cyan-50 p-4 text-sm font-semibold text-cyan-800">Agent 4 正在只重新生成“{selected.title}”及其 Blueprint 源字段……</div>
            ) : (
              <>
                <div className="mt-4 flex flex-wrap justify-end gap-2">
                  <button type="button" onClick={handleApprove} className="btn-primary px-5 py-2.5 text-sm">通过</button>
                  <button type="button" onClick={() => { setRevisionOpen(true); setComment(selected.reviewComment || ''); setError(''); }} className="rounded-xl border border-rose-200 bg-rose-50 px-5 py-2.5 text-sm font-semibold text-rose-700">需调整</button>
                </div>
                {revisionOpen && (
                  <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4">
                    <label className="text-xs font-semibold text-rose-800">
                      专业修改意见
                      <textarea
                        rows="3"
                        value={comment}
                        onChange={(event) => setComment(event.target.value)}
                        className="form-input mt-2 resize-none !bg-white"
                        placeholder="用一句专业意见说明需要调整的方向，不需要重写正文。"
                      />
                    </label>
                    <div className="mt-3 flex justify-end gap-2">
                      <button type="button" onClick={() => { setRevisionOpen(false); setError(''); }} className="btn-secondary px-4 py-2 text-xs">取消</button>
                      <button type="button" onClick={handleSubmitRevision} className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white">提交修改</button>
                    </div>
                  </div>
                )}
              </>
            )}
            {error && <p className="mt-3 text-xs text-rose-600">{error}</p>}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-violet-100 bg-white p-3">
        <p className="text-xs text-[var(--lf-muted)]">批量操作只通过仍为“待复核”的分项，不覆盖“需调整”或正在重新生成的分项。</p>
        <button type="button" disabled={!pendingCount} onClick={onApproveRemaining} className="btn-secondary px-4 py-2 text-xs disabled:opacity-40">通过其余待复核项（{pendingCount}）</button>
      </div>
    </div>
  );
}
