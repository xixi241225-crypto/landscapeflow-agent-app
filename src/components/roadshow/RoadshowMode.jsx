import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PresentationDeckViewer from '../PresentationDeckViewer';
import {
  isRoadshowResultsReady,
  selectDesignExecutionTrace,
  selectRoadshowResults,
} from '../../blueprint/blueprintSelectors';
import { loadActiveProject } from '../../lib/projectStorage';

const RESULT_STAGES = ['项目资料', '设计蓝本', 'Agent 协作', '完整成果'];

function CheckIcon({ className = 'h-5 w-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m5 12 4 4L19 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RoadshowImage({ src, alt, fit = 'cover', className = '', placeholder = '专业图纸槽位｜待生成' }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className={`roadshow-image-placeholder ${className}`} role="img" aria-label={placeholder}>
        <div className="roadshow-placeholder-lines" aria-hidden="true" />
        <svg className="h-10 w-10 text-[var(--lf-brand-500)]/55" viewBox="0 0 48 48" fill="none" aria-hidden="true">
          <path d="M7 36c6-10 11-15 18-15 6 0 10 4 16 13M8 40h32" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M31 9c0 5-3 9-8 9s-8-4-8-9M23 6v16M17 11l12 6M29 11l-12 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
        <span>{placeholder}</span>
      </div>
    );
  }
  return <img src={src} alt={alt} className={className} style={{ objectFit: fit }} onError={() => setFailed(true)} />;
}

function RoadshowHeader({ onHome }) {
  return (
    <header className="roadshow-header">
      <button onClick={onHome} className="flex shrink-0 items-center gap-3 text-left" aria-label="返回产品首页">
        <span className="brand-mark h-10 w-10 rounded-xl">L</span>
        <span>
          <span className="brand-gradient-text block text-base font-bold">LandscapeFlow AI</span>
          <span className="block text-xs text-slate-500">景观方案设计总监智能体</span>
        </span>
      </button>
      <div className="roadshow-stage-nav" aria-label="成果生成进度">
        {RESULT_STAGES.map((label, index) => (
          <div key={label} className={`roadshow-stage-item ${index === RESULT_STAGES.length - 1 ? 'active' : 'done'}`}>
            <span>{index < RESULT_STAGES.length - 1 ? <CheckIcon className="h-3.5 w-3.5" /> : index + 1}</span>
            <p>{label}</p>
          </div>
        ))}
      </div>
      <div className="hidden shrink-0 text-right lg:block">
        <p className="text-xs font-bold text-[var(--lf-brand-700)]">项目成果 · RESULTS</p>
        <p className="mt-0.5 text-xs text-[var(--lf-muted)]">最终交付成果</p>
      </div>
    </header>
  );
}

function BlueprintStatusBar() {
  return (
    <div className="roadshow-blueprint-status">
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white"><CheckIcon className="h-4 w-4" /></span>
      <span className="font-bold text-[var(--lf-brand-950)]">项目设计蓝本已归档</span>
      <span className="hidden h-4 w-px bg-violet-200 sm:block" />
      <span className="text-emerald-700">六个专业 Agent 已完成</span>
      <span className="hidden h-4 w-px bg-violet-200 md:block" />
      <span className="hidden text-[var(--lf-muted)] md:inline">最终成果已确认</span>
    </div>
  );
}

function ResultsTabs({ active, onChange }) {
  const tabs = [
    ['definition', '项目定义与概念'],
    ['spatial', '总平面与分析'],
    ['visual', '视觉表达'],
    ['presentation', '方案汇报成果'],
  ];
  return (
    <div className="roadshow-results-tabs">
      {tabs.map(([id, label]) => <button key={id} onClick={() => onChange(id)} className={active === id ? 'active' : ''}>{label}</button>)}
    </div>
  );
}

