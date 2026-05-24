import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SchemeCards from './SchemeCards';
import ComparisonTable from './ComparisonTable';
import DeepenPlan from './DeepenPlan';
import ImageModal from './ImageModal';
import { downloadMarkdown } from '../lib/reportExporter';
import { DEMO_CASE } from '../data/demoCase';

const STEPS = [
  { key: 'step1', label: '项目定义 Agent', goal: '解析场地条件、识别缺失信息、做出合理假设' },
  { key: 'step2', label: '概念生成 Agent', goal: '生成三个差异化概念方案，覆盖不同设计策略' },
  { key: 'step3', label: '方案选择 Agent', goal: '六维度加权打分，推荐综合最优方案' },
  { key: 'step4', label: '空间推演 Agent', goal: '深化推荐方案，展开功能分区和游线组织' },
  { key: 'step5', label: '视觉表达 Agent', goal: '实时生成 + 精选成果库 + Prompt 指令包' },
  { key: 'step6', label: '输出成果 Agent', goal: 'Markdown 报告 + PPT 大纲 + 视觉成果包' },
];

/**
 * AgentContent — 单阶段视图
 *
 * 只渲染 viewedStep 对应的内容，不再把所有阶段堆在一起。
 * viewHeight 用于控制内容区高度（calc(100vh - header - bottomBar)）。
 */
