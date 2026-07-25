import assert from 'node:assert/strict';
import { createBlueprint } from '../src/blueprint/blueprintModel.js';
import { migrateBlueprintToV2 } from '../src/blueprint/blueprintMigration.js';
import {
  selectCoreConstraints,
  selectDesignPrinciples,
  selectProjectDefinitionDetails,
  selectProjectFactByKey,
  selectProjectGoals,
} from '../src/blueprint/blueprintSelectors.js';
import {
  createBlueprintVersion,
  restoreBlueprintVersion,
} from '../src/blueprint/blueprintVersionService.js';
import {
  agentWriteScopes,
  assertAgentWriteScope,
  confirmProjectDefinitionBlueprint,
  runProjectDefinitionAgent,
} from '../src/agents/projectDefinitionAgent.js';
import { applyDesignerPatch } from '../src/blueprint/blueprintService.js';
import { DEMO_CASE, DEMO_FILES } from '../src/data/demoCase.js';
import { generateBlueprintMarkdown } from '../src/lib/reportExporter.js';

const input = { ...DEMO_CASE, siteFiles: DEMO_FILES };
const draft = createBlueprint(input, 'P-SL-001');
const agentResult = runProjectDefinitionAgent(input, draft);
const v1 = agentResult.blueprint;

assert.equal(v1.schemaVersion, '2.0');
assert.equal(v1.milestoneVersion, 'v1');
assert.equal(v1.revision, 1);
assert.ok(v1.chapters.projectDefinition);
assert.equal(v1.chapters.conceptGeneration, null);
assert.equal(v1.chapters.schemeDecision, null);
assert.deepEqual(agentWriteScopes['agent-1'], [
  'chapters.projectDefinition',
  'project',
  'projectFacts',
  'designPreferences',
  'designerJudgments',
  'pendingVerification',
  'sourceRefs',
  'demoPolicies',
]);
assert.throws(() => assertAgentWriteScope('agent-1', ['chapters.conceptGeneration']), /无权写入/);
assert.equal(selectProjectFactByKey(v1, 'projectName').value, '北京市欢乐谷社区公园景观设计');
assert.equal(selectProjectFactByKey(v1, 'location').value, '北京市朝阳区');
assert.equal(selectProjectFactByKey(v1, 'area').value, '11037.66');
assert.equal(selectProjectFactByKey(v1, 'area').status, 'pending');
assert.equal(selectProjectFactByKey(v1, 'area').evidenceType, 'measurement');
assert.equal(selectProjectFactByKey(v1, 'area').inputStatus, 'pendingVerification');
assert.equal(selectProjectFactByKey(v1, 'area').confidence, 0.7);
assert.equal(selectProjectFactByKey(v1, 'projectType').value, '社区公园景观设计');
assert.equal(v1.chapters.projectDefinition.explicitGoals[0].status, 'assumption');
assert.equal(v1.chapters.projectDefinition.constraints[0].status, 'pending');
assert.equal(v1.chapters.projectDefinition.designPrinciples[0].status, 'assumption');
assert.ok(v1.chapters.projectDefinition.openItems.length >= 6);
assert.doesNotMatch(JSON.stringify(v1.chapters.projectDefinition), /松林|上海市浦东新区|28000|2\.8公顷/);

const confirmation = confirmProjectDefinitionBlueprint(v1);
const v2 = confirmation.blueprint;
assert.equal(v2.milestoneVersion, 'v2');
assert.equal(v2.revision, 2);
assert.equal(v2.checkpoints.find((item) => item.id === 'checkpoint-1').status, '已确认');
assert.equal(v2.chapters.projectDefinition.explicitGoals[0].status, 'assumption');
assert.equal(selectProjectFactByKey(v2, 'area').status, 'pending');
assert.equal(v2.chapters.projectDefinition.constraints[0].status, 'pending');
assert.equal(v2.chapters.projectDefinition.designPrinciples[0].status, 'assumption');

const revisionOnly = applyDesignerPatch(v2, { projectBasicInfo: { ...v2.projectBasicInfo, presentationAudience: '项目决策方' } }, '验证内部修订');
assert.equal(revisionOnly.milestoneVersion, 'v2');
assert.equal(revisionOnly.revision, 3);

