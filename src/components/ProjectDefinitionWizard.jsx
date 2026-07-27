import { useRef } from 'react';
import { BUDGET_OPTIONS, DESIGN_STAGES, PROJECT_TYPES } from '../data/demoCase';

const SUGGESTED_TYPES = ['项目任务书', '场地基础资料', '设计要求与约束', '参考案例与风格偏好'];

function inferCategory(file) {
  const name = file.name || '';
  const extension = name.split('.').pop()?.toLowerCase();
  if (/任务书/.test(name)) return '项目任务书';
  if (/需求|约束|访谈|纪要/.test(name)) return '甲方需求文件';
  if (/照片|现状/.test(name) || ['jpg', 'jpeg', 'png', 'zip'].includes(extension)) return '场地照片';
  if (/区位|周边/.test(name)) return '区位资料';
  if (/红线|底图|总平/.test(name) || ['dwg', 'dxf'].includes(extension)) return 'CAD／红线／总平底图';
  if (/参考|案例|风格/.test(name)) return '参考案例';
  if (['ppt', 'pptx'].includes(extension)) return '原有 PPT 或文本提纲';
  return '原有设计资料';
}

function formatFileSize(size) {
  if (!Number.isFinite(size)) return '未知大小';
  if (size >= 1024 * 1024) return `${(size / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(size / 1024))} KB`;
}

function mergeProjectFiles(existingFiles, files) {
  const existing = existingFiles || [];
  const existingNames = new Set(existing.map((file) => file.name));
  const additions = Array.from(files || [])
    .filter((file) => !existingNames.has(file.name))
    .map((file) => ({
      name: file.name,
      type: file.name.split('.').pop()?.toUpperCase() || file.type || '未知',
      size: formatFileSize(file.size),
      category: inferCategory(file),
      status: '已上传，待解析',
    }));
  return [...existing, ...additions];
}

function PageTitle({ title, subtitle, onFillDemo }) {
  return (
    <div className="flex items-start justify-between gap-5">
      <div>
        <h3 className="text-2xl font-bold text-[var(--lf-brand-950)]">{title}</h3>
        <p className="mt-1.5 text-sm text-[var(--lf-muted)]">{subtitle}</p>
      </div>
      {onFillDemo && <button type="button" onClick={onFillDemo} className="btn-gold shrink-0 px-4 py-2.5 text-sm">一键填入演示案例</button>}
    </div>
  );
}

