import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createBlueprint } from '../src/blueprint/blueprintModel.js';
import {
  applyAgentPatch,
  canRunAgent,
  confirmCheckpoint,
  getNextRunnableAgent,
  invalidateDownstream,
  updateDesignerDecision,
} from '../src/blueprint/blueprintService.js';
import { migrateBlueprintToV2 } from '../src/blueprint/blueprintMigration.js';
import {
  selectAnalysisAssets,
  selectSelectedVisuals,
  selectVisualCandidates,
  selectVisualDecisionTrace,
  selectVisualReview,
} from '../src/blueprint/blueprintSelectors.js';
import {
  approvePendingDesignStatementSections,
  buildDesignStatement,
} from '../src/blueprint/designStatementService.js';
import {
  confirmProjectDefinitionBlueprint,
  runProjectDefinitionAgent,
} from '../src/agents/projectDefinitionAgent.js';
import { runConceptGenerationAgent } from '../src/agents/conceptGenerationAgent.js';
import { DEMO_CASE, DEMO_FILES } from '../src/data/demoCase.js';
import { mockAgentProvider } from '../src/providers/mockAgentProvider.js';

async function runThroughGate3(input, projectId, conceptId = '') {
  let blueprint = createBlueprint(input, projectId);
  blueprint = runProjectDefinitionAgent(input, blueprint).blueprint;
  blueprint = confirmProjectDefinitionBlueprint(blueprint).blueprint;
  blueprint = runConceptGenerationAgent(blueprint, { mode: 'demo' }).blueprint;
  blueprint = applyAgentPatch(
    blueprint,
    3,
    await mockAgentProvider.runAgent(3, blueprint, { delayMs: 0 }),
    'Demo-2 Agent 3 验证',
  );
  const selectedConceptId = conceptId
    || blueprint.agentRecommendation?.conceptId
    || blueprint.chapters.conceptGeneration.conceptCandidates[0].id;
  blueprint = updateDesignerDecision(blueprint, {
    selectedConceptId,
    acceptedRecommendation: selectedConceptId === blueprint.agentRecommendation?.conceptId,
    decisionReason: 'Demo-2 validator 人工选择方向',
  });
  blueprint = confirmCheckpoint(blueprint, 'checkpoint-2', { selectedConceptId }, 'Demo-2 验证设计师');
  blueprint = applyAgentPatch(
    blueprint,
    4,
    await mockAgentProvider.runAgent(4, blueprint, { delayMs: 0 }),
    'Demo-2 Agent 4 验证',
  );
  blueprint = buildDesignStatement(blueprint);
  blueprint = approvePendingDesignStatementSections(blueprint, 'Demo-2 验证设计师');
  return confirmCheckpoint(blueprint, 'checkpoint-3', { source: 'Design Statement' }, 'Demo-2 验证设计师');
}

const demoInput = { ...DEMO_CASE, siteFiles: DEMO_FILES };
let blueprint = await runThroughGate3(demoInput, 'demo2-visual-gate4');

// A: Gate 3 confirmed makes Agent 5, not Agent 6, the next runnable step.
assert.equal(blueprint.checkpoints.find((item) => item.id === 'checkpoint-3').status, '已确认');
assert.equal(canRunAgent(blueprint, 5), true);
assert.equal(canRunAgent(blueprint, 6), false);
assert.equal(getNextRunnableAgent(blueprint), 5);

// B–E: Agent 5 reads Blueprint, binds only the explicit demo asset package, and pauses at Gate 4.
const agent5Patch = await mockAgentProvider.runAgent(5, blueprint, { delayMs: 0 });
assert.deepEqual(Object.keys(agent5Patch).sort(), [
  'analysisAssets',
  'nextTasks',
  'qualityReview',
  'risks',
  'visualAssets',
  'visualCandidates',
  'visualReview',
  'visualTasks',
].sort());
assert.equal(agent5Patch.visualReview.status, 'pending');
assert.equal(agent5Patch.visualTasks[0].selectedConceptId, blueprint.designerDecision.selectedConceptId);
assert.equal(agent5Patch.visualTasks[0].designStatementRevision, blueprint.deliverableArtifacts.designStatement.statementRevision);
assert.ok(agent5Patch.visualTasks[0].sourceBlueprintFields.includes('spatialStructure'));
assert.ok(agent5Patch.visualTasks[0].preferenceSources.some((item) => item.id === 'DP-06' && item.status === 'preference'));
blueprint = applyAgentPatch(blueprint, 5, agent5Patch, 'Demo-2 Agent 5 验证');
assert.equal(blueprint.currentCheckpoint, 'checkpoint-4');
assert.equal(blueprint.checkpoints.find((item) => item.id === 'checkpoint-4').status, '待确认');
assert.equal(blueprint.agentRuns[5].status, 'done');
assert.equal(blueprint.agentRuns[6].status, 'pending');
assert.equal(canRunAgent(blueprint, 6), false);
assert.equal(selectSelectedVisuals(blueprint).length, 0);
assert.equal(selectVisualReview(blueprint).status, 'pending');

