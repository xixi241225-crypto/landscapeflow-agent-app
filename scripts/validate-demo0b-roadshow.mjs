import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createBlueprint } from '../src/blueprint/blueprintModel.js';
import {
  applyAgentPatch,
  confirmCheckpoint,
  updateDesignerDecision,
} from '../src/blueprint/blueprintService.js';
import {
  isRoadshowResultsReady,
  selectRoadshowResults,
} from '../src/blueprint/blueprintSelectors.js';
import {
  confirmProjectDefinitionBlueprint,
  runProjectDefinitionAgent,
} from '../src/agents/projectDefinitionAgent.js';
import { runConceptGenerationAgent } from '../src/agents/conceptGenerationAgent.js';
import { DEMO_CASE, DEMO_FILES } from '../src/data/demoCase.js';
import { mockAgentProvider } from '../src/providers/mockAgentProvider.js';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const demoInput = { ...DEMO_CASE, siteFiles: DEMO_FILES };

let blueprint = createBlueprint(demoInput, 'demo0b-validation-project');
blueprint = runProjectDefinitionAgent(demoInput, blueprint).blueprint;
blueprint = confirmProjectDefinitionBlueprint(blueprint).blueprint;
blueprint = runConceptGenerationAgent(blueprint, {
  mode: 'demo',
  designerBrief: '强调安静停留与清晰导视。',
}).blueprint;

const agent3Patch = await mockAgentProvider.runAgent(3, blueprint, { delayMs: 0 });
blueprint = applyAgentPatch(blueprint, 3, agent3Patch, 'Demo-0B Agent 3 验证');
const selectedConceptId = blueprint.agentRecommendation.conceptId;
blueprint = updateDesignerDecision(blueprint, {
  selectedConceptId,
  acceptedRecommendation: true,
  fusionRequirements: '保持所选概念核心策略，未确认条件在后续资料补齐后深化。',
  decisionReason: 'Demo-0B 自动验证选择 Agent 推荐方向',
}, 'Demo-0B 设计师概念决策');
blueprint = confirmCheckpoint(blueprint, 'checkpoint-2', { selectedConceptId }, 'Demo-0B 验证设计师');

const agent4Patch = await mockAgentProvider.runAgent(4, blueprint, { delayMs: 0 });
blueprint = applyAgentPatch(blueprint, 4, agent4Patch, 'Demo-0B Agent 4 验证');
blueprint = confirmCheckpoint(blueprint, 'checkpoint-3', { source: 'Blueprint 空间成果' }, 'Demo-0B 验证设计师');

const agent5Patch = await mockAgentProvider.runAgent(5, blueprint, { delayMs: 0 });
blueprint = applyAgentPatch(blueprint, 5, agent5Patch, 'Demo-0B Agent 5 验证');
const agent6Patch = await mockAgentProvider.runAgent(6, blueprint, { delayMs: 0 });
blueprint = applyAgentPatch(blueprint, 6, agent6Patch, 'Demo-0B Agent 6 验证');
blueprint = confirmCheckpoint(blueprint, 'checkpoint-4', { source: 'Blueprint 最终成果' }, 'Demo-0B 验证设计师');

assert.equal(blueprint.milestoneVersion, 'v7');
assert.ok([1, 2, 3, 4, 5, 6].every((agentId) => blueprint.agentRuns[agentId].status === 'done'));
assert.equal(isRoadshowResultsReady(blueprint), true);
assert.equal(isRoadshowResultsReady(createBlueprint()), false);

const results = selectRoadshowResults(blueprint);
assert.equal(results.project.projectName, '北京市欢乐谷社区公园景观设计');
assert.equal(results.project.location, '北京市朝阳区');
assert.equal(results.project.area, '10000');
assert.equal(results.project.projectType, '社区公园景观设计');
assert.equal(results.ppt.pageCount, blueprint.pptOutline.length);
assert.equal(results.ppt.pageCount, 12);
assert.equal(results.ppt.slides.length, 12);
assert.equal(results.ppt.fileUrl, '');
assert.match(results.ppt.status, /12 页内容结构已生成/);

assert.deepEqual(results.spatial.spatialStructure, blueprint.spatialStructure);
assert.deepEqual(results.spatial.functionalZones, blueprint.functionalZones);
assert.deepEqual(results.spatial.circulationStrategy, blueprint.circulationStrategy);
assert.deepEqual(results.spatial.professionalStrategies, blueprint.professionalStrategies);
assert.deepEqual(results.visual.visualTasks, blueprint.visualTasks);
assert.deepEqual(results.visual.visualAssets, blueprint.visualAssets);
assert.deepEqual(results.ppt.outline, blueprint.pptOutline);

assert.equal(results.definition.selectedConceptId, blueprint.designerDecision.selectedConceptId);
assert.equal(results.definition.selectedConcept.id, blueprint.designerDecision.selectedConceptId);
assert.equal(results.summary.find((item) => item.key === 'concepts').value, blueprint.chapters.conceptGeneration.conceptCandidates.length);
assert.equal(results.summary.find((item) => item.key === 'masterplan').value, blueprint.spatialStructure.planAsset ? 1 : 0);
assert.equal(results.summary.find((item) => item.key === 'analysis').value, blueprint.spatialStructure.analysisAssets.length);
assert.equal(results.summary.find((item) => item.key === 'visual').value, blueprint.visualAssets.length);
assert.equal(results.summary.find((item) => item.key === 'ppt').value, blueprint.pptOutline.length);

