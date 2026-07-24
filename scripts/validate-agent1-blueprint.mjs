import assert from 'node:assert/strict';
import { createBlueprint } from '../src/blueprint/blueprintModel.js';
import { migrateBlueprintToV2 } from '../src/blueprint/blueprintMigration.js';
import {
  selectCoreConstraints,
  selectDesignPrinciples,
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
assert.deepEqual(agentWriteScopes['agent-1'], ['chapters.projectDefinition']);
assert.throws(() => assertAgentWriteScope('agent-1', ['chapters.conceptGeneration']), /无权写入/);

const confirmation = confirmProjectDefinitionBlueprint(v1);
const v2 = confirmation.blueprint;
assert.equal(v2.milestoneVersion, 'v2');
assert.equal(v2.revision, 2);
assert.equal(v2.checkpoints.find((item) => item.id === 'checkpoint-1').status, '已确认');

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

let versions = createBlueprintVersion(v1, [], '', { ...agentResult.version, changeSet: agentResult.changeSet });
versions = createBlueprintVersion(v2, versions, '', { ...confirmation.version, changeSet: confirmation.changeSet });
const restoredV1 = restoreBlueprintVersion(versions, 'v1', v2);
assert.equal(restoredV1.milestoneVersion, 'v1');
assert.deepEqual(restoredV1.chapters.projectDefinition.explicitGoals, v1.chapters.projectDefinition.explicitGoals);

assert.ok(selectProjectGoals(v1).some((item) => item.value.includes('儿童')));
assert.ok(selectCoreConstraints(v1).some((item) => item.value.includes('高维护水景')));
assert.ok(selectDesignPrinciples(v1).some((item) => item.value === '保留现状松林'));

const markdown = generateBlueprintMarkdown(v1);
assert.match(markdown, /^# 项目设计蓝本 v1/m);
assert.match(markdown, /## 项目目标/);
assert.match(markdown, /保留现状松林/);
assert.match(markdown, /## 版本记录/);

console.log('✓ Agent 1 输出符合 Blueprint v2 schema');
console.log('✓ Agent 1 写入权限、v1/v2、revision、迁移与幂等校验通过');
console.log('✓ 版本恢复、selectors 与 Markdown Blueprint 视图校验通过');
