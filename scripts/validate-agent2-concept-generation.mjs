import assert from 'node:assert/strict';
import { createBlueprint, cloneBlueprint } from '../src/blueprint/blueprintModel.js';
import { migrateBlueprintToV2 } from '../src/blueprint/blueprintMigration.js';
import {
  selectAgentExecution,
  selectConceptCandidates,
  selectConceptGenerationInput,
  selectProjectFactByKey,
} from '../src/blueprint/blueprintSelectors.js';
import { createBlueprintVersion, restoreBlueprintVersion } from '../src/blueprint/blueprintVersionService.js';
import { confirmProjectDefinitionBlueprint, runProjectDefinitionAgent, assertAgentWriteScope } from '../src/agents/projectDefinitionAgent.js';
import { runConceptGenerationAgent, validateConceptGenerationChapter } from '../src/agents/conceptGenerationAgent.js';
import { DEMO_CASE, DEMO_FILES } from '../src/data/demoCase.js';
import { generateBlueprintMarkdown } from '../src/lib/reportExporter.js';

const demoInput = { ...DEMO_CASE, siteFiles: DEMO_FILES };
const v0 = createBlueprint(demoInput, 'agent2-validation-project');
const v1 = runProjectDefinitionAgent(demoInput, v0).blueprint;
const v2Result = confirmProjectDefinitionBlueprint(v1);
const v2 = v2Result.blueprint;

// 1—2: Agent 1 facts retain stable keys and Agent 2 input never falls back to projectBasicInfo.
['projectName', 'location', 'area', 'projectType', 'designStage', 'budgetCondition', 'owner'].forEach((key) => {
  assert.equal(selectProjectFactByKey(v1, key)?.key, key);
});
const inconsistentV2 = cloneBlueprint(v2);
inconsistentV2.projectBasicInfo.projectName = '错误旧表单项目';
inconsistentV2.projectBasicInfo.city = '错误旧地点';
const isolatedInput = selectConceptGenerationInput(inconsistentV2);
assert.equal(isolatedInput.project.projectName, selectProjectFactByKey(v2, 'projectName').value);
assert.notEqual(isolatedInput.project.projectName, inconsistentV2.projectBasicInfo.projectName);

// 3—5: prerequisites: v1 blocked, v2 allowed, unresolved conflicts blocked.
assert.throws(() => runConceptGenerationAgent(v1, { mode: 'demo' }), /Blueprint v2/);
const v3Result = runConceptGenerationAgent(v2, { mode: 'demo', designerBrief: '突出林下活动，避免过度商业化表达。' });
const v3 = v3Result.blueprint;
const conflicted = cloneBlueprint(v2);
conflicted.chapters.projectDefinition.conflicts = [{
  id: 'conflict-01',
  label: '红线冲突',
  value: '两份资料的边界不一致',
  status: 'conflict',
}];
assert.throws(() => runConceptGenerationAgent(conflicted, { mode: 'demo' }), /未裁决信息冲突/);

// 6—12: dependencies, write scope, immutability, differentiation, mappings and boundary validation.
const candidates = selectConceptCandidates(v3);
assert.equal(v3.chapters.conceptGeneration.unresolvedDependencies.length, v2.chapters.projectDefinition.openItems.length);
assert.throws(() => assertAgentWriteScope('agent-2', ['chapters.projectDefinition']), /无权写入/);
assert.deepEqual(v3.chapters.projectDefinition, v2.chapters.projectDefinition);
assert.equal(candidates.length, 3);
assert.equal(new Set(candidates.map((item) => item.strategicFocus)).size, 3);
assert.equal(new Set(candidates.map((item) => item.spatialHypothesis)).size, 3);
candidates.forEach((candidate) => {
  assert.ok(candidate.responseMappings.length >= 4);
  assert.ok(candidate.dependencies.length === v2.chapters.projectDefinition.openItems.length);
});
assert.equal(validateConceptGenerationChapter(v3.chapters.conceptGeneration, { mode: 'demo' }).valid, true);
assert.equal(JSON.stringify(candidates).match(/"score"|"weight"|"rank"|"recommended"|"selected"|"winner"|"finalDecision"/), null);

