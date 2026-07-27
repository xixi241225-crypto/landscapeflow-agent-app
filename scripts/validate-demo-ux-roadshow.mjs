import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DEMO_CASE, DEMO_FILES } from '../src/data/demoCase.js';
import { createBlueprint } from '../src/blueprint/blueprintModel.js';
import { migrateBlueprintToV2 } from '../src/blueprint/blueprintMigration.js';
import {
  applyAgentPatch,
  confirmCheckpoint,
  getNextRunnableAgent,
  updateDesignerDecision,
} from '../src/blueprint/blueprintService.js';
import {
  approvePendingDesignStatementSections,
  buildDesignStatement,
} from '../src/blueprint/designStatementService.js';
import { confirmProjectDefinitionBlueprint, runProjectDefinitionAgent } from '../src/agents/projectDefinitionAgent.js';
import { runConceptGenerationAgent } from '../src/agents/conceptGenerationAgent.js';
import { mockAgentProvider } from '../src/providers/mockAgentProvider.js';
import { selectAnalysisAssets, selectSelectedVisuals } from '../src/blueprint/blueprintSelectors.js';

const source = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
const workspaceSource = source('../src/components/RoadshowAgentWorkspace.jsx');
const workbenchSource = source('../src/components/Workbench.jsx');
const agentContentSource = source('../src/components/AgentContent.jsx');
const wizardSource = source('../src/components/ProjectDefinitionWizard.jsx');
const checkpointSource = source('../src/components/CheckpointPanel.jsx');
const heroSource = source('../src/components/Hero.jsx');
const roadshowFlowSource = source('../src/components/RoadshowFlow.jsx');
const resultsSource = source('../src/components/roadshow/RoadshowMode.jsx');
const bindingSource = source('../src/data/demoAssetBindings.js');
const stylesSource = source('../src/index.css');

// A–C: input UI uses designer-facing names, starts blank and only fills demo content on explicit action.
assert.equal(DEMO_FILES[0].displayName, '设计任务书');
assert.equal(DEMO_FILES[0].displayType, '已上传');
assert.match(wizardSource, /file\.displayName \|\| file\.name/);
assert.match(wizardSource, /file\.displayType \|\| file\.type/);
['老人效果图', '儿童效果图', '中央草坪效果图', '入口效果图', '最终鸟瞰效果图'].forEach((label) => assert.doesNotMatch(wizardSource, new RegExp(label)));
assert.ok(DEMO_CASE.projectName);
assert.ok(DEMO_CASE.city);
assert.ok(DEMO_CASE.designGoals);
assert.ok(DEMO_CASE.stylePreference);
assert.ok(DEMO_CASE.clientFocus);
const startPresentationSource = workbenchSource.match(/const handleStartPresentation = useCallback\(\(\) => \{([\s\S]*?)\n  \}, \[\]\);/)?.[1] || '';
assert.match(startPresentationSource, /const fresh = newProjectState\(true\)/);
assert.doesNotMatch(startPresentationSource, /DEMO_CASE|DEMO_FILES/);
const restartDemoSource = workbenchSource.match(/const handleRestartDemo = useCallback\(\(\) => \{([\s\S]*?)\n  \}, \[\]\);/)?.[1] || '';
assert.match(restartDemoSource, /const fresh = newProjectState\(true\)/);
assert.doesNotMatch(restartDemoSource, /DEMO_CASE|DEMO_FILES/);
assert.match(workbenchSource, /当前已有项目资料，填入演示案例将替换当前草稿，是否继续？/);
assert.match(workbenchSource, /siteFiles:\s*DEMO_FILES/);
assert.doesNotMatch(wizardSource, /载入演示补充资料/);

