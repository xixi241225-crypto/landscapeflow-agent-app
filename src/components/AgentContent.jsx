import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SchemeCards from './SchemeCards';
import ComparisonTable from './ComparisonTable';
import DeepenPlan from './DeepenPlan';
import ImageModal from './ImageModal';
import { downloadMarkdown } from '../lib/reportExporter';

const STEPS = [
  { key: 'step1', label: '项目定义 Agent', goal: '解析场地条件、识别缺失信息、做出合理假设' },
  { key: 'step2', label: '概念生成 Agent', goal: '生成三个差异化概念方案，覆盖不同设计策略' },
  { key: 'step3', label: '方案选择 Agent', goal: '六维度加权打分，推荐综合最优方案' },
  { key: 'step4', label: '空间推演 Agent', goal: '深化推荐方案，展开功能分区和游线组织' },
  { key: 'step5', label: '视觉表达 Agent', goal: '实时生成 + 精选成果库 + Prompt 指令包' },
  { key: 'step6', label: '输出成果 Agent', goal: 'Markdown 报告 + PPT 大纲 + 视觉成果包' },
];

export default function AgentContent({
  stepStatus,
  stepData,
  currentStep,
  isGenerating,
  projectName,
  demoPhase,
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

  const hasAnyComplete = stepStatus?.step1 === 'done';

  return (
    <div className="space-y-8">

      {/* ============================================ */}
      {/* AGENT HEADER — shows current agent context */}
      {/* ============================================ */}
      {currentStep >= 0 && (
        <AgentHeader
          stepIndex={currentStep}
          status={stepStatus?.[`step${currentStep + 1}`]}
          isGenerating={isGenerating}
        />
      )}

      {/* ============================================ */}
      {/* PROJECT DEFINITION — step1 */}
      {/* ============================================ */}
      {step1 && (
        <SectionBlock
          title="项目定义 Agent"
          badge="项目解析"
          badgeColor="#22C55E"
          agentNum="01"
        >
          <JudgmentCard>
            场地现状图已接收，关键场地矛盾识别完成。确定项目为城市更新型社区公园，核心挑战在于多元人群需求与有限用地之间的平衡，气候条件（北方四季分明）对植物配置和铺装材料选择具有决定性影响。
          </JudgmentCard>
          <AnalysisResult data={step1} />
          {step1.siteImageContext && (
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
        </SectionBlock>
      )}

      {/* ============================================ */}
      {/* MISSING INFO — step2 */}
      {/* ============================================ */}
      {step2?.missingInfo && (
        <SectionBlock
          title="智能追问与合理假设"
          badge="概念生成前置"
          badgeColor="#22C55E"
          agentNum="02"
        >
          <JudgmentCard>
            信息补全完成。已对缺失场地信息作出合理假设，确保概念方案生成具有充分依据，不因信息缺口而停滞。
          </JudgmentCard>
          <MissingInfoResult data={step2.missingInfo} />
        </SectionBlock>
      )}

      {/* ============================================ */}
      {/* SCHEME CARDS — step2/3 */}
      {/* ============================================ */}
      {(recommendedScheme || schemes) && (
        <SectionBlock
          title="方案推荐"
          badge="精选方案"
          badgeStyle="gold"
          agentNum="03"
        >
          <JudgmentCard type="gold">
            综合六维度加权打分结果，方案二「欢乐草坪·邻里活力客厅」在功能多样性、文化契合度、全龄友好度三项指标上优势显著，推荐作为深化方向。
          </JudgmentCard>

          {recommendedScheme && (
            <div
              className="rounded-2xl p-5 mb-4 flex gap-5 items-start"
              style={{ background: '#101211', border: '1px solid rgba(214,181,109,0.18)' }}
            >
              <div
                className="w-28 h-20 rounded-xl overflow-hidden flex-shrink-0 cursor-pointer"
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
                    推荐方案
                  </span>
                </div>
                <h3 className="text-base font-serif font-bold mb-1.5 text-[#F5F1E8]">
                  {recommendedScheme.name}
                </h3>
                <p className="text-xs leading-relaxed mb-3" style={{ color: '#A8A29A' }}>
                  基于欢乐谷片区文娱活力与社区多元使用需求，打造开放共享的邻里客厅、四季皆景、全龄友好的城市活力绿心。
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

          {comparison && <ComparisonTable comparison={comparison} />}
          {schemes && !recommendedScheme && <SchemeCards schemes={schemes} />}
        </SectionBlock>
      )}

      {/* ============================================ */}
      {/* SITE PLAN — large image */}
      {/* ============================================ */}
      {(deepenedPlan?.planImage || outputs?.planImage) && (() => {
        const planImg = deepenedPlan?.planImage || outputs?.planImage;
        return (
          <SectionBlock
            title="总平面图 / 空间策略图"
            badge="空间策略"
            badgeColor="#22C55E"
            agentNum="04"
          >
            <JudgmentCard>
              空间结构确定为「一心一环多点」：中央共享草坪为核心，环形慢行系统串联六个主题功能节点，游线清晰连续，功能分区互不干扰。
            </JudgmentCard>
            {/* Large plan image */}
            <div
              className="rounded-2xl overflow-hidden cursor-pointer group relative"
              style={{ background: '#0B0C0B', border: '1px solid rgba(255,255,255,0.06)' }}
              onClick={() => setModalImage({ src: planImg.url, title: '总平面图 / 空间策略图' })}
            >
              <img
                src={planImg.url}
                alt={planImg.title || '总平面图'}
                className="w-full object-contain"
                style={{ minHeight: '360px', maxHeight: '480px' }}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-all flex items-center justify-center">
                <span className="opacity-0 group-hover:opacity-100 transition-opacity px-4 py-1.5 rounded-lg text-xs text-white" style={{ background: 'rgba(0,0,0,0.55)' }}>
                  点击查看大图
                </span>
              </div>
            </div>
            <p className="text-xs mt-2 px-1" style={{ color: '#555955' }}>
              展示「一心一环多点」空间结构、功能分区与游线组织 · 点击查看大图
            </p>
          </SectionBlock>
        );
      })()}

      {/* Space deepen details */}
      {deepenedPlan && (
        <SectionBlock
          title="空间推演详情"
          badge="深化方案"
          badgeColor="#22C55E"
          agentNum="04"
        >
          <DeepenPlan data={deepenedPlan} />
        </SectionBlock>
      )}

      {/* ============================================ */}
      {/* VISUAL EXPRESSION — 3 clear modules */}
      {/* ============================================ */}
      {visualExpression && (
        <>
          {/* Module 1: Realtime image */}
          <SectionBlock
            title="实时生成结果"
            badge="WorkBuddy 实时生成"
            badgeColor="#22C55E"
            agentNum="05"
          >
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
                  style={{ minHeight: '300px', maxHeight: '420px' }}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-all flex items-center justify-center">
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity px-4 py-1.5 rounded-lg text-xs text-white" style={{ background: 'rgba(0,0,0,0.55)' }}>
                    点击查看大图
                  </span>
                </div>
              </div>
            ) : (
              /* Elegant placeholder — no broken image */
              <div
                className="rounded-2xl flex flex-col items-center justify-center py-14"
                style={{ background: '#101211', border: '1px solid rgba(255,255,255,0.05)' }}
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: 'rgba(214,181,109,0.06)', border: '1px solid rgba(214,181,109,0.12)' }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#D6B56D" strokeWidth="1.2" strokeLinecap="round">
                    <rect x="3" y="3" width="18" height="18" rx="3" />
                    <circle cx="8.5" cy="8.5" r="1.5" fill="#D6B56D" fillOpacity="0.5" stroke="none" />
                    <path d="M21 15l-5-5L5 21" />
                  </svg>
                </div>
                <p className="text-sm font-medium mb-1.5" style={{ color: '#A8A29A' }}>
                  WorkBuddy 实时生成结果将在演示视频中展示
                </p>
                <p className="text-xs text-center max-w-xs" style={{ color: '#555955' }}>
                  当前前端保留生成接口，接入 API 后自动展示实时结果
                </p>
              </div>
            )}
          </SectionBlock>

          {/* Module 2: Curated gallery */}
          {visualExpression?.curatedImages && (
            <SectionBlock
              title="精选成果库"
              badge="多轮筛选优化成果"
              badgeStyle="gold"
              agentNum="05"
            >
              <p className="text-xs mb-4" style={{ color: '#78716C' }}>
                以下为多轮生成、筛选和优化后的高质量成果，适用于正式汇报场景。
              </p>
              <div
                className="grid grid-cols-2 gap-3"
                data-section="visual"
              >
                {visualExpression.curatedImages.map((img, i) => (
                  <motion.div
                    key={i}
                    className="rounded-xl overflow-hidden cursor-pointer group"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    style={{ background: '#101211', border: '1px solid rgba(214,181,109,0.1)' }}
                    onClick={() => setModalImage({ src: img.url, title: img.title })}
                  >
                    {img.url ? (
                      <div className="relative" style={{ height: '280px' }}>
                        <img
                          src={img.url}
                          alt={img.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-end justify-end p-2">
                          <span className="opacity-0 group-hover:opacity-100 transition-opacity px-2.5 py-1 rounded-lg text-[10px] text-white" style={{ background: 'rgba(0,0,0,0.6)' }}>
                            查看大图
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="flex items-center justify-center"
                        style={{ height: '280px', background: '#0B0C0B' }}
                      >
                        <span className="text-xs" style={{ color: '#3D403C' }}>{img.title}</span>
                      </div>
                    )}
                    <div className="px-3 py-2.5 border-t" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                      <p className="text-xs font-medium text-[#F5F1E8]">{img.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px]" style={{ color: '#D6B56D' }}>精选成果</span>
                        <span className="text-[10px]" style={{ color: '#3D403C' }}>高清</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </SectionBlock>
          )}

          {/* Module 3: Prompt pack — collapsed by default */}
          {visualExpression?.prompts && (
            <SectionBlock
              title="Prompt 指令包"
              badge="5 条专业 Prompt"
              badgeColor="#3B82F6"
              agentNum="05"
            >
              <CollapsibleSection title="Prompt 指令包 · 5 条专业 Prompt" subtitle="" defaultOpen={false}>
                <div className="space-y-2 pt-3">
                  {visualExpression.prompts.map((p, i) => (
                    <div
                      key={p.id}
                      className="rounded-lg p-3"
                      style={{ background: '#0E1110', border: '1px solid rgba(255,255,255,0.05)' }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-[#F5F1E8]">
                          {p.id}. {p.title}
                        </span>
                      </div>
                      <p className="text-[10px]" style={{ color: '#555955' }}>
                        视角：{p.angle} · 时间：{p.time} · 风格：{p.style}
                      </p>
                      <p className="text-[10px] mt-1 leading-relaxed" style={{ color: '#78716C' }}>
                        {p.cn}
                      </p>
                    </div>
                  ))}
                </div>
              </CollapsibleSection>
            </SectionBlock>
          )}
        </>
      )}

      {/* ============================================ */}
      {/* AWN IMAGE — large */}
      {/* ============================================ */}
      {outputs?.awnImage && (
        <SectionBlock
          title="中央草坪区效果图"
          badge="重点成果"
          badgeStyle="gold"
          agentNum="06"
        >
          <div
            className="rounded-2xl overflow-hidden cursor-pointer group relative"
            style={{ background: '#0B0C0B', border: '1px solid rgba(214,181,109,0.15)' }}
            onClick={() => setModalImage({ src: outputs.awnImage.url, title: '中央草坪区效果图' })}
          >
            <img
              src={outputs.awnImage.url}
              alt="中央草坪区效果图"
              className="w-full object-contain"
              style={{ minHeight: '300px', maxHeight: '460px' }}
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-all flex items-center justify-center">
              <span className="opacity-0 group-hover:opacity-100 transition-opacity px-4 py-1.5 rounded-lg text-xs text-white" style={{ background: 'rgba(0,0,0,0.55)' }}>
                点击查看大图
              </span>
            </div>
          </div>
          <p className="text-xs mt-2 px-1" style={{ color: '#555955' }}>
            中央共享草坪与周边功能区关系，体现全龄友好的社区邻里氛围
          </p>
        </SectionBlock>
      )}

      {/* ============================================ */}
      {/* OUTPUTS — PPT + Report */}
      {/* ============================================ */}
      {outputs && (
        <SectionBlock
          title="输出成果 Agent"
          badge="成果导出"
          badgeStyle="gold"
          agentNum="06"
        >
          <JudgmentCard type="gold">
            完整方案成果已生成。包含 Markdown 设计报告、8 页 PPT 汇报大纲及视觉成果包，可直接用于甲方汇报与内部评审。
          </JudgmentCard>

          {/* PPT Outline */}
          {outputs?.pptOutline && (
            <CollapsibleSection title="PPT 汇报大纲" subtitle="8 页结构" defaultOpen={false}>
              <div className="space-y-1.5 pt-3" data-section="ppt">
                {outputs.pptOutline.map((page, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 rounded-lg p-2.5"
                    style={{ background: '#101211', border: '1px solid rgba(255,255,255,0.05)' }}
                  >
                    <span
                      className="text-[10px] font-medium flex-shrink-0 px-1.5 py-0.5 rounded"
                      style={{ background: 'rgba(34,197,94,0.08)', color: '#22C55E' }}
                    >
                      P{i + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-[#F5F1E8]">{page.title}</p>
                      <p className="text-[10px] mt-0.5 line-clamp-1" style={{ color: '#555955' }}>
                        {Array.isArray(page.content) ? page.content[0] : page.content}
                      </p>
                    </div>
                  </div>
                ))}
                <div
                  className="rounded-lg p-2.5 mt-1"
                  style={{ background: 'rgba(59,130,246,0.04)', border: '1px solid rgba(59,130,246,0.1)' }}
                >
                  <p className="text-[10px]" style={{ color: '#60A5FA' }}>
                    PPTX 接口预留 — P5 使用 plan.jpg，P6 使用 awn.jpg。
                  </p>
                </div>
              </div>
            </CollapsibleSection>
          )}

          {/* Markdown report download */}
          {outputs?.report && (
            <div
              className="rounded-xl p-4 flex items-center justify-between mt-3"
              style={{ background: '#101211', border: '1px solid rgba(255,255,255,0.05)' }}
            >
              <div>
                <p className="text-sm font-medium text-[#F5F1E8]">完整方案报告</p>
                <p className="text-[10px] mt-0.5" style={{ color: '#555955' }}>
                  Markdown 格式 · 包含全部六个 Agent 输出内容
                </p>
              </div>
              <button
                onClick={() => downloadMarkdown(outputs.report, projectName || '方案报告')}
                className="btn-gold text-xs px-4 py-2"
              >
                下载报告
              </button>
            </div>
          )}
        </SectionBlock>
      )}

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
// Helper Components
// =============================================================================

function AgentHeader({ stepIndex, status, isGenerating }) {
  if (stepIndex < 0 || stepIndex >= STEPS.length) return null;
  const step = STEPS[stepIndex];
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl px-4 py-3 flex items-center gap-3"
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
        <span
          className="inline-flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full"
          style={{ background: 'rgba(34,197,94,0.08)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.2)' }}
        >
          <svg className="animate-spin" width="10" height="10" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="rgba(34,197,94,0.2)" strokeWidth="3" />
            <path d="M12 2a10 10 0 0 1 10 10" stroke="#22C55E" strokeWidth="3" strokeLinecap="round" />
          </svg>
          执行中
        </span>
      )}
      {status === 'done' && (
        <span
          className="text-[10px] px-2.5 py-1 rounded-full"
          style={{ background: 'rgba(34,197,94,0.06)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.12)' }}
        >
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
        <div
          className="w-1 h-3.5 rounded-full"
          style={{ background: isGold ? '#D6B56D' : '#22C55E' }}
        />
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

function SectionBlock({ title, badge, badgeStyle, badgeColor, agentNum, children }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="flex items-center gap-3 mb-4">
        {agentNum && (
          <span
            className="text-xs font-bold font-serif flex-shrink-0"
            style={{ color: '#3D403C' }}
          >
            {agentNum}
          </span>
        )}
        <h2 className="text-sm font-semibold text-[#F5F1E8]">{title}</h2>
        <span
          className="text-[10px] px-2 py-0.5 rounded-full flex-shrink-0"
          style={
            badgeStyle === 'gold'
              ? { background: 'rgba(214,181,109,0.08)', color: '#D6B56D', border: '1px solid rgba(214,181,109,0.18)' }
              : { background: badgeColor ? `${badgeColor}15` : 'rgba(34,197,94,0.08)', color: badgeColor || '#22C55E', border: `1px solid ${badgeColor ? `${badgeColor}25` : 'rgba(34,197,94,0.18)'}` }
          }
        >
          {badge}
        </span>
      </div>
      {children}
    </motion.section>
  );
}

function CollapsibleSection({ title, subtitle, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between rounded-xl p-3 transition-all"
        style={{
          background: open ? '#151715' : '#101211',
          border: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <div className="text-left">
          <span className="text-sm font-medium text-[#F5F1E8]">{title}</span>
          {subtitle && <span className="text-[10px] ml-2" style={{ color: '#555955' }}>{subtitle}</span>}
        </div>
        <svg
          width="16" height="16" viewBox="0 0 16 16" fill="none"
          className={`transition-transform ${open ? 'rotate-180' : ''}`}
        >
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
    <div className="space-y-3">
      {data.mustAsk?.length > 0 && (
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