function DefinitionResult({ result }) {
  const concept = result.selectedConcept;
  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <article className="roadshow-result-panel p-7">
        <p className="roadshow-eyebrow">PROJECT DEFINITION</p>
        <h2 className="mt-2 text-3xl font-bold text-[var(--lf-brand-950)]">{result.positioning}</h2>
        <div className="mt-6 rounded-2xl bg-[var(--lf-brand-950)] p-6 text-white">
          <p className="text-sm font-semibold text-violet-200">设计师已选概念</p>
          <p className="mt-2 font-serif text-4xl font-bold">{concept?.name || '概念方向待确认'}</p>
          <p className="mt-3 text-base leading-7 text-violet-100">{concept?.proposition || concept?.narrative || '等待 Blueprint 写入概念结果'}</p>
        </div>
        <div className="mt-6 space-y-3">
          {result.strategies.slice(0, 5).map((strategy, index) => (
            <p key={`${index}-${strategy}`} className="flex gap-3 text-base leading-7">
              <span className="font-extrabold text-[var(--lf-brand-600)]">{String(index + 1).padStart(2, '0')}</span>
              <span>{strategy}</span>
            </p>
          ))}
        </div>
      </article>
      <div className="roadshow-result-panel overflow-hidden">
        <RoadshowImage
          src={result.conceptImage?.url}
          alt={`${concept?.name || '概念方向'}演示意向`}
          className="h-full min-h-[470px] w-full"
          placeholder="概念意向图｜待生成"
        />
      </div>
    </div>
  );
}

function SpatialResult({ result }) {
  const structure = result.spatialStructure;
  const plan = result.planAsset;
  return (
    <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
      <article className="roadshow-result-panel overflow-hidden">
        <div className="border-b border-[var(--lf-border)] px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-[var(--lf-brand-950)]">{structure?.title || '空间结构待生成'}</h2>
              <p className="mt-1 text-sm leading-6 text-[var(--lf-muted)]">{structure?.value || '等待 Blueprint 写入空间结构'}</p>
            </div>
            <span className="roadshow-status-pill demo">{plan?.isDemoAsset ? '演示素材' : '成果资产'}</span>
          </div>
        </div>
        <RoadshowImage
          src={plan?.url}
          alt={plan?.title || '空间策略总平面'}
          fit="contain"
          className="h-[580px] w-full bg-slate-50"
          placeholder="空间策略总平面｜待生成"
        />
      </article>
      <div className="grid gap-4">
        {result.analysisAssets.map((item) => (
          <article key={item.id} className="roadshow-result-panel grid grid-cols-[38%_1fr] overflow-hidden">
            <RoadshowImage src={item.url} alt={item.title} fit="contain" className="h-full min-h-[170px] w-full" placeholder={`${item.title}｜待深化`} />
            <div className="flex flex-col justify-center p-5">
              <span className="text-xs font-bold text-[var(--lf-brand-600)]">{item.id}</span>
              <h3 className="mt-2 text-xl font-bold">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--lf-muted)]">{item.content}</p>
            </div>
          </article>
        ))}
        {!result.analysisAssets.length && (
          <article className="roadshow-result-panel p-6 text-sm text-[var(--lf-muted)]">当前 Blueprint 尚未生成分析内容。</article>
        )}
      </div>
    </div>
  );
}

