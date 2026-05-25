import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AgentSidebar from './AgentSidebar';
import AgentContent from './AgentContent';
import BottomControlBar from './BottomControlBar';
import HistoryPanel from './HistoryPanel';
import { runAgent } from '../lib/agentEngine';
import { saveHistory } from '../lib/storage';
import { downloadMarkdown } from '../lib/reportExporter';
import { DEMO_CASE } from '../data/demoCase';

const STEPS = [
  { key: 'step1', label: '项目定义 Agent' },
  { key: 'step2', label: '概念生成 Agent' },
  { key: 'step3', label: '方案选择 Agent' },
  { key: 'step4', label: '空间推演 Agent' },
  { key: 'step5', label: '视觉表达 Agent' },
  { key: 'step6', label: '输出成果 Agent' },
];

/**
 * demoPhase state machine:
 *   'idle'        — not started, showing step 0 input form
 *   'stepByStep'  — running step-by-step (agent executing)
 *   'waiting'     — step-by-step paused, waiting for user click
 *   'autoRun'     — auto running all steps
 *   'done'        — all complete, free navigation
 */

export default function Workbench() {
  const navigate = useNavigate();

  // ---- Core state ----
  const [formData, setFormData] = useState(() => ({ ...DEMO_CASE }));
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [viewedStep, setViewedStep] = useState(0); // Which step user is viewing (for canvas)
  const [stepStatus, setStepStatus] = useState({});
  const [stepData, setStepData] = useState({});
  const [projectName, setProjectName] = useState('');
  const [historyOpen, setHistoryOpen] = useState(false);

  // ---- Demo phase ----
  const [demoPhase, setDemoPhase] = useState('idle');
  const autoRunRemainingRef = useRef(false);
  const nextResolver = useRef(null);

  // Auto-track viewedStep during execution
  useEffect(() => {
    if ((demoPhase === 'stepByStep' || demoPhase === 'autoRun') && currentStep >= 0) {
      setViewedStep(currentStep);
    }
  }, [currentStep, demoPhase]);

  // ---- Form update ----
  const handleFormUpdate = useCallback((key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }, []);

  // ---- Fill demo case ----
  const handleFillDemo = useCallback(() => {
    setFormData({ ...DEMO_CASE });
    setProjectName('北京欢乐谷社区公园景观概念设计');
  }, []);

  // ---- waitForUser: called by agentEngine in step-by-step mode ----
  const waitForUser = useCallback(() => {
    return new Promise((resolve) => {
      nextResolver.current = resolve;
      setDemoPhase('waiting');
    });
  }, []);

  // ---- handleNextStep: user clicks "执行下一步" ----
  const handleNextStep = useCallback(() => {
    setDemoPhase('stepByStep');
    if (nextResolver.current) {
      nextResolver.current();
      nextResolver.current = null;
    }
  }, []);

  // ---- handleAutoRunRemaining ----
  const handleAutoRunRemaining = useCallback(() => {
    autoRunRemainingRef.current = true;
    setDemoPhase('autoRun');
    if (nextResolver.current) {
      nextResolver.current();
      nextResolver.current = null;
    }
  }, []);

  // ---- stepUpdate callback from engine ----
  const handleStepUpdate = useCallback((stepIndex, status, data) => {
    setCurrentStep(stepIndex);
    setStepStatus((prev) => ({ ...prev, [`step${stepIndex + 1}`]: status }));
    if (data) {
      setStepData((prev) => ({ ...prev, [`step${stepIndex + 1}`]: data }));
    }
  }, []);

  // ---- Start step-by-step ----
  const handleStartStepByStep = useCallback(async () => {
    if (isGenerating) return;
    autoRunRemainingRef.current = false;
    setStepStatus({});
    setStepData({});
    setCurrentStep(-1);
    setProjectName(formData.projectName || '北京欢乐谷社区公园景观概念设计');
    setDemoPhase('stepByStep');
    setIsGenerating(true);

    try {
      const result = await runAgent(formData, handleStepUpdate, () => {
        if (autoRunRemainingRef.current) return Promise.resolve();
        return waitForUser();
      });
      saveHistory(result);
    } catch (err) {
      console.error('Agent error:', err);
    } finally {
      setIsGenerating(false);
      setDemoPhase('done');
    }
  }, [isGenerating, formData, handleStepUpdate, waitForUser]);

  // ---- Start auto run ----
  const handleStartAutoRun = useCallback(async () => {
    if (isGenerating) return;
    autoRunRemainingRef.current = false;
    setStepStatus({});
    setStepData({});
    setCurrentStep(-1);
    setProjectName(formData.projectName || '北京欢乐谷社区公园景观概念设计');
    setDemoPhase('autoRun');
    setIsGenerating(true);

    try {
      const result = await runAgent(formData, handleStepUpdate, null);
      saveHistory(result);
    } catch (err) {
      console.error('Agent error:', err);
    } finally {
      setIsGenerating(false);
      setDemoPhase('done');
    }
  }, [isGenerating, formData, handleStepUpdate]);

  // ---- Reset ----
  const handleReset = useCallback(() => {
    setDemoPhase('idle');
    setStepStatus({});
    setStepData({});
    setCurrentStep(-1);
    setViewedStep(0);
    setProjectName('');
    autoRunRemainingRef.current = false;
    if (nextResolver.current) {
      nextResolver.current();
      nextResolver.current = null;
    }
  }, []);

  // ---- Pause / Stop ----
  const handlePause = useCallback(() => {
    setDemoPhase('waiting');
  }, []);

  const handleStop = useCallback(() => {
    setDemoPhase('idle');
    setIsGenerating(false);
  }, []);

  // ---- Export ----
  const handleExport = useCallback(() => {
    if (stepData?.step6?.report) {
      downloadMarkdown(stepData.step6.report, projectName || '方案报告');
    }
  }, [stepData, projectName]);

  // ---- Navigation ----
  const handlePrevStep = useCallback(() => {
    setViewedStep((prev) => Math.max(0, prev - 1));
  }, []);

  const handleNextStepNav = useCallback(() => {
    setViewedStep((prev) => Math.min(5, prev + 1));
  }, []);

  const handleStepClick = useCallback((index) => {
    // Allow clicking to view any step (navigates canvas, doesn't trigger execution)
    setViewedStep(index);
  }, []);

  // ---- Load history ----
  const handleLoadHistory = (record) => {
    if (!record?.data) return;
    setProjectName(record.formData?.projectName || '未命名项目');
    setStepData({
      step1: record.data.step1, step2: record.data.step2,
      step3: record.data.step3, step4: record.data.step4,
      step5: record.data.step5, step6: record.data.step6,
    });
    setStepStatus({ step1: 'done', step2: 'done', step3: 'done', step4: 'done', step5: 'done', step6: 'done' });
    setCurrentStep(5);
    setViewedStep(5);
    setDemoPhase('done');
    setHistoryOpen(false);
  };

  // ---- Derived ----
  const hasAnyOutput = Object.keys(stepData).length > 0;
  const completedCount = Object.values(stepStatus).filter((s) => s === 'done').length;

  // Header center text
  const headerCenter = (() => {
    if (demoPhase === 'idle') return null;
    if (demoPhase === 'done') return { mode: '方案完成', stage: '全部 Agent', progress: '6 / 6' };
    const label = currentStep >= 0 ? STEPS[currentStep]?.label : '初始化';
    const modeLabel = demoPhase === 'autoRun' ? '一键自动' : '分步演示';
    return { mode: modeLabel, stage: label, progress: `${Math.max(0, currentStep + 1)} / 6` };
  })();

  const headerHeight = '48px';
  const bottomBarHeight = '56px';

  return (
    <div className="h-screen flex flex-col" style={{ background: '#F7F8F6' }}>

      {/* ============================================ */}
      {/* HEADER — 明亮专业风格 */}
      {/* ============================================ */}
      <header
        className="flex items-center justify-between px-5 flex-shrink-0 border-b z-20"
        style={{ height: headerHeight, background: '#FFFFFF', borderColor: '#E5E7EB' }}
      >
        {/* Left: Logo */}
        <button onClick={() => navigate('/')} className="flex items-center gap-2.5 group flex-shrink-0">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: '#16A34A', boxShadow: '0 1px 3px rgba(22,163,74,0.25)' }}
          >
            <span className="text-sm font-serif font-bold text-white">L</span>
          </div>
          <div className="leading-tight hidden sm:block">
            <div className="text-xs font-bold group-hover:text-[#16A34A] transition-all" style={{ color: '#1F2937' }}>
              景观方案总监 Agent 应用
            </div>
            <div className="text-[9px] tracking-wide" style={{ color: '#9CA3AF' }}>LandscapeFlow AI</div>
          </div>
        </button>

        {/* Center: Mode + Stage + Progress */}
        {headerCenter && (
          <div className="hidden md:flex items-center gap-3 text-[10px]">
            <div className="flex items-center gap-1.5">
              <span style={{ color: '#9CA3AF' }}>模式</span>
              <span className="px-2 py-0.5 rounded-full font-medium" style={{
                background: demoPhase === 'autoRun' ? '#F0FDF4' : '#FFFBEB',
                color: demoPhase === 'autoRun' ? '#16A34A' : '#D6A84F',
              }}>
                {headerCenter.mode}
              </span>
            </div>
            <div className="h-3 w-px" style={{ background: '#E5E7EB' }} />
            <div className="flex items-center gap-1">
              <span style={{ color: '#9CA3AF' }}>阶段</span>
              <span className="font-medium" style={{ color: '#374151' }}>{headerCenter.stage}</span>
            </div>
            <div className="h-3 w-px" style={{ background: '#E5E7EB' }} />
            <div className="flex items-center gap-1">
              <span style={{ color: '#9CA3AF' }}>进度</span>
              <span className="font-medium" style={{ color: '#16A34A' }}>{headerCenter.progress}</span>
            </div>
          </div>
        )}

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5">
          <button className="text-[10px] px-2.5 py-1.5 rounded-lg transition-colors hover:bg-gray-50" style={{ color: '#6B7280', border: '1px solid #E5E7EB' }}>使用指南</button>
          <button className="text-[10px] px-2.5 py-1.5 rounded-lg transition-colors" style={{ color: '#B8922F', border: '1px solid rgba(214,168,79,0.3)', background: '#FFFBEB' }}>分享方案</button>
          <button className="text-[10px] px-2.5 py-1.5 rounded-lg transition-colors hover:bg-gray-50" style={{ color: '#6B7280', border: '1px solid #E5E7EB' }}>设计总监</button>
          <button onClick={() => setHistoryOpen(true)} className="text-[10px] px-2.5 py-1.5 rounded-lg transition-colors hover:bg-gray-50" style={{ color: '#6B7280', border: '1px solid #E5E7EB' }}>
            历史记录
          </button>
        </div>
      </header>

      {/* ============================================ */}
      {/* MAIN LAYOUT */}
      {/* ============================================ */}
      <div className="flex-1 flex overflow-hidden" style={{ paddingBottom: bottomBarHeight }}>
        {/* Left Sidebar: agent workflow + clickable nav */}
        <aside
          className="w-[280px] flex-shrink-0 border-r flex flex-col overflow-hidden"
          style={{ borderColor: '#E5E7EB' }}
        >
          <AgentSidebar
            stepStatus={stepStatus}
            currentStep={currentStep}
            viewedStep={viewedStep}
            isGenerating={isGenerating}
            demoPhase={demoPhase}
            stepData={stepData}
            projectName={projectName}
            onStepClick={handleStepClick}
          />
        </aside>

        {/* Right: Main content — step canvas */}
        <main className="flex-1 overflow-hidden" style={{ background: '#FFFFFF' }}>
          {/* Idle loading: spinner when nothing */}
          {!hasAnyOutput && demoPhase !== 'idle' && isGenerating && (
            <div className="flex flex-col items-center justify-center h-full">
              <svg className="animate-spin mb-4" width="32" height="32" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="rgba(22,163,74,0.15)" strokeWidth="2" />
                <path d="M12 2a10 10 0 0 1 10 10" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <p className="text-sm" style={{ color: '#A8A29A' }}>
                {STEPS[currentStep]?.label ?? 'Agent 工作流初始化中…'}
              </p>
            </div>
          )}

          {/* Agent Content: single step view */}
          {(hasAnyOutput || demoPhase === 'idle') && (
            <AgentContent
              stepStatus={stepStatus}
              stepData={stepData}
              viewedStep={viewedStep}
              currentStep={currentStep}
              isGenerating={isGenerating}
              projectName={projectName}
              demoPhase={demoPhase}
              formData={formData}
              onFormUpdate={handleFormUpdate}
              onFillDemo={handleFillDemo}
              onStartStepByStep={handleStartStepByStep}
              onStartAutoRun={handleStartAutoRun}
              onExport={handleExport}
            />
          )}
        </main>
      </div>

      {/* ============================================ */}
      {/* BOTTOM CONTROL BAR — fixed */}
      {/* ============================================ */}
      <BottomControlBar
        demoPhase={demoPhase}
        viewedStep={viewedStep}
        currentStep={currentStep}
        isGenerating={isGenerating}
        onStartStepByStep={handleStartStepByStep}
        onStartAutoRun={handleStartAutoRun}
        onNextStep={handleNextStep}
        onAutoRunRemaining={handleAutoRunRemaining}
        onPause={handlePause}
        onStop={handleStop}
        onReset={handleReset}
        onExport={handleExport}
        onPrevStep={handlePrevStep}
        onNextStepNav={handleNextStepNav}
        stepData={stepData}
      />

      {/* History Panel */}
      <HistoryPanel
        isOpen={historyOpen}
        onToggle={() => setHistoryOpen(false)}
        onLoad={handleLoadHistory}
      />
    </div>
  );
}
