import { useState } from 'react';
import ImageModal from './ImageModal';

const STATUS_STYLE = {
  待上传: 'bg-slate-100 text-slate-600 border-slate-200',
  待生成: 'bg-violet-50 text-violet-700 border-violet-200',
  待深化: 'bg-violet-50 text-violet-700 border-violet-200',
  演示案例: 'bg-amber-50 text-amber-800 border-amber-200',
  已生成: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  已失效: 'bg-rose-50 text-rose-700 border-rose-200',
};

const RATIO_STYLE = {
  '16:9': '16 / 9',
  '4:3': '4 / 3',
  '3:4': '3 / 4',
  '4:5': '4 / 5',
};

function isDrawingType(assetType = '') {
  return /总平|底图|CAD|区位|分析|图纸|分区|动线|策略|剖面/.test(assetType);
}

export default function VisualAssetFrame({
  asset = {},
  src,
  title,
  assetType,
  status,
  source,
  blueprintVersion,
  aspectRatio,
  objectFit,
  placeholder,
  className = '',
  visualClassName = '',
  compact = false,
  showMeta = true,
  allowZoom = true,
}) {
  const [loadFailed, setLoadFailed] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const resolvedSrc = src || asset.url || asset.src || '';
  const resolvedTitle = title || asset.title || '视觉成果';
  const resolvedType = assetType || asset.assetType || asset.type || '景观视觉';
  const requestedStatus = status || asset.assetStatus || asset.status || (resolvedSrc ? '已生成' : '待生成');
  const resolvedStatus = loadFailed ? '待生成' : requestedStatus;
  const resolvedSource = source || asset.sourceAgent || asset._meta?.sourceAgent || '项目设计蓝本';
  const resolvedVersion = blueprintVersion || asset.blueprintVersion || asset._meta?.version;
  const ratio = aspectRatio || asset.aspectRatio || '16:9';
  const fit = objectFit || asset.objectFit || (isDrawingType(resolvedType) ? 'contain' : 'cover');
  const hasImage = Boolean(resolvedSrc) && !loadFailed;
  const invalid = resolvedStatus === '已失效';

  const visual = (
    <div
      className={`visual-asset-visual relative w-full overflow-hidden ${invalid ? 'grayscale-[45%]' : ''} ${visualClassName}`}
      style={{ aspectRatio: RATIO_STYLE[ratio] || ratio.replace(':', ' / ') }}
    >
      {hasImage ? (
        <img
          src={resolvedSrc}
          alt={resolvedTitle}
          className="h-full w-full"
          style={{ objectFit: fit }}
          onError={() => setLoadFailed(true)}
        />
      ) : (
        <div className="visual-asset-placeholder flex h-full w-full flex-col items-center justify-center px-4 text-center">
          <svg width="42" height="42" viewBox="0 0 48 48" fill="none" aria-hidden="true">
            <path d="M7 35c6-10 11-15 18-15 6 0 10 4 16 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M8 39h32M32 14c0 4-3 7-7 7s-7-3-7-7 3-7 7-7 7 3 7 7Z" stroke="currentColor" strokeWidth="1.5" />
            <path d="M25 7v14M19 11l12 6M31 11l-12 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          <p className="mt-2 text-sm font-semibold text-[var(--lf-brand-800)]">{placeholder || `${resolvedType}｜${resolvedStatus}`}</p>
          <p className="mt-1 text-xs text-[var(--lf-muted)]">视觉槽位已预留，可按 Blueprint 定向替换</p>
        </div>
      )}
      <div className="absolute left-2 top-2 flex flex-wrap gap-1.5">
        <span className={`rounded-full border px-2 py-1 text-[11px] font-semibold ${STATUS_STYLE[resolvedStatus] || STATUS_STYLE['待生成']}`}>{resolvedStatus}</span>
        {asset.id && <span className="rounded-full border border-white/70 bg-white/90 px-2 py-1 text-[11px] font-bold text-[var(--lf-brand-700)]">{asset.id}</span>}
      </div>
      {invalid && <div className="absolute inset-0 flex items-center justify-center bg-rose-950/16"><span className="rounded-lg bg-white/94 px-3 py-2 text-sm font-bold text-rose-700 shadow">已失效，不属于当前方案</span></div>}
      {hasImage && allowZoom && <span className="absolute bottom-2 right-2 rounded-full bg-slate-950/65 px-2 py-1 text-[10px] text-white">点击查看</span>}
    </div>
  );

  return (
    <>
      <figure className={`visual-asset-frame overflow-hidden rounded-xl border border-[var(--lf-border)] bg-white ${className}`}>
        {hasImage && allowZoom ? (
          <button type="button" className="block w-full text-left" onClick={() => setModalOpen(true)} aria-label={`放大查看：${resolvedTitle}`}>
            {visual}
          </button>
        ) : visual}
        {showMeta && (
          <figcaption className={compact ? 'px-3 py-2.5' : 'px-3.5 py-3'}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className={`${compact ? 'text-xs' : 'text-sm'} truncate font-semibold text-[var(--lf-text)]`}>{resolvedTitle}</p>
                <p className="mt-0.5 truncate text-xs text-[var(--lf-muted)]">{resolvedType}</p>
              </div>
              <span className="shrink-0 rounded-md bg-[var(--lf-brand-50)] px-2 py-1 text-[10px] font-semibold text-[var(--lf-brand-600)]">{ratio}</span>
            </div>
            <p className="mt-2 truncate text-[10px] text-slate-400">来源：{resolvedSource}{resolvedVersion ? ` · Blueprint v${resolvedVersion}` : ''}</p>
          </figcaption>
        )}
      </figure>
      {modalOpen && hasImage && <ImageModal src={resolvedSrc} title={`${resolvedTitle}｜${resolvedType}`} onClose={() => setModalOpen(false)} />}
    </>
  );
}