const analysisAssets = selectAnalysisAssets(blueprint);
assert.deepEqual(analysisAssets.map((item) => item.id), ['A01', 'A02', 'A05']);
analysisAssets.forEach((asset) => {
  assert.equal(asset.assetType, 'Analysis');
  assert.equal(asset.status, 'approvedDemoAsset');
  assert.equal(asset.isFactSource, false);
  assert.ok(asset.sourceBlueprintFields.length > 0);
  assert.ok(existsSync(new URL(`../public/${asset.url.replace(/^\.\//, '')}`, import.meta.url)));
});
assert.equal(analysisAssets.find((item) => item.id === 'A05').role, 'directorProfessionalReview');

const candidates = selectVisualCandidates(blueprint, 'children');
assert.deepEqual(candidates.map((item) => item.id), ['V02B', 'V02C']);
assert.deepEqual(candidates.map((item) => item.name), ['B｜浅层安全亲水型', 'C｜自然低维护型']);
candidates.forEach((candidate) => {
  assert.equal(candidate.candidateStatus, 'candidate');
  assert.equal(candidate.selectedVisual, false);
  assert.equal(candidate.isFactSource, false);
  assert.ok(existsSync(new URL(`../public/${candidate.url.replace(/^\.\//, '')}`, import.meta.url)));
});
assert.match(candidates[0].coreIntent, /浅层安全亲水|家长可视/);
assert.match(candidates[1].coreIntent, /自然探索|林荫/);

// F: choosing a card is local UI draft state; Blueprint remains unchanged until confirmation.
const beforeDraft = JSON.stringify(blueprint);
const localDraft = {
  candidateId: 'V02B',
  reasons: ['更符合前期居民偏好', '家长看护关系更清晰'],
  comment: '优先保留浅层、安全、可视、可控的互动方向。',
};
assert.equal(JSON.stringify(blueprint), beforeDraft);
assert.equal(selectSelectedVisuals(blueprint).length, 0);
assert.throws(
  () => confirmCheckpoint(blueprint, 'checkpoint-4', { visualSelection: { scene: 'children', candidateId: 'V02B', reasons: [] } }),
  /至少选择一项/,
);

// G–H: Gate 4 confirmation writes selection, reasons and one trace event; Agent 6 is next but not executed.
blueprint = confirmCheckpoint(blueprint, 'checkpoint-4', {
  visualSelection: {
    scene: 'children',
    visualTaskId: 'VT-CHILDREN',
    candidateId: localDraft.candidateId,
    reasons: localDraft.reasons,
    comment: localDraft.comment,
  },
}, 'Demo-2 验证设计师');
const selection = selectSelectedVisuals(blueprint, 'children')[0];
assert.equal(selection.candidateId, 'V02B');
assert.deepEqual(selection.reasons, localDraft.reasons);
assert.equal(selection.comment, localDraft.comment);
assert.equal(selection.selectionStatus, 'confirmed');
assert.equal(selection.isFactSource, false);
assert.equal(selectVisualReview(blueprint).status, 'confirmed');
assert.equal(blueprint.checkpoints.find((item) => item.id === 'checkpoint-4').status, '已确认');
assert.equal(canRunAgent(blueprint, 6), true);
assert.equal(getNextRunnableAgent(blueprint), 6);
assert.equal(blueprint.agentRuns[6].status, 'pending');

const visualTrace = selectVisualDecisionTrace(blueprint);
assert.ok(visualTrace.some((event) => event.type === 'visual-candidate-generation' && event.candidateIds.includes('V02B')));
const decisionTrace = visualTrace.find((event) => event.type === 'visual-selection-review');
assert.equal(decisionTrace.candidate.id, 'V02B');
assert.deepEqual(decisionTrace.reasons, localDraft.reasons);
assert.equal(decisionTrace.action, 'confirmed');

// I: no analysis, candidate or selected visual can be treated as a fact source.
[
  ...selectAnalysisAssets(blueprint),
  ...selectVisualCandidates(blueprint),
  ...selectSelectedVisuals(blueprint),
].forEach((item) => assert.equal(item.isFactSource, false));