function BasicInfoStep({ formData, onFormUpdate, onFillDemo, onNext, onNotice }) {
  const handleNext = () => {
    const missing = [
      ['projectName', '项目名称'],
      ['city', '项目地点'],
      ['projectType', '项目类型'],
    ].filter(([key]) => !String(formData[key] || '').trim()).map(([, label]) => label);
    if (missing.length) {
      onNotice(`请先填写：${missing.join('、')}`);
      return;
    }
    onNext();
  };

  return (
    <div className="project-wizard-page">
      <PageTitle title="项目基本信息" subtitle="请填写项目的基础信息与关键设计边界，也可一键填入演示案例。" onFillDemo={onFillDemo} />
      <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <label className="form-label">项目名称
          <input data-testid="field-projectName" value={formData.projectName || ''} onChange={(event) => onFormUpdate('projectName', event.target.value)} className="form-input mt-1.5" placeholder="例如：社区公园更新设计" />
        </label>
        <label className="form-label">项目地点
          <input data-testid="field-city" value={formData.city || ''} onChange={(event) => onFormUpdate('city', event.target.value)} className="form-input mt-1.5" placeholder="城市 / 区域" />
        </label>
        <label className="form-label">项目类型
          <select data-testid="field-projectType" value={formData.projectType || ''} onChange={(event) => onFormUpdate('projectType', event.target.value)} className="form-select mt-1.5">
            <option value="">请选择项目类型</option>
            {PROJECT_TYPES.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="form-label">项目面积
          <span className="relative mt-1.5 block">
            <input data-testid="field-area" type="number" min="0" value={formData.area || ''} onChange={(event) => onFormUpdate('area', event.target.value)} className="form-input pr-12" placeholder="例如：10000" />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-[var(--lf-muted)]">㎡</span>
          </span>
        </label>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="form-label">设计阶段
          <select data-testid="field-designStage" value={formData.designStage || ''} onChange={(event) => onFormUpdate('designStage', event.target.value)} className="form-select mt-1.5">
            <option value="">请选择设计阶段</option>
            {DESIGN_STAGES.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="form-label">预算条件
          <select data-testid="field-budgetCondition" value={formData.budgetCondition || ''} onChange={(event) => onFormUpdate('budgetCondition', event.target.value)} className="form-select mt-1.5">
            <option value="">请选择预算条件</option>
            {BUDGET_OPTIONS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="form-label">设计目标
          <textarea data-testid="field-designGoals" value={formData.designGoals || ''} onChange={(event) => onFormUpdate('designGoals', event.target.value)} className="form-input mt-1.5 min-h-[132px] resize-none" placeholder="描述项目需要解决的核心目标" />
        </label>
        {formData.demoProjectInput ? (
          <div className="form-label">核心约束
            <div data-testid="field-constraints-pending" className="mt-1.5 min-h-[132px] rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
              正式红线、测绘、现状乔木、地下管线、市政排水接口、投资上限与运维主体均待后续资料确认。
            </div>
          </div>
        ) : (
          <label className="form-label">核心约束
            <textarea data-testid="field-constraints" value={formData.constraints || ''} onChange={(event) => onFormUpdate('constraints', event.target.value)} className="form-input mt-1.5 min-h-[132px] resize-none" placeholder="描述造价、维护、场地与规范条件" />
          </label>
        )}
      </div>

      <div className="project-wizard-actions">
        <button type="button" disabled className="btn-secondary invisible px-6 py-3">上一步</button>
        <button data-testid="basic-next" type="button" onClick={handleNext} className="btn-primary px-8 py-3 text-base">开始整理项目资料</button>
      </div>
    </div>
  );
}

function UploadStep({
  formData,
  organizing,
  organizingStep,
  onFormUpdate,
  onFillDemo,
  onPrevious,
  onNext,
}) {
  const fileInputRef = useRef(null);
  const mergeFiles = (files) => {
    const nextFiles = mergeProjectFiles(formData.siteFiles, files);
    if (nextFiles.length !== (formData.siteFiles || []).length) onFormUpdate('siteFiles', nextFiles);
  };
  const removeFile = (name) => onFormUpdate('siteFiles', (formData.siteFiles || []).filter((file) => file.name !== name));
  const loadingLabels = ['正在读取基本信息', '正在识别项目资料', '正在检查资料完整性'];

  return (
    <div className="project-wizard-page">
      <PageTitle title="项目资料上传" subtitle="所有资料统一进入一个入口，系统将自动识别资料类型。" onFillDemo={onFillDemo} />

      <div
        className="project-upload-dropzone"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => { event.preventDefault(); mergeFiles(event.dataTransfer.files); }}
      >
        <svg className="mx-auto h-12 w-12 text-[var(--lf-brand-500)]" viewBox="0 0 48 48" fill="none" aria-hidden="true">
          <path d="M24 32V12m0 0-7 7m7-7 7 7M9 29v7a4 4 0 0 0 4 4h22a4 4 0 0 0 4-4v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <h4 className="mt-3 text-lg font-bold text-[var(--lf-brand-950)]">拖拽或点击上传项目资料</h4>
        <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-[var(--lf-muted)]">支持项目任务书、场地照片、区位图、红线或 CAD 底图、甲方需求、参考案例及原有汇报资料。</p>
        <p className="mt-2 text-xs font-semibold tracking-wide text-[var(--lf-brand-600)]">PDF、DOCX、PPTX、JPG、PNG、DWG、DXF、ZIP</p>
        <button type="button" onClick={() => fileInputRef.current?.click()} className="btn-secondary mt-4 px-5 py-2.5">选择项目文件</button>
        <input ref={fileInputRef} type="file" multiple className="hidden" accept=".pdf,.doc,.docx,.ppt,.pptx,.dwg,.dxf,.jpg,.jpeg,.png,.zip" onChange={(event) => mergeFiles(event.target.files)} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="mr-1 text-xs font-semibold text-[var(--lf-muted)]">建议上传</span>
        {SUGGESTED_TYPES.map((item) => <span key={item} className="rounded-full border border-violet-100 bg-[var(--lf-brand-50)] px-3 py-1.5 text-xs text-[var(--lf-brand-700)]">{item}</span>)}
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-[var(--lf-border)] bg-white">
        <div className="flex items-center justify-between border-b border-[var(--lf-border)] px-4 py-3">
          <p className="text-sm font-bold text-[var(--lf-brand-950)]">已上传资料</p>
          <span className="text-xs text-[var(--lf-muted)]">{formData.siteFiles?.length || 0} 个文件</span>
        </div>
        <div className="max-h-[214px] overflow-y-auto">
          {formData.siteFiles?.length ? formData.siteFiles.map((file) => (
            <div key={file.name} className="project-file-row">
              <span className="truncate font-semibold text-[var(--lf-text)]">{file.displayName || file.name}</span>
              <span>{file.displayType || file.type || file.name.split('.').pop()?.toUpperCase()}</span>
              <span>{file.size}</span>
              <span className="truncate text-[var(--lf-brand-600)]">{file.category || '项目资料'}</span>
              <button type="button" onClick={() => removeFile(file.name)} className="text-rose-500" aria-label={`删除 ${file.displayName || file.name}`}>删除</button>
            </div>
          )) : <p className="py-9 text-center text-sm text-slate-400">尚未上传项目资料</p>}
        </div>
      </div>

      {organizing && (
        <div className="mt-4 rounded-2xl border border-cyan-100 bg-cyan-50 px-5 py-4">
          <div className="grid gap-2 sm:grid-cols-3">
            {loadingLabels.map((label, index) => <p key={label} className={`text-sm font-semibold ${index <= organizingStep ? 'text-cyan-800' : 'text-slate-400'}`}>{index < organizingStep ? '✓' : index === organizingStep ? '●' : '○'} {label}</p>)}
          </div>
        </div>
      )}

      <div className="project-wizard-actions">
        <button type="button" onClick={onPrevious} disabled={organizing} className="btn-secondary px-6 py-3 disabled:opacity-40">上一步</button>
        <button data-testid="upload-next" type="button" onClick={onNext} disabled={organizing} className="btn-primary px-8 py-3 text-base disabled:cursor-wait disabled:opacity-70">{organizing ? '正在整理资料…' : '下一步：整理资料'}</button>
      </div>
    </div>
  );
}

function ReviewStep({
  formData,
  onFormUpdate,
  onFillDemoFiles,
  onPrevious,
  onConfirm,
}) {
  const supplementInputRef = useRef(null);
  const files = formData.siteFiles || [];
  const categories = new Set(files.map((file) => file.category));
  const hasCritical = ['项目任务书', '甲方需求文件', 'CAD／红线／总平底图'].some((category) => categories.has(category));
  const readyItems = [
    ['项目任务书', categories.has('项目任务书')],
    ['场地基础资料', categories.has('场地照片') || categories.has('原有设计资料')],
    ['项目目标与约束', Boolean(formData.designGoals && formData.constraints)],
    ['区位资料', categories.has('区位资料')],
    ['正式红线／总平底图', categories.has('CAD／红线／总平底图')],
    ['参考案例', categories.has('参考案例') || files.some((file) => /参考|案例|风格/.test(file.name))],
    ['汇报资料', categories.has('原有 PPT 或文本提纲')],
  ];
  const areaText = formData.area
    ? (/㎡|平方米|平米|m²/i.test(String(formData.area)) ? String(formData.area) : `约 ${formData.area}㎡`)
    : '待补充';
  const areaPendingVerification = formData.areaStatus === 'pendingVerification';
  const areaDisplay = areaPendingVerification
    ? `${areaText}（工具量测，待正式红线复核）`
    : areaText;
  const detectedCategories = [...categories].filter(Boolean);
  const siteConditionText = [formData.constraints, formData.siteConditions]
    .filter(Boolean)
    .map(String)
    .find((value) => /植被|乔木|树木|出入口|入口/.test(value));
  const recognized = [
    { status: formData.projectName ? 'confirmed' : 'pending', text: formData.projectName ? `已确认项目名称：${formData.projectName}` : '项目名称：待补充' },
    { status: formData.city ? 'confirmed' : 'pending', text: formData.city ? `已确认项目地点：${formData.city}` : '项目地点：待补充' },
    {
      status: formData.area && !areaPendingVerification ? 'confirmed' : 'pending',
      text: formData.area
        ? areaPendingVerification
          ? `已量测项目面积：${areaDisplay}`
          : `已确认项目面积：${areaText}`
        : '项目面积：待补充',
    },
    { status: formData.projectType ? 'confirmed' : 'pending', text: formData.projectType ? `已确认项目类型：${formData.projectType}` : '项目类型：待补充' },
    { status: files.length ? 'confirmed' : 'pending', text: files.length ? `已上传 ${files.length} 份项目资料` : '项目资料：待上传' },
    { status: detectedCategories.length ? 'confirmed' : 'pending', text: detectedCategories.length ? `已检测到资料类型：${detectedCategories.join('、')}` : '资料类型：待上传后检测' },
    { status: formData.targetUsers ? 'confirmed' : 'pending', text: formData.targetUsers ? `已识别服务人群：${formData.targetUsers}` : '服务人群：待补充 / 待解析' },
    { status: formData.designGoals ? 'confirmed' : 'pending', text: formData.designGoals ? `已识别设计目标：${formData.designGoals}` : '设计目标：待补充 / 待解析' },
    { status: siteConditionText ? 'confirmed' : 'pending', text: siteConditionText ? `已识别场地条件：${siteConditionText}` : '场地植被与出入口：待解析' },
    { status: formData.maintenance ? 'confirmed' : 'pending', text: formData.maintenance ? `已识别运维要求：${formData.maintenance}` : '运维要求：待补充 / 待解析' },
    { status: formData.budgetCondition ? 'confirmed' : 'pending', text: formData.budgetCondition ? `已识别造价要求：${formData.budgetCondition}` : '造价要求：待补充' },
  ];
  const suggestions = ['正式红线与测绘资料', '详细现状高程数据', '地下管线资料', '精确投资控制指标'];
  const summary = [
    ['项目名称', formData.projectName || '待补充'],
    ['项目地点', formData.city || '待补充'],
    ['项目类型', formData.projectType || '待补充'],
    ['项目面积', areaDisplay],
    ['设计阶段', formData.designStage || '待补充'],
    ['预算条件', formData.budgetCondition || '待补充'],
    ['已上传资料', `${files.length} 份`],
  ];
  const mergeSupplementFiles = (selectedFiles) => {
    const nextFiles = mergeProjectFiles(files, selectedFiles);
    if (nextFiles.length !== files.length) onFormUpdate('siteFiles', nextFiles);
  };

  return (
    <div className="project-wizard-page">
      <PageTitle title="资料整理与完整性检查" subtitle="核对项目输入边界，缺少的核心资料可在当前页直接补充。" />

      <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 rounded-2xl border border-[var(--lf-border)] bg-white p-5 md:grid-cols-4">
        {summary.map(([label, value]) => <div key={label}><p className="text-xs text-[var(--lf-muted)]">{label}</p><p className="mt-1 truncate text-sm font-semibold text-[var(--lf-text)]">{value}</p></div>)}
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-2xl border border-violet-100 bg-[var(--lf-brand-50)] p-5">
          <h4 className="text-base font-bold text-[var(--lf-brand-950)]">当前确认与待解析信息</h4>
          <div className="mt-3 space-y-2.5">
            {recognized.map((item) => (
              <p key={item.text} className="flex gap-2 text-sm leading-6 text-[var(--lf-text)]">
                <span className={item.status === 'confirmed' ? 'text-emerald-600' : 'text-amber-500'}>{item.status === 'confirmed' ? '✓' : '○'}</span>
                {item.text}
              </p>
            ))}
          </div>
        </section>
        <section className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
            <h4 className="text-base font-bold text-emerald-900">核心资料已具备</h4>
            <div className="mt-3 space-y-2">{readyItems.filter(([, ready]) => ready).map(([item]) => <p key={item} className="text-sm text-emerald-800">✓ {item}</p>)}</div>
          </div>
          <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5">
            <h4 className="text-base font-bold text-amber-900">后续深化建议补充</h4>
            <div className="mt-3 space-y-2">{suggestions.map((item) => <p key={item} className="text-sm text-amber-800">＋ {item}</p>)}</div>
          </div>
        </section>
      </div>

      <div className={`mt-5 rounded-2xl border px-5 py-4 ${hasCritical ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
        <p className={`text-base font-bold ${hasCritical ? 'text-emerald-800' : 'text-amber-800'}`}>{hasCritical ? '核心资料已满足，可以开始整理' : '还需补充至少一项核心项目资料'}</p>
        <p className="mt-1 text-sm text-[var(--lf-muted)]">{hasCritical ? '补充结果已即时更新，无需返回上一页。' : '补充项目任务书、甲方需求文件或红线底图后，即可开始整理。'}</p>
        {!hasCritical && (
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" onClick={() => supplementInputRef.current?.click()} className="btn-secondary px-4 py-2.5 text-sm">上传补充资料</button>
            <button type="button" onClick={onFillDemoFiles} className="btn-gold px-4 py-2.5 text-sm">载入演示补充资料</button>
            <input
              ref={supplementInputRef}
              type="file"
              multiple
              className="hidden"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.dwg,.dxf,.jpg,.jpeg,.png,.zip"
              onChange={(event) => {
                mergeSupplementFiles(event.target.files);
                event.target.value = '';
              }}
            />
          </div>
        )}
      </div>

      <div className="project-wizard-actions">
        <button type="button" onClick={onPrevious} className="btn-secondary px-6 py-3">上一步</button>
        <button data-testid="review-confirm" type="button" onClick={onConfirm} disabled={!hasCritical} className="btn-primary px-8 py-3 text-base disabled:cursor-not-allowed disabled:opacity-40">开始整理项目资料</button>
      </div>
    </div>
  );
}

export default function ProjectDefinitionWizard({
  formData,
  step,
  organizing,
  organizingStep,
  onFormUpdate,
  onFillDemoBasic,
  onFillDemoFiles,
  onFillDemoAll,
  onSetStep,
  onReviewMaterials,
  onConfirmAndGenerate,
  onNotice,
}) {
  return (
    <div className="project-wizard">
      {step === 0 && <BasicInfoStep formData={formData} onFormUpdate={onFormUpdate} onFillDemo={onFillDemoBasic} onNext={() => onSetStep(1)} onNotice={onNotice} />}
      {step === 1 && <UploadStep formData={formData} organizing={organizing} organizingStep={organizingStep} onFormUpdate={onFormUpdate} onFillDemo={onFillDemoFiles} onPrevious={() => onSetStep(0)} onNext={onReviewMaterials} />}
      {step === 2 && <ReviewStep formData={formData} onFormUpdate={onFormUpdate} onFillDemoFiles={onFillDemoFiles} onPrevious={() => onSetStep(1)} onConfirm={onConfirmAndGenerate} />}
    </div>
  );
}
