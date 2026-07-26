import { useState } from 'react';
import PresentationDeckViewer from './PresentationDeckViewer';

const CONTENT_ITEMS = [
  '项目概况与场地认知',
  '核心设计命题与概念',
  '总体空间结构与尺度校核',
  '全龄功能关系',
  '重点空间体验',
  '植物与专项策略',
  '已确认视觉成果',
  '实施建议与待深化事项',
];

export default function PresentationDeliverable({ blueprint }) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const artifact = blueprint.deliverableArtifacts?.presentation;
  if (!artifact) {
    return <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">等待 Agent 6 登记最终汇报成果。</div>;
  }
  const confirmed = artifact.review?.status === 'confirmed';
  return (
    <div className="space-y-5" data-testid="agent6-presentation-deliverable">
      <section className="overflow-hidden rounded-2xl bg-[var(--lf-brand-950)] text-white shadow-lg">
        <div className="grid gap-6 p-6 lg:grid-cols-[1fr_320px]">
          <div>
            <p className="text-xs font-bold tracking-[0.2em] text-emerald-300">AGENT 6 · FINAL PRESENTATION</p>
            <h2 className="mt-3 font-serif text-3xl font-bold">方案汇报已准备</h2>
            <p className="mt-2 text-base text-violet-100">{artifact.pageCount} 页景观概念方案汇报成果，已完成文件校验并登记到当前 Blueprint。</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button type="button" onClick={() => setPreviewOpen(true)} className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-[var(--lf-brand-950)]" data-testid="preview-presentation">查看方案汇报</button>
              <a href={artifact.downloadRef} download={artifact.download?.fileName} className="rounded-xl border border-white/30 px-5 py-3 text-sm font-bold text-white hover:bg-white/10" data-testid="download-presentation">下载完整成果包</a>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 self-end">
            <div className="rounded-xl bg-white/10 p-3"><strong className="block text-2xl">{artifact.pageCount}</strong><span className="text-xs text-violet-200">页成果</span></div>
            <div className="rounded-xl bg-white/10 p-3"><strong className="block text-lg">已完成</strong><span className="text-xs text-violet-200">成果生成</span></div>
            <div className="rounded-xl bg-white/10 p-3"><strong className="block text-lg">当前</strong><span className="text-xs text-violet-200">版本状态</span></div>
          </div>
        </div>
      </section>

      {confirmed && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800" data-testid="gate5-confirmed-banner">Gate 5 已确认｜最终汇报成果已进入交付状态</div>}

      <div className="grid gap-5 xl:grid-cols-2">
        <section className="rounded-2xl border border-[var(--lf-border)] bg-white p-5">
          <h3 className="text-base font-bold text-[var(--lf-brand-950)]">汇报内容</h3>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {CONTENT_ITEMS.map((item) => <p key={item} className="rounded-lg bg-[var(--lf-brand-50)] px-3 py-2 text-sm text-[var(--lf-text)]">✓ {item}</p>)}
          </div>
        </section>
        <section className="rounded-2xl border border-[var(--lf-border)] bg-white p-5">
          <h3 className="text-base font-bold text-[var(--lf-brand-950)]">成果质量校验</h3>
          <div className="mt-4 space-y-3">
            {(blueprint.qualityReview || []).filter((item) => item.id?.startsWith('presentation-')).map((item) => (
              <div key={item.id || item.check} className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3 last:border-0">
                <div><p className="text-sm font-semibold">{item.check}</p><p className="mt-1 text-xs leading-5 text-[var(--lf-muted)]">{item.result}</p></div>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">通过</span>
              </div>
            ))}
          </div>
        </section>
      </div>
      <PresentationDeckViewer open={previewOpen} artifact={artifact} onClose={() => setPreviewOpen(false)} />
    </div>
  );
}
