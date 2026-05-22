import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import AgentSidebar from './AgentSidebar';
import AgentContent from './AgentContent';
import DemoConsole from './DemoConsole';
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
 *   'idle'        — landing panel, not started
 *   'stepByStep'  — running in step-by-step mode (agent executing)
 *   'waiting'     — step-by-step paused, waiting for user click
 *   'autoRun'     — auto run all steps
 *   'done'        — all steps finished
 */

export default function Workbench() {
  const navigate = useNavigate();

  // ---- Core state ----
  const [formData] = useState(() => ({ ...DEMO_CASE, siteFiles: [{ name: '欢乐谷社区公园现状图.jpg', size: '2.4 MB', type: 'image/jpeg' }] }));
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [stepStatus, setStepStatus] = useState({});
  const [stepData, setStepData] = useState({});
  const [projectName, setProjectName] = useState('');
  const [historyOpen, setHistoryOpen] = useState(false);

  // ---- Demo phase (replaces old isDemoMode + isWaitingForUser) ----
  const [demoPhase, setDemoPhase] = useState('idle');
  // Track if user wants autorun from within stepByStep
  const autoRunRemainingRef = useRef(false);

  const nextResolver = useRef(null);

  // ---- waitForUser: called by agentEngine in step-by-step mode ----
  const waitForUser = useCallback(() => {
    return new Promise((resolve) => {
      nextResolver.current = resolve;
      setDemoPhase('waiting');
    });
  }, []);

  // ---- handleNextStep: user clicks "执行下一步" in console ----
  const handleNextStep = useCallback(() => {
    setDemoPhase('stepByStep');
    if (nextResolver.current) {
      nextResolver.current();
      nextResolver.current = null;
    }
  }, []);

  // ---- handleAutoRunRemaining: from waiting, switch to autoRun ----
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
    setProjectName('北京欢乐谷社区公园景观概念设计');
    setDemoPhase('stepByStep');
    setIsGenerating(true);

    // waitForUser is injected — engine will pause after each step
    try {
      const result = await runAgent(formData, handleStepUpdate, () => {
        // If user switched to autoRun, skip waiting
        if (autoRunRemainingRef.current) {
          return Promise.resolve();
        }
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

  // ---- Start auto run (no wait) ----
  const handleStartAutoRun = useCallback(async () => {
    if (isGenerating) return;
    autoRunRemainingRef.current = false;
    setStepStatus({});
    setStepData({});
    setCurrentStep(-1);
    setProjectName('北京欢乐谷社区公园景观概念设计');
    setDemoPhase('autoRun');
    setIsGenerating(true);

    try {
      // Pass null for waitForUser — engine will auto-continue with 1s delay
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
    setProjectName('');
    autoRunRemainingRef.current = false;
    // If a resolver is pending, reject it gracefully
    if (nextResolver.current) {
      nextResolver.current();
      nextResolver.current = null;
    }
  }, []);

  // ---- Stop auto run ----
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
    return {
      mode: modeLabel,
      stage: label,
      progress: `${Math.max(0, currentStep + 1)} / 6`,
    };
  })();

  return (
    <div className="h-screen flex flex-col" style={{ background: '#080908' }}>

      {/* ============================================ */}
      {/* HEADER — lightweight, no "下一步" */}
      {/* ============================================ */}
      <header
        className="flex items-center justify-between px-5 py-3 flex-shrink-0 border-b z-20"
        style={{ background: '#0D0F0E', borderColor: 'rgba(255,255,255,0.06)' }}
      >
        {/* Left: Logo */}
        <button onClick={() => navigate('/')} className="flex items-center gap-2.5 group flex-shrink-0">
          <div
            className="w-7 h-7 rounded-md flex items-center justify-center"
            style={{ background: 'rgba(214,181,109,0.1)', border: '1px solid rgba(214,181,109,0.2)' }}
          >
            <span className="text-sm font-serif font-bold text-gradient">L</span>
          </div>
          <div className="leading-tight hidden sm:block">
            <div className="text-sm font-medium text-[#F5F1E8] group-hover:text-gradient transition-all">
              景观方案总监 Agent 应用
            </div>
            <div className="text-[10px] tracking-wide" style={{ color: '#555955' }}>LandscapeFlow AI</div>
          </div>
        </button>

        {/* Center: Mode + Stage + Progress — only when running */}
        {headerCenter && (
          <div className="hidden md:flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span style={{ color: '#555955' }}>模式</span>
              <span
                className="px-2 py-0.5 rounded-full"
                style={{
                  background: demoPhase === 'autoRun' ? 'rgba(34,197,94,0.1)' : 'rgba(214,181,109,0.1)',
                  color: demoPhase === 'autoRun' ? '#22C55E' : '#D6B56D',
                  border: demoPhase === 'autoRun' ? '1px solid rgba(34,197,94,0.2)' : '1px solid rgba(214,181,109,0.2)',
                }}
              >
                {headerCenter.mode}
              </span>
            </div>
            <div className="h-3 w-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
            <div className="flex items-center gap-1.5">
              <span style={{ color: '#555955' }}>阶段</span>
              <span style={{ color: '#A8A29A' }}>{headerCenter.stage}</span>
            </div>
            <div className="h-3 w-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
            <div className="flex items-center gap-1.5">
              <span style={{ color: '#555955' }}>进度</span>
              <span style={{ color: '#A8A29A' }}>{headerCenter.progress}</span>
            </div>
          </div>
        )}

        {/* Right: Actions — NO 下一步 */}
        <div className="flex items-center gap-2">
          <button className="btn-secondary text-xs">使用指南</button>
          <button className="btn-gold text-xs">分享方案</button>
          <button className="btn-secondary text-xs">设计总监</button>
          <button onClick={() => setHistoryOpen(true)} className="btn-secondary text-xs">
            历史记录
          </button>
        </div>
      </header>

      {/* ============================================ */}
      {/* MAIN LAYOUT */}
      {/* ============================================ */}
      <div className="flex-1 flex overflow-hidden">

        {/* Left Sidebar: agent workflow status only */}
        <aside
          className="w-[280px] flex-shrink-0 border-r flex flex-col overflow-hidden"
          style={{ background: '#0D0F0E', borderColor: 'rgba(255,255,255,0.05)' }}
        >
          <AgentSidebar
            stepStatus={stepStatus}
            currentStep={currentStep}
            isGenerating={isGenerating}
            demoPhase={demoPhase}
            stepData={stepData}
            projectName={projectName}
          />
        </aside>

        {/* Right: Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-6 py-6">

            {/* ---- DEMO CONSOLE — unique control area ---- */}
            <div className="mb-6">
              <DemoConsole
                demoPhase={demoPhase}
                currentStep={currentStep}
                isGenerating={isGenerating}
                onStartStepByStep={handleStartStepByStep}
                onStartAutoRun={handleStartAutoRun}
                onNextStep={handleNextStep}
                onAutoRunRemaining={handleAutoRunRemaining}
                onReset={handleReset}
                onPause={() => setDemoPhase('waiting')}
                onStop={handleStop}
                onExport={handleExport}
                stepData={stepData}
              />
            </div>

            {/* ---- AGENT CONTENT (only when there's output) ---- */}
            {hasAnyOutput && (
              <AgentContent
                stepStatus={stepStatus}
                stepData={stepData}
                currentStep={currentStep}
                isGenerating={isGenerating}
                projectName={projectName}
                demoPhase={demoPhase}
              />
            )}

            {/* Minimal loading state for first step */}
            {!hasAnyOutput && isGenerating && (
              <div className="flex flex-col items-center justify-center py-24">
                <svg className="animate-spin mb-4" width="32" height="32" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="rgba(34,197,94,0.15)" strokeWidth="2" />
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <p className="text-sm" style={{ color: '#A8A29A' }}>
                  {STEPS[currentStep]?.label ?? 'Agent 工作流初始化中…'}
                </p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* History Panel */}
      <HistoryPanel
        isOpen={historyOpen}
        onToggle={() => setHistoryOpen(false)}
        onLoad={handleLoadHistory}
      />
    </div>
  );
}
