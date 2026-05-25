/**
 * AgentSidebar — 可点击导航 + 纯状态展示（明亮风格）
 *
 * 职责：
 *   · 显示 6 个 Agent 流程状态（待执行 / 执行中 / 完成）
 *   · 点击切换查看对应阶段（不触发执行）
 *   · 显示项目信息卡片
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
    <div className="h-full flex flex-col overflow-hidden" style={{ background: '#FAFAFA' }}>

      {/* ---- Sidebar Header ---- */}
      <div
        className="px-5 py-4 border-b flex-shrink-0"
        style={{ borderColor: '#E5E5E5', background: '#FFFFFF' }}
      >
        <h3 className="text-[11px] font-bold tracking-widest uppercase mb-0.5" style={{ color: '#374151' }}>
          Agent 工作流
        </h3>
        <p className="text-[10px]" style={{ color: '#9CA3AF' }}>6 步自动生成完整方案</p>
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
                          ? '#16A34A'
                          : '#E5E7EB',
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
                        ? '#16A34A'
                        : status === 'working'
                        ? '#F0FDF4'
                        : isViewed ? '#FFFFFF' : '#F3F4F6',
                      border: status === 'done'
                        ? 'none'
                        : status === 'working'
                        ? '1.5px solid #16A34A'
                        : isViewed
                        ? '1.5px solid #D6A84F'
                        : '1px solid #E5E7EB',
                      boxShadow: status === 'working'
                        ? '0 0 10px rgba(22,163,74,0.25)'
                        : status === 'done'
                        ? 'none'
                        : '0 1px 2px rgba(0,0,0,0.04)',
                    }}
                  >
                    {status === 'done' ? (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2.5 6L5 8.5L9.5 3.5" stroke="#FFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : status === 'working' ? (
                      <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="#16A34A" strokeWidth="2.5" opacity="0.2" />
                        <path d="M12 2a10 10 0 0 1 10 10" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" />
                      </svg>
                    ) : (
                      <span style={{ fontSize: '9px', color: isViewed ? '#D6A84F' : '#9CA3AF', fontWeight: '700' }}>
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
                          ? '#16A34A'
                          : '#E5E7EB',
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
                      color: isViewed || status === 'working'
                        ? '#1F2937'
                        : status === 'done'
                        ? '#16A34A'
                        : '#6B7280',
                      fontWeight: isViewed || status === 'working' ? 600 : 500,
                    }}
                  >
                    {step.label}
                  </div>
                  <div className="text-[10px] mt-0.5 leading-relaxed" style={{ color: '#9CA3AF' }}>
                    {step.desc}
                  </div>

                  {/* Status pill — compact */}
                  {status === 'working' && (
                    <span
                      className="inline-block text-[9px] px-2 py-0.5 rounded-full mt-1.5 font-medium"
                      style={{
                        background: '#F0FDF4',
                        color: '#16A34A',
                      }}
                    >
                      执行中...
                    </span>
                  )}
                  {status === 'done' && (
                    <span
                      className="inline-block text-[9px] px-2 py-0.5 rounded-full mt-1.5 font-medium"
                      style={{
                        background: '#F0FDF4',
                        color: '#16A34A',
                      }}
                    >
                      ✓ 完成
                    </span>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ---- Project info card — bottom ---- */}
      <div
        className="px-4 py-3 border-t flex-shrink-0"
        style={{ borderColor: '#E5E5E5', background: '#FFFFFF' }}
      >
        <div
          className="rounded-xl p-3.5"
          style={{
            background: '#FAFAF9',
            border: '1px solid #E5E5E3',
          }}
        >
          <div className="text-[9px] font-bold tracking-widest uppercase mb-2.5" style={{ color: '#9CA3AF' }}>
            方案信息
          </div>

          {hasAnyOutput ? (
            <>
              <div className="text-xs font-bold mb-0.5 leading-tight" style={{ color: '#1F2937' }}>{schemeName}</div>
              <div className="text-[10px] mb-0.5" style={{ color: '#6B7280' }}>北京 · 朝阳区 · 欢乐谷</div>
              <div className="text-[10px]" style={{ color: '#9CA3AF' }}>
                {projectName || '北京欢乐谷社区公园'}
              </div>
              {/* Progress */}
              <div className="mt-2.5 h-1.5 rounded-full overflow-hidden" style={{ background: '#E5E7EB' }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${(completedCount / 6) * 100}%`,
                    background: 'linear-gradient(90deg, #16A34A, #22C55E)',
                  }}
                />
              </div>
              <div className="text-[9px] mt-1.5 font-medium" style={{ color: '#16A34A' }}>
                {completedCount} / 6 Agent 完成
              </div>
            </>
          ) : (
            <div className="text-[10px] leading-relaxed py-1 text-center" style={{ color: '#9CA3AF' }}>
              选择演示模式后开始生成方案
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
