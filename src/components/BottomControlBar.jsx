import { motion } from 'framer-motion';

const STEPS = [
  { key: 'step1', label: '项目定义 Agent' },
  { key: 'step2', label: '概念生成 Agent' },
  { key: 'step3', label: '方案选择 Agent' },
  { key: 'step4', label: '空间推演 Agent' },
  { key: 'step5', label: '视觉表达 Agent' },
  { key: 'step6', label: '输出成果 Agent' },
];

/**
 * BottomControlBar — 居中悬浮控制台（明亮风格）
 * 固定底部居中，白色玻璃态胶囊，微妙阴影
 *
 * 状态：
 *   'idle'      — 未开始，显示"分步演示"/"一键自动跑完"
 *   'waiting'   — 分步暂停，显示"执行下一步"/"自动跑完剩余"
 *   'autoRun'   — 自动运行中，显示"暂停"/"停止"
 *   'done'      — 全部完成，显示导航 + "导出报告"
 */
export default function BottomControlBar({
  demoPhase,
  viewedStep,
  currentStep,
  isGenerating,
  onStartStepByStep,
  onStartAutoRun,
  onNextStep,
  onAutoRunRemaining,
  onPause,
  onStop,
  onReset,
  onExport,
  onPrevStep,
  onNextStepNav,
  stepData,
}) {
  const totalSteps = STEPS.length;
  const completedCount = Object.values(stepData || {}).filter(Boolean).length;
  const currentLabel = STEPS[viewedStep]?.label || '';
  const hasOutputs = completedCount > 0;
  const isDone = demoPhase === 'done';
  const isIdle = demoPhase === 'idle';
  const isWaiting = demoPhase === 'waiting';
  const isAutoRun = demoPhase === 'autoRun' || (demoPhase === 'stepByStep' && isGenerating);

  // Can navigate
  const canGoPrev = viewedStep > 0;
  const canGoNext = viewedStep < totalSteps - 1;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-center pb-5 pt-2 pointer-events-none">
      {/* Centered floating capsule */}
      <div
        className="flex items-center gap-3 px-5 py-2.5 rounded-2xl pointer-events-auto"
        style={{
          background: 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(0, 0, 0, 0.06)',
          boxShadow: '0 -4px 24px rgba(0, 0, 0, 0.06), 0 1px 4px rgba(0, 0, 0, 0.02)',
        }}
      >
        {/* Left: Stage info (compact) */}
        <div className="flex items-center gap-2.5 flex-shrink-0" style={{ minWidth: '200px' }}>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-medium" style={{ color: '#9CA3AF' }}>阶段</span>
            <span className="text-xs font-semibold" style={{ color: '#374151' }}>{currentLabel}</span>
          </div>
          <div className="h-3 w-px rounded-full" style={{ background: '#E5E7EB' }} />
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-medium" style={{ color: '#9CA3AF' }}>进度</span>
            <span className="text-xs font-bold tabular-nums" style={{ color: '#16A34A' }}>
              {completedCount} / {totalSteps}
            </span>
          </div>
          {/* Progress bar mini */}
          <div className="h-1.5 w-16 rounded-full overflow-hidden" style={{ background: '#F3F4F6' }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, #16A34A, #22C55E)' }}
              animate={{ width: `${(completedCount / totalSteps) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* Vertical separator */}
        <div className="h-7 w-px rounded-full" style={{ background: '#E5E7EB' }} />

        {/* Center: Main action buttons */}
        <div className="flex items-center justify-center gap-2.5">
          {/* IDLE: Start buttons */}
          {isIdle && (
            <>
              <motion.button
                onClick={onStartStepByStep}
                className="px-5 py-2 text-sm font-medium rounded-xl transition-all shadow-sm"
                whileHover={{ scale: 1.03, y: -1 }}
                whileTap={{ scale: 0.97 }}
                style={{
                  background: 'linear-gradient(135deg, #FFFFFF 0%, #F9FAFB 100%)',
                  border: '1px solid rgba(214, 168, 79, 0.35)',
                  color: '#B8860B',
                  boxShadow: '0 1px 6px rgba(214, 168, 79, 0.08)',
                }}
              >
                ◆ 分步演示
              </motion.button>
              <button
                onClick={onStartAutoRun}
                className="px-5 py-2 text-sm font-medium rounded-xl transition-all shadow-sm hover:shadow-md"
                style={{
                  background: 'linear-gradient(135deg, #16A34A, #22C55E)',
                  border: 'none',
                  color: '#FFFFFF',
                  boxShadow: '0 2px 8px rgba(22, 163, 74, 0.25)',
                }}
                onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 14px rgba(22,163,74,0.35)'}
                onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 2px 8px rgba(22,163,74,0.25)'}
              >
                ▶ 一键自动跑完
              </button>
            </>
          )}

          {/* WAITING: Next step */}
          {isWaiting && (
            <>
              <motion.button
                onClick={onNextStep}
                className="px-6 py-2 text-sm font-medium rounded-xl transition-all"
                whileHover={{ scale: 1.03, y: -1 }}
                whileTap={{ scale: 0.96 }}
                style={{
                  background: 'linear-gradient(135deg, #16A34A, #22C55E)',
                  border: 'none',
                  color: '#FFFFFF',
                  boxShadow: '0 2px 10px rgba(22, 163, 74, 0.28)',
                }}
              >
                ▶ 执行下一步
              </motion.button>
              <button
                onClick={onAutoRunRemaining}
                className="px-4 py-2 text-xs font-medium rounded-xl transition-all"
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  color: '#6B7280',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#D1D5DB'; e.currentTarget.style.color = '#374151'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.color = '#6B7280'; }}
              >
                自动跑完剩余
              </button>
            </>
          )}

          {/* AUTO RUN: Running indicator + controls */}
          {isAutoRun && (
            <>
              <div className="flex items-center gap-2 mr-1">
                <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="rgba(22,163,74,0.15)" strokeWidth="2.5" />
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
                <span className="text-xs" style={{ color: '#6B7280' }}>
                  正在执行：{STEPS[currentStep]?.label}
                </span>
              </div>
              <button
                onClick={onPause}
                className="px-3 py-1.5 text-xs font-medium rounded-lg transition-all"
                style={{
                  background: '#F3F4F6',
                  border: '1px solid #E5E7EB',
                  color: '#4B5563',
                }}
              >
                ⏸ 暂停
              </button>
              <button
                onClick={onStop}
                className="px-3 py-1.5 text-xs font-medium rounded-lg transition-all"
                style={{
                  background: '#FEF2F2',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  color: '#DC2626',
                }}
              >
                ■ 停止
              </button>
            </>
          )}

          {/* DONE / NAVIGATION: Prev/Next */}
          {(isDone || (!isIdle && !isWaiting && !isAutoRun && hasOutputs)) && (
            <>
              <button
                onClick={onPrevStep}
                disabled={!canGoPrev}
                className="px-4 py-2 text-xs font-medium rounded-lg transition-all disabled:opacity-30"
                style={{
                  background: canGoPrev ? '#F9FAFB' : '#F3F4F6',
                  border: `1px solid ${canGoPrev ? '#E5E7EB' : '#F3F4F6'}`,
                  color: canGoPrev ? '#4B5563' : '#D1D5DB',
                }}
              >
                ← 上一步
              </button>
              <span className="text-xs px-2 font-medium tabular-nums" style={{ color: '#9CA3AF' }}>
                {viewedStep + 1} / {totalSteps}
              </span>
              <button
                onClick={onNextStepNav}
                disabled={!canGoNext}
                className="px-4 py-2 text-xs font-medium rounded-lg transition-all disabled:opacity-30"
                style={{
                  background: canGoNext ? '#F9FAFB' : '#F3F4F6',
                  border: `1px solid ${canGoNext ? '#E5E7EB' : '#F3F4F6'}`,
                  color: canGoNext ? '#4B5563' : '#D1D5DB',
                }}
              >
                下一步 →
              </button>
            </>
          )}
        </div>

        {/* Vertical separator */}
        <div className="h-7 w-px rounded-full" style={{ background: '#E5E7EB' }} />

        {/* Right: Utility actions */}
        <div className="flex items-center gap-2 flex-shrink-0" style={{ minWidth: '120px', justifyContent: 'flex-end' }}>
          {isDone && (
            <>
              <button
                onClick={onExport}
                className="px-3 py-1.5 text-[11px] font-medium rounded-lg transition-all"
                style={{
                  background: 'rgba(214, 168, 79, 0.08)',
                  border: '1px solid rgba(214, 168, 79, 0.25)',
                  color: '#B8860B',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(214,168,79,0.12)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(214,168,79,0.08)'; }}
              >
                导出报告
              </button>
              <button
                onClick={onReset}
                className="px-3 py-1.5 text-[11px] font-medium rounded-lg transition-all"
                style={{
                  background: '#F3F4F6',
                  border: '1px solid #E5E7EB',
                  color: '#6B7280',
                }}
              >
                重新演示
              </button>
            </>
          )}
          {!isDone && !isIdle && (
            <button
              onClick={onReset}
              className="px-3 py-1.5 text-[11px] font-medium rounded-lg transition-all"
              style={{
                background: '#F3F4F6',
                border: '1px solid #E5E7EB',
                color: '#9CA3AF',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#6B7280'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#9CA3AF'; }}
            >
              重置
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
