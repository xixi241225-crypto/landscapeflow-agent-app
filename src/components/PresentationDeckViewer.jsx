import { useEffect, useRef, useState } from 'react';

export default function PresentationDeckViewer({
  open,
  artifact,
  initialPage = 1,
  onClose,
}) {
  const pages = artifact?.pages || [];
  const [pageIndex, setPageIndex] = useState(Math.max(0, initialPage - 1));
  const viewerRef = useRef(null);

  useEffect(() => {
    if (open) setPageIndex(Math.min(Math.max(0, initialPage - 1), Math.max(0, pages.length - 1)));
  }, [initialPage, open, pages.length]);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.();
      if (event.key === 'ArrowLeft') setPageIndex((index) => Math.max(0, index - 1));
      if (event.key === 'ArrowRight') setPageIndex((index) => Math.min(pages.length - 1, index + 1));
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose, open, pages.length]);

  if (!open || !pages.length) return null;
  const page = pages[pageIndex];

  const enterFullscreen = () => {
    viewerRef.current?.requestFullscreen?.();
  };

  return (
    <div
      ref={viewerRef}
      className="fixed inset-0 z-[100] flex flex-col bg-slate-950/98 text-white"
      data-testid="presentation-deck-viewer"
      role="dialog"
      aria-modal="true"
      aria-label="14 页方案汇报预览"
    >
      <header className="flex shrink-0 items-center justify-between border-b border-white/10 px-5 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{artifact.title}</p>
          <p className="mt-0.5 text-xs text-slate-400">P{String(page.pageNumber).padStart(2, '0')} / {pages.length} · {page.title}</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={enterFullscreen} className="rounded-lg border border-white/20 px-3 py-2 text-xs hover:bg-white/10">全屏查看</button>
          <button type="button" onClick={onClose} className="rounded-lg border border-white/20 px-3 py-2 text-xs hover:bg-white/10">关闭</button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 items-center justify-center gap-3 px-4 py-3">
        <button
          type="button"
          aria-label="上一页"
          disabled={pageIndex === 0}
          onClick={() => setPageIndex((index) => Math.max(0, index - 1))}
          className="h-12 w-12 shrink-0 rounded-full border border-white/20 text-2xl disabled:opacity-25"
        >
          ‹
        </button>
        <div className="flex h-full min-h-0 flex-1 items-center justify-center">
          <img
            src={page.runtimeRef}
            alt={`P${String(page.pageNumber).padStart(2, '0')} ${page.title}`}
            className="max-h-full max-w-full rounded-lg object-contain shadow-2xl"
            data-testid={`presentation-page-${String(page.pageNumber).padStart(2, '0')}`}
          />
        </div>
        <button
          type="button"
          aria-label="下一页"
          disabled={pageIndex === pages.length - 1}
          onClick={() => setPageIndex((index) => Math.min(pages.length - 1, index + 1))}
          className="h-12 w-12 shrink-0 rounded-full border border-white/20 text-2xl disabled:opacity-25"
        >
          ›
        </button>
      </div>

      <div className="shrink-0 overflow-x-auto border-t border-white/10 bg-black/30 px-4 py-3">
        <div className="mx-auto flex w-max gap-2">
          {pages.map((item, index) => (
            <button
              type="button"
              key={item.assetRef}
              onClick={() => setPageIndex(index)}
              className={`relative w-28 shrink-0 overflow-hidden rounded-lg border-2 ${index === pageIndex ? 'border-emerald-400' : 'border-transparent opacity-65 hover:opacity-100'}`}
              aria-label={`查看 P${String(item.pageNumber).padStart(2, '0')} ${item.title}`}
            >
              <img src={item.runtimeRef} alt="" loading="lazy" className="aspect-video w-full object-cover" />
              <span className="absolute bottom-0 left-0 right-0 bg-black/70 px-1.5 py-1 text-[10px]">P{String(item.pageNumber).padStart(2, '0')}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
