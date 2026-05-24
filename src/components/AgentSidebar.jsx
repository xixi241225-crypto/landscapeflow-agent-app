/**
 * AgentSidebar — 可点击导航 + 纯状态展示
 *
 * 职责：
 *   · 显示 6 个 Agent 流程状态（待执行 / 执行中 / 完成）
 *   · 点击切换查看对应阶段（不触发执行）
 *   · 显示项目信息卡片
 *
 * 不负责任何操作按钮。"执行下一步"唯一在底部控制栏中。
 */

const STEPS = [
  { key: 'step1', label: '项目定义 Agent', desc: '解析场地条件与缺失信息' },
  { key: 'step2', label: '概念生成 Agent', desc: '生成三个差异化概念方案' },
  { key: 'step3', label: '方案选择 Agent', desc: '六维度加权打分比选' },
  { key: 'step4', label: '空间推演 Agent', desc: '深化推荐方案空间策略' },
  { key: 'step5', label: '视觉表达 Agent', desc: '实时生成 + 精选成果库' },
  { key: 'step6', label: '输出成果 Agent', desc: 'Markdown + PPT + 视觉成果' },
];

export default function AgentSidebar({
  stepStatus,
  currentStep,
  viewedStep,
  isGenerating,
  demoPhase,
  stepData,
  projectName,
  onStepClick,
}) {
  const hasAnyOutput = Object.keys(stepData || {}).length > 0;
  const schemeName = stepData?.step4?.recommendedScheme?.name || '欢乐草坪 · 邻里活力客厅';
  const completedCount = Object.values(stepStatus || {}).filter((s) => s === 'done').length;

  return (
    <div className="h-full flex flex-col overflow-hidden">

      {/* ---- Sidebar Header ---- */}
      <div className="px-5 py-4 border-b flex-shrink-0" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <h3 className="text-[11px] font-semibold tracking-widest uppercase mb-0.5" style={{ color: '#555955' }}>
          Agent 工作流
        </h3>
        <p className="text-[10px]" style={{ color: '#3D403C' }}>6 步自动生成完整方案</p>
      </div>

      {/* ---- Steps ---- */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="relative">
          {STEPS.map((step, index) => {
            const status = stepStatus?.[step.key] || 'pending';
            const isCurrent = currentStep === index;
            const isViewed = viewedStep === index;
            const isLast = index === STEPS.length - 1;

            return (
              <div key={step.key} className="relative flex gap-3">
                {/* Timeline column */}
                <div className="flex flex-col items-center w-7 flex-shrink-0">
                  {/* Line above dot */}
                  {index > 0 && (
                    <div
                      className="w-px"
                      style={{
                        height: '14px',
                        background: stepStatus?.[STEPS[index - 1].key] === 'done'
                          ? 'rgba(34,197,94,0.2)'
                          : 'rgba(255,255,255,0.04)',
                      }}
                    />
                  )}

                  {/* Status dot */}
                  <div
                    style={{
                      width: status === 'working' ? '28px' : '24px',
                      height: status === 'working' ? '28px' : '24px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      transition: 'all 0.4s ease',
                      background: status === 'done'
                        ? 'rgba(34,197,94,0.08)'
                        : status === 'working'
                        ? 'rgba(34,197,94,0.12)'
                        : '#111312',
                      border: status === 'done'
                        ? '1px solid rgba(34,197,94,0.25)'
                        : status === 'working'
                        ? '1.5px solid rgba(34,197,94,0.5)'
                        : '1px solid rgba(255,255,255,0.06)',
                      boxShadow: status === 'working'
                        ? '0 0 10px rgba(34,197,94,0.2)'
                        : 'none',
                    }}
                  >
                    {status === 'done' ? (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5L4.5 7.5L8 3" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : status === 'working' ? (
                      <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="rgba(34,197,94,0.15)" strokeWidth="2.5" />
                        <path d="M12 2a10 10 0 0 1 10 10" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" />
                      </svg>
                    ) : (
                      <span style={{ fontSize: '9px', color: '#3D403C', fontWeight: '600' }}>
                        {String(index + 1).padStart(2, '0')}
                      </span>
                    )}
                  </div>

                  {/* Line below dot */}
                  {!isLast && (
                    <div
                      className="w-px flex-1"
                      style={{
                        minHeight: '16px',
                        background: status === 'done'
                          ? 'rgba(34,197,94,0.2)'
                          : 'rgba(255,255,255,0.04)',
                      }}
                    />
                  )}
                </div>

                {/* Step info — clickable to view */}
                <button
                  onClick={() => onStepClick?.(index)}
                  className={`flex-1 min-w-0 text-left pb-4 ${isLast ? 'pb-0' : ''}`}
                  style={{ paddingTop: index > 0 ? '1px' : '0' }}
                >
                  <div
                    className="text-xs font-medium transition-colors duration-300"
                    style={{
                      color: isViewed
                        ? '#F5F1E8'
                        : status === 'done'
                        ? '#A8A29A'
                        : status === 'working'
                        ? '#F5F1E8'
                        : '#555955',
                    }}
                  >
                    {step.label}
                  </div>
                  <div className="text-[10px] mt-0.5 leading-relaxed" style={{ color: '#3D403C' }}>
                    {step.desc}
                  </div>

                  {/* Status pill — compact */}
                  {status === 'working' && (
                    <span
                      className="inline-block text-[9px] px-1.5 py-0.5 rounded-full mt-1"
                      style={{
                        background: 'rgba(34,197,94,0.08)',
                        color: '#22C55E',
                        border: '1px solid rgba(34,197,94,0.2)',
                      }}
                    >
                      执行中
                    </span>
                  )}
                  {status === 'done' && (
                    <span
                      className="inline-block text-[9px] px-1.5 py-0.5 rounded-full mt-1"
                      style={{
                        background: 'rgba(61,64,60,0.25)',
                        color: '#555955',
                        border: '1px solid rgba(61,64,60,0.25)',
                      }}
                    >
                      完成
                    </span>
                  )}
                  {/* Viewed indicator */}
                  {isViewed && status !== 'working' && status !== 'done' && (
                    <span
                      className="inline-block text-[9px] px-1.5 py-0.5 rounded-full mt-1"
                      style={{
                        background: 'rgba(214,181,109,0.06)',
                        color: '#D6B56D',
                        border: '1px solid rgba(214,181,109,0.15)',
                      }}
                    >
                      当前查看
                    </span>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ---- Project info card — bottom ---- */}
      <div className="px-4 py-3 border-t flex-shrink-0" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <div
          className="rounded-xl p-3"
          style={{
            background: '#101211',
            border: '1px solid rgba(214,181,109,0.1)',
          }}
        >
          <div className="text-[9px] font-semibold tracking-widest uppercase mb-2" style={{ color: '#3D403C' }}>
            方案信息
          </div>

          {hasAnyOutput ? (
            <>
              <div className="text-xs font-medium mb-0.5 text-[#F5F1E8] leading-tight">{schemeName}</div>
              <div className="text-[10px] mb-0.5" style={{ color: '#78716C' }}>北京 · 朝阳区 · 欢乐谷</div>
              <div className="text-[10px]" style={{ color: '#555955' }}>
                {projectName || '北京欢乐谷社区公园'}
              </div>
              {/* Progress */}
              <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ background: '#1D1F1E' }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${(completedCount / 6) * 100}%`,
                    background: 'linear-gradient(90deg, rgba(34,197,94,0.6), rgba(34,197,94,0.4))',
                  }}
                />
              </div>
              <div className="text-[9px] mt-1" style={{ color: '#3D403C' }}>
                {completedCount} / 6 Agent 完成
              </div>
            </>
          ) : (
            <div className="text-[10px] leading-relaxed" style={{ color: '#3D403C' }}>
              选择演示模式后开始生成方案
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