export default function AgentContent({
  stepStatus,
  stepData,
  viewedStep,
  currentStep,
  isGenerating,
  projectName,
  demoPhase,
  formData,
  onFormUpdate,
  onFillDemo,
  onStartStepByStep,
  onStartAutoRun,
  onExport,
}) {
  const [modalImage, setModalImage] = useState(null);

  const step1 = stepData?.step1;
  const step2 = stepData?.step2;
  const step3 = stepData?.step3;
  const step4 = stepData?.step4;
  const step5 = stepData?.step5;
  const step6 = stepData?.step6;

  const schemes = step2?.schemes;
  const deepenedPlan = step4;
  const recommendedScheme = deepenedPlan?.recommendedScheme;
  const comparison = step3;
  const visualExpression = step5;
  const outputs = step6;

  const isIdle = demoPhase === 'idle';
  const currentStepData = STEPS[viewedStep];
  const currentStatus = stepStatus?.[`step${viewedStep + 1}`];

  return (
    <div className="flex flex-col" style={{ height: `calc(100vh - 56px - 56px)` }}>
      {/* Agent header for current step */}
      {currentStepData && (
        <AgentHeader
          stepIndex={viewedStep}
          status={currentStatus}
          isGenerating={isGenerating}
        />
      )}

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="max-w-4xl mx-auto">

        {/* ============================================ */}
        {/* STEP 0: 项目定义 Agent */}
        {/* ============================================ */}
        {viewedStep === 0 && (
          <>
            {isIdle && !step1 ? (
              /* Idle — show input form */
              <ProjectInputForm
                formData={formData}
                onFormUpdate={onFormUpdate}
                onFillDemo={onFillDemo}
                onStartStepByStep={onStartStepByStep}
                onStartAutoRun={onStartAutoRun}
              />
            ) : (
              /* Running or done — show analysis results */
              <>
                <JudgmentCard>
                  场地现状图已接收，关键场地矛盾识别完成。确定项目为城市更新型社区公园，核心挑战在于多元人群需求与有限用地之间的平衡，气候条件（北方四季分明）对植物配置和铺装材料选择具有决定性影响。
                </JudgmentCard>
                {step1 && <AnalysisResult data={step1} />}
                {step1?.siteImageContext && (
                  <div
                    className="rounded-xl p-3 mt-3"
                    style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.12)' }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium" style={{ color: '#60A5FA' }}>场地现状图处理结果</span>
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: '#A8A29A' }}>
                      {step1.siteImageContext.message}
                    </p>
                    {step1.siteImageContext.fileNames?.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-2">
                        {step1.siteImageContext.fileNames.map((f, idx) => (
                          <span key={idx} className="text-[10px]" style={{ color: '#555955' }}>· {f}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ============================================ */}
        {/* STEP 1: 概念生成 Agent */}
        {/* ============================================ */}
        {viewedStep === 1 && (
          <>
            {/* Missing info */}
            {step2?.missingInfo && (
              <>
                <JudgmentCard>
                  信息补全完成。已对缺失场地信息作出合理假设，确保概念方案生成具有充分依据，不因信息缺口而停滞。
                </JudgmentCard>
                <MissingInfoResult data={step2.missingInfo} />
              </>
            )}

            {/* Three schemes side by side */}
            {schemes && (
              <div className="mt-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1 h-3.5 rounded-full" style={{ background: '#22C55E' }} />
                  <span className="text-xs font-semibold" style={{ color: '#22C55E' }}>三个概念方案</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {schemes.map((s) => (
                    <div
                      key={s.id}
                      className="rounded-xl p-4 transition-all duration-300"
                      style={{
                        background: '#101211',
                        border: '1px solid rgba(255,255,255,0.06)',
                      }}
                    >
                      <div className="text-[10px] font-bold mb-1" style={{ color: s.id === 'B' ? '#D6B56D' : '#22C55E' }}>
                        方案 {s.id}
                      </div>
                      <h3 className="text-sm font-serif font-bold mb-2 text-[#F5F1E8]">{s.name}</h3>
                      <p className="text-[11px] leading-relaxed mb-3" style={{ color: '#78716C' }}>
                        {s.concept?.substring(0, 100)}...
                      </p>
                      <div className="text-[10px] mb-2" style={{ color: '#555955' }}>
                        空间结构
                      </div>
                      <p className="text-[11px] leading-relaxed mb-3" style={{ color: '#A8A29A' }}>
                        {s.spatialStructure?.substring(0, 120)}...
                      </p>
                      <div className="flex flex-wrap gap-1 mt-auto">
                        {s.pros?.slice(0, 3).map((p, i) => (
                          <span key={i} className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(34,197,94,0.06)', color: '#22C55E' }}>
                            {p.substring(0, 20)}...
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ============================================ */}
        {/* STEP 2: 方案选择 Agent */}
        {/* ============================================ */}
        {viewedStep === 2 && (
          <>
            <JudgmentCard type="gold">
              综合六维度加权打分结果，方案二「欢乐草坪·邻里活力客厅」在功能多样性、文化契合度、全龄友好度三项指标上优势显著，推荐作为深化方向。
            </JudgmentCard>

            {/* Recommendation card */}
            {recommendedScheme && (
              <div
                className="rounded-2xl p-5 mb-4 flex gap-5 items-start"
                style={{ background: '#101211', border: '1px solid rgba(214,181,109,0.18)' }}
              >
                <div
                  className="w-32 h-24 rounded-xl overflow-hidden flex-shrink-0 cursor-pointer"
                  style={{ background: '#0B0C0B', border: '1px solid rgba(255,255,255,0.06)' }}
                  onClick={() => setModalImage({ src: '/demo-images/aerial.jpg', title: '方案推荐 · 鸟瞰总览图' })}
                >
                  <img
                    src="/demo-images/aerial.jpg"
                    alt="方案缩略图"
                    className="w-full h-full object-cover hover:opacity-80 transition-opacity"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(214,181,109,0.1)', color: '#D6B56D', border: '1px solid rgba(214,181,109,0.2)' }}>
                      ★ 推荐方案
                    </span>
                  </div>
                  <h3 className="text-lg font-serif font-bold mb-1.5 text-[#F5F1E8]">
                    {recommendedScheme.name}
                  </h3>
                  <p className="text-xs leading-relaxed mb-3" style={{ color: '#A8A29A' }}>
                    更契合欢乐谷片区文娱活力、社区共享和亲子使用场景，同时兼顾汇报表现力、落地性和维护成本。
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {['活力共享', '全龄友好', '四季有景', '生态低碳'].map((tag) => (
                      <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(214,181,109,0.07)', color: '#D6B56D', border: '1px solid rgba(214,181,109,0.15)' }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Comparison table */}
            {comparison && <ComparisonTable comparison={comparison} />}
            {schemes && !recommendedScheme && <SchemeCards schemes={schemes} />}
          </>
        )}

        {/* ============================================ */}
        {/* STEP 3: 空间推演 Agent */}
        {/* ============================================ */}
        {viewedStep === 3 && (
          <>
            <JudgmentCard>
              空间结构确定为「一心一环多点」：中央共享草坪为核心，环形慢行系统串联六个主题功能节点，游线清晰连续，功能分区互不干扰。
            </JudgmentCard>

            {/* Large plan image */}
            {(deepenedPlan?.planImage || outputs?.planImage) && (() => {
              const planImg = deepenedPlan?.planImage || outputs?.planImage;
              return (
                <div
                  className="rounded-2xl overflow-hidden cursor-pointer group relative mb-4"
                  style={{ background: '#0B0C0B', border: '1px solid rgba(255,255,255,0.06)' }}
                  onClick={() => setModalImage({ src: planImg.url, title: '总平面图 / 空间策略图' })}
                >
                  <img
                    src={planImg.url}
                    alt={planImg.title || '总平面图'}
                    className="w-full object-contain"
                    style={{ minHeight: '420px', maxHeight: '520px' }}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-all flex items-center justify-center">
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity px-4 py-1.5 rounded-lg text-xs text-white" style={{ background: 'rgba(0,0,0,0.55)' }}>
                      点击查看大图
                    </span>
                  </div>
                </div>
              );
            })()}
            <p className="text-xs mb-4 px-1" style={{ color: '#555955' }}>
              展示「一心一环多点」空间结构、功能分区与游线组织 · 点击查看大图
            </p>

            {/* Deepen details */}
            {deepenedPlan && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Space strategy */}
                <SpaceStrategy plan={deepenedPlan} />
                {/* Zones */}
                <div className="rounded-xl p-4" style={{ background: '#101211', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="text-xs font-medium mb-2 text-[#F5F1E8]">功能分区</div>
                  <div className="space-y-2">
                    {(deepenedPlan.functionalZones || []).slice(0, 7).map((z, i) => (
                      <div key={i} className="text-[11px] leading-relaxed" style={{ color: '#A8A29A' }}>
                        <span className="text-[#22C55E] mr-1">●</span>
                        <span className="font-medium">{z.name}</span>
                        <span className="text-[10px] ml-1" style={{ color: '#555955' }}>{z.function}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ============================================ */}
        {/* STEP 4: 视觉表达 Agent */}
        {/* ============================================ */}
        {viewedStep === 4 && visualExpression && (
          <>
            {/* Module 1: Realtime image */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-3.5 rounded-full" style={{ background: '#22C55E' }} />
                <span className="text-xs font-semibold text-[#F5F1E8]">实时生成结果</span>
                <span className="text-[9px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(34,197,94,0.08)', color: '#22C55E' }}>WorkBuddy 实时生成</span>
              </div>
              <JudgmentCard>
                实时生成用于证明 Agent 具备调用生成能力。精选成果库代表多轮生成、筛选和优化后的高质量成果，适用于正式汇报场景。
              </JudgmentCard>
              {visualExpression.realtimeImage?.url ? (
                <div
                  className="rounded-2xl overflow-hidden cursor-pointer group relative"
                  style={{ background: '#101211', border: '1px solid rgba(255,255,255,0.06)' }}
                  onClick={() => setModalImage({ src: visualExpression.realtimeImage.url, title: visualExpression.realtimeImage.title })}
                >
                  <img
                    src={visualExpression.realtimeImage.url}
                    alt={visualExpression.realtimeImage.title}
                    className="w-full object-contain"
                    style={{ minHeight: '260px', maxHeight: '360px' }}
                  />
                </div>
              ) : (
                <div
                  className="rounded-2xl flex flex-col items-center justify-center py-10"
                  style={{ background: '#101211', border: '1px solid rgba(255,255,255,0.05)' }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
                    style={{ background: 'rgba(214,181,109,0.06)', border: '1px solid rgba(214,181,109,0.12)' }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D6B56D" strokeWidth="1.2" strokeLinecap="round">
                      <rect x="3" y="3" width="18" height="18" rx="3" />
                      <circle cx="8.5" cy="8.5" r="1.5" fill="#D6B56D" fillOpacity="0.5" stroke="none" />
                      <path d="M21 15l-5-5L5 21" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium mb-1" style={{ color: '#A8A29A' }}>
                    WorkBuddy 实时生成结果将在演示视频中展示
                  </p>
                  <p className="text-xs text-center" style={{ color: '#555955' }}>
                    当前前端保留生成接口，接入 API 后自动展示实时结果
                  </p>
                </div>
              )}
            </div>

            {/* Module 2: Curated gallery — 2x2 core images */}
            {visualExpression?.curatedImages && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1 h-3.5 rounded-full" style={{ background: '#D6B56D' }} />
                  <span className="text-xs font-semibold text-[#F5F1E8]">精选成果库</span>
                  <span className="text-[9px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(214,181,109,0.08)', color: '#D6B56D' }}>多轮筛选优化成果</span>
                </div>
                <p className="text-[10px] mb-3" style={{ color: '#78716C' }}>
                  用于正式汇报场景，代表多轮生成、筛选和优化后的高质量成果。
                </p>
                {/* Core 4 images in 2x2 */}
                {(() => {
                  const coreIndices = [0, 1, 6, 7]; // aerial, entrance, awn, plan
                  const coreImages = coreIndices.map(i => visualExpression.curatedImages[i]).filter(Boolean);
                  return (
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      {coreImages.map((img, i) => (
                        <motion.div
                          key={i}
                          className="rounded-xl overflow-hidden cursor-pointer group"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.04 }}
                          style={{ background: '#101211', border: '1px solid rgba(214,181,109,0.1)' }}
                          onClick={() => setModalImage({ src: img.url, title: img.title })}
                        >
                          <div className="relative" style={{ height: '240px' }}>
                            <img src={img.url} alt={img.title} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-end justify-end p-2">
                              <span className="opacity-0 group-hover:opacity-100 transition-opacity px-2.5 py-1 rounded-lg text-[10px] text-white" style={{ background: 'rgba(0,0,0,0.6)' }}>
                                查看大图
                              </span>
                            </div>
                          </div>
                          <div className="px-3 py-2.5 border-t" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                            <p className="text-xs font-medium text-[#F5F1E8]">{img.title}</p>
                            <span className="text-[9px]" style={{ color: '#D6B56D' }}>精选成果</span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  );
                })()}

                {/* More images — collapsible */}
                {(() => {
                  const otherIndices = [2, 3, 4, 5]; // children, elderly, night, planting
                  const otherImages = otherIndices.map(i => visualExpression.curatedImages[i]).filter(Boolean);
                  if (otherImages.length === 0) return null;
                  return <CollapsibleSection title="查看更多成果" subtitle={`${otherImages.length} 张`} defaultOpen={false}>
                    <div className="grid grid-cols-2 gap-3 pt-3">
                      {otherImages.map((img, i) => (
                        <motion.div
                          key={i}
                          className="rounded-xl overflow-hidden cursor-pointer group"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.04 }}
                          style={{ background: '#101211', border: '1px solid rgba(255,255,255,0.06)' }}
                          onClick={() => setModalImage({ src: img.url, title: img.title })}
                        >
                          <div className="relative" style={{ height: '200px' }}>
                            <img src={img.url} alt={img.title} className="w-full h-full object-cover" />
                          </div>
                          <div className="px-3 py-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                            <p className="text-xs text-[#A8A29A]">{img.title}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </CollapsibleSection>;
                })()}
              </div>
            )}

            {/* Module 3: Prompt pack — collapsed */}
            {visualExpression?.prompts && (
              <CollapsibleSection title="Prompt 指令包" subtitle="5 条专业 Prompt" defaultOpen={false}>
                <div className="space-y-2 pt-3">
                  {visualExpression.prompts.map((p, i) => (
                    <div key={p.id} className="rounded-lg p-3" style={{ background: '#0E1110', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-[#F5F1E8]">{p.id}. {p.title}</span>
                      </div>
                      <p className="text-[10px]" style={{ color: '#555955' }}>
                        视角：{p.angle} · 时间：{p.time} · 风格：{p.style}
                      </p>
                      <p className="text-[10px] mt-1 leading-relaxed line-clamp-2" style={{ color: '#78716C' }}>
                        {p.cn}
                      </p>
                    </div>
                  ))}
                </div>
              </CollapsibleSection>
            )}
          </>
        )}

        {/* ============================================ */}
        {/* STEP 5: 输出成果 Agent */}
        {/* ============================================ */}
        {viewedStep === 5 && outputs && (
          <>
            <JudgmentCard type="gold">
              完整方案成果已生成。包含 Markdown 设计报告、8 页 PPT 汇报大纲及视觉成果包，可直接用于甲方汇报与内部评审。
            </JudgmentCard>

            {/* Three result cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
              {/* 1. Markdown report */}
              <div className="rounded-xl p-4" style={{ background: '#101211', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(214,181,109,0.08)' }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <rect x="1" y="1" width="12" height="12" rx="2" stroke="#D6B56D" strokeWidth="1.2" />
                      <path d="M4 4h6M4 7h6M4 10h3" stroke="#D6B56D" strokeWidth="1.2" strokeLinecap="round" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-[#F5F1E8]">Markdown 方案报告</div>
                    <div className="text-[9px]" style={{ color: '#555955' }}>完整六阶段输出内容</div>
                  </div>
                </div>
                <p className="text-[10px] leading-relaxed mb-3" style={{ color: '#78716C' }}>
                  包含项目概况、场地解析、三方案比选、推荐方案深化、效果图Prompt、PPT大纲等全流程内容。
                </p>
                <button
                  onClick={() => onExport?.()}
                  className="w-full py-2 text-xs rounded-lg"
                  style={{ background: 'rgba(214,181,109,0.1)', border: '1px solid rgba(214,181,109,0.2)', color: '#D6B56D' }}
                >
                  导出 Markdown
                </button>
              </div>

              {/* 2. PPT outline */}
              <div className="rounded-xl p-4" style={{ background: '#101211', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(34,197,94,0.08)' }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <rect x="2" y="1" width="10" height="9" rx="1.5" stroke="#22C55E" strokeWidth="1.2" />
                      <path d="M5 12v1M9 12v1M3 13h8" stroke="#22C55E" strokeWidth="1" strokeLinecap="round" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-[#F5F1E8]">PPT 汇报大纲</div>
                    <div className="text-[9px]" style={{ color: '#555955' }}>8 页汇报结构</div>
                  </div>
                </div>
                <div className="space-y-1 mb-3">
                  {outputs.pptOutline?.slice(0, 4).map((page, i) => (
                    <div key={i} className="flex items-start gap-2 text-[10px]" style={{ color: '#78716C' }}>
                      <span className="flex-shrink-0" style={{ color: '#22C55E' }}>{page.page}</span>
                      <span className="truncate">{page.title}</span>
                    </div>
                  ))}
                  <div className="text-[9px]" style={{ color: '#3D403C' }}>… 共 8 页</div>
                </div>
              </div>

              {/* 3. Visual package */}
              <div className="rounded-xl p-4" style={{ background: '#101211', border: '1px solid rgba(214,181,109,0.1)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.08)' }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <rect x="1" y="1" width="12" height="12" rx="2" stroke="#60A5FA" strokeWidth="1.2" />
                      <circle cx="5" cy="5" r="1.5" fill="#60A5FA" fillOpacity="0.5" stroke="none" />
                      <path d="M13 9l-3-3L4 13" stroke="#60A5FA" strokeWidth="1" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-[#F5F1E8]">视觉表达成果包</div>
                    <div className="text-[9px]" style={{ color: '#555955' }}>8 张精选效果图</div>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-1 mb-3">
                  {visualExpression?.curatedImages?.slice(0, 4).map((img, i) => (
                    <div key={i} className="rounded overflow-hidden" style={{ height: '40px', background: '#0B0C0B' }}>
                      <img src={img.url} alt="" className="w-full h-full object-cover opacity-60" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* AWN large image */}
            {outputs?.awnImage && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1 h-3.5 rounded-full" style={{ background: '#D6B56D' }} />
                  <span className="text-xs font-semibold text-[#F5F1E8]">中央草坪区效果图</span>
                </div>
                <div
                  className="rounded-2xl overflow-hidden cursor-pointer group relative"
                  style={{ background: '#0B0C0B', border: '1px solid rgba(214,181,109,0.15)' }}
                  onClick={() => setModalImage({ src: outputs.awnImage.url, title: '中央草坪区效果图' })}
                >
                  <img
                    src={outputs.awnImage.url}
                    alt="中央草坪区效果图"
                    className="w-full object-contain"
                    style={{ minHeight: '300px', maxHeight: '420px' }}
                  />
                </div>
                <p className="text-[10px] mt-1.5 px-1" style={{ color: '#555955' }}>
                  中央共享草坪与周边功能区关系，体现全龄友好的社区邻里氛围
                </p>
              </div>
            )}

            {/* PPT outline detailed — collapsed */}
            {outputs?.pptOutline && (
              <CollapsibleSection title="PPT 汇报大纲" subtitle="8 页结构" defaultOpen={false}>
                <div className="space-y-1.5 pt-3">
                  {outputs.pptOutline.map((page, i) => (
                    <div key={i} className="flex items-start gap-3 rounded-lg p-2.5" style={{ background: '#101211', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <span className="text-[10px] font-medium flex-shrink-0 px-1.5 py-0.5 rounded" style={{ background: 'rgba(34,197,94,0.08)', color: '#22C55E' }}>
                        {page.page}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-[#F5F1E8]">{page.title}</p>
                        <p className="text-[10px] mt-0.5 line-clamp-1" style={{ color: '#555955' }}>
                          {Array.isArray(page.content) ? page.content[0] : page.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CollapsibleSection>
            )}

            {/* MVP boundary note */}
            <div className="rounded-xl p-4 mt-6" style={{ background: 'rgba(59,130,246,0.03)', border: '1px solid rgba(59,130,246,0.08)' }}>
              <p className="text-[10px] leading-relaxed" style={{ color: '#555955' }}>
                当前版本已完成六阶段 Agent 工作流、精选成果库、Prompt 指令包和 Markdown 报告导出。WorkBuddy 实时生成能力在演示视频中展示，后续可接入真实图像生成 API 与 PPTX 生成能力。
              </p>
            </div>
          </>
        )}

        </div>
      </div>

      {/* IMAGE MODAL */}
      {modalImage && (
        <ImageModal
          src={modalImage.src}
          title={modalImage.title}
          onClose={() => setModalImage(null)}
        />
      )}
    </div>
  );
}

// =============================================================================
// Project Input Form (Step 0, idle state)
// =============================================================================

function ProjectInputForm({ formData, onFormUpdate, onFillDemo, onStartStepByStep, onStartAutoRun }) {
  const fields = [
    { key: 'projectName', label: '项目名称', placeholder: '如：北京欢乐谷社区公园景观概念设计', type: 'text' },
    { key: 'city', label: '项目地点', placeholder: '如：北京市朝阳区', type: 'text' },
    { key: 'area', label: '项目面积（㎡）', placeholder: '如：8000', type: 'text' },
    { key: 'projectType', label: '项目类型', placeholder: '如：社区公园', type: 'text' },
    { key: 'targetUsers', label: '服务人群', placeholder: '如：老人、儿童、周边居民、亲子家庭', type: 'text' },
    { key: 'designGoals', label: '设计目标', placeholder: '如：全龄友好、低维护、复合使用', type: 'text' },
    { key: 'constraints', label: '限制条件', placeholder: '如：城市建成区内用地、运维预算有限', type: 'text' },
    { key: 'stylePreference', label: '风格偏好', placeholder: '如：现代自然风格', type: 'text' },
    { key: 'maintenance', label: '运维要求', placeholder: '如：低维护', type: 'text' },
    { key: 'clientFocus', label: '甲方关注点', placeholder: '如：汇报表现力、可落地性、成本控制', type: 'text' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      {/* Left: Input form (3 cols) */}
      <div className="md:col-span-3 space-y-3">
        <div className="text-sm font-serif font-bold mb-2" style={{ color: '#F5F1E8' }}>
          项目定义 Agent — 输入项目条件
        </div>
        {fields.map((f) => (
          <div key={f.key}>
            <label className="text-[10px] mb-1 block" style={{ color: '#555955' }}>{f.label}</label>
            <input
              type={f.type}
              value={formData?.[f.key] || ''}
              onChange={(e) => onFormUpdate?.(f.key, e.target.value)}
              placeholder={f.placeholder}
              className="w-full text-xs px-3 py-2 rounded-lg outline-none transition-all"
              style={{
                background: '#0E1110',
                border: '1px solid rgba(255,255,255,0.06)',
                color: '#A8A29A',
              }}
            />
          </div>
        ))}
        {/* Site file note */}
        <div
          className="rounded-lg p-2.5 mt-2"
          style={{ background: 'rgba(59,130,246,0.04)', border: '1px solid rgba(59,130,246,0.1)' }}
        >
          <p className="text-[10px]" style={{ color: '#60A5FA' }}>
            场地现状图 · 欢乐谷社区公园现状图.jpg（演示案例自动包含）
          </p>
        </div>
      </div>

      {/* Right: Demo case card + Start buttons (2 cols) */}
      <div className="md:col-span-2 flex flex-col gap-4">
        {/* Demo case card */}
        <div
          className="rounded-2xl p-5"
          style={{
            background: '#101211',
            border: '1px solid rgba(214,181,109,0.12)',
          }}
        >
          <div className="text-[10px] font-semibold tracking-wider uppercase mb-3" style={{ color: '#555955' }}>
            演示案例
          </div>
          <div className="text-sm font-serif font-bold mb-2" style={{ color: '#D6B56D' }}>
            北京欢乐谷社区公园景观概念设计
          </div>
          <div className="space-y-1 mb-4">
            {[
              '北京市朝阳区欢乐谷',
              '约 8000 平方米',
              '社区公园 / 城市更新型公共绿地',
              '老人、儿童、亲子家庭、周边居民',
              '全龄友好 · 低维护 · 复合使用',
              '欢乐谷游客外溢 · 文娱活力延伸',
            ].map((item) => (
              <div key={item} className="text-[11px] leading-relaxed" style={{ color: '#78716C' }}>
                · {item}
              </div>
            ))}
          </div>
          <button
            onClick={onFillDemo}
            className="w-full py-2 text-xs rounded-lg transition-all"
            style={{
              background: 'rgba(214,181,109,0.1)',
              border: '1px solid rgba(214,181,109,0.2)',
              color: '#D6B56D',
            }}
          >
            一键填入案例
          </button>
        </div>

        {/* Quick action note */}
        <div className="rounded-xl p-4" style={{ background: '#0E1110', border: '1px solid rgba(255,255,255,0.05)' }}>
          <p className="text-[10px] leading-relaxed" style={{ color: '#555955' }}>
            填入案例后，点击底部"分步演示"逐步查看六个 Agent 的判断过程；或选择"一键自动跑完"快速生成完整方案。
          </p>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Space Strategy Card (Step 3)
// =============================================================================

function SpaceStrategy({ plan }) {
  return (
    <div className="rounded-xl p-4" style={{ background: '#101211', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="text-xs font-medium mb-3 text-[#F5F1E8]">空间策略</div>
      <div className="space-y-2.5">
        <div>
          <span className="text-[11px] font-medium" style={{ color: '#22C55E' }}>一心</span>
          <p className="text-[11px] mt-0.5" style={{ color: '#A8A29A' }}>中央共享草坪（约 2500-3000 ㎡），弹性大草坪兼容日常休憩与周末社区活动</p>
        </div>
        <div>
          <span className="text-[11px] font-medium" style={{ color: '#22C55E' }}>一环</span>
          <p className="text-[11px] mt-0.5" style={{ color: '#A8A29A' }}>350m 环形慢跑/漫步路径，EPDM 软质铺装，串联全园节点，夜间照明</p>
        </div>
        <div>
          <span className="text-[11px] font-medium" style={{ color: '#22C55E' }}>多点</span>
          <p className="text-[11px] mt-0.5" style={{ color: '#A8A29A' }}>儿童活动点 · 老人休憩点 · 林下会客点 · 社区活动点 · 入口形象点</p>
        </div>
        <div>
          <span className="text-[11px] font-medium" style={{ color: '#22C55E' }}>边界</span>
          <p className="text-[11px] mt-0.5" style={{ color: '#A8A29A' }}>柔性绿化界面，与周边社区及欢乐谷方向自然过渡</p>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Shared Components
// =============================================================================

function AgentHeader({ stepIndex, status, isGenerating }) {
  if (stepIndex < 0 || stepIndex >= STEPS.length) return null;
  const step = STEPS[stepIndex];
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl mx-6 mt-4 px-4 py-3 flex items-center gap-3 flex-shrink-0"
      style={{
        background: '#0E1110',
        border: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 font-serif text-xs font-bold"
        style={{ background: 'rgba(34,197,94,0.08)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.15)' }}
      >
        {String(stepIndex + 1).padStart(2, '0')}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-[#F5F1E8]">{step.label}</div>
        <div className="text-[10px] mt-0.5" style={{ color: '#78716C' }}>{step.goal}</div>
      </div>
      {status === 'working' && (
        <span className="inline-flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full" style={{ background: 'rgba(34,197,94,0.08)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.2)' }}>
          <svg className="animate-spin" width="10" height="10" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="rgba(34,197,94,0.2)" strokeWidth="3" />
            <path d="M12 2a10 10 0 0 1 10 10" stroke="#22C55E" strokeWidth="3" strokeLinecap="round" />
          </svg>
          执行中
        </span>
      )}
      {status === 'done' && (
        <span className="text-[10px] px-2.5 py-1 rounded-full" style={{ background: 'rgba(34,197,94,0.06)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.12)' }}>
          ✓ 完成
        </span>
      )}
    </motion.div>
  );
}

function JudgmentCard({ children, type = 'default' }) {
  const isGold = type === 'gold';
  return (
    <div
      className="rounded-xl p-4 mb-4"
      style={{
        background: isGold ? 'rgba(214,181,109,0.04)' : 'rgba(34,197,94,0.04)',
        border: isGold ? '1px solid rgba(214,181,109,0.12)' : '1px solid rgba(34,197,94,0.1)',
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="w-1 h-3.5 rounded-full" style={{ background: isGold ? '#D6B56D' : '#22C55E' }} />
        <span className="text-[10px] font-semibold tracking-wider uppercase" style={{ color: isGold ? '#D6B56D' : '#22C55E' }}>
          本阶段专业判断
        </span>
      </div>
      <p className="text-xs leading-relaxed" style={{ color: '#A8A29A' }}>
        {children}
      </p>
    </div>
  );
}

function CollapsibleSection({ title, subtitle, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="mb-3">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between rounded-xl p-3 transition-all"
        style={{
          background: open ? '#151715' : '#101211',
          border: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <div className="text-left">
          <span className="text-xs font-medium text-[#F5F1E8]">{title}</span>
          {subtitle && <span className="text-[10px] ml-2" style={{ color: '#555955' }}>{subtitle}</span>}
        </div>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={`transition-transform ${open ? 'rotate-180' : ''}`}>
          <path d="M4 6L8 10L12 6" stroke="#555955" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AnalysisResult({ data }) {
  if (!data) return null;
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 text-xs">
        <InfoCard label="项目类型">{data.projectType}</InfoCard>
        <InfoCard label="规模判断">{data.scaleJudgment}</InfoCard>
      </div>
      <InfoCard label="场地核心矛盾">{data.coreConflict}</InfoCard>
      <InfoCard label="气候与地域判断">{data.climateJudgment}</InfoCard>
      <div>
        <span className="text-[10px] mb-1.5 block" style={{ color: '#555955' }}>目标人群需求</span>
        {data.userNeeds?.map((group, i) => (
          <div key={i} className="mt-2">
            <span className="text-xs font-medium" style={{ color: '#22C55E' }}>{group.group}</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {group.needs.map((n, j) => (
                <span key={j} className="text-[10px] px-2 py-0.5 rounded" style={{ background: '#151715', color: '#78716C' }}>{n}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function InfoCard({ label, children }) {
  return (
    <div className="rounded-lg p-2.5" style={{ background: '#101211', border: '1px solid rgba(255,255,255,0.05)' }}>
      <span className="text-[10px]" style={{ color: '#555955' }}>{label}</span>
      <p className="mt-1 text-xs leading-relaxed text-[#A8A29A]">{children}</p>
    </div>
  );
}

function MissingInfoResult({ data }) {
  if (!data) return null;
  return (
    <div className="space-y-3 mt-4">
      {data.mustAsk?.length > 0 && !data.mustAsk.includes('无必须补充的刚性缺失信息') && (
        <div>
          <span className="text-xs font-medium" style={{ color: '#F87171' }}>必须补充的信息</span>
          <ul className="mt-1.5 space-y-1">
            {data.mustAsk.map((item, i) => (
              <li key={i} className="text-xs" style={{ color: '#A8A29A' }}>⚠ {item}</li>
            ))}
          </ul>
        </div>
      )}
      {data.canAssume?.length > 0 && (
        <div>
          <span className="text-xs font-medium" style={{ color: '#FBBF24' }}>可暂按合理假设处理</span>
          <div className="mt-1.5 space-y-1.5">
            {data.canAssume.map((item, i) => (
              <div key={i} className="rounded-lg p-2.5" style={{ background: '#101211', border: '1px solid rgba(255,255,255,0.05)' }}>
                <p className="text-xs" style={{ color: '#A8A29A' }}>{item.question}</p>
                <p className="text-[10px] mt-0.5" style={{ color: '#78716C' }}>→ {item.assumption}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {data.demoNote && (
        <div className="rounded-lg p-2.5" style={{ background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.12)' }}>
          <p className="text-xs" style={{ color: '#FBBF24' }}>{data.demoNote}</p>
        </div>
      )}
    </div>
  );
}
