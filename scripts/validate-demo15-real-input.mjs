import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  BLUEPRINT_ITEM_STATUS,
  createBlueprint,
} from '../src/blueprint/blueprintModel.js';
import {
  applyAgentPatch,
  canRunAgent,
  confirmCheckpoint,
  updateDesignerDecision,
} from '../src/blueprint/blueprintService.js';
import {
  buildDesignStatement,
} from '../src/blueprint/designStatementService.js';
import {
  selectConceptCandidates,
  selectProjectFactByKey,
} from '../src/blueprint/blueprintSelectors.js';
import {
  confirmProjectDefinitionBlueprint,
  runProjectDefinitionAgent,
} from '../src/agents/projectDefinitionAgent.js';
import { runConceptGenerationAgent } from '../src/agents/conceptGenerationAgent.js';
import { DEMO_CASE, DEMO_FILES } from '../src/data/demoCase.js';
import { mockAgentProvider } from '../src/providers/mockAgentProvider.js';
import projectInput from '../data/demo-projects/huanlegu-community-park/project_input_v1.json' with { type: 'json' };
import conceptReference from '../data/demo-projects/huanlegu-community-park/concepts/concept_reference_v1.json' with { type: 'json' };
import designStatementReference from '../data/demo-projects/huanlegu-community-park/design/design_statement_reference_v1.json' with { type: 'json' };

const forbiddenNameInferences = /主题乐园|游客|欢乐谷\s*IP|摩天轮|游乐设施|旅游服务|网红打卡|商业娱乐主题/;
const sectionKeys = [
  'coreNarrative',
  'spatialStructure',
  'functionalZones',
  'circulation',
  'featureNodes',
  'plant',
  'material',
  'ecology',
  'grading',
  'drainage',
  'operations',
];

function activeGeneratedContent(blueprint) {
  return JSON.stringify({
    projectDefinition: blueprint.chapters.projectDefinition,
    conceptGeneration: blueprint.chapters.conceptGeneration,
    comparison: blueprint.comparison,
    agentRecommendation: blueprint.agentRecommendation,
    coreNarrative: blueprint.coreNarrative,
    spatialStructure: blueprint.spatialStructure,
    functionalZones: blueprint.functionalZones,
    circulationStrategy: blueprint.circulationStrategy,
    professionalStrategies: blueprint.professionalStrategies,
    featureNodes: blueprint.featureNodes,
    designStatement: blueprint.deliverableArtifacts.designStatement,
  });
}

const demoInput = { ...DEMO_CASE, siteFiles: DEMO_FILES };
let blueprint = createBlueprint(demoInput, 'demo15-huanlegu-project');
blueprint = runProjectDefinitionAgent(demoInput, blueprint).blueprint;

// 1—3: the runtime input is preserved in Blueprint and measurement never becomes fact.
assert.deepEqual(blueprint.project, projectInput.project);
assert.deepEqual(blueprint.projectFacts, projectInput.projectFacts);
assert.deepEqual(blueprint.designPreferences, projectInput.designPreferences);
assert.deepEqual(blueprint.designerJudgments, projectInput.designerJudgments);
assert.deepEqual(blueprint.pendingVerification, projectInput.pendingVerification);
assert.deepEqual(blueprint.sourceRefs, projectInput.sourceRefs);
assert.deepEqual(blueprint.demoPolicies, projectInput.demoPolicies);
assert.equal(blueprint.project.sourceCaseId, 'L2-001');
assert.deepEqual(blueprint.project.excludedL2CaseIds, ['L2-001']);
assert.equal(blueprint.demoPolicies.doNotInferFromProjectName, true);

let areaFact = selectProjectFactByKey(blueprint, 'area');
assert.equal(areaFact.value, '11037.66');
assert.equal(areaFact.status, BLUEPRINT_ITEM_STATUS.PENDING);
assert.equal(areaFact.evidenceType, 'measurement');
assert.equal(areaFact.inputStatus, 'pendingVerification');
assert.equal(areaFact.confidence, 0.7);
const sourceArea = blueprint.projectFacts.measurements.find((item) => item.field === 'siteArea');
assert.equal(sourceArea.value, 11037.66);
assert.equal(sourceArea.status, 'pendingVerification');
assert.equal(sourceArea.evidenceType, 'measurement');
assert.equal(sourceArea.confidence, 'medium');