// 13—16: v3 milestone, revision, execution and changeSet.
assert.equal(v3.milestoneVersion, 'v3');
assert.equal(v3.revision, v2.revision + 1);
const execution = selectAgentExecution(v3, 2);
assert.equal(execution.inputVersion, 'v2');
assert.equal(execution.outputVersion, 'v3');
assert.equal(execution.candidateCount, 3);
assert.deepEqual(execution.writtenSections, ['chapters.conceptGeneration']);
assert.deepEqual(v3Result.changeSet.added, ['chapters.conceptGeneration']);

// 17—19: legacy top-level candidates migrate once and Agent 3 can consume via selector.
const legacy = cloneBlueprint(v2);
legacy.chapters.conceptGeneration = null;
legacy.conceptCandidates = [{
  id: 'A',
  name: '旧版概念',
  concept: '旧版概念叙事',
  spatialStructure: '旧版空间假设',
  sceneFeatures: ['旧版场景'],
  fit: '旧版适用条件',
  visual: { id: 'legacy-A', url: './demo-images/aerial.jpg', status: '演示案例' },
}];
const migrated = migrateBlueprintToV2(legacy);
const migratedAgain = migrateBlueprintToV2(migrated);
assert.equal(selectConceptCandidates(migrated).length, 1);
assert.equal(selectConceptCandidates(migratedAgain).length, 1);
assert.equal(Object.hasOwn(migrated, 'conceptCandidates'), false);
assert.equal(selectConceptCandidates(v3).length, 3);

// 20: regeneration marks existing Agent 3—6 results stale without changing project definition.
const downstream = cloneBlueprint(v3);
downstream.currentCheckpoint = 'checkpoint-2';
downstream.checkpoints = downstream.checkpoints.map((checkpoint) => (
  checkpoint.id === 'checkpoint-2'
    ? { ...checkpoint, status: '待确认' }
    : checkpoint
));
[3, 4, 5, 6].forEach((agentId) => {
  downstream.agentRuns[agentId] = {
    ...downstream.agentRuns[agentId],
    status: 'done',
    blueprintVersionWritten: `v${agentId + 1}`,
  };
});
const regenerated = runConceptGenerationAgent(downstream, { mode: 'demo', designerBrief: '增加四季社区活动适配。' }).blueprint;
[3, 4, 5, 6].forEach((agentId) => assert.equal(regenerated.agentRuns[agentId].status, 'stale'));
assert.deepEqual(regenerated.chapters.projectDefinition, downstream.chapters.projectDefinition);
assert.equal(regenerated.milestoneVersion, 'v3');
assert.equal(regenerated.revision, downstream.revision + 1);
assert.equal(regenerated.currentCheckpoint, null);
assert.equal(regenerated.checkpoints.find((checkpoint) => checkpoint.id === 'checkpoint-2').status, '未到达');

// 21: v3 snapshot restores concept data and milestone.
const v3History = createBlueprintVersion(v3, [], 'Agent 2 验证快照', v3Result.version);
const restoredV3 = restoreBlueprintVersion(v3History, 'v3', regenerated);
assert.equal(restoredV3.milestoneVersion, 'v3');
assert.deepEqual(selectConceptCandidates(restoredV3), candidates);

// 22—24: Markdown/JSON use chapter as the only source and roadshow completion can verify real execution.
const markdown = generateBlueprintMarkdown(v3);
assert.match(markdown, /## 概念生成/);
assert.match(markdown, /方向 A｜林下织补｜松林共享客厅/);
assert.match(markdown, /尚未经过 Agent 3 比选及设计师最终确认/);
assert.equal(Object.hasOwn(v3, 'conceptCandidates'), false);
assert.equal(v3.chapters.conceptGeneration.conceptCandidates.length, 3);
assert.equal(v3.agentRuns[2].status, 'done');
assert.ok(v3.agentExecutions.some((item) => item.agentId === 'agent-2' && item.outputVersion === 'v3'));

console.log('✓ Agent 1 项目事实 key 与 Agent 2 唯一输入校验通过');
console.log('✓ Agent 2 前置条件、职责边界、三候选差异与蓝本映射校验通过');
console.log('✓ v3/revision、迁移幂等、重生成失效、版本恢复与导出校验通过');
console.log('✓ 路演 Agent 2 完成状态与真实 Blueprint v3 写入一致');