// D–F, H–O: the active roadshow UI is one Agent page at a time and exposes the specified sequence.
assert.match(workspaceSource, /roadshow-single-agent-workspace/);
assert.doesNotMatch(workspaceSource, /roadshow-agent-stepper|function AgentStepper/);
assert.doesNotMatch(stylesSource, /\.roadshow-agent-stepper|\.roadshow-agent-step\b/);
assert.match(workbenchSource, /workbench-agent-progress/);
assert.match(workbenchSource, /disabled=\{!canReview\}/);
assert.match(roadshowFlowSource, /details\.coreQuestions\?\.length/);
assert.match(workspaceSource, /AGENT 02 · CONCEPT GENERATION/);
assert.match(workspaceSource, /本阶段只负责产生差异化方向，不评分、不推荐/);
assert.match(workspaceSource, /进入方案比选/);
assert.match(workspaceSource, /AGENT 03 · SCHEME COMPARISON/);
assert.match(workspaceSource, /方案 2｜社区共享环/);
assert.match(workspaceSource, /agent3-professional-scores/);
assert.match(workspaceSource, /<ComparisonTable/);
assert.match(workspaceSource, /totalLabel="综合评分"/);
assert.match(checkpointSource, /重新生成概念方案/);
assert.match(workspaceSource, /data-testid=\{`agent4-\$\{asset\.id\.toLowerCase\(\)\}`\}/);
['A01', 'A02', 'A05'].forEach((id) => assert.match(bindingSource, new RegExp(`id: '${id}'`)));
assert.match(workspaceSource, /design-statement-full/);
assert.match(workspaceSource, /生成视觉提示词/);
assert.match(workspaceSource, /确认并开始生成/);
assert.match(workspaceSource, /其余六个场景作为当前方案的 supporting visuals 一次完成/);
assert.match(workspaceSource, /进入成果输出/);
assert.match(workspaceSource, /roadshow-agent6-outline/);
assert.match(workspaceSource, /PRESENTATION_OUTLINE/);
assert.equal((workspaceSource.match(/\['(?:0[1-9]|1[0-4])',/g) || []).length, 14);
assert.doesNotMatch(workspaceSource, /风格 A|风格 B|模板市场|路演版|专业版/);
assert.equal((workspaceSource.match(/roadshow-action-area/g) || []).length, 6);
assert.doesNotMatch(workspaceSource, /roadshow-sticky-action/);
const actionStyle = stylesSource.match(/\.roadshow-action-area\s*\{([\s\S]*?)\}/)?.[1] || '';
assert.match(actionStyle, /position:\s*static/);
assert.match(actionStyle, /margin-top:\s*20px/);
assert.match(actionStyle, /justify-content:\s*center/);
assert.doesNotMatch(actionStyle, /(?:^|\n)\s*(?:position:\s*(?:sticky|fixed)|justify-content:\s*space-between|backdrop-filter|bottom:)/);
assert.match(stylesSource, /\.roadshow-checkpoint-actions[\s\S]*justify-content:\s*center/);
assert.match(roadshowFlowSource, /gate1-centered-actions/);
assert.match(agentContentSource, /presentationMode \? 'pb-5' : 'pb-28'/);

// G: concept regeneration keeps Agent 1, replaces Agent 2 and marks downstream stale.
const demoInput = { ...DEMO_CASE, siteFiles: DEMO_FILES };
let blueprint = createBlueprint(demoInput, 'demo-ux-roadshow');
blueprint = runProjectDefinitionAgent(demoInput, blueprint).blueprint;
blueprint = confirmProjectDefinitionBlueprint(blueprint).blueprint;
blueprint = runConceptGenerationAgent(blueprint, { mode: 'demo' }).blueprint;
blueprint = applyAgentPatch(blueprint, 3, await mockAgentProvider.runAgent(3, blueprint, { delayMs: 0 }), 'Demo UX Agent 3');
assert.deepEqual(
  blueprint.comparison.dimensions.map((dimension) => dimension.label),
  ['功能满足度', '多年龄融合度', '空间尺度适配', '植物空间潜力', '建设成本', '运维难度'],
);
assert.equal(blueprint.comparison.schemes.find((scheme) => scheme.code === 'B').total, 8.63);
blueprint = updateDesignerDecision(blueprint, { selectedConceptId: 'B' }, 'Demo UX Gate 2');
blueprint = confirmCheckpoint(blueprint, 'checkpoint-2', { selectedConceptId: 'B' }, 'Demo UX');
blueprint = applyAgentPatch(blueprint, 4, await mockAgentProvider.runAgent(4, blueprint, { delayMs: 0 }), 'Demo UX Agent 4');
blueprint = buildDesignStatement(blueprint);
const agent1Before = JSON.stringify(blueprint.chapters.projectDefinition);
const regenerated = runConceptGenerationAgent(blueprint, { mode: 'demo', designerBrief: '增强共享空间的全天候适配。' }).blueprint;
assert.equal(regenerated.agentRuns[1].status, 'done');
assert.equal(JSON.stringify(regenerated.chapters.projectDefinition), agent1Before);
assert.equal(regenerated.agentRuns[2].status, 'done');
[3, 4].forEach((agentId) => assert.equal(regenerated.agentRuns[agentId].status, 'stale'));
assert.equal(regenerated.currentCheckpoint, null);
assert.match(workbenchSource, /designer-concept-regeneration-request/);
assert.match(workbenchSource, /designer requested concept regeneration/);

// H–P: full Blueprint flow still owns all five gates and Gate 5 alone completes the project.
blueprint = approvePendingDesignStatementSections(blueprint);
blueprint = confirmCheckpoint(blueprint, 'checkpoint-3', {}, 'Demo UX');
blueprint = applyAgentPatch(blueprint, 5, await mockAgentProvider.runAgent(5, blueprint, { delayMs: 0 }), 'Demo UX Agent 5');
assert.deepEqual(selectAnalysisAssets(blueprint).map((item) => item.id), ['A01', 'A02', 'A05']);
assert.ok(blueprint.visualAssets.some((item) => item.role === 'supportingVisual'));
blueprint = confirmCheckpoint(blueprint, 'checkpoint-4', {
  visualSelection: { scene: 'children', candidateId: 'V02B', reasons: [] },
}, 'Demo UX');
assert.deepEqual(selectSelectedVisuals(blueprint, 'children')[0].reasons, []);
assert.equal(getNextRunnableAgent(blueprint), 6);
blueprint = applyAgentPatch(blueprint, 6, await mockAgentProvider.runAgent(6, blueprint, { delayMs: 0 }), 'Demo UX Agent 6');
assert.notEqual(blueprint.status, 'completed');
blueprint = confirmCheckpoint(blueprint, 'checkpoint-5', {
  presentationReview: {
    checks: {
      contentComplete: true,
      schemeConsistent: true,
      pendingPreserved: true,
      filesComplete: true,
    },
    comment: '',
  },
}, 'Demo UX');
assert.equal(blueprint.status, 'completed');
assert.equal(blueprint.checkpoints.find((item) => item.id === 'checkpoint-5').status, '已确认');

// Q–S: Trace entry, technical-field reduction and reload persistence.
assert.match(resultsSource, /results-design-trace-entry/);
assert.match(resultsSource, /查看设计执行轨迹/);
assert.match(resultsSource, /经人工复核后，可进一步沉淀为后续项目可复用的设计经验/);
assert.match(heroSource, /h-screen overflow-hidden/);
assert.doesNotMatch(heroSource, /LandscapeFlow AI 是怎么工作的？/);
assert.doesNotMatch(workspaceSource, /traceId|Cached Demo Asset Provider|generationProvider|generationMode|sourceBlueprintFields|isFactSource|schemaVersion/);
const reloaded = migrateBlueprintToV2(JSON.parse(JSON.stringify(blueprint)));
assert.equal(reloaded.checkpoints.find((item) => item.id === 'checkpoint-5').status, '已确认');
assert.equal(reloaded.status, 'completed');
assert.equal(selectSelectedVisuals(reloaded, 'children')[0].candidateId, 'V02B');

// T: a project without the explicit binding receives no Huanlegu visual assets.
const otherInput = {
  projectName: '滨水商业街区景观设计',
  city: '宁波市海曙区',
  area: '26000',
  projectType: '商业公共空间',
  designGoals: '组织滨水公共活动与连续慢行体验。',
  stylePreference: '偏好开放、克制的滨水公共空间体验。',
  constraints: '市政接口与防洪条件待正式资料确认。',
  siteFiles: [{ name: '项目任务书.pdf', category: '项目任务书' }],
};
let other = createBlueprint(otherInput, 'demo-ux-other');
other = runProjectDefinitionAgent(otherInput, other).blueprint;
other = confirmProjectDefinitionBlueprint(other).blueprint;
other = runConceptGenerationAgent(other, { mode: 'demo' }).blueprint;
other = applyAgentPatch(other, 3, await mockAgentProvider.runAgent(3, other, { delayMs: 0 }), 'Other Agent 3');
other = updateDesignerDecision(other, { selectedConceptId: 'A' }, 'Other Gate 2');
other = confirmCheckpoint(other, 'checkpoint-2', { selectedConceptId: 'A' }, 'Other');
other = applyAgentPatch(other, 4, await mockAgentProvider.runAgent(4, other, { delayMs: 0 }), 'Other Agent 4');
other = buildDesignStatement(other);
other = approvePendingDesignStatementSections(other);
other = confirmCheckpoint(other, 'checkpoint-3', {}, 'Other');
const otherVisualPatch = await mockAgentProvider.runAgent(5, other, { delayMs: 0 });
assert.equal(otherVisualPatch.analysisAssets.length, 0);
assert.ok(otherVisualPatch.visualAssets.every((item) => !/huanlegu|欢乐谷|demo-images/i.test(JSON.stringify(item))));

console.log('✓ A–F 项目资料减法、显式演示填入、单一 Agent 进度条与页面校验通过');
console.log('✓ G 概念重新生成保留 Agent 1、记录设计师请求并只使 Agent 2/3 及下游受影响');
console.log('✓ H–P Agent 4/5/6 分阶段体验、Gate 4 可空理由与 Gate 5 最终门禁校验通过');
console.log('✓ Q–T Results Trace 入口、技术字段减法、reload persistence 与跨项目隔离校验通过');