// J: a second project receives generic briefs only and never Huanlegu assets or vocabulary.
const alternateInput = {
  projectName: '滨水商业街区景观设计',
  city: '宁波市海曙区',
  area: '26000',
  projectType: '商业公共空间',
  targetUsers: '',
  designGoals: '连接滨水慢行系统并组织复合公共空间',
  constraints: '岸线安全边界和运营动线需要协同',
  stylePreference: '开放连续、复合使用',
  maintenance: '',
  clientFocus: '',
  designStage: '概念方案',
  deliveryDate: '',
  budgetCondition: '',
  presentationAudience: '项目决策方',
  siteFiles: [],
};
let alternateBlueprint = await runThroughGate3(alternateInput, 'demo2-cross-project');
const alternatePatch = await mockAgentProvider.runAgent(5, alternateBlueprint, { delayMs: 0 });
const alternateSerialized = JSON.stringify(alternatePatch);
assert.doesNotMatch(alternateSerialized, /欢乐谷|社区公园|huanlegu|V02B|V02C|DP-06/);
assert.doesNotMatch(alternateSerialized, /\/demo-assets\/huanlegu\//);
assert.equal(alternatePatch.analysisAssets.length, 0);
assert.ok(alternatePatch.visualCandidates.every((candidate) => candidate.provenance.candidateOrigin === 'runtimeVisualBrief'));

// K: an upstream Agent 4 source change marks Agent 5/Gate 4 stale without deleting history.
const traceCountBeforeInvalidation = selectVisualDecisionTrace(blueprint).length;
const candidateIdsBeforeInvalidation = selectVisualCandidates(blueprint).map((item) => item.id);
const invalidated = invalidateDownstream(
  blueprint,
  ['professionalStrategies'],
  'Demo-2 上游专业策略修改验证',
);
assert.equal(invalidated.agentRuns[5].status, 'stale');
assert.equal(invalidated.visualReview.status, 'stale');
assert.equal(invalidated.selectedVisuals[0].selectionStatus, 'stale');
assert.equal(invalidated.checkpoints.find((item) => item.id === 'checkpoint-4').status, '需重新确认');
assert.deepEqual(selectVisualCandidates(invalidated).map((item) => item.id), candidateIdsBeforeInvalidation);
assert.equal(selectVisualDecisionTrace(invalidated).length, traceCountBeforeInvalidation);

// L: serialized local persistence and migration retain the confirmed Gate 4 decision.
const reloaded = migrateBlueprintToV2(JSON.parse(JSON.stringify(blueprint)));
assert.equal(selectSelectedVisuals(reloaded, 'children')[0].candidateId, 'V02B');
assert.deepEqual(selectSelectedVisuals(reloaded, 'children')[0].reasons, localDraft.reasons);
assert.equal(reloaded.checkpoints.find((item) => item.id === 'checkpoint-4').status, '已确认');
assert.equal(selectVisualDecisionTrace(reloaded).find((item) => item.type === 'visual-selection-review').candidate.id, 'V02B');

// M: active UI contains a local Gate 4 draft and the roadshow runner cannot auto-confirm it.
const checkpointSource = readFileSync(new URL('../src/components/CheckpointPanel.jsx', import.meta.url), 'utf8');
const workbenchSource = readFileSync(new URL('../src/components/Workbench.jsx', import.meta.url), 'utf8');
const presentationRunnerSource = workbenchSource.slice(
  workbenchSource.indexOf('const runPresentationUntilCheckpoint'),
  workbenchSource.indexOf('const handleOpenPresentationResults'),
);
assert.match(checkpointSource, /useState\(\{\s*candidateId: ''/s);
assert.match(checkpointSource, /只有点击下方“确认视觉方案并继续”后/);
assert.doesNotMatch(presentationRunnerSource, /confirmCheckpoint/);
assert.match(presentationRunnerSource, /\['checkpoint-2', 'checkpoint-3', 'checkpoint-4'\]\.includes/);
assert.match(presentationRunnerSource, /gate4Confirmed.*agentRuns\?\.\[6\]\?\.status === 'pending'/s);

console.log('✓ A–E Gate 3 → Agent 5 → Gate 4 真暂停、Blueprint 驱动与指定分析/候选资产校验通过');
console.log('✓ F–H 本地草稿、Gate 4 确认写入、理由与统一 Trace 校验通过');
console.log('✓ I–J 视觉非事实源与第二项目无欢乐谷资产/文案泄漏校验通过');
console.log('✓ K–L 上游失效、历史保留与 reload persistence 校验通过');
console.log('✓ M 活跃 UI 无自动选择、路演不自动确认 Gate 4 且不执行 Agent 6');
