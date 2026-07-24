import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ProjectHistorySidebar from './ProjectHistorySidebar';
import AgentContent from './AgentContent';
import BottomControlBar from './BottomControlBar';
import BlueprintPanel from './BlueprintPanel';
import HistoryPanel from './HistoryPanel';
import { DEMO_CASE, DEMO_FILES } from '../data/demoCase';
import { createBlueprint } from '../blueprint/blueprintModel';
import {
  applyAgentPatch,
  applyDesignerPatch,
  canRunAgent,
  confirmCheckpoint,
  createBlueprintVersion,
  getNextRunnableAgent,
  readBlueprint,
  restoreBlueprintVersion,
  updateAssumptionDecision,
  updateDesignerDecision,
} from '../blueprint/blueprintService';
import { mockAgentProvider } from '../providers/mockAgentProvider';
import { loadActiveProject, saveProjectState } from '../lib/projectStorage';
import { downloadBlueprintJSON, downloadBlueprintMarkdown } from '../lib/reportExporter';

const emptyForm = {
  projectName: '', city: '', area: '', projectType: '', targetUsers: '', designGoals: '', constraints: '', stylePreference: '', maintenance: '', clientFocus: '',
  designStage: '', deliveryDate: '', budgetCondition: '', presentationAudience: '', siteFiles: [],
};

const AGENT_ANALYSIS_STEPS = {
  1: ['读取项目条件', '区分事实与假设', '归纳核心设计问题'],
  2: ['读取已确认事实', '展开差异化概念', '校核优势与风险'],
  3: ['建立比选维度', '计算项目适配度', '形成 Agent 推荐'],
  4: ['读取设计师最终选择', '推演空间与动线', '组织五项专业策略'],
  5: ['拆解视觉任务', '匹配重点空间场景', '组织演示案例视觉成果'],
  6: ['汇总蓝本字段', '组织报告与 12 页 PPT', '执行最终质量复核'],
};

