import { motion, AnimatePresence } from 'framer-motion';

const STEPS = [
  { key: 'step1', label: '项目定义 Agent' },
  { key: 'step2', label: '概念生成 Agent' },
  { key: 'step3', label: '方案选择 Agent' },
  { key: 'step4', label: '空间推演 Agent' },
  { key: 'step5', label: '视觉表达 Agent' },
  { key: 'step6', label: '输出成果 Agent' },
];

/**
 * DemoConsole — 唯一的演示控制区域（明亮主题版）
 *
 * demoPhase 状态：
 *   'idle'        — 未开始，显示起始面板 + 两个大卡片
 *   'stepByStep'  — 分步模式进行中，等待用户点下一步
 *   'waiting'     — 分步模式中，当前步骤完成，等待用户确认下一步
 *   'autoRun'     — 一键自动运行中
 *   'done'        — 全部完成
 */
export default function DemoConsole({
  demoPhase,          // 'idle' | 'stepByStep' | 'waiting' | 'autoRun' | 'done'
  currentStep,        // 0-based index
  isGenerating,
  onStartStepByStep,
  onStartAutoRun,
  onNextStep,
  onAutoRunRemaining,
  onReset,
  onPause,
  onStop,
  onExport,
  stepData,
}) {
  const completedStepLabel = currentStep >= 0 ? STEPS[currentStep]?.label : '';
  const nextStepLabel = currentStep >= 0 && currentStep < STEPS.length - 1
    ? STEPS[currentStep + 1]?.label
    : '';
  const autoProgress = currentStep >= 0 ? `${currentStep + 1} / ${STEPS.length}` : '0 / 6';
  const hasOutputs = stepData && Object.keys(stepData).length > 0;

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">

        {/* ====================== IDLE: 起始面板 ====================== */}
        {demoPhase === 'idle' && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
          >
            {/* Title */}
            <div className="text-center mb-8">
              <h2 className="text-xl font-serif font-bold text-[#111827] mb-2">
                开始一次景观方案 Agent 工作流
              </h2>
              <p className="text-sm" style={{ color: '#6B7280' }}>
                选择分步演示，逐步查看六个 Agent 的判断过程；或选择一键自动跑完，快速生成完整方案成果。
              </p>
            </div>

            {/* Two mode cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Step-by-step card */}
              <motion.div
                className="rounded-2xl p-6 flex flex-col gap-4 cursor-pointer group transition-all duration-300 bg-white shadow-sm"
                style={{
                  border: '1px solid #E5E7EB',
                }}
                whileHover={{
                  borderColor: 'rgba(214,168,79,0.4)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(214,168,79,0.1)' }}
                  >
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <path d="M3 9h5M11 9h4M9 3v5M9 11v4" stroke="#D6A84F" strokeWidth="1.5" strokeLinecap="round" />
                      <circle cx="9" cy="9" r="2" fill="#D6A84F" fillOpacity="0.5" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-[#111827] mb-1">分步演示</h3>
                    <p className="text-xs leading-relaxed" style={{ color: '#6B7280' }}>
                      适合录屏 / 路演 / 逐步讲解
                    </p>
                  </div>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: '#9CA3AF' }}>
                  每完成一个 Agent 后自动暂停，由您点击「执行下一步」继续，便于逐步讲解每个 Agent 的推理过程。
                </p>
                <button
                  onClick={onStartStepByStep}
                  className="btn-gold text-sm py-2.5 w-full"
                >
                  开始分步演示
                </button>
              </motion.div>

              {/* Auto run card */}
              <motion.div
                className="rounded-2xl p-6 flex flex-col gap-4 cursor-pointer group transition-all duration-300 bg-white shadow-sm"
                style={{
                  border: '1px solid #E5E7EB',
                }}
                whileHover={{
                  borderColor: 'rgba(22,163,74,0.35)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(22,163,74,0.08)' }}
                  >
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <polygon points="5,3 15,9 5,15" fill="#16A34A" fillOpacity="0.8" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-[#111827] mb-1">一键自动跑完</h3>
                    <p className="text-xs leading-relaxed" style={{ color: '#6B7280' }}>
                      适合快速体验完整流程
                    </p>
                  </div>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: '#9CA3AF' }}>
                  六个 Agent 按顺序自动执行，每步停顿约 1 秒，便于观察进度。无需任何操作，全程自动完成。
                </p>
                <button
                  onClick={onStartAutoRun}
                  className="text-sm py-2.5 w-full rounded-lg font-medium transition-all duration-200"
                  style={{
                    border: '1px solid rgba(22,163,74,0.3)',
                    color: '#16A34A',
                    background: 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(22,163,74,0.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  一键生成完整方案
                </button>
              </motion.div>
            </div>

            {/* Reset button — tertiary */}
            <div className="flex justify-center mb-8">
              <button
                onClick={onReset}
                className="text-xs px-6 py-2 rounded-lg transition-colors"
                style={{ color: '#9CA3AF', background: 'transparent', border: '1px solid #E5E7EB' }}
              >
                重置案例
              </button>
            </div>

            {/* Demo case summary */}
            <div
              className="rounded-xl p-4 flex items-start gap-4"
              style={{
                background: '#F9FAFB',
                border: '1px solid #E5E7EB',
              }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: 'rgba(214,168,79,0.08)' }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <rect x="1" y="1" width="12" height="12" rx="2" stroke="#D6A84F" strokeWidth="1.2" />
                  <path d="M4 4h6M4 7h6M4 10h3" stroke="#D6A84F" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
              </div>
              <div>
                <div className="text-xs font-medium text-[#111827] mb-1">演示案例</div>
                <div className="text-sm font-semibold mb-1.5" style={{ color: '#D6A84F' }}>
                  北京欢乐谷社区公园景观概念设计
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-0.5">
                  {[
                    '北京市朝阳区欢乐谷',
                    '约 8000 平方米',
                    '社区公园 / 城市更新型公共绿地',
                  ].map((item) => (
                    <span key={item} className="text-xs" style={{ color: '#6B7280' }}>
                      · {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ====================== STEP-BY-STEP: 分步进行中（等待） ====================== */}
        {demoPhase === 'waiting' && (
          <motion.div
            key="waiting"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="rounded-2xl p-5 bg-white shadow-sm"
            style={{
              border: '1px solid rgba(214,168,79,0.25)',
            }}
          >
            {/* Status line */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span
                  className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full"
                  style={{ background: 'rgba(214,168,79,0.08)', color: '#D6A84F', border: '1px solid rgba(214,168,79,0.2)' }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D6A84F]" />
                  分步演示模式
                </span>
                <span className="text-xs" style={{ color: '#6B7280' }}>
                  {currentStep + 1} / {STEPS.length}
                </span>
              </div>
              <button
                onClick={onReset}
                className="text-xs px-3 py-1 rounded-lg transition-colors"
                style={{ color: '#6B7280', background: '#F3F4F6', border: '1px solid #E5E7EB' }}
              >
                重置
              </button>
            </div>

            {/* Progress info */}
            <div className="mb-5">
              <div className="text-xs mb-1" style={{ color: '#6B7280' }}>当前已完成</div>
              <div className="text-base font-semibold text-[#111827]">{completedStepLabel}</div>
              {nextStepLabel && (
                <div className="text-xs mt-2" style={{ color: '#9CA3AF' }}>
                  准备执行：<span style={{ color: '#16A34A' }}>{nextStepLabel}</span>
                </div>
              )}
            </div>

            {/* Action buttons */}
            {nextStepLabel ? (
              <div className="flex items-center gap-3">
                <motion.button
                  onClick={onNextStep}
                  className="flex-1 py-3 text-sm font-medium rounded-xl transition-all duration-200"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    background: 'linear-gradient(135deg, #16A34A 0%, #22C55E 100%)',
                    border: 'none',
                    color: '#FFFFFF',
                    boxShadow: '0 2px 8px rgba(22,163,74,0.25)',
                  }}
                >
                  ▶ 执行下一步
                </motion.button>
                <button
                  onClick={onAutoRunRemaining}
                  className="text-xs px-4 py-3 rounded-xl transition-all duration-200"
                  style={{ border: '1px solid #E5E7EB', color: '#6B7280', background: '#FFFFFF' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#16A34A';
                    e.currentTarget.style.color = '#16A34A';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#E5E7EB';
                    e.currentTarget.style.color = '#6B7280';
                  }}
                >
                  自动跑完剩余步骤
                </button>
              </div>
            ) : (
              /* All done in step-by-step */
              <div className="text-sm text-center py-2" style={{ color: '#16A34A' }}>
                ✓ 全部 Agent 执行完成
              </div>
            )}
          </motion.div>
        )}

        {/* ====================== STEP-BY-STEP: Agent 执行中 ====================== */}
        {demoPhase === 'stepByStep' && isGenerating && (
          <motion.div
            key="stepByStep-running"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="rounded-2xl p-5 flex items-center gap-4 bg-white shadow-sm"
            style={{
              border: '1px solid rgba(22,163,74,0.2)',
            }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(22,163,74,0.08)' }}
            >
              <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="rgba(22,163,74,0.2)" strokeWidth="2.5" />
                <path d="M12 2a10 10 0 0 1 10 10" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs mb-0.5" style={{ color: '#6B7280' }}>分步演示 · 正在执行</div>
              <div className="text-sm font-medium text-[#111827]">
                {currentStep >= 0 ? STEPS[currentStep]?.label : '初始化中…'}
              </div>
            </div>
            <span className="text-xs" style={{ color: '#6B7280' }}>
              {currentStep + 1} / {STEPS.length}
            </span>
          </motion.div>
        )}

        {/* ====================== AUTO RUN: 自动执行中 ====================== */}
        {demoPhase === 'autoRun' && (
          <motion.div
            key="autoRun"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="rounded-2xl p-5 bg-white shadow-sm"
            style={{
              border: '1px solid rgba(22,163,74,0.18)',
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="rgba(22,163,74,0.2)" strokeWidth="2.5" />
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
                <span className="text-sm font-medium text-[#111827]">
                  正在自动执行：{currentStep >= 0 ? STEPS[currentStep]?.label : '初始化…'}
                </span>
              </div>
              <span className="text-xs" style={{ color: '#6B7280' }}>{autoProgress}</span>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 rounded-full mb-4 overflow-hidden" style={{ background: '#E5E7EB' }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, #16A34A, #D6A84F)' }}
                animate={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={onPause}
                className="text-xs px-5 py-2 rounded-lg transition-all duration-200"
                style={{ border: '1px solid #E5E7EB', color: '#374151', background: '#FFFFFF' }}
              >
                ⏸ 暂停
              </button>
              <button
                onClick={onStop}
                className="text-xs px-5 py-2 rounded-lg transition-all duration-200"
                style={{ color: '#EF4444', borderColor: 'rgba(239,68,68,0.25)', border: '1px solid rgba(239,68,68,0.25)', background: '#FFFFFF' }}
              >
                ■ 停止
              </button>
            </div>
          </motion.div>
        )}

        {/* ====================== DONE: 全部完成 ====================== */}
        {demoPhase === 'done' && (
          <motion.div
            key="done"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="rounded-2xl p-5 bg-white shadow-sm"
            style={{
              border: '1px solid rgba(214,168,79,0.25)',
            }}
          >
            {/* Done header */}
            <div className="flex items-center gap-3 mb-5">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(214,168,79,0.1)' }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8L6.5 11.5L13 4.5" stroke="#D6A84F" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-semibold" style={{ color: '#D6A84F' }}>方案生成完成</div>
                <div className="text-xs mt-0.5" style={{ color: '#6B7280' }}>
                  北京欢乐谷社区公园景观概念设计 · 六个 Agent 全部执行完成
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={onReset}
                className="text-xs px-5 py-2 rounded-lg transition-all duration-200"
                style={{ border: '1px solid #E5E7EB', color: '#374151', background: '#FFFFFF' }}
              >
                重新演示
              </button>
              <button
                onClick={onExport}
                className="btn-gold text-xs px-5 py-2"
              >
                导出 Markdown 报告
              </button>
              <button
                className="text-xs px-5 py-2 rounded-lg transition-all duration-200"
                style={{ border: '1px solid rgba(214,168,79,0.25)', color: '#D6A84F', background: '#FFFFFF' }}
                onClick={() => {
                  document.querySelector('[data-section="visual"]')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                查看视觉成果
              </button>
              <button
                className="text-xs px-5 py-2 rounded-lg transition-all duration-200"
                style={{ border: '1px solid #E5E7EB', color: '#6B7280', background: '#FFFFFF' }}
                onClick={() => {
                  document.querySelector('[data-section="ppt"]')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                查看 PPT 大纲
              </button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