function VisualResult({ result }) {
  const strategyCards = [
    ['植物策略', result.professionalStrategies.plant],
    ['材料策略', result.professionalStrategies.material],
    ['生态策略', result.professionalStrategies.ecology],
  ].filter(([, value]) => value);
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {result.renderings.map((item) => (
        <article key={item.id} className="roadshow-result-panel overflow-hidden">
          <RoadshowImage src={item.url} alt={item.title} className="aspect-video w-full" />
          <div className="p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-2xl font-bold">{item.title}</h2>
              <span className="roadshow-status-pill demo">{item.isDemoAsset ? '演示案例' : '成果资产'}</span>
            </div>
            <p className="mt-2 text-base text-[var(--lf-muted)]">
              {result.visualTasks.find((task) => task.id === item.id)?.activity || item.assetType}
            </p>
          </div>
        </article>
      ))}
      {strategyCards.map(([title, value], index) => {
        const image = result.analysisAssets[index % Math.max(result.analysisAssets.length, 1)]?.url;
        return (
          <article key={title} className="roadshow-result-panel grid overflow-hidden sm:grid-cols-[42%_1fr]">
            <RoadshowImage src={image} alt={title} className="h-full min-h-[230px] w-full" fit="contain" placeholder={`${title}｜待深化`} />
            <div className="flex flex-col justify-center p-6">
              <p className="roadshow-eyebrow">PROFESSIONAL STRATEGY</p>
              <h2 className="mt-2 text-2xl font-bold">{title}</h2>
              <p className="mt-3 text-base leading-7 text-[var(--lf-muted)]">{value}</p>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function PresentationResult({ result, onDownload, onPreview }) {
  return (
    <div>
      <article className="roadshow-ppt-file">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[var(--lf-brand-950)] text-lg font-black text-white">14P</div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-2xl font-bold text-[var(--lf-brand-950)]">{result.title}</h2>
            <span className="roadshow-status-pill success">{result.pageCount} 页成果已确认</span>
          </div>
          <p className="mt-2 text-base text-[var(--lf-muted)]">{result.status}</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button onClick={onPreview} className="btn-secondary px-5 py-3 text-base">全屏预览</button>
          <a href={result.fileUrl} download={result.fileName} onClick={onDownload} className="btn-primary px-5 py-3 text-base">下载完整成果包</a>
        </div>
      </article>

      <div className="mt-6 flex items-end justify-between gap-4">
        <div>
          <p className="roadshow-eyebrow">{result.pageCount}-PAGE PRESENTATION IMAGE DECK</p>
          <h2 className="mt-1 text-2xl font-bold text-[var(--lf-brand-950)]">完整方案汇报成果</h2>
        </div>
        <p className="hidden text-sm text-[var(--lf-muted)] md:block">P01–P14 已通过 Gate 5 复核</p>
      </div>
      <div className="roadshow-slide-grid">
        {result.slides.map((slide) => (
          <article key={slide.number} className="roadshow-slide">
            <div className="roadshow-slide-visual">
              <RoadshowImage src={slide.image} alt={slide.title} className="h-full w-full" fit={/总平|结构/.test(slide.title) ? 'contain' : 'cover'} placeholder={`${slide.suggestedVisual}｜待深化`} />
              <span>{String(slide.number).padStart(2, '0')}</span>
              <i>LandscapeFlow AI</i>
            </div>
            <div className="p-3.5">
              <h3>{slide.title}</h3>
              <p>{slide.upScreenCopy}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function DesignTraceDialog({ open, trace, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/55 p-6" role="dialog" aria-modal="true" aria-label="设计执行轨迹详情">
      <section className="max-h-[82vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-7 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="roadshow-eyebrow">DESIGN TRACE</p>
            <h2 className="mt-1 text-2xl font-bold text-[var(--lf-brand-950)]">设计执行轨迹</h2>
            <p className="mt-2 text-sm text-[var(--lf-muted)]">展示本次设计师专业意见与对应成果更新，不暴露内部运行字段。</p>
          </div>
          <button type="button" onClick={onClose} className="btn-secondary px-4 py-2 text-sm">关闭</button>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {['项目理解已确认', '方案方向已确认', '设计说明已完成分项复核', '视觉成果与最终汇报已确认'].map((item) => (
            <p key={item} className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">✓ {item}</p>
          ))}
        </div>
        <div className="mt-6 space-y-3">
          {trace.map((item) => (
            <article key={item.traceId} className="rounded-2xl border border-violet-100 bg-violet-50/50 p-5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-bold text-[var(--lf-brand-950)]">{item.sectionTitle || '设计说明专业修改'}</h3>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-emerald-700">{item.status === 'completed' ? '已完成' : '处理中'}</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-700"><b>设计师意见：</b>{item.comment || '无补充意见'}</p>
              <p className="mt-2 text-sm leading-6 text-[var(--lf-muted)]">Agent 4 已按意见重新生成对应分项，后续成果继续沿用更新后的设计说明。</p>
            </article>
          ))}
          {!trace.length && <p className="rounded-2xl border border-violet-100 bg-violet-50 p-5 text-sm text-[var(--lf-muted)]">本次方案没有需要单独重新生成的设计说明分项。</p>}
        </div>
      </section>
    </div>
  );
}

function ResultsPage({ activeTab, onTabChange, onDownload, onPreview, onOpenTrace, results }) {
  const project = results.project;
  const areaLabel = /㎡|平方米|平米|m²/i.test(project.area) ? project.area : `${project.area}㎡`;
  return (
    <section className="roadshow-content roadshow-page-scroll">
      <div className="mx-auto max-w-[1500px] px-6 py-7 lg:px-10">
        <div className="roadshow-title-row">
          <div>
            <p className="roadshow-eyebrow">COMPLETE LANDSCAPE SCHEME</p>
            <h1>{project.projectName}</h1>
            <p className="mt-2 text-sm font-semibold text-[var(--lf-muted)]">{project.location} · {areaLabel} · {project.projectType}</p>
            <p className="mt-1 text-sm font-semibold text-[var(--lf-brand-700)]">当前方案：{results.definition.selectedConcept?.name || '待确认'}</p>
            <p className="mt-1 font-semibold text-emerald-700">最终状态：已完成</p>
          </div>
          <div className="hidden rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-right md:block">
            <p className="text-sm font-semibold text-emerald-700">项目状态</p>
            <p className="mt-1 text-lg font-bold text-emerald-900">成果已完整归档</p>
          </div>
        </div>
        <div className="roadshow-results-summary">
          {results.summary.map((item) => <div key={item.key}><strong>{item.value}</strong><span>{item.label}</span></div>)}
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4" data-testid="final-deliverable-checklist">
          {['设计说明', '专业分析图', '重点视觉成果', '14 页景观概念方案汇报'].map((item) => (
            <div key={item} className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">✓ {item}</div>
          ))}
        </div>
        <ResultsTabs active={activeTab} onChange={onTabChange} />
        <div className="mt-6">
          {activeTab === 'definition' && <DefinitionResult result={results.definition} />}
          {activeTab === 'spatial' && <SpatialResult result={results.spatial} />}
          {activeTab === 'visual' && <VisualResult result={results.visual} />}
          {activeTab === 'presentation' && <PresentationResult result={results.presentation} onDownload={onDownload} onPreview={onPreview} />}
        </div>
        <section className="mt-8 rounded-2xl border border-violet-100 bg-white p-5" data-testid="results-design-trace-entry">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold tracking-[0.14em] text-[var(--lf-brand-600)]">DESIGN TRACE</p>
              <h2 className="mt-1 text-xl font-bold text-[var(--lf-brand-950)]">设计执行轨迹</h2>
              <p className="mt-2 text-sm text-[var(--lf-muted)]">本项目已记录关键设计选择、修改和成果版本。</p>
            </div>
            <button type="button" onClick={onOpenTrace} className="btn-secondary px-5 py-2.5 text-sm">查看设计执行轨迹</button>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {['项目理解确认', '方案方向确认', '设计说明复核', '视觉成果确认'].map((item) => <p key={item} className="rounded-xl bg-violet-50 px-4 py-3 text-sm font-semibold text-violet-800">✓ {item}</p>)}
          </div>
          <p className="mt-4 text-xs leading-6 text-[var(--lf-muted)]">经人工复核后，可进一步沉淀为后续项目可复用的设计经验。</p>
        </section>
      </div>
    </section>
  );
}

export default function RoadshowMode() {
  const navigate = useNavigate();
  const [resultsTab, setResultsTab] = useState('presentation');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [traceOpen, setTraceOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const activeProject = useMemo(() => loadActiveProject(), []);
  const blueprint = activeProject?.blueprint || null;
  const ready = isRoadshowResultsReady(blueprint);
  const results = useMemo(() => ready ? selectRoadshowResults(blueprint) : null, [blueprint, ready]);
  const designTrace = useMemo(() => ready ? selectDesignExecutionTrace(blueprint) : [], [blueprint, ready]);

  useEffect(() => {
    if (!ready) navigate('/workbench', { replace: true });
  }, [navigate, ready]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(''), 4800);
    return () => clearTimeout(timer);
  }, [notice]);

  const handlePresentationDownload = useCallback(() => {
    setNotice('完整成果包下载已开始。');
  }, [results]);

  if (!ready || !results) return null;

  return (
    <div className="roadshow-shell">
      <RoadshowHeader onHome={() => navigate('/')} />
      <BlueprintStatusBar />
      {notice && <div className="roadshow-notice">{notice}</div>}
      <main className="min-h-0 flex-1">
        <ResultsPage activeTab={resultsTab} onTabChange={setResultsTab} onDownload={handlePresentationDownload} onPreview={() => setPreviewOpen(true)} onOpenTrace={() => setTraceOpen(true)} results={results} />
      </main>
      <div className="roadshow-results-bottom">
        <button onClick={() => navigate('/workbench')} className="btn-secondary px-6 py-3 text-sm">返回工作台</button>
        <button onClick={() => setResultsTab('presentation')} className="btn-primary px-7 py-3 text-base">查看方案成果</button>
      </div>
      <PresentationDeckViewer open={previewOpen} artifact={blueprint.deliverableArtifacts?.presentation} onClose={() => setPreviewOpen(false)} />
      <DesignTraceDialog open={traceOpen} trace={designTrace} onClose={() => setTraceOpen(false)} />
    </div>
  );
}