function newProjectState(presentationMode = false) {
  const projectId = `project-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  const blueprint = createBlueprint(emptyForm, projectId);
  return {
    projectId,
    formData: { ...emptyForm },
    blueprint,
    versions: createBlueprintVersion(blueprint, [], '创建项目'),
    viewedStep: 0,
    currentStep: -1,
    runState: 'idle',
    runMode: presentationMode ? 'roadshow' : 'professional',
    visualWorkflowStep: 0,
    outputWorkflowStep: 0,
    conceptRequirement: '',
    projectInputStep: 0,
    presentationMode,
    presentationStage: 0,
    presentationAgentStates: Array(6).fill('等待'),
    presentationComplete: false,
  };
}

function getInitialState() {
  const restored = loadActiveProject();
  if (!restored?.blueprint) return newProjectState();
  return {
    ...restored,
    runState: restored.runState === 'running' ? 'paused' : restored.runState,
    currentStep: restored.runState === 'running' ? Math.max(0, restored.currentStep || 0) : restored.currentStep,
    visualWorkflowStep: restored.visualWorkflowStep ?? (restored.blueprint.visualAssets?.length ? 3 : restored.blueprint.visualTasks?.length ? 1 : 0),
    outputWorkflowStep: restored.outputWorkflowStep ?? (restored.blueprint.pptOutline?.length ? 4 : 0),
    conceptRequirement: restored.conceptRequirement || '',
    projectInputStep: restored.projectInputStep ?? (restored.blueprint.agentRuns?.[1]?.blueprintVersionWritten ? 2 : 0),
    presentationMode: Boolean(restored.presentationMode),
    presentationStage: restored.presentationStage === 3 ? 2 : restored.presentationStage ?? 0,
    presentationAgentStates: Array.isArray(restored.presentationAgentStates) && restored.presentationAgentStates.length === 6
      ? restored.presentationAgentStates.map((status) => status === '执行中' ? '等待' : status)
      : Array(6).fill('等待'),
    presentationComplete: Boolean(restored.presentationComplete),
  };
}

export default function Workbench() {
  const navigate = useNavigate();
  const location = useLocation();
  const initial = useRef(getInitialState()).current;
  const [projectId, setProjectId] = useState(initial.projectId);
  const [formData, setFormData] = useState(initial.formData);
  const [blueprint, setBlueprint] = useState(initial.blueprint);
  const [versions, setVersions] = useState(initial.versions || []);
  const [viewedStep, setViewedStep] = useState(initial.viewedStep ?? 0);
  const [currentStep, setCurrentStep] = useState(initial.currentStep ?? -1);
  const [runState, setRunState] = useState(initial.runState || 'idle');
  const [runMode, setRunMode] = useState(initial.runMode || 'professional');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [visualWorkflowStep, setVisualWorkflowStep] = useState(initial.visualWorkflowStep || 0);
  const [outputWorkflowStep, setOutputWorkflowStep] = useState(initial.outputWorkflowStep || 0);
  const [conceptRequirement, setConceptRequirement] = useState(initial.conceptRequirement || '');
  const [projectInputStep, setProjectInputStep] = useState(initial.projectInputStep || 0);
  const [projectInputLoading, setProjectInputLoading] = useState(false);
  const [projectInputLoadingStep, setProjectInputLoadingStep] = useState(0);
  const [presentationMode, setPresentationMode] = useState(initial.presentationMode || false);
  const [presentationStage, setPresentationStage] = useState(initial.presentationStage || 0);
  const [presentationAgentStates, setPresentationAgentStates] = useState(initial.presentationAgentStates || Array(6).fill('等待'));
  const [presentationComplete, setPresentationComplete] = useState(initial.presentationComplete || false);
  const [presentationBusy, setPresentationBusy] = useState(false);
  const [notice, setNotice] = useState(initial.runState === 'paused' ? '页面刷新后已恢复项目；运行任务保持暂停，请手动继续。' : '');
  const [agentProgress, setAgentProgress] = useState(null);
  const blueprintRef = useRef(blueprint);
  const controllerRef = useRef(null);
  const pausedAgentRef = useRef(null);
  const autoLoopRef = useRef(false);
  const projectInputTokenRef = useRef(0);
  const projectSubmitRef = useRef(false);
  const presentationTokenRef = useRef(0);

  useEffect(() => { blueprintRef.current = blueprint; }, [blueprint]);

  useEffect(() => {
    const timer = setTimeout(() => saveProjectState({ projectId, formData, blueprint, versions, viewedStep, currentStep, runState, runMode, visualWorkflowStep, outputWorkflowStep, conceptRequirement, projectInputStep, presentationMode, presentationStage, presentationAgentStates, presentationComplete }), 160);
    return () => clearTimeout(timer);
  }, [projectId, formData, blueprint, versions, viewedStep, currentStep, runState, runMode, visualWorkflowStep, outputWorkflowStep, conceptRequirement, projectInputStep, presentationMode, presentationStage, presentationAgentStates, presentationComplete]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(''), 5000);
    return () => clearTimeout(timer);
  }, [notice]);

  useEffect(() => () => {
    controllerRef.current?.abort();
    presentationTokenRef.current += 1;
  }, []);

  const commitBlueprint = useCallback((next, reason) => {
    blueprintRef.current = next;
    setBlueprint(next);
    setVersions((history) => createBlueprintVersion(next, history, reason));
  }, []);

  const validateProject = useCallback((data = formData) => {
    const missing = [['projectName', '项目名称'], ['city', '项目地点'], ['projectType', '项目类型'], ['area', '场地面积'], ['designGoals', '设计目标'], ['constraints', '核心约束']].filter(([key]) => !data[key]?.trim()).map(([, label]) => label);
    if (missing.length) {
      setNotice(`缺少关键项目条件，暂不能整理资料：${missing.join('、')}`);
      return false;
    }
    const hasCriticalMaterial = data.siteFiles?.some((file) => ['项目任务书', '甲方需求文件', 'CAD／红线／总平底图'].includes(file.category));
    if (!hasCriticalMaterial) {
      setNotice('缺少关键资料：请至少上传项目任务书、甲方需求文件或 CAD／红线底图。');
      return false;
    }
    return true;
  }, [formData]);

  const handleFormUpdate = useCallback((key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    const source = blueprintRef.current;
    const started = Object.values(source.agentRuns).some((item) => Boolean(item.blueprintVersionWritten));
    if (started) {
      const next = applyDesignerPatch(source, { projectBasicInfo: { ...source.projectBasicInfo, [key]: value } }, '设计师修改项目基本信息');
      commitBlueprint(next, '同步项目表单与设计蓝本');
      setNotice('项目信息已同步到设计蓝本，已有下游成果标记为需要重新生成。');
    } else {
      const next = { ...source, projectBasicInfo: { ...source.projectBasicInfo, [key]: value } };
      blueprintRef.current = next;
      setBlueprint(next);
    }
  }, [commitBlueprint]);

  const applyProjectInputPatch = useCallback((patch, reason) => {
    setFormData((previous) => ({ ...previous, ...patch }));
    const source = blueprintRef.current;
    const started = Object.values(source.agentRuns).some((item) => Boolean(item.blueprintVersionWritten));
    const next = started
      ? applyDesignerPatch(source, { projectBasicInfo: { ...source.projectBasicInfo, ...patch } }, reason)
      : { ...source, projectBasicInfo: { ...source.projectBasicInfo, ...patch } };
    blueprintRef.current = next;
    if (started) commitBlueprint(next, reason);
    else setBlueprint(next);
  }, [commitBlueprint]);

  const handleFillDemoBasic = useCallback(() => {
    const { projectName, city, area, projectType, designGoals, constraints, designStage, budgetCondition } = DEMO_CASE;
    applyProjectInputPatch({ projectName, city, area, projectType, designGoals, constraints, designStage, budgetCondition }, '填入演示案例基本信息');
    setNotice('演示案例基本信息已填入，仍可继续修改。');
  }, [applyProjectInputPatch]);

  const mergeDemoFiles = useCallback(() => {
    const existing = blueprintRef.current.projectBasicInfo.siteFiles || [];
    const names = new Set(existing.map((file) => file.name));
    return [...existing, ...DEMO_FILES.filter((file) => !names.has(file.name))];
  }, []);

  const handleFillDemoFiles = useCallback(() => {
    applyProjectInputPatch({ siteFiles: mergeDemoFiles() }, '填入演示案例项目资料');
    setNotice('演示案例资料已加入，未重复添加同名文件。');
  }, [applyProjectInputPatch, mergeDemoFiles]);

  const handleFillDemoAll = useCallback(() => {
    const { projectName, city, area, projectType, designGoals, constraints, designStage, budgetCondition } = DEMO_CASE;
    applyProjectInputPatch({ projectName, city, area, projectType, designGoals, constraints, designStage, budgetCondition, siteFiles: mergeDemoFiles() }, '补齐演示案例资料');
    setNotice('演示案例基本信息与项目资料已补齐，仍需手动确认提交。');
  }, [applyProjectInputPatch, mergeDemoFiles]);

  const handleReviewProjectMaterials = useCallback(async () => {
    if (projectInputLoading) return;
    const token = projectInputTokenRef.current + 1;
    projectInputTokenRef.current = token;
    setProjectInputLoading(true);
    setProjectInputLoadingStep(0);
    for (let step = 0; step < 3; step += 1) {
      setProjectInputLoadingStep(step);
      await new Promise((resolve) => setTimeout(resolve, 380));
      if (projectInputTokenRef.current !== token) return;
    }
    setProjectInputLoading(false);
    setProjectInputStep(2);
  }, [projectInputLoading]);

  const executeAgent = useCallback(async (agentId, mode = runMode) => {
    const source = readBlueprint(blueprintRef.current);
    if (!canRunAgent(source, agentId)) {
      setNotice('前置确认节点尚未完成，当前 Agent 不能运行。');
      setRunState('checkpoint');
      return false;
    }
    if (source.currentCheckpoint) {
      setNotice('请先完成当前设计师确认节点。');
      setRunState('checkpoint');
      return false;
    }

    const controller = new AbortController();
    controllerRef.current = controller;
    setCurrentStep(agentId - 1);
    setViewedStep(agentId - 1);
    setRunState('running');
    setAgentProgress({ agentId, step: 0, actions: AGENT_ANALYSIS_STEPS[agentId] });
    setBlueprint((prev) => {
      const next = { ...prev, agentRuns: { ...prev.agentRuns, [agentId]: { ...prev.agentRuns[agentId], status: 'working' } } };
      return next;
    });
    const delayMs = mode === 'roadshow' ? [560, 620, 640, 720, 660, 700][agentId - 1] : 900;
    const progressTimers = [0.32, 0.68].map((ratio, index) => setTimeout(() => {
      if (!controller.signal.aborted) setAgentProgress({ agentId, step: index + 1, actions: AGENT_ANALYSIS_STEPS[agentId] });
    }, delayMs * ratio));
    try {
      const patch = await mockAgentProvider.runAgent(agentId, source, { signal: controller.signal, delayMs });
      const next = applyAgentPatch(source, agentId, patch, `演示协作引擎完成 Agent ${agentId} 结构化写入`);
      const checkpoint = next.checkpoints.find((item) => item.afterAgent === agentId);
      commitBlueprint(next, `${mode === 'roadshow' ? '路演演示' : '专业协作'} · Agent ${agentId} 完成`);
      if (agentId === 5) setVisualWorkflowStep(1);
      if (agentId === 6) setOutputWorkflowStep(1);

      if (checkpoint) {
        setRunState('checkpoint');
        setNotice(`已到达确认节点：${checkpoint.name}`);
        return false;
      }
      if (agentId === 6 && !next.invalidatedOutputs.length) setRunState('done');
      else setRunState('ready');
      return true;
    } catch (error) {
      if (error.name === 'AbortError') return false;
      console.error('Agent 执行失败：', error);
      setNotice(`Agent 执行失败：${error.message}`);
      setRunState('stopped');
      return false;
    } finally {
      progressTimers.forEach(clearTimeout);
      setAgentProgress(null);
      if (controllerRef.current === controller) controllerRef.current = null;
    }
  }, [commitBlueprint, runMode]);

  const runRoadshowFlow = useCallback(async () => {
    if (autoLoopRef.current) return;
    autoLoopRef.current = true;
    try {
      const nextAgent = getNextRunnableAgent(blueprintRef.current);
      if (nextAgent) await executeAgent(nextAgent, 'roadshow');
    } finally {
      autoLoopRef.current = false;
    }
  }, [executeAgent]);

  const handleConfirmProjectMaterials = useCallback(async () => {
    if (projectSubmitRef.current || !validateProject()) return;
    projectSubmitRef.current = true;
    const mode = presentationMode ? 'roadshow' : 'professional';
    setRunMode(mode);
    setNotice('正在整理项目目标、核心约束与推荐设计策略。');
    try {
      await executeAgent(1, mode);
      if (presentationMode && blueprintRef.current.agentRuns?.[1]?.status === 'done') {
        setPresentationStage(1);
        setViewedStep(0);
      }
    } finally {
      projectSubmitRef.current = false;
    }
  }, [executeAgent, presentationMode, validateProject]);

  const handleModifyPresentationInputs = useCallback(() => {
    presentationTokenRef.current += 1;
    controllerRef.current?.abort();
    const source = readBlueprint(blueprintRef.current);
    source.currentCheckpoint = null;
    source.checkpoints = source.checkpoints.map((item) => item.id === 'checkpoint-1'
      ? { ...item, status: '未到达', confirmedAt: null, confirmedBy: null, decision: null }
      : item);
    source.agentRuns[1] = { ...source.agentRuns[1], status: 'pending' };
    blueprintRef.current = source;
    setBlueprint(source);
    setPresentationStage(0);
    setProjectInputStep(2);
    setPresentationAgentStates(Array(6).fill('等待'));
    setPresentationComplete(false);
    setRunState('idle');
    setViewedStep(0);
    setNotice('可在当前资料检查页直接补充或修改资料。');
  }, []);

  const handleConfirmPresentation = useCallback(async () => {
    if (presentationBusy || presentationComplete) return;
    const token = presentationTokenRef.current + 1;
    presentationTokenRef.current = token;
    setPresentationBusy(true);
    setPresentationStage(2);
    setPresentationAgentStates(Array(6).fill('等待'));
    setPresentationComplete(false);
    setRunMode('roadshow');

    try {
      let source = blueprintRef.current;
      if (source.currentCheckpoint === 'checkpoint-1') {
        source = confirmCheckpoint(source, 'checkpoint-1', { source: '路演唯一人工确认', scope: ['项目目标', '核心约束', '推荐设计策略'] }, '设计师');
        commitBlueprint(source, '设计师确认设计方向');
      }

      for (let index = 0; index < 6; index += 1) {
        if (presentationTokenRef.current !== token) return;
        setPresentationAgentStates((states) => states.map((status, itemIndex) => itemIndex === index ? '执行中' : status));

        if (index === 0) {
          await new Promise((resolve) => setTimeout(resolve, 560));
        } else {
          await executeAgent(index + 1, 'roadshow');
        }
        if (presentationTokenRef.current !== token) return;

        if (index === 2 && blueprintRef.current.currentCheckpoint === 'checkpoint-2') {
          const recommendationId = blueprintRef.current.agentRecommendation?.conceptId || 'B';
          let next = updateDesignerDecision(blueprintRef.current, {
            selectedConceptId: recommendationId,
            acceptedRecommendation: true,
            fusionRequirements: '采用预缓存路演决策，保持低维护与全年龄共享方向。',
            modificationNotes: '',
            decisionReason: '路演模式采用已准备的设计师决策',
          }, '路演预设概念决策');
          next = confirmCheckpoint(next, 'checkpoint-2', { source: '预缓存路演决策' }, '路演预设决策');
          commitBlueprint(next, '路演预设完成概念方向确认');
          setRunState('ready');
        }
        if (index === 3 && blueprintRef.current.currentCheckpoint === 'checkpoint-3') {
          const next = confirmCheckpoint(blueprintRef.current, 'checkpoint-3', { source: '预缓存空间策略' }, '路演预设决策');
          commitBlueprint(next, '路演预设完成空间策略确认');
          setRunState('ready');
        }
        if (index === 4) setVisualWorkflowStep(3);
        if (index === 5 && blueprintRef.current.currentCheckpoint === 'checkpoint-4') {
          const next = confirmCheckpoint(blueprintRef.current, 'checkpoint-4', { source: '预缓存成果复核' }, '路演预设决策');
          commitBlueprint(next, '路演预设完成最终成果复核');
          setOutputWorkflowStep(4);
          setRunState('done');
        }

        setPresentationAgentStates((states) => states.map((status, itemIndex) => itemIndex === index ? '已完成' : status));
      }
      setPresentationComplete(true);
      setNotice('六个专业 Agent 已完成协作，完整成果已解锁。');
    } catch (error) {
      console.error('路演 Agent 协作失败：', error);
      setNotice(`路演协作未完成：${error.message}`);
      setRunState('stopped');
    } finally {
      if (presentationTokenRef.current === token) setPresentationBusy(false);
    }
  }, [commitBlueprint, executeAgent, presentationBusy, presentationComplete]);

  const handleOpenPresentationResults = useCallback(() => {
    saveProjectState({
      projectId, formData, blueprint: blueprintRef.current, versions, viewedStep, currentStep, runState: 'done', runMode: 'roadshow',
      visualWorkflowStep: 3, outputWorkflowStep: 4, conceptRequirement, projectInputStep, presentationMode: true,
      presentationStage: 2, presentationAgentStates: Array(6).fill('已完成'), presentationComplete: true,
    });
    navigate('/roadshow', { state: { openResults: true, fromWorkbench: true } });
  }, [conceptRequirement, currentStep, formData, navigate, projectId, projectInputStep, versions, viewedStep]);

  const handleRunNext = useCallback(() => {
    const agentId = getNextRunnableAgent(blueprintRef.current);
    if (!agentId) { setRunState('done'); return; }
    if (agentId === 6 && visualWorkflowStep < 3) {
      setNotice('请先确认视觉任务书并完成视觉成果生成。');
      setViewedStep(4);
      return;
    }
    if (runMode === 'roadshow') executeAgent(agentId, 'roadshow');
    else executeAgent(agentId, 'professional');
  }, [executeAgent, runMode, visualWorkflowStep]);

  const handleRunAgent = useCallback((agentId) => {
    if (blueprintRef.current.currentCheckpoint) {
      setNotice('请先完成当前设计师确认节点。');
      return;
    }
    if (agentId === 6 && visualWorkflowStep < 3) {
      setNotice('请先确认视觉任务书并生成视觉成果。');
      return;
    }
    executeAgent(agentId, runMode);
  }, [executeAgent, runMode, visualWorkflowStep]);

  const handlePause = useCallback(() => {
    pausedAgentRef.current = currentStep + 1;
    controllerRef.current?.abort();
    autoLoopRef.current = false;
    setBlueprint((prev) => {
      const agentId = currentStep + 1;
      const next = { ...prev, agentRuns: { ...prev.agentRuns, [agentId]: { ...prev.agentRuns[agentId], status: prev.agentRuns[agentId].blueprintVersionWritten ? 'done' : 'pending' } } };
      blueprintRef.current = next;
      return next;
    });
    setRunState('paused');
    setAgentProgress(null);
    setNotice('当前 Agent 任务已中止，后台不会继续写入。');
  }, [currentStep]);

  const handleResume = useCallback(() => {
    const agentId = pausedAgentRef.current || getNextRunnableAgent(blueprintRef.current);
    pausedAgentRef.current = null;
    if (!agentId) { setRunState('done'); return; }
    if (runMode === 'roadshow') runRoadshowFlow();
    else executeAgent(agentId, 'professional');
  }, [executeAgent, runRoadshowFlow, runMode]);

  const handleStop = useCallback(() => {
    controllerRef.current?.abort();
    autoLoopRef.current = false;
    setAgentProgress(null);
    setRunState('stopped');
    setNotice('运行已停止；已完成的 Blueprint 版本和结果仍然保留。');
  }, []);

  const handleReset = useCallback(() => {
    controllerRef.current?.abort();
    projectInputTokenRef.current += 1;
    presentationTokenRef.current += 1;
    const fresh = newProjectState();
    setProjectId(fresh.projectId); setFormData(fresh.formData); setBlueprint(fresh.blueprint); blueprintRef.current = fresh.blueprint;
    setVersions(fresh.versions); setViewedStep(0); setCurrentStep(-1); setRunState('idle'); setRunMode('professional');
    setVisualWorkflowStep(0); setOutputWorkflowStep(0); setConceptRequirement(''); setProjectInputStep(0); setProjectInputLoading(false); setProjectInputLoadingStep(0);
    setPresentationMode(false); setPresentationStage(0); setPresentationAgentStates(Array(6).fill('等待')); setPresentationComplete(false); setPresentationBusy(false);
    setNotice('已新建空白项目；上一项目仍保留在历史记录。');
  }, []);

  const handleStartPresentation = useCallback(() => {
    controllerRef.current?.abort();
    projectInputTokenRef.current += 1;
    presentationTokenRef.current += 1;
    const fresh = newProjectState(true);
    setProjectId(fresh.projectId); setFormData(fresh.formData); setBlueprint(fresh.blueprint); blueprintRef.current = fresh.blueprint;
    setVersions(fresh.versions); setViewedStep(0); setCurrentStep(-1); setRunState('idle'); setRunMode('roadshow');
    setVisualWorkflowStep(0); setOutputWorkflowStep(0); setConceptRequirement(''); setProjectInputStep(0); setProjectInputLoading(false); setProjectInputLoadingStep(0);
    setPresentationMode(true); setPresentationStage(0); setPresentationAgentStates(Array(6).fill('等待')); setPresentationComplete(false); setPresentationBusy(false);
    setNotice('已进入路演流程，请先载入或填写项目资料。');
  }, []);

  const handleRestartDemo = useCallback(() => {
    controllerRef.current?.abort();
    const fresh = newProjectState();
    const demo = { ...DEMO_CASE, siteFiles: DEMO_FILES };
    const next = { ...fresh.blueprint, projectBasicInfo: { ...fresh.blueprint.projectBasicInfo, ...demo } };
    setProjectId(fresh.projectId); setFormData(demo); setBlueprint(next); blueprintRef.current = next;
    setVersions(createBlueprintVersion(next, [], '重新开始路演演示')); setViewedStep(0); setCurrentStep(-1); setRunState('idle'); setRunMode('roadshow');
    setVisualWorkflowStep(0); setOutputWorkflowStep(0); setConceptRequirement(''); setProjectInputStep(0);
    setPresentationMode(true); setPresentationStage(0); setPresentationAgentStates(Array(6).fill('等待')); setPresentationComplete(false); setPresentationBusy(false);
    setNotice('路演案例与模拟资料已载入，请点击“开始整理项目资料”。');
  }, []);

  const handleConfirmCheckpoint = useCallback((checkpointId, payload = {}) => {
    let source = blueprintRef.current;
    if (checkpointId === 'checkpoint-2' && payload.designerDecision) {
      const fields = ['selectedConceptId', 'acceptedRecommendation', 'fusionRequirements', 'modificationNotes', 'decisionReason'];
      const changed = fields.some((field) => (source.designerDecision?.[field] || '') !== (payload.designerDecision[field] || ''));
      if (changed) source = updateDesignerDecision(source, payload.designerDecision, '设计师保存概念方向决策');
    }
    const next = confirmCheckpoint(source, checkpointId, { source: '工作台人工确认' });
    commitBlueprint(next, `设计师完成${next.checkpoints.find((item) => item.id === checkpointId)?.name}`);
    if (checkpointId === 'checkpoint-4') setRunState('done');
    else if (runMode === 'roadshow') {
      setRunState('ready');
      setTimeout(runRoadshowFlow, 360);
    } else setRunState('ready');
    setNotice(checkpointId === 'checkpoint-4' ? '演示方案已完成｜正式成果可继续深化' : '设计师确认已写入项目设计蓝本。');
  }, [commitBlueprint, runMode, runRoadshowFlow]);

  const handleUpdateDecision = useCallback((patch) => {
    const next = updateDesignerDecision(blueprintRef.current, patch, '设计师更新概念选择 / 融合意见');
    commitBlueprint(next, '更新设计师概念决策');
  }, [commitBlueprint]);

  const handleAssumptionDecision = useCallback((assumptionId, accepted) => {
    const next = updateAssumptionDecision(blueprintRef.current, assumptionId, accepted);
    commitBlueprint(next, accepted ? '接受系统假设' : '否定系统假设');
  }, [commitBlueprint]);

  const handleSaveFacts = useCallback((facts) => {
    const cleaned = facts.filter((item) => item.label?.trim() && String(item.value || '').trim());
    const labelToField = { 项目名称: 'projectName', 项目地点: 'city', 项目面积: 'area', 场地面积: 'area', 项目类型: 'projectType', 服务人群: 'targetUsers', 设计目标: 'designGoals', 核心约束: 'constraints', 限制条件: 'constraints' };
    const projectBasicInfo = cleaned.reduce((info, item) => {
      const field = labelToField[item.label];
      return field ? { ...info, [field]: item.value } : info;
    }, { ...blueprintRef.current.projectBasicInfo });
    const next = applyDesignerPatch(blueprintRef.current, { confirmedFacts: cleaned, projectBasicInfo }, '设计师编辑或补充项目事实');
    setFormData((prev) => ({ ...prev, ...Object.fromEntries(Object.values(labelToField).map((field) => [field, projectBasicInfo[field] ?? prev[field]])) }));
    commitBlueprint(next, '修改上游项目事实');
    setRunState(next.currentCheckpoint ? 'checkpoint' : getNextRunnableAgent(next) ? 'ready' : 'done');
    setNotice('事实修改已保存，相关下游 Agent 成果已标记为“需重新生成”。');
  }, [commitBlueprint]);

  const handleRegenerateConcepts = useCallback(() => {
    let next = applyDesignerPatch(blueprintRef.current, { coreDesignQuestions: blueprintRef.current.coreDesignQuestions }, '设计师退回重新生成概念');
    next.conceptCandidates = [];
    next.comparison = null;
    next.agentRecommendation = null;
    next.designerDecision = { ...next.designerDecision, selectedConceptId: '', acceptedRecommendation: false, status: '待确认' };
    next.currentCheckpoint = null;
    next.checkpoints = next.checkpoints.map((item) => item.id === 'checkpoint-2' ? { ...item, status: '未到达', confirmedAt: null } : item);
    next.agentRuns[2].status = 'stale';
    next.agentRuns[3].status = 'stale';
    commitBlueprint(next, '退回重新生成概念候选');
    setRunState('ready');
    setViewedStep(1);
    setConceptRequirement('');
    setNotice('已退回概念生成，Agent 2 与下游成果需重新生成。');
  }, [commitBlueprint]);

  const handleRestore = useCallback((versionId) => {
    const next = restoreBlueprintVersion(versions, versionId, blueprintRef.current);
    commitBlueprint(next, `恢复项目状态至历史版本`);
    setRunState(next.currentCheckpoint ? 'checkpoint' : getNextRunnableAgent(next) ? 'ready' : 'done');
    setNotice('项目状态已恢复，并创建新的恢复版本。');
  }, [commitBlueprint, versions]);

  const handleLoadProject = useCallback((record) => {
    controllerRef.current?.abort();
    presentationTokenRef.current += 1;
    setProjectId(record.projectId); setFormData(record.formData); setBlueprint(record.blueprint); blueprintRef.current = record.blueprint;
    setVersions(record.versions || []); setViewedStep(record.viewedStep || 0); setCurrentStep(record.currentStep ?? -1);
    setRunState(record.runState === 'running' ? 'paused' : record.runState || 'ready'); setRunMode(record.runMode || 'professional'); setHistoryOpen(false);
    setVisualWorkflowStep(record.visualWorkflowStep ?? (record.blueprint.visualAssets?.length ? 3 : record.blueprint.visualTasks?.length ? 1 : 0));
    setOutputWorkflowStep(record.outputWorkflowStep ?? (record.blueprint.pptOutline?.length ? 4 : 0));
    setConceptRequirement(record.conceptRequirement || '');
    setProjectInputStep(record.projectInputStep ?? (record.blueprint.agentRuns?.[1]?.blueprintVersionWritten ? 2 : 0));
    setProjectInputLoading(false);
    setPresentationMode(Boolean(record.presentationMode));
    setPresentationStage(record.presentationStage === 3 ? 2 : record.presentationStage ?? 0);
    setPresentationAgentStates(Array.isArray(record.presentationAgentStates) && record.presentationAgentStates.length === 6 ? record.presentationAgentStates : Array(6).fill('等待'));
    setPresentationComplete(Boolean(record.presentationComplete));
    setPresentationBusy(false);
    setNotice('已恢复历史项目状态。');
  }, []);

  const handleExportMarkdown = useCallback(() => {
    if (blueprint.invalidatedOutputs.length && !window.confirm('当前存在需重新生成的下游成果。仍要导出带风险标记的 Markdown 吗？')) return;
    downloadBlueprintMarkdown(blueprint);
  }, [blueprint]);

  const handleConfirmVisualBrief = useCallback(() => {
    setVisualWorkflowStep(2);
    setNotice('视觉任务书已由设计师确认，可生成对应视觉成果。');
  }, []);

  const handleGenerateVisuals = useCallback(() => {
    setVisualWorkflowStep(3);
    setNotice('视觉成果已按任务书组织完成，演示图片均保留来源与 Blueprint 版本。');
  }, []);

  const handleAdvanceOutput = useCallback(() => {
    setOutputWorkflowStep((step) => Math.min(4, step + 1));
  }, []);

  useEffect(() => {
    if (!location.state?.newProject) return;
    if (location.state?.presentationMode) handleStartPresentation();
    else handleReset();
    navigate('/workbench', { replace: true, state: null });
  }, [handleReset, handleStartPresentation, location.state, navigate]);

  useEffect(() => {
    if (!location.state?.loadDemo) return;
    handleRestartDemo();
    navigate('/workbench', { replace: true, state: null });
  }, [handleRestartDemo, location.state, navigate]);

  useEffect(() => {
    if (!location.state?.returnToTrack) return;
    setPresentationMode(true);
    setPresentationStage(2);
    setPresentationAgentStates(Array(6).fill('已完成'));
    setPresentationComplete(true);
    setRunMode('roadshow');
    setRunState('done');
    navigate('/workbench', { replace: true, state: null });
  }, [location.state, navigate]);

  useEffect(() => {
    if (!presentationMode || presentationStage !== 2 || presentationComplete || presentationBusy) return undefined;
    const hasRunningStatus = presentationAgentStates.some((status) => status === '执行中');
    if (hasRunningStatus) return undefined;
    const timer = setTimeout(handleConfirmPresentation, 320);
    return () => clearTimeout(timer);
  }, [handleConfirmPresentation, presentationAgentStates, presentationBusy, presentationComplete, presentationMode, presentationStage]);

  useEffect(() => {
    if (presentationMode && presentationStage === 3) setPresentationStage(2);
  }, [presentationMode, presentationStage]);

  const showProjectInputWizard = presentationMode
    ? presentationStage === 0
    : viewedStep === 0
      && runState === 'idle'
      && blueprint.agentRuns?.[1]?.status === 'pending'
      && !blueprint.agentRuns?.[1]?.blueprintVersionWritten;
  const currentProjectRecord = {
    projectId, formData, blueprint, versions, viewedStep, currentStep, runState, runMode, visualWorkflowStep, outputWorkflowStep, conceptRequirement, projectInputStep,
    presentationMode, presentationStage, presentationAgentStates, presentationComplete,
  };

  return (
    <div className="workspace-readable app-shell h-screen flex flex-col">
      <header className="h-16 shrink-0 flex items-center justify-between px-5 bg-white border-b border-[var(--lf-border)] z-20">
        <button onClick={() => navigate('/')} className="flex items-center gap-3">
          <div className="brand-mark w-9 h-9 rounded-xl">L</div>
          <div className="text-left"><p className="brand-gradient-text text-sm font-bold">LandscapeFlow AI</p><p className="text-xs text-[var(--lf-muted)]">景观方案设计总监智能体</p></div>
        </button>
        <div className="min-w-0 flex-1 px-8 text-center">
          <p className="truncate text-sm font-semibold text-[var(--lf-brand-950)]">{blueprint.projectBasicInfo.projectName || '未命名景观项目'}</p>
          <p className="truncate text-xs text-[var(--lf-muted)]">当前阶段：{presentationMode ? ['项目资料', '设计蓝本', 'Agent 协作', '完整成果'][presentationStage] : blueprint.agentRuns[viewedStep + 1]?.agentName}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-cyan-50 px-3 py-1.5 text-xs font-semibold text-cyan-700">Blueprint v{blueprint.currentVersion}</span>
        </div>
      </header>
      {notice && <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[70] rounded-xl bg-gray-900 text-white text-xs px-4 py-2.5 shadow-xl max-w-xl text-center">{notice}</div>}
      <div className="workbench-grid flex-1 min-h-0 overflow-hidden">
        <aside className="min-h-0 overflow-hidden border-r border-[var(--lf-border)]">
          <ProjectHistorySidebar
            activeProjectId={projectId}
            currentProject={currentProjectRecord}
            refreshKey={`${projectId}-${blueprint.currentVersion}-${formData.projectName}-${projectInputStep}`}
            onLoad={handleLoadProject}
            presentationMode={presentationMode}
          />
        </aside>
        <main className={`relative min-w-0 overflow-hidden bg-[#FBFBFE] ${showProjectInputWizard ? '' : 'pb-[76px]'}`}>
          <AgentContent
            blueprint={blueprint}
            formData={formData}
            viewedStep={viewedStep}
            currentStep={currentStep}
            runState={runState}
            agentProgress={agentProgress}
            conceptRequirement={conceptRequirement}
            visualWorkflowStep={visualWorkflowStep}
            outputWorkflowStep={outputWorkflowStep}
            projectInputStep={projectInputStep}
            projectInputLoading={projectInputLoading}
            projectInputLoadingStep={projectInputLoadingStep}
            presentationMode={presentationMode}
            presentationStage={presentationStage}
            presentationAgentStates={presentationAgentStates}
            onFormUpdate={handleFormUpdate}
            onFillDemoBasic={handleFillDemoBasic}
            onFillDemoFiles={handleFillDemoFiles}
            onFillDemoAll={handleFillDemoAll}
            onProjectInputStep={(step) => setProjectInputStep(Math.max(0, Math.min(2, step)))}
            onReviewProjectMaterials={handleReviewProjectMaterials}
            onConfirmProjectMaterials={handleConfirmProjectMaterials}
            onRunAgent={handleRunAgent}
            onConceptRequirement={setConceptRequirement}
            onConfirmVisualBrief={handleConfirmVisualBrief}
            onGenerateVisuals={handleGenerateVisuals}
            onAdvanceOutput={handleAdvanceOutput}
            onConfirmCheckpoint={handleConfirmCheckpoint}
            onUpdateDecision={handleUpdateDecision}
            onAssumptionDecision={handleAssumptionDecision}
            onSaveFacts={handleSaveFacts}
            onExportJSON={() => downloadBlueprintJSON(blueprint)}
            onExportMarkdown={handleExportMarkdown}
            onNavigate={setViewedStep}
            onRegenerateConcepts={handleRegenerateConcepts}
            onNotice={setNotice}
          />
          {!showProjectInputWizard && <BottomControlBar
            blueprint={blueprint}
            runState={runState}
            runMode={runMode}
            viewedStep={viewedStep}
            currentStep={currentStep}
            visualWorkflowStep={visualWorkflowStep}
            outputWorkflowStep={outputWorkflowStep}
            presentationMode={presentationMode}
            presentationStage={presentationStage}
            presentationAgentStates={presentationAgentStates}
            presentationBusy={presentationBusy}
            onModifyPresentation={handleModifyPresentationInputs}
            onConfirmPresentation={handleConfirmPresentation}
            onOpenResults={handleOpenPresentationResults}
            onRunNext={handleRunNext}
            onPause={handlePause}
            onResume={handleResume}
            onStop={handleStop}
            onReset={handleReset}
            onRestartDemo={handleRestartDemo}
            onPrevStep={() => setViewedStep((prev) => Math.max(0, prev - 1))}
            onNextStep={() => setViewedStep((prev) => Math.min(5, prev + 1))}
          />}
        </main>
        <BlueprintPanel
          blueprint={blueprint}
          versions={versions}
          viewedStep={viewedStep}
          presentationMode={presentationMode}
          presentationStage={presentationStage}
          presentationAgentStates={presentationAgentStates}
          onOpenVersions={() => setHistoryOpen(true)}
          onInitiateModification={presentationMode ? handleModifyPresentationInputs : () => { setViewedStep(0); setNotice('已进入发起修改流程。保存上游修改后，系统将创建新版本并标记下游影响。'); }}
        />
      </div>
      <HistoryPanel isOpen={historyOpen} onToggle={() => setHistoryOpen(false)} onLoad={handleLoadProject} versions={versions} onRestore={handleRestore} />
    </div>
  );
}
