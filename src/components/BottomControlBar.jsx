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
 * BottomControlBar — 唯一的阶段切换和操作控制区
 * 固定底部，深色玻璃效果
 *
 * 状态：
 *   'idle'      — 未开始，显示"开始分步演示"/"一键自动跑完"
 *   'waiting'   — 分步暂停，显示"执行下一步"/"自动跑完剩余"
 *   'autoRun'   — 自动运行中，显示"暂停"/"停止"
 *   'done'      — 全部完成，显示"重新演示"/"导出报告"+ 上一步/下一步
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

  // Can navigate: done state or viewing completed steps
  const canGoPrev = viewedStep > 0;
  const canGoNext = viewedStep < totalSteps - 1;

  const barHeight = '56px';

  return (
    <div
      className="fixed bottom-0 right-0 left-[280px] z-30 flex items-center px-5"
      style={{
        height: barHeight,
        background: 'rgba(13,15,14,0.92)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderTop: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {/* Left: Stage info */}
      <div className="flex items-center gap-3 flex-shrink-0" style={{ minWidth: '240px' }}>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px]" style={{ color: '#555955' }}>阶段</span>
          <span className="text-xs font-medium" style={{ color: '#A8A29A' }}>{currentLabel}</span>
        </div>
        <div className="h-3 w-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
        <div className="flex items-center gap-1.5">
          <span className="text-[10px]" style={{ color: '#555955' }}>进度</span>
          <span className="text-xs font-medium" style={{ color: '#22C55E' }}>
            {completedCount} / {totalSteps}
          </span>
        </div>
        {/* Progress bar mini */}
        <div className="h-1 w-20 rounded-full overflow-hidden" style={{ background: '#1D1F1E' }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #22C55E, rgba(34,197,94,0.5))' }}
            animate={{ width: `${(completedCount / totalSteps) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Center: Main action / navigation */}
      <div className="flex-1 flex items-center justify-center gap-3">
        {/* IDLE: Start buttons */}
        {isIdle && (
          <>
            <motion.button
              onClick={onStartStepByStep}
              className="px-5 py-2 text-sm font-medium rounded-lg transition-all"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              style={{
                background: 'linear-gradient(135deg, rgba(214,181,109,0.2) 0%, rgba(214,181,109,0.1) 100%)',
                border: '1px solid rgba(214,181,109,0.35)',
                color: '#D6B56D',
              }}
            >
              ◆ 分步演示
            </motion.button>
            <button
              onClick={onStartAutoRun}
              className="px-5 py-2 text-sm rounded-lg transition-all"
              style={{
                background: 'rgba(34,197,94,0.08)',
                border: '1px solid rgba(34,197,94,0.25)',
                color: '#22C55E',
              }}
            >
              ▶ 一键自动跑完
            </button>
            <span className="text-[10px] ml-1" style={{ color: '#555955' }}>
              分步演示适合录屏讲解；一键自动适合快速体验
            </span>
          </>
        )}

        {/* WAITING: Next step */}
        {isWaiting && (
          <>
            <motion.button
              onClick={onNextStep}
              className="px-6 py-2 text-sm font-medium rounded-lg"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              style={{
                background: 'linear-gradient(135deg, rgba(34,197,94,0.22) 0%, rgba(34,197,94,0.1) 100%)',
                border: '1px solid rgba(34,197,94,0.45)',
                color: '#22C55E',
              }}
            >
              ▶ 执行下一步
            </motion.button>
            <button
              onClick={onAutoRunRemaining}
              className="px-4 py-2 text-xs rounded-lg transition-all"
              style={{
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#A8A29A',
              }}
            >
              自动跑完剩余步骤
            </button>
          </>
        )}

        {/* AUTO RUN: Running */}
        {isAutoRun && (
          <>
            <div className="flex items-center gap-2.5 mr-3">
              <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="rgba(34,197,94,0.2)" strokeWidth="2.5" />
                <path d="M12 2a10 10 0 0 1 10 10" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
              <span className="text-xs" style={{ color: '#A8A29A' }}>
                正在自动执行：{STEPS[currentStep]?.label}
              </span>
            </div>
            <button
              onClick={onPause}
              className="px-4 py-2 text-xs rounded-lg"
              style={{
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#A8A29A',
              }}
            >
              ⏸ 暂停
            </button>
            <button
              onClick={onStop}
              className="px-4 py-2 text-xs rounded-lg"
              style={{
                background: 'transparent',
                border: '1px solid rgba(239,68,68,0.3)',
                color: '#EF4444',
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
              className="px-4 py-2 text-xs rounded-lg transition-all disabled:opacity-25"
              style={{
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.08)',
                color: canGoPrev ? '#A8A29A' : '#3D403C',
              }}
            >
              ← 上一步
            </button>
            <span className="text-xs px-2" style={{ color: '#555955' }}>
              {viewedStep + 1} / {totalSteps}
            </span>
            <button
              onClick={onNextStepNav}
              disabled={!canGoNext}
              className="px-4 py-2 text-xs rounded-lg transition-all disabled:opacity-25"
              style={{
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.08)',
                color: canGoNext ? '#A8A29A' : '#3D403C',
              }}
            >
              下一步 →
            </button>
          </>
        )}
      </div>

      {/* Right: Utility actions */}
      <div className="flex items-center gap-2 flex-shrink-0" style={{ minWidth: '200px', justifyContent: 'flex-end' }}>
        {isDone && (
          <>
            <button
              onClick={onExport}
              className="px-3 py-1.5 text-[10px] rounded-lg"
              style={{
                background: 'rgba(214,181,109,0.1)',
                border: '1px solid rgba(214,181,109,0.2)',
                color: '#D6B56D',
              }}
            >
              导出报告
            </button>
            <button
              onClick={onReset}
              className="px-3 py-1.5 text-[10px] rounded-lg"
              style={{
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.06)',
                color: '#555955',
              }}
            >
              重新演示
            </button>
          </>
        )}
        {!isDone && !isIdle && (
          <button
            onClick={onReset}
            className="px-3 py-1.5 text-[10px] rounded-lg"
            style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.06)',
              color: '#555955',
            }}
          >
            重置
          </button>
        )}
      </div>
    </div>
  );
}