blueprint = confirmProjectDefinitionBlueprint(blueprint).blueprint;
areaFact = selectProjectFactByKey(blueprint, 'area');
assert.equal(areaFact.status, BLUEPRINT_ITEM_STATUS.PENDING);
assert.equal(blueprint.projectFacts.measurements.find((item) => item.field === 'siteArea').status, 'pendingVerification');
assert.doesNotMatch(activeGeneratedContent(blueprint), forbiddenNameInferences);

// 4—5: Agent 2 generates exactly the frozen three candidates without scoring or recommendation.
blueprint = runConceptGenerationAgent(blueprint, {
  mode: 'demo',
  designerBrief: '基于当前真实输入形成三个可比较的概念方向。',
}).blueprint;
const candidates = selectConceptCandidates(blueprint);
assert.deepEqual(
  candidates.map((item) => `${item.code}｜${item.name}`),
  ['A｜邻里分区型', 'B｜社区共享环', 'C｜自然漫游型'],
);
assert.deepEqual(
  candidates.map((item) => item.candidateOrigin),
  ['demoReconstructed', 'projectReferenceDirection', 'demoReconstructed'],
);
assert.deepEqual(
  conceptReference.candidates.map((item) => item.candidateOrigin),
  ['demoReconstructed', 'projectReferenceDirection', 'demoReconstructed'],
);
assert.equal(blueprint.chapters.conceptGeneration.qualityChecks.containsRecommendation, false);
assert.equal(blueprint.chapters.conceptGeneration.qualityChecks.containsScoring, false);
assert.equal(blueprint.agentRecommendation, null);
assert.doesNotMatch(activeGeneratedContent(blueprint), forbiddenNameInferences);

// 6—7: Agent 3 recommends B, but Gate 2 remains an enforced human decision.
const agent3Patch = await mockAgentProvider.runAgent(3, blueprint, { delayMs: 0 });
blueprint = applyAgentPatch(blueprint, 3, agent3Patch, 'Demo-1.5 Agent 3 验证');
assert.deepEqual(
  blueprint.comparison.dimensions.map((item) => item.label),
  ['功能满足度', '多年龄融合度', '空间尺度适配', '植物空间潜力', '建设成本', '运维难度'],
);
assert.equal(blueprint.agentRecommendation.conceptId, 'B');
assert.equal(blueprint.agentRecommendation.conceptName, '社区共享环');
assert.equal(
  blueprint.agentRecommendation.reason,
  '不是平均分配空间，而是把共性需求放进共享空间，把差异需求放进功能节点。',
);
assert.equal(blueprint.currentCheckpoint, 'checkpoint-2');
assert.equal(blueprint.checkpoints.find((item) => item.id === 'checkpoint-2').status, '待确认');
assert.equal(blueprint.designerDecision.selectedConceptId, '');
assert.equal(canRunAgent(blueprint, 4), false);
assert.throws(() => confirmCheckpoint(blueprint, 'checkpoint-2'), /请先选择/);

blueprint = updateDesignerDecision(blueprint, {
  selectedConceptId: 'B',
  acceptedRecommendation: true,
  fusionRequirements: '保留共享核心、慢行环与功能节点的组织逻辑，工程参数继续保持待复核。',
  modificationNotes: '不把设计偏好升级为现状事实或工程清单。',
  decisionReason: '设计师在 Gate 2 主动选择 B｜社区共享环。',
}, 'Demo-1.5 Gate 2 人工选择');
blueprint = confirmCheckpoint(
  blueprint,
  'checkpoint-2',
  { selectedConceptId: 'B' },
  'Demo-1.5 验证设计师',
);
assert.equal(canRunAgent(blueprint, 4), true);