const legacy = structuredClone(draft);
delete legacy.chapters;
delete legacy.revision;
delete legacy.milestoneVersion;
legacy.schemaVersion = '1.0';
legacy.goals = ['旧版项目目标'];
legacy.constraints = ['旧版核心约束'];
legacy.strategies = ['旧版低维护策略'];
const migrated = migrateBlueprintToV2(legacy);
assert.equal(migrated.schemaVersion, '2.0');
assert.equal(migrated.chapters.projectDefinition.designPrinciples[0].value, '旧版低维护策略');
const migratedAgain = migrateBlueprintToV2(migrated);
assert.equal(migratedAgain.changeLog.filter((item) => item.migrationId).length, 1);

const alternateInput = {
  ...DEMO_CASE,
  projectName: '滨水商业街区景观设计',
  city: '宁波市',
  area: '22000',
  projectType: '商业公共空间',
  targetUsers: '周边居民、商业访客',
  designGoals: '连接滨水慢行与商业公共界面',
  constraints: '岸线安全边界与防洪条件待专项复核',
  stylePreference: '开放、连续、复合使用',
  siteFiles: DEMO_FILES,
};
const alternateV1 = runProjectDefinitionAgent(alternateInput, createBlueprint(alternateInput, 'alternate-agent1-project')).blueprint;
assert.ok(alternateV1.chapters.projectDefinition.explicitGoals.some((item) => item.value.includes('连接滨水慢行')));
assert.ok(alternateV1.chapters.projectDefinition.constraints.some((item) => item.value.includes('岸线安全边界')));
assert.ok(alternateV1.chapters.projectDefinition.designPrinciples.some((item) => item.value.includes('复合使用')));
const { sourceDocuments: _alternateSources, ...alternateDefinitionContent } = alternateV1.chapters.projectDefinition;
assert.doesNotMatch(JSON.stringify(alternateDefinitionContent), /北京市欢乐谷社区公园|现状植物、构筑物及其他可保留资源待现场资料复核/);

let versions = createBlueprintVersion(v1, [], '', { ...agentResult.version, changeSet: agentResult.changeSet });
versions = createBlueprintVersion(v2, versions, '', { ...confirmation.version, changeSet: confirmation.changeSet });
const restoredV1 = restoreBlueprintVersion(versions, 'v1', v2);
assert.equal(restoredV1.milestoneVersion, 'v1');
assert.deepEqual(restoredV1.chapters.projectDefinition.explicitGoals, v1.chapters.projectDefinition.explicitGoals);

assert.ok(selectProjectGoals(v1).some((item) => item.value.includes('多种实用功能交叉融合')));
assert.ok(selectCoreConstraints(v1).some((item) => item.label === '投资上限'));
assert.ok(selectDesignPrinciples(v1).some((item) => item.status === 'assumption'));
const statusValues = selectProjectDefinitionDetails(v1)
  .facts
  .concat(
    selectProjectDefinitionDetails(v1).stakeholders,
    selectProjectDefinitionDetails(v1).explicitGoals,
    selectProjectDefinitionDetails(v1).latentGoals,
    selectProjectDefinitionDetails(v1).siteConditions,
    selectProjectDefinitionDetails(v1).constraints,
    selectProjectDefinitionDetails(v1).designPrinciples,
    selectProjectDefinitionDetails(v1).successCriteria,
    selectProjectDefinitionDetails(v1).coreQuestions,
    selectProjectDefinitionDetails(v1).openItems,
    selectProjectDefinitionDetails(v1).conflicts,
  )
  .map((item) => item.status)
  .filter(Boolean);
assert.ok(statusValues.every((status) => ['confirmed', 'assumption', 'pending', 'conflict'].includes(status)));

const markdown = generateBlueprintMarkdown(v1);
assert.match(markdown, /^# 项目设计蓝本 v1/m);
assert.match(markdown, /## 项目目标/);
assert.match(markdown, /多种实用功能交叉融合/);
assert.match(markdown, /## 版本记录/);

console.log('✓ Agent 1 输出符合 Blueprint v2 schema');
console.log('✓ 欢乐谷真实输入、面积待复核状态、四态保留与旧松林内容清理校验通过');
console.log('✓ Demo 文件显式绑定、跨项目防污染与 Agent 1 写入权限校验通过');
console.log('✓ v1/v2、revision、迁移幂等、版本恢复与 Markdown 校验通过');
