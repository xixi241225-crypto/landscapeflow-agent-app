import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SchemeCards from './SchemeCards';
import ComparisonTable from './ComparisonTable';
import DeepenPlan from './DeepenPlan';
import { downloadMarkdown } from '../lib/reportExporter';

const STEPS = [
  { key: 'step1', label: '项目定义 Agent', icon: '📋', statusText: '项目定义 Agent 正在解析项目条件...' },
  { key: 'step2', label: '概念生成 Agent', icon: '💡', statusText: '概念生成 Agent 正在生成三个差异化方案...' },
  { key: 'step3', label: '方案选择 Agent', icon: '📊', statusText: '方案选择 Agent 正在进行多维度打分比选...' },
  { key: 'step4', label: '空间推演 Agent', icon: '🎯', statusText: '空间推演 Agent 正在深化推荐方案...' },
  { key: 'step5', label: '视觉表达 Agent', icon: '🖼️', statusText: '视觉表达 Agent 正在生成视觉效果...' },
  { key: 'step6', label: '输出成果 Agent', icon: '📦', statusText: '输出成果 Agent 正在生成成果包...' },
];

export default function AgentTimeline({ stepStatus, stepData, currentStep, isGenerating, projectName, isWaitingForUser, onNextStep }) {
  const scrollRef = useRef(null);

  // Auto-scroll to current step
  useEffect(() => {
    if (scrollRef.current && isGenerating) {
      const activeEl = scrollRef.current.querySelector('[data-active="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentStep, isGenerating]);

  const renderStepContent = (stepKey, index) => {
    const data = stepData[stepKey];
    if (!data) return null;

    switch (stepKey) {
      case 'step1':
        return (
          <motion.div
            className="glass-card p-4 space-y-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <AnalysisResult data={data} />
            {/* Site Image Context from 项目定义 Agent */}
            {data.siteImageContext && (
              <SiteImageContextResult data={data.siteImageContext} />
            )}
          </motion.div>
        );

      case 'step2':
        return (
          <motion.div
            className="glass-card p-4 space-y-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* 追问 + 合理假设 */}
            {data.missingInfo && <MissingInfoResult data={data.missingInfo} />}
            {/* 三方案 */}
            {data.schemes && (
              <div className="mt-3 border-t border-landscape-600/30 pt-3">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs text-landscape-glow font-medium">💡 概念生成 Agent · 三方案输出</span>
                </div>
                <SchemeCards schemes={data.schemes} />
              </div>
            )}
          </motion.div>
        );

      case 'step3':
        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs text-landscape-glow font-medium">📊 方案选择 Agent · 六维度加权比选</span>
            </div>
            <ComparisonTable comparison={data} />
          </motion.div>
        );

      case 'step4':
        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs text-landscape-glow font-medium">🎯 空间推演 Agent · 推荐方案深化</span>
            </div>
            <DeepenPlan data={data} />
          </motion.div>
        );

      case 'step5':
        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <VisualExpressionResult data={data} />
          </motion.div>
        );

      case 'step6':
        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <OutputResult data={data} projectName={projectName} />
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Status Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-serif font-bold text-white">Agent 工作台</h2>
        {isGenerating && (
          <div className="agent-badge working">
            <span className="w-2 h-2 rounded-full bg-landscape-glow animate-pulse" />
            工作中
          </div>
        )}
        {!isGenerating && stepData.step6 && (
          <div className="agent-badge done">
            已完成
          </div>
        )}
      </div>

      {/* Steps Timeline */}
      <div className="flex-1 overflow-y-auto pr-1" ref={scrollRef}>
        {/* Empty state */}
        {Object.keys(stepData).length === 0 && !isGenerating && (
          <div className="flex flex-col items-center justify-center h-full text-center py-20">
            <div className="text-5xl mb-4">🌿</div>
            <h3 className="text-landscape-300 font-serif text-lg mb-2">等待方案生成</h3>
            <p className="text-landscape-500 text-sm max-w-xs">
              请在左侧填写项目条件，然后点击「开始生成方案」启动 Agent 工作流
            </p>
          </div>
        )}

        {/* Step items */}
        <div className="space-y-0">
          {STEPS.map((step, index) => {
            const status = stepStatus[step.key] || 'pending'; // pending | working | done
            const hasData = !!stepData[step.key];
            const isCurrent = currentStep === index;
            const isPast = index < currentStep;

            return (
              <div key={step.key} className="relative" data-active={isCurrent ? 'true' : 'false'}>
                {/* Step indicator + Content */}
                <div className="flex gap-4">
                  {/* Timeline line + dot */}
                  <div className="flex flex-col items-center w-10 flex-shrink-0">
                    {/* Dot */}
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${
                        status === 'done'
                          ? 'bg-landscape-accent/20 border-2 border-landscape-accent'
                          : status === 'working'
                          ? 'bg-landscape-accent/30 border-2 border-landscape-glow animate-pulse-glow'
                          : 'bg-landscape-800 border-2 border-landscape-600'
                      }`}
                    >
                      {status === 'done' ? (
                        <span className="text-sm">✓</span>
                      ) : status === 'working' ? (
                        <svg className="animate-spin h-5 w-5 text-landscape-glow" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      ) : (
                        <span className="text-landscape-500 text-sm">{step.icon}</span>
                      )}
                    </div>
                    {/* Line */}
                    {index < STEPS.length - 1 && (
                      <div
                        className={`w-0.5 flex-1 min-h-[20px] transition-all duration-500 ${
                          status === 'done' ? 'bg-landscape-accent' : 'bg-landscape-600'
                        }`}
                      />
                    )}
                  </div>

                  {/* Step content */}
                  <div className="flex-1 pb-6">
                    {/* Step label */}
                    <div className="flex items-center gap-2 mb-2">
                      <h3
                        className={`text-sm font-semibold transition-colors duration-300 ${
                          status === 'done'
                            ? 'text-landscape-glow'
                            : status === 'working'
                            ? 'text-white'
                            : 'text-landscape-500'
                        }`}
                      >
                        {step.label}
                      </h3>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          status === 'done'
                            ? 'bg-landscape-accent/20 text-landscape-glow'
                            : status === 'working'
                            ? 'bg-landscape-accent/10 text-landscape-glow animate-pulse'
                            : 'bg-landscape-800 text-landscape-500'
                        }`}
                      >
                        {status === 'done' ? '完成' : status === 'working' ? '执行中...' : '等待'}
                      </span>
                    </div>

                    {/* Working status text */}
                    {status === 'working' && (
                      <motion.p
                        className="text-sm text-landscape-400 mb-3"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        {step.statusText}
                      </motion.p>
                    )}

                    {/* Step output data */}
                    <AnimatePresence>
                      {hasData && status === 'done' && renderStepContent(step.key, index)}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Waiting for user prompt */}
        {isWaitingForUser && currentStep >= 0 && currentStep < STEPS.length - 1 && (
          <motion.div
            className="mt-4 p-4 rounded-xl border border-landscape-glow/30 bg-landscape-accent/5 text-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-lg">{STEPS[currentStep + 1]?.icon || '👉'}</span>
              <span className="text-sm text-landscape-200 font-medium">
                下一步：{STEPS[currentStep + 1]?.label || '下一个 Agent'}
              </span>
            </div>
            <p className="text-xs text-landscape-400 mb-3">
              {STEPS[currentStep + 1]?.statusText || '准备就绪'}
            </p>
            <button
              onClick={onNextStep}
              className="text-sm px-6 py-2 rounded-lg bg-landscape-accent/20 border border-landscape-glow/50 text-landscape-glow hover:bg-landscape-accent/30 hover:border-landscape-glow transition-all duration-200 font-semibold"
            >
              ▶ 执行下一步
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Sub-components for step rendering
// =============================================================================

function AnalysisResult({ data }) {
  if (!data) return null;
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs text-landscape-glow font-medium">📋 项目定义 Agent · 本阶段专业判断</span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-landscape-700/30 rounded-lg p-2.5">
          <span className="text-landscape-400">项目类型</span>
          <p className="text-landscape-200 mt-1 font-medium">{data.projectType}</p>
        </div>
        <div className="bg-landscape-700/30 rounded-lg p-2.5">
          <span className="text-landscape-400">规模判断</span>
          <p className="text-landscape-200 mt-1 font-medium">{data.scaleJudgment}</p>
        </div>
      </div>

      <div>
        <span className="text-xs text-landscape-400">场地核心矛盾</span>
        <p className="text-sm text-landscape-200 mt-1 leading-relaxed">{data.coreConflict}</p>
      </div>

      <div>
        <span className="text-xs text-landscape-400">气候与地域判断</span>
        <p className="text-sm text-landscape-300 mt-1 leading-relaxed">{data.climateJudgment}</p>
      </div>

      <div>
        <span className="text-xs text-landscape-400">目标人群需求</span>
        {data.userNeeds?.map((group, i) => (
          <div key={i} className="mt-1.5">
            <span className="text-xs text-landscape-accent font-medium">{group.group}</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {group.needs.map((n, j) => (
                <span key={j} className="text-xs bg-landscape-700/40 px-2 py-0.5 rounded text-landscape-300">{n}</span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div>
        <span className="text-xs text-landscape-400">甲方关注点</span>
        <ul className="mt-1 space-y-0.5">
          {data.clientFocus?.map((item, i) => (
            <li key={i} className="text-xs text-landscape-300">· {item}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function MissingInfoResult({ data }) {
  if (!data) return null;
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs text-landscape-glow font-medium">💬 项目定义 Agent · 主动追问与合理假设</span>
      </div>
      {/* Must Ask */}
      <div>
        <span className="text-xs text-red-400 font-medium">必须补充的信息</span>
        <ul className="mt-1 space-y-0.5">
          {data.mustAsk?.map((item, i) => (
            <li key={i} className="text-xs text-landscape-200">⚠ {item}</li>
          ))}
        </ul>
      </div>

      {/* Can Assume */}
      <div>
        <span className="text-xs text-amber-400 font-medium">可暂按合理假设处理</span>
        <div className="mt-1 space-y-1.5">
          {data.canAssume?.map((item, i) => (
            <div key={i} className="bg-landscape-700/30 rounded-lg p-2.5">
              <p className="text-xs text-landscape-300">{item.question}</p>
              <p className="text-xs text-landscape-500 mt-0.5">→ {item.assumption}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Demo Note */}
      {data.demoNote && (
        <div className="bg-amber-400/10 border border-amber-400/20 rounded-lg p-2.5">
          <p className="text-xs text-amber-300">{data.demoNote}</p>
        </div>
      )}
    </div>
  );
}

// Site image context card for 项目定义 Agent
function SiteImageContextResult({ data }) {
  if (!data) return null;
  return (
    <div className="glass-card p-4 border-l-2 border-sky-400/50 mt-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sky-400 text-sm">🖼️</span>
        <span className="text-xs text-sky-400 font-medium">项目定义 Agent · 场地现状图处理结果</span>
      </div>
      <div className="space-y-2 text-xs">
        <p className={data.hasSiteImage ? 'text-landscape-200' : 'text-landscape-400'}>
          {data.message}
        </p>
        {data.fileNames?.length > 0 && (
          <div className="bg-sky-400/5 border border-sky-400/20 rounded-lg p-2">
            <span className="text-sky-400">已上传文件：</span>
            {data.fileNames.map((f, i) => (
              <div key={i} className="text-landscape-300 mt-0.5">· {f}</div>
            ))}
          </div>
        )}
        {data.usageNote && (
          <p className="text-landscape-500">{data.usageNote}</p>
        )}
        {data.limitation && (
          <p className="text-amber-400/80">{data.limitation}</p>
        )}
        {data.futurePlan && (
          <p className="text-landscape-500">{data.futurePlan}</p>
        )}
      </div>
    </div>
  );
}

// Dual-track Visual Expression Result for 视觉表达 Agent
function VisualExpressionResult({ data }) {
  if (!data) return null;

  const { realtimeImage, curatedImages, prompts } = data;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs text-landscape-glow font-medium">🖼️ 视觉表达 Agent · 双轨制输出</span>
      </div>

      {/* Track 1: Real-time generation */}
      <div className="glass-card p-4 border-l-2 border-emerald-400/50">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-emerald-400 text-sm font-semibold">⚡ 实时生成结果</span>
          <span className="text-[10px] bg-emerald-400/10 text-emerald-400 px-2 py-0.5 rounded">WorkBuddy 实时生成</span>
        </div>
        <p className="text-xs text-landscape-400 mb-3">以下为 WorkBuddy 实时生成的一张效果图，用于证明 Agent 具备调用生成能力。</p>
        {realtimeImage ? (
          <div className="rounded-lg overflow-hidden bg-landscape-700/30">
            <img src={realtimeImage.url} alt={realtimeImage.title} className="w-full h-48 object-cover" />
            <div className="p-2">
              <p className="text-xs text-landscape-300">{realtimeImage.title}</p>
              <p className="text-[10px] text-landscape-500 mt-0.5">标注：实时生成图 · WorkBuddy 生成</p>
            </div>
          </div>
        ) : (
          <div className="bg-landscape-700/20 rounded-lg p-3 text-center">
            <p className="text-xs text-landscape-500">（WorkBuddy 演示模式下展示实时生成效果图）</p>
          </div>
        )}
      </div>

      {/* Track 2: Curated gallery */}
      <div className="glass-card p-4 border-l-2 border-amber-400/50">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-amber-400 text-sm font-semibold">🏆 精选成果库</span>
          <span className="text-[10px] bg-amber-400/10 text-amber-400 px-2 py-0.5 rounded">多轮筛选优化成果</span>
        </div>
        <p className="text-xs text-landscape-400 mb-3">以下为提前准备好的高质量效果图，用于正式汇报场景，代表多轮生成、筛选和优化后的成果。</p>
        {curatedImages?.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {curatedImages.map((img, i) => (
              <div key={i} className="rounded-lg overflow-hidden bg-landscape-700/30">
                {img.url ? (
                  <img src={img.url} alt={img.title} className="w-full h-32 object-cover" />
                ) : (
                  <div className="w-full h-32 bg-landscape-600/30 flex items-center justify-center text-landscape-500 text-xs">
                    {img.title}
                  </div>
                )}
                <div className="p-2">
                  <p className="text-xs text-landscape-300">{img.title}</p>
                  <p className="text-[10px] text-amber-400/70 mt-0.5">标注：精选成果图</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-landscape-700/20 rounded-lg p-3 text-center">
            <p className="text-xs text-landscape-500">（演示模式下展示精选成果图）</p>
          </div>
        )}
      </div>

      {/* Track 3: Prompt package */}
      <div className="glass-card p-4 border-l-2 border-sky-400/50">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sky-400 text-sm font-semibold">📦 效果图 Prompt 指令包</span>
          <span className="text-[10px] bg-sky-400/10 text-sky-400 px-2 py-0.5 rounded">可复制使用</span>
        </div>
        <p className="text-xs text-landscape-400 mb-3">输出鸟瞰、中央草坪区、儿童活动区、老人休憩区、夜景等 5 类专业效果图 Prompt。</p>
        {prompts?.map((prompt, index) => (
          <motion.div
            key={prompt.id}
            className="bg-landscape-700/20 rounded-lg p-3 mb-2"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
          >
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-xs font-semibold text-white">{prompt.id}. {prompt.title}</h4>
            </div>
            <p className="text-[11px] text-landscape-400">视角：{prompt.angle} · 时间：{prompt.time} · 风格：{prompt.style}</p>
            <p className="text-[11px] text-landscape-300 mt-1 line-clamp-2">{prompt.cn}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// Output Results for 输出成果 Agent
function OutputResult({ data, projectName }) {
  if (!data) return null;

  const { report, pptOutline, visualResults, planImage, awnImage } = data;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs text-landscape-glow font-medium">📦 输出成果 Agent · 三类成果</span>
      </div>

      {/* 1. Downloadable report */}
      <div className="glass-card p-4 border-l-2 border-emerald-400/50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-white">📝 可下载方案报告</span>
        </div>
        <p className="text-xs text-landscape-400 mb-2">当前 MVP 支持导出 Markdown 报告，包含完整方案内容。</p>
        <div className="flex gap-2">
          <button
            onClick={() => {
              downloadMarkdown(report || '', projectName || '方案报告');
            }}
            className="text-xs px-3 py-1.5 rounded-lg border border-landscape-accent/40 text-landscape-glow hover:bg-landscape-accent/10 transition-all"
          >
            下载 Markdown 报告
          </button>
        </div>
      </div>

      {/* 2. PPT outline */}
      <div className="glass-card p-4 border-l-2 border-sky-400/50">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-semibold text-white">📊 PPT 汇报大纲</span>
          <span className="text-[10px] bg-sky-400/10 text-sky-400 px-2 py-0.5 rounded">PPTX 接口预留</span>
        </div>
        <p className="text-xs text-landscape-400 mb-3">输出 8 页 PPT 结构。暂未真实导出 PPTX，标注"PPTX 接口预留"。</p>
        {pptOutline?.map((page, i) => (
          <div key={i} className="bg-landscape-700/20 rounded p-2 mb-1.5">
            <span className="text-xs text-landscape-glow font-medium">{page.title}</span>
            <p className="text-[11px] text-landscape-400 mt-0.5">{page.content?.[0] || ''}</p>
          </div>
        ))}
        <div className="mt-2 bg-sky-400/5 border border-sky-400/20 rounded-lg p-2">
          <p className="text-[11px] text-sky-400">💡 WorkBuddy 生成 PPT 演示说明区：后续可通过 WorkBuddy 或 pptxgenjs 接入真实 PPT 生成。</p>
        </div>
      </div>

      {/* 3. Visual expression results */}
      <div className="glass-card p-4 border-l-2 border-amber-400/50">
        <span className="text-sm font-semibold text-white">🖼️ 视觉表达成果</span>
        <p className="text-xs text-landscape-400 mt-1 mb-2">包含：实时生成图 + 精选成果图 + Prompt 指令包</p>
        {visualResults?.realtimeImage && (
          <div className="bg-landscape-700/20 rounded-lg p-2 mb-2">
            <span className="text-[11px] text-emerald-400">⚡ 实时生成图：{visualResults.realtimeImage.title}</span>
          </div>
        )}
        {visualResults?.curatedImages?.length > 0 && (
          <div className="bg-landscape-700/20 rounded-lg p-2 mb-2">
            <span className="text-[11px] text-amber-400">🏆 精选成果图：{visualResults.curatedImages.length} 张</span>
          </div>
        )}
        {/* 中央草坪区效果图 */}
        {awnImage && (
          <div className="bg-landscape-accent/5 border border-landscape-glow/20 rounded-lg p-2 mb-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] text-landscape-glow font-medium">🌿 中央草坪区效果图</span>
            </div>
            <img
              src={awnImage.url}
              alt={awnImage.title}
              className="w-full h-40 object-cover rounded"
            />
            <p className="text-[10px] text-landscape-500 mt-1">{awnImage.note}</p>
          </div>
        )}
        {/* 总平面图 / 空间策略图 高亮展示 */}
        {planImage && (
          <div className="bg-landscape-accent/5 border border-landscape-glow/20 rounded-lg p-2 mb-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] text-landscape-glow font-medium">🗺️ 总平面图 / 空间策略图</span>
            </div>
            <img
              src={planImage.url}
              alt={planImage.title}
              className="w-full h-40 object-cover rounded"
            />
            <p className="text-[10px] text-landscape-500 mt-1">{planImage.note}</p>
          </div>
        )}
        {visualResults?.prompts?.length > 0 && (
          <div className="bg-landscape-700/20 rounded-lg p-2">
            <span className="text-[11px] text-sky-400">📦 Prompt 指令包：{visualResults.prompts.length} 条专业 Prompt</span>
          </div>
        )}
      </div>
    </div>
  );
}