// 8: Agent 4 writes Blueprint source fields first, then the service compiles 11 sections.
const agent4Patch = await mockAgentProvider.runAgent(4, blueprint, { delayMs: 0 });
blueprint = applyAgentPatch(blueprint, 4, agent4Patch, 'Demo-1.5 Agent 4 验证');
assert.equal(blueprint.currentCheckpoint, 'checkpoint-3');
assert.equal(blueprint.deliverableArtifacts.designStatement, null);
assert.deepEqual(blueprint.chapters.spatialDevelopment.coreNarrative, blueprint.coreNarrative);
assert.deepEqual(blueprint.chapters.spatialDevelopment.spatialStructure, blueprint.spatialStructure);
assert.deepEqual(blueprint.chapters.spatialDevelopment.professionalStrategies, blueprint.professionalStrategies);
blueprint = buildDesignStatement(blueprint);
assert.deepEqual(
  blueprint.deliverableArtifacts.designStatement.sections.map((item) => item.key),
  sectionKeys,
);
assert.deepEqual(designStatementReference.sections.map((item) => item.key), sectionKeys);
blueprint.deliverableArtifacts.designStatement.sections.forEach((item) => {
  assert.ok(item.sourceFields.length > 0, `${item.key} 缺少 Blueprint sourceFields`);
  assert.ok(String(item.body).trim(), `${item.key} 未由 Blueprint 生成正文`);
});
const providerSource = readFileSync(new URL('../src/providers/mockAgentProvider.js', import.meta.url), 'utf8');
const agentContentSource = readFileSync(new URL('../src/components/AgentContent.jsx', import.meta.url), 'utf8');
const projectWizardSource = readFileSync(new URL('../src/components/ProjectDefinitionWizard.jsx', import.meta.url), 'utf8');
assert.doesNotMatch(providerSource, /design_statement_reference_v1/);
assert.doesNotMatch(agentContentSource, /design_statement_reference_v1|B_社区共享环_设计说明母稿_v1/);
assert.doesNotMatch(projectWizardSource, /区位及红线资料/);
assert.match(projectWizardSource, /正式红线与测绘资料/);
assert.match(blueprint.spatialStructure.value, /measurement\s*\/\s*pendingVerification/);
assert.doesNotMatch(activeGeneratedContent(blueprint), forbiddenNameInferences);

// 9: a fresh non-demo project follows the generic chain without any 欢乐谷 candidates or provenance.
const alternateInput = {
  projectName: '滨水商业街区景观设计',
  city: '宁波市海曙区',
  area: '26000',
  projectType: '商业公共空间',
  targetUsers: '',
  designGoals: '连接滨水慢行与商业公共界面',
  constraints: '岸线安全边界与防洪条件待专项复核',
  stylePreference: '开放、连续、复合使用',
  maintenance: '',
  clientFocus: '',
  designStage: '概念方案',
  deliveryDate: '',
  budgetCondition: '',
  presentationAudience: '',
  siteFiles: [],
};
let alternate = createBlueprint(alternateInput, 'demo15-cross-project');
alternate = runProjectDefinitionAgent(alternateInput, alternate).blueprint;
alternate = confirmProjectDefinitionBlueprint(alternate).blueprint;
alternate = runConceptGenerationAgent(alternate, { mode: 'demo' }).blueprint;
const alternateCandidates = selectConceptCandidates(alternate);
assert.equal(alternate.project, null);
assert.equal(alternate.demoPolicies.doNotInferFromProjectName, undefined);
assert.notDeepEqual(
  alternateCandidates.map((item) => item.name),
  ['邻里分区型', '社区共享环', '自然漫游型'],
);
assert.ok(alternateCandidates.every((item) => !item.candidateOrigin));
const alternateAgent3 = await mockAgentProvider.runAgent(3, alternate, { delayMs: 0 });
alternate = applyAgentPatch(alternate, 3, alternateAgent3, 'Demo-1.5 跨项目验证');
assert.doesNotMatch(
  JSON.stringify({
    projectDefinition: alternate.chapters.projectDefinition,
    conceptGeneration: alternate.chapters.conceptGeneration,
    comparison: alternate.comparison,
    recommendation: alternate.agentRecommendation,
  }),
  /欢乐谷|社区共享环|邻里分区型|自然漫游型|projectReferenceDirection|demoReconstructed/,
);

console.log('✓ project_input_v1 已完整映射到 Blueprint 输入血缘字段');
console.log('✓ 11037.66㎡ 始终保持 measurement / pendingVerification / medium confidence');
console.log('✓ Agent 2 A/B/C provenance 与“只生成、不推荐”边界校验通过');
console.log('✓ Agent 3 推荐 B 且 Gate 2 必须由设计师人工选择');
console.log('✓ Agent 4 Blueprint source fields → 11-section Design Statement 链路校验通过');
console.log('✓ 欢乐谷名称禁推断与第二项目无案例泄漏校验通过');
