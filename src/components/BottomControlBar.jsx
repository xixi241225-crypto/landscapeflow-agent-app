import { AGENTS } from '../blueprint/blueprintModel';

export default function BottomControlBar({
  blueprint,
  runState,
  runMode,
  viewedStep,
  currentStep,
  visualWorkflowStep,
  outputWorkflowStep,
  onRunNext,
  onPause,
  onResume,
  onStop,
  onReset,
  onRestartDemo,
  onPrevStep,
  onNextStep,
  presentationMode = false,
  presentationStage = 0,
  presentationAgentStates = [],
  presentationBusy = false,
  onModifyPresentation,
  onConfirmPresentation,
  onOpenResults,
}) {
  if (presentationMode) {
    const completeCount = presentationAgentStates.filter((status) => status === '已完成').length;
    return (
      <div className="absolute bottom-0 left-0 right-0 z-30 border-t border-[var(--lf-border)] bg-white/95 px-5 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-[980px] items-center justify-between gap-4">
          {presentationStage === 0 && (
            <>
              <p className="text-sm text-[var(--lf-muted)]">完善核心资料后即可开始整理项目。</p>
              <span className="text-xs font-semibold text-[var(--lf-brand-600)]">阶段 1 / 4</span>
            </>
          )}
          {presentationStage === 1 && (
            <>
              <button onClick={onModifyPresentation} className="btn-secondary px-5 py-3 text-sm">修改或补充资料</button>
              <button onClick={onConfirmPresentation} disabled={presentationBusy} className="btn-primary px-7 py-3 text-base disabled:cursor-wait disabled:opacity-70">
                {presentationBusy ? '正在启动 Agent 协作…' : '确认设计方向并开始设计'}
              </button>
            </>
          )}
          {presentationStage === 2 && (
            <>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between text-sm">
                  <span className={completeCount === 6 ? 'font-semibold text-emerald-700' : 'font-semibold text-[var(--lf-brand-700)]'}>
                    {completeCount === 6 ? '六个专业 Agent 已全部完成' : '正在生成完整方案……'}
                  </span>
                  <span className="text-[var(--lf-muted)]">{completeCount} / 6</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-violet-100">
                  <span className="block h-full rounded-full bg-gradient-to-r from-[var(--lf-brand-700)] to-cyan-500 transition-all" style={{ width: `${completeCount / 6 * 100}%` }} />
                </div>
              </div>
              {completeCount === 6 && <button onClick={onOpenResults} className="btn-primary shrink-0 px-7 py-3 text-base">查看完整成果</button>}
            </>
          )}
        </div>
      </div>
    );
  }

  const activeCheckpoint = blueprint.checkpoints.find((item) => item.id === blueprint.currentCheckpoint);
  const viewedRun = blueprint.agentRuns?.[viewedStep + 1];
  const checkpointForViewed = blueprint.checkpoints.find((item) => item.afterAgent === viewedStep + 1);
  const nextBlockedReason = blueprint.currentCheckpoint
    ? `请先完成${blueprint.checkpoints.find((item) => item.id === blueprint.currentCheckpoint)?.name}`
    : viewedRun?.status === 'pending'
      ? '当前阶段尚未执行'
      : viewedRun?.status === 'stale'
        ? '当前成果需要重新生成'
        : viewedStep === 4 && visualWorkflowStep < 3
          ? '请先确认任务书并生成视觉成果'
          : viewedStep === 5 && outputWorkflowStep < 4
            ? '请先完成方案文案与 PPT 预览'
            : checkpointForViewed && checkpointForViewed.status !== '已确认'
              ? `等待${checkpointForViewed.name}`
              : '';
  const canNext = viewedStep < 5 && !nextBlockedReason;
  const canPrev = viewedStep > 0;
  const nextAgent = Object.values(blueprint.agentRuns || {}).find((item) => ['pending', 'stale'].includes(item.status));
  const capsule = 'flex items-center gap-3 px-4 py-2.5 rounded-2xl pointer-events-auto';
  return (
    <div className="absolute bottom-0 left-0 right-0 z-30 border-t border-[var(--lf-border)] bg-white/95 px-4 py-3 backdrop-blur-md">
      <div className={`${capsule} mx-auto justify-between`} style={{ maxWidth: '980px' }}>
        <div className="hidden min-w-[120px] lg:block" />
        <div className="flex items-center gap-2">
          {runState === 'running' && (
            <>
              <span className="text-xs text-cyan-700 mr-1"><span className="inline-block animate-spin mr-2">◌</span>正在执行：{AGENTS[currentStep]?.name}</span>
              <button onClick={onPause} className="px-3 py-1.5 rounded-lg text-xs border border-gray-200 bg-gray-50 text-gray-600">⏸ 暂停</button>
              <button onClick={onStop} className="px-3 py-1.5 rounded-lg text-xs border border-red-200 bg-red-50 text-red-700">■ 停止</button>
            </>
          )}
          {runState === 'paused' && (
            <>
              <span className="text-xs text-amber-700">任务已真实暂停</span>
              <button onClick={onResume} className="btn-primary px-4 py-2 text-xs">继续运行</button>
              <button onClick={onStop} className="px-3 py-1.5 rounded-lg text-xs border border-red-200 bg-red-50 text-red-700">停止</button>
            </>
          )}
          {runState === 'checkpoint' && (
            <span className="text-xs font-semibold text-[var(--lf-gold)] px-3 py-2 rounded-xl bg-[var(--lf-gold-soft)] border border-amber-200">◆ 等待设计师：{activeCheckpoint?.name || '确认节点'}</span>
          )}
          {['ready', 'stopped'].includes(runState) && (
            <>
              <button onClick={onRunNext} className="btn-primary px-5 py-2 text-sm">运行 Agent {nextAgent?.agentId || '—'}｜{nextAgent?.agentName || '无待执行项'}</button>
              <button onClick={onStop} className="px-3 py-1.5 rounded-lg text-xs border border-gray-200 text-gray-500">停止</button>
            </>
          )}
          {runState === 'done' && (
            <>
              {blueprint.invalidatedOutputs.length > 0 ? (
                <button onClick={onRunNext} className="px-5 py-2 rounded-xl text-sm font-medium bg-red-600 text-white">重新生成受影响成果（{blueprint.invalidatedOutputs.length}）</button>
              ) : <span className="text-xs text-green-700 px-3">{blueprint.officialPackageStatus.includes('已完成') ? '演示方案已完成｜正式成果可继续深化' : '六 Agent 流程已完成'}</span>}
              {runMode === 'roadshow' && <button onClick={onRestartDemo} className="px-3 py-1.5 rounded-lg text-xs border border-amber-200 text-amber-700">重新开始演示</button>}
              <button onClick={onReset} className="px-3 py-1.5 rounded-lg text-xs border border-gray-200 text-gray-500">新建项目</button>
            </>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button onClick={onPrevStep} disabled={!canPrev} className="rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-600 disabled:opacity-30">上一步</button>
          <span className="w-10 text-center text-xs text-gray-400">{viewedStep + 1}/6</span>
          <button onClick={onNextStep} disabled={!canNext} title={nextBlockedReason || '进入下一阶段'} className="rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-600 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-300">下一步</button>
          {nextBlockedReason && <span className="hidden max-w-[180px] text-xs text-amber-700 xl:inline">{nextBlockedReason}</span>}
        </div>
      </div>
    </div>
  );
}