const unsupportedProjectClaims = /松林|上海市浦东新区|28000|2\.8\s*公顷|林下会客|林下康养|雨水花园|摩天轮|游乐园|游客外溢/;
assert.doesNotMatch(JSON.stringify(results), unsupportedProjectClaims);
assert.doesNotMatch(JSON.stringify({
  spatialStructure: blueprint.spatialStructure,
  functionalZones: blueprint.functionalZones,
  circulationStrategy: blueprint.circulationStrategy,
  professionalStrategies: blueprint.professionalStrategies,
  featureNodes: blueprint.featureNodes,
  visualTasks: blueprint.visualTasks,
}), unsupportedProjectClaims);
assert.ok(blueprint.visualTasks.every((task) => task.people === '适量社区使用者，具体人群结构待确认'));
assert.match(blueprint.professionalStrategies.plant, /调查后确认/);
assert.match(blueprint.professionalStrategies.ecology, /专项调查确认/);
assert.match(blueprint.professionalStrategies.grading, /测绘数据复核/);
assert.match(blueprint.professionalStrategies.drainage, /条件复核/);

const roadshowModePath = new URL('../src/components/roadshow/RoadshowMode.jsx', import.meta.url);
const roadshowFlowPath = new URL('../src/components/RoadshowFlow.jsx', import.meta.url);
const projectDefinitionWizardPath = new URL('../src/components/ProjectDefinitionWizard.jsx', import.meta.url);
const agentContentPath = new URL('../src/components/AgentContent.jsx', import.meta.url);
const checkpointPanelPath = new URL('../src/components/CheckpointPanel.jsx', import.meta.url);
const roadshowModeSource = readFileSync(roadshowModePath, 'utf8');
const roadshowFlowSource = readFileSync(roadshowFlowPath, 'utf8');
const projectDefinitionWizardSource = readFileSync(projectDefinitionWizardPath, 'utf8');
const agentContentSource = readFileSync(agentContentPath, 'utf8');
const checkpointPanelSource = readFileSync(checkpointPanelPath, 'utf8');
[
  'runProjectDefinitionAgent',
  'runConceptGenerationAgent',
  'executeAgents',
  'generateBlueprint',
  'confirmBlueprint',
  'landscapeflow_v2_roadshow_state',
  'demoConfirmedBlueprint',
  'roadshowProject.deliverables',
].forEach((forbidden) => assert.doesNotMatch(roadshowModeSource, new RegExp(forbidden)));
assert.doesNotMatch(roadshowModeSource, /roadshowProject|18-SLIDE|18 页/);
assert.doesNotMatch(roadshowFlowSource, /roadshowProject/);
assert.match(roadshowModeSource, /loadActiveProject/);
assert.match(roadshowModeSource, /isRoadshowResultsReady/);
assert.match(roadshowModeSource, /selectRoadshowResults/);
assert.equal(existsSync(`${projectRoot}src/data/roadshowProject.js`), false);

const activeUiSources = [
  projectDefinitionWizardSource,
  agentContentSource,
  checkpointPanelSource,
];
[
  '已识别社区居民、儿童和老年人为核心使用人群',
  '已识别自然生态、邻里共享和低维护设计目标',
  '已识别场地红线、主要出入口和现状植被',
  '已识别造价控制和后期维护要求',
  '已识别参考案例偏好为自然生态、轻介入设计',
  '强调城市活力、全龄共享、低维护与可实施性',
  '方案 B 的活力核心与融合的生态漫游体验',
  '融合 C 的雨水花园',
].forEach((forbidden) => {
  activeUiSources.forEach((source) => assert.doesNotMatch(source, new RegExp(forbidden)));
});
assert.match(projectDefinitionWizardSource, /formData\.targetUsers/);
assert.match(projectDefinitionWizardSource, /待补充 \/ 待解析/);
assert.match(agentContentSource, /selectedConcept\?\.proposition/);
assert.match(agentContentSource, /selectedConcept\.keyScenes/);
assert.match(checkpointPanelSource, /采用方案 B 的公共核心策略，同时融合方案 C 的慢行体验逻辑/);

console.log('✓ Demo-0B 完整 Blueprint v7 主链与成果可展示条件校验通过');
console.log('✓ Results ViewModel 项目、概念、空间、视觉、Summary 与 12 页 PPT 均来自 Blueprint');
console.log('✓ Agent 4 / 5 未确认事实清理与专业策略待复核表达校验通过');
console.log('✓ RoadshowMode 第二执行链、独立状态和 roadshowProject 静态数据源已移除');
console.log('✓ Demo-0B.1 活跃 UI 旧静态识别、方案默认话术与 Gate 2 示例防回归校验通过');
