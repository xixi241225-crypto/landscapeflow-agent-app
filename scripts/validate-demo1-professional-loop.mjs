import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  BLUEPRINT_ITEM_STATUS,
  DESIGN_STATEMENT_REVIEW_STATUS,
  cloneBlueprint,
  createBlueprint,
} from '../src/blueprint/blueprintModel.js';
import {
  applyAgentPatch,
  canRunAgent,
  confirmCheckpoint,
  updateDesignerDecision,
} from '../src/blueprint/blueprintService.js';
import {
  approvePendingDesignStatementSections,
  buildDesignStatement,
  canConfirmDesignStatement,
  regenerateDesignStatementSections,
  reviewDesignStatementSection,
} from '../src/blueprint/designStatementService.js';
import {
  isRoadshowResultsReady,
  selectDesignExecutionTrace,
} from '../src/blueprint/blueprintSelectors.js';
import {
  confirmProjectDefinitionBlueprint,
  runProjectDefinitionAgent,
} from '../src/agents/projectDefinitionAgent.js';
import { runConceptGenerationAgent } from '../src/agents/conceptGenerationAgent.js';
import { DEMO_CASE, DEMO_FILES } from '../src/data/demoCase.js';
import { mockAgentProvider } from '../src/providers/mockAgentProvider.js';

const comment = '当前植物策略过于笼统，请增加北京冬季景观考虑，并明确四季景观连续性的设计原则。';
const demoInput = { ...DEMO_CASE, siteFiles: DEMO_FILES };
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

function section(blueprint, key) {
  return blueprint.deliverableArtifacts.designStatement.sections.find((item) => item.key === key);
}

function professionalSourceSnapshot(blueprint) {
  return cloneBlueprint({
    coreNarrative: blueprint.coreNarrative,
    spatialStructure: blueprint.spatialStructure,
    functionalZones: blueprint.functionalZones,
    circulationStrategy: blueprint.circulationStrategy,
    featureNodes: blueprint.featureNodes,
    material: blueprint.professionalStrategies.material,
    ecology: blueprint.professionalStrategies.ecology,
    grading: blueprint.professionalStrategies.grading,
    drainage: blueprint.professionalStrategies.drainage,
    operations: blueprint.professionalStrategies.operations,
  });
}

function gate3SourceSnapshot(blueprint) {
  return cloneBlueprint({
    coreNarrative: blueprint.coreNarrative,
    spatialStructure: blueprint.spatialStructure,
    functionalZones: blueprint.functionalZones,
    circulationStrategy: blueprint.circulationStrategy,
    professionalStrategies: blueprint.professionalStrategies,
    featureNodes: blueprint.featureNodes,
  });
}

let blueprint = createBlueprint(demoInput, 'demo1-validation-project');
blueprint = runProjectDefinitionAgent(demoInput, blueprint).blueprint;
blueprint = confirmProjectDefinitionBlueprint(blueprint).blueprint;
blueprint = runConceptGenerationAgent(blueprint, {
  mode: 'demo',
  designerBrief: '强调安静停留与清晰导视。',
}).blueprint;

// 1—5: Agent 3 reaches a real Gate 2. No designer decision is persisted before confirmation.
const agent3Patch = await mockAgentProvider.runAgent(3, blueprint, { delayMs: 0 });
blueprint = applyAgentPatch(blueprint, 3, agent3Patch, 'Demo-1 Agent 3 验证');
assert.equal(blueprint.currentCheckpoint, 'checkpoint-2');
assert.equal(blueprint.checkpoints.find((item) => item.id === 'checkpoint-2').status, '待确认');
assert.equal(blueprint.designerDecision.selectedConceptId, '');
assert.equal(canRunAgent(blueprint, 4), false);
assert.throws(() => confirmCheckpoint(blueprint, 'checkpoint-2'), /请先选择/);

const gate2Draft = {
  selectedConceptId: 'A',
  acceptedRecommendation: blueprint.agentRecommendation.conceptId === 'A',
  fusionRequirements: '保留方案 A 的核心空间策略。',
  modificationNotes: '后续专业策略继续保留资料边界。',
  decisionReason: '设计师基于当前比选主动选择方案 A。',
};
const beforeGate2Confirm = cloneBlueprint(blueprint);
blueprint = updateDesignerDecision(blueprint, gate2Draft, 'Demo-1 Gate 2 人工确认');
assert.equal(beforeGate2Confirm.designerDecision.selectedConceptId, '');
assert.equal(blueprint.designerDecision.selectedConceptId, 'A');
blueprint = confirmCheckpoint(blueprint, 'checkpoint-2', { selectedConceptId: 'A' }, 'Demo-1 验证设计师');
assert.equal(canRunAgent(blueprint, 4), true);

// 6—10: Agent 4 writes Blueprint first; the service then compiles an 11-section artifact.
const agent4Patch = await mockAgentProvider.runAgent(4, blueprint, { delayMs: 0 });
blueprint = applyAgentPatch(blueprint, 4, agent4Patch, 'Demo-1 Agent 4 验证');
assert.equal(blueprint.currentCheckpoint, 'checkpoint-3');
assert.equal(blueprint.deliverableArtifacts.designStatement, null);
blueprint = buildDesignStatement(blueprint);
const initialStatement = blueprint.deliverableArtifacts.designStatement;
assert.equal(initialStatement.sections.length, 11);
assert.deepEqual(initialStatement.sections.map((item) => item.key), sectionKeys);
initialStatement.sections.forEach((item) => {
  [
    'id', 'key', 'group', 'title', 'body', 'contentStatus', 'reviewStatus',
    'sourceFields', 'sourceRevision', 'generatedBy', 'generatedAt',
    'reviewComment', 'reviewedBy', 'reviewedAt', 'revision',
  ].forEach((field) => assert.ok(Object.hasOwn(item, field), `${item.key} 缺少 ${field}`));
  assert.ok(Object.values(BLUEPRINT_ITEM_STATUS).includes(item.contentStatus));
  assert.equal(item.reviewStatus, DESIGN_STATEMENT_REVIEW_STATUS.PENDING);
});
assert.equal(Object.hasOwn(initialStatement, 'version'), false);
assert.equal(initialStatement.statementRevision, 1);
const initialPlantContentStatus = section(blueprint, 'plant').contentStatus;
assert.equal(initialPlantContentStatus, BLUEPRINT_ITEM_STATUS.PENDING);
const reviewOnlyRevision = blueprint.revision;
const reviewOnlyStatementRevision = initialStatement.statementRevision;
blueprint = reviewDesignStatementSection(blueprint, 'plant', {
  reviewStatus: DESIGN_STATEMENT_REVIEW_STATUS.APPROVED,
  reviewedBy: 'designer',
}).blueprint;
assert.equal(section(blueprint, 'plant').contentStatus, initialPlantContentStatus);
assert.equal(section(blueprint, 'plant').reviewStatus, DESIGN_STATEMENT_REVIEW_STATUS.APPROVED);
assert.equal(blueprint.deliverableArtifacts.designStatement.statementRevision, reviewOnlyStatementRevision);
assert.equal(blueprint.revision, reviewOnlyRevision + 1);

// 11—23: one review request drives one scoped Agent 4 execution and one compiled section.
assert.throws(() => reviewDesignStatementSection(blueprint, 'plant', {
  reviewStatus: DESIGN_STATEMENT_REVIEW_STATUS.NEEDS_REVISION,
  comment: '   ',
}), /必须填写专业意见/);

const otherSectionsBeforeReview = Object.fromEntries(
  initialStatement.sections
    .filter((item) => item.key !== 'plant')
    .map((item) => [item.key, cloneBlueprint(item)]),
);
const reviewResult = reviewDesignStatementSection(blueprint, 'plant', {
  reviewStatus: DESIGN_STATEMENT_REVIEW_STATUS.NEEDS_REVISION,
  comment,
  reviewedBy: 'designer',
});
blueprint = reviewResult.blueprint;
assert.equal(section(blueprint, 'plant').reviewStatus, DESIGN_STATEMENT_REVIEW_STATUS.NEEDS_REVISION);
Object.entries(otherSectionsBeforeReview).forEach(([key, item]) => {
  assert.equal(section(blueprint, key).body, item.body);
  assert.equal(section(blueprint, key).revision, item.revision);
});
assert.equal(canRunAgent(blueprint, 5), false);
assert.throws(
  () => confirmCheckpoint(blueprint, 'checkpoint-3'),
  /待修改|全部分项复核/,
);

blueprint = approvePendingDesignStatementSections(blueprint, 'Demo-1 验证设计师');
assert.equal(section(blueprint, 'plant').reviewStatus, DESIGN_STATEMENT_REVIEW_STATUS.NEEDS_REVISION);
blueprint.deliverableArtifacts.designStatement.sections
  .filter((item) => item.key !== 'plant')
  .forEach((item) => assert.equal(item.reviewStatus, DESIGN_STATEMENT_REVIEW_STATUS.APPROVED));

const sourceBeforeRegeneration = professionalSourceSnapshot(blueprint);
const plantSourceBefore = blueprint.professionalStrategies.plant;
const statementRevisionBefore = blueprint.deliverableArtifacts.designStatement.statementRevision;
const plantSectionBefore = cloneBlueprint(section(blueprint, 'plant'));
const untouchedSectionsBeforeRegeneration = Object.fromEntries(
  blueprint.deliverableArtifacts.designStatement.sections
    .filter((item) => item.key !== 'plant')
    .map((item) => [item.key, cloneBlueprint(item)]),
);
const scopedResult = await mockAgentProvider.runAgent(4, blueprint, {
  delayMs: 0,
  scope: 'sections',
  sectionKeys: ['plant'],
  reviewComments: { plant: comment },
  traceId: reviewResult.traceId,
});
blueprint = regenerateDesignStatementSections(blueprint, scopedResult);

assert.notEqual(blueprint.professionalStrategies.plant, plantSourceBefore);
assert.deepEqual(professionalSourceSnapshot(blueprint), sourceBeforeRegeneration);
assert.equal(section(blueprint, 'plant').revision, plantSectionBefore.revision + 1);
assert.equal(blueprint.deliverableArtifacts.designStatement.statementRevision, statementRevisionBefore + 1);
assert.equal(section(blueprint, 'plant').reviewStatus, DESIGN_STATEMENT_REVIEW_STATUS.PENDING);
assert.equal(section(blueprint, 'plant').reviewComment, comment);
Object.entries(untouchedSectionsBeforeRegeneration).forEach(([key, item]) => {
  assert.deepEqual(section(blueprint, key), item, `${key} 被 scoped regeneration 意外修改`);
});
assert.doesNotMatch(
  blueprint.professionalStrategies.plant,
  /银杏|国槐|白皮松|油松|元宝枫|海棠|[0-9]+\s*株|[0-9]+\s*%|常绿比例/,
);
assert.match(blueprint.professionalStrategies.plant, /现状植物资料仍待调查与专项深化确认/);

const reviewEvent = blueprint.changeLog.find((event) => (
  event.type === 'design-statement-section-review'
  && event.traceId === reviewResult.traceId
));
const regenerationExecution = blueprint.agentExecutions.find((execution) => (
  execution.executionType === 'section-regeneration'
  && execution.traceId === reviewResult.traceId
));
assert.equal(reviewEvent.comment, comment);
assert.equal(regenerationExecution.sectionKeys[0], 'plant');
assert.equal(regenerationExecution.before[0].body, plantSectionBefore.body);
assert.equal(regenerationExecution.after[0].body, section(blueprint, 'plant').body);
const trace = selectDesignExecutionTrace(blueprint).find((item) => item.traceId === reviewResult.traceId);
assert.equal(trace.before.body, plantSectionBefore.body);
assert.equal(trace.comment, comment);
assert.equal(trace.after[0].body, section(blueprint, 'plant').body);
assert.equal(trace.status, 'completed');

// 22—27: Gate 3 is service-enforced; confirmation preserves source content states.
assert.equal(canConfirmDesignStatement(blueprint).valid, false);
assert.throws(() => confirmCheckpoint(blueprint, 'checkpoint-3'), /全部分项复核/);
blueprint = reviewDesignStatementSection(blueprint, 'plant', {
  reviewStatus: DESIGN_STATEMENT_REVIEW_STATUS.APPROVED,
  reviewedBy: 'designer',
}).blueprint;
assert.equal(section(blueprint, 'plant').contentStatus, BLUEPRINT_ITEM_STATUS.PENDING);
assert.equal(section(blueprint, 'plant').reviewStatus, DESIGN_STATEMENT_REVIEW_STATUS.APPROVED);
assert.equal(section(blueprint, 'plant').reviewComment, comment);
const traceAfterApproval = selectDesignExecutionTrace(blueprint).find((item) => item.traceId === reviewResult.traceId);
assert.equal(traceAfterApproval.before.body, trace.before.body);
assert.equal(traceAfterApproval.comment, comment);
assert.equal(traceAfterApproval.after[0].body, trace.after[0].body);
assert.equal(canConfirmDesignStatement(blueprint).valid, true);
assert.equal(blueprint.deliverableArtifacts.designStatement.status, 'approved');
const sourceBeforeGate3 = gate3SourceSnapshot(blueprint);
const revisionBeforeGate3 = blueprint.revision;
blueprint = confirmCheckpoint(blueprint, 'checkpoint-3', { source: 'Design Statement' }, 'Demo-1 验证设计师');
assert.deepEqual(gate3SourceSnapshot(blueprint), sourceBeforeGate3);
assert.equal(blueprint.revision, revisionBeforeGate3 + 1);
assert.equal(canRunAgent(blueprint, 5), true);

const agent5Patch = await mockAgentProvider.runAgent(5, blueprint, { delayMs: 0 });
blueprint = applyAgentPatch(blueprint, 5, agent5Patch, 'Demo-1 Agent 5 验证');
assert.ok(blueprint.visualTasks.every((task) => task.isFactSource === false));
assert.ok(blueprint.visualCandidates.every((candidate) => candidate.isFactSource === false));
assert.equal(blueprint.selectedVisuals.length, 0);
const demo1Candidate = blueprint.visualCandidates[0];
blueprint = confirmCheckpoint(blueprint, 'checkpoint-4', {
  visualSelection: {
    scene: demo1Candidate.scene,
    visualTaskId: demo1Candidate.visualTaskId,
    candidateId: demo1Candidate.id,
    reasons: ['与总平空间关系更一致'],
  },
}, 'Demo-1 验证设计师');
const agent6Patch = await mockAgentProvider.runAgent(6, blueprint, { delayMs: 0 });
blueprint = applyAgentPatch(blueprint, 6, agent6Patch, 'Demo-1 Agent 6 验证');
assert.equal(isRoadshowResultsReady(blueprint), true);

// 28: a later Agent 4 source edit invalidates dependent Agent 5/6 outputs.
const futureReview = reviewDesignStatementSection(blueprint, 'plant', {
  reviewStatus: DESIGN_STATEMENT_REVIEW_STATUS.NEEDS_REVISION,
  comment: '进一步强调冬季空间层次，继续保持资料边界。',
  reviewedBy: 'designer',
});
const futureScopedResult = await mockAgentProvider.runAgent(4, futureReview.blueprint, {
  delayMs: 0,
  scope: 'sections',
  sectionKeys: ['plant'],
  reviewComments: { plant: '进一步强调冬季空间层次，继续保持资料边界。' },
  traceId: futureReview.traceId,
});
const futureBlueprint = regenerateDesignStatementSections(futureReview.blueprint, futureScopedResult);
assert.equal(futureBlueprint.agentRuns[5].status, 'stale');
assert.equal(futureBlueprint.agentRuns[6].status, 'stale');
assert.equal(futureBlueprint.currentCheckpoint, 'checkpoint-3');
assert.equal(isRoadshowResultsReady(futureBlueprint), false);

// 29—30: presentation orchestration must stop at every human decision checkpoint.
const workbenchSource = readFileSync(new URL('../src/components/Workbench.jsx', import.meta.url), 'utf8');
const checkpointPanelSource = readFileSync(new URL('../src/components/CheckpointPanel.jsx', import.meta.url), 'utf8');
const heroSource = readFileSync(new URL('../src/components/Hero.jsx', import.meta.url), 'utf8');
const mockProviderSource = readFileSync(new URL('../src/providers/mockAgentProvider.js', import.meta.url), 'utf8');
const runnerSource = workbenchSource.slice(
  workbenchSource.indexOf('const runPresentationUntilCheckpoint'),
  workbenchSource.indexOf('const handleOpenPresentationResults'),
);
assert.doesNotMatch(runnerSource, /updateDesignerDecision/);
assert.doesNotMatch(runnerSource, /confirmCheckpoint\([^)]*['"]checkpoint-2['"]/s);
assert.doesNotMatch(runnerSource, /confirmCheckpoint\([^)]*['"]checkpoint-3['"]/s);
assert.doesNotMatch(runnerSource, /confirmCheckpoint\([^)]*['"]checkpoint-4['"]/s);
assert.match(runnerSource, /\['checkpoint-2', 'checkpoint-3', 'checkpoint-4'\]\.includes/);
assert.match(runnerSource, /getNextRunnableAgent\(blueprintRef\.current\)/);
assert.match(runnerSource, /checkpoint-4/);
assert.deepEqual(
  blueprint.checkpoints.slice(0, 4).map((checkpoint) => checkpoint.name),
  ['项目理解确认', '方案方向决策', '设计说明书分项确认', '视觉方案挑选'],
);
assert.match(blueprint.checkpoints[2].description, /逐项复核 Design Statement.*专业修改意见/);
assert.match(checkpointPanelSource, /DESIGNER CHECKPOINT · GATE/);
assert.doesNotMatch(checkpointPanelSource, /checkpoint\.order} \/ 4/);
assert.doesNotMatch(heroSource, /四个关键判断|项目事实确认|概念方向确认|空间方案确认/);
assert.match(workbenchSource, /组织六项专业策略/);
assert.match(mockProviderSource, /动线与六项专业策略/);
assert.doesNotMatch(`${workbenchSource}\n${mockProviderSource}`, /五项专业策略|适量社区使用者/);

// Demo-1.1: a second project must never receive the Beijing/community demo answer.
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
let alternateBlueprint = createBlueprint(alternateInput, 'demo1-cross-project-validation');
alternateBlueprint = runProjectDefinitionAgent(alternateInput, alternateBlueprint).blueprint;
alternateBlueprint = confirmProjectDefinitionBlueprint(alternateBlueprint).blueprint;
alternateBlueprint = runConceptGenerationAgent(alternateBlueprint, { mode: 'demo' }).blueprint;
const alternateAgent3Patch = await mockAgentProvider.runAgent(3, alternateBlueprint, { delayMs: 0 });
alternateBlueprint = applyAgentPatch(alternateBlueprint, 3, alternateAgent3Patch, 'Demo-1.1 跨项目 Agent 3 验证');
const alternateConceptId = alternateBlueprint.chapters.conceptGeneration.conceptCandidates[0].id;
alternateBlueprint = updateDesignerDecision(alternateBlueprint, {
  selectedConceptId: alternateConceptId,
  acceptedRecommendation: alternateConceptId === alternateBlueprint.agentRecommendation.conceptId,
  decisionReason: '跨项目验证选择首个概念方向',
});
alternateBlueprint = confirmCheckpoint(alternateBlueprint, 'checkpoint-2', { selectedConceptId: alternateConceptId }, 'Demo-1.1 验证设计师');
const alternateAgent4Patch = await mockAgentProvider.runAgent(4, alternateBlueprint, { delayMs: 0 });
alternateBlueprint = applyAgentPatch(alternateBlueprint, 4, alternateAgent4Patch, 'Demo-1.1 跨项目 Agent 4 验证');
alternateBlueprint = buildDesignStatement(alternateBlueprint);
const alternateComment = '请加强冬季景观层次与四季连续性。';
const alternateReview = reviewDesignStatementSection(alternateBlueprint, 'plant', {
  reviewStatus: DESIGN_STATEMENT_REVIEW_STATUS.NEEDS_REVISION,
  comment: alternateComment,
  reviewedBy: 'designer',
});
const alternateScopedResult = await mockAgentProvider.runAgent(4, alternateReview.blueprint, {
  delayMs: 0,
  scope: 'sections',
  sectionKeys: ['plant'],
  reviewComments: { plant: alternateComment },
  traceId: alternateReview.traceId,
});
alternateBlueprint = regenerateDesignStatementSections(alternateReview.blueprint, alternateScopedResult);
const alternatePlantResult = `${alternateBlueprint.professionalStrategies.plant}\n${section(alternateBlueprint, 'plant').body}`;
assert.doesNotMatch(alternatePlantResult, /北京|欢乐谷|社区公园/);
assert.match(alternatePlantResult, /宁波市海曙区/);
assert.match(alternatePlantResult, /冬季空间骨架/);
assert.match(alternatePlantResult, /四季景观连续/);
assert.match(alternatePlantResult, /资料仍待调查与专项深化确认/);

console.log('✓ 1–5 Gate 2 真暂停、无自动设计师决策、确认前后 Agent 4 门禁校验通过');
console.log('✓ 6–10 Agent 4 后置编译、11 个 Design Statement section 与双状态校验通过');
console.log('✓ 11–23 comment 门禁、批量复核保护、scoped regeneration 与完整 Trace 校验通过');
console.log('✓ 24–28 Gate 3 门禁、contentStatus 防污染、Agent 5/6 续跑与下游失效校验通过');
console.log('✓ 29–30 presentationMode 不自动确认 Gate 2 / Gate 3，Blueprint 仍为唯一流程状态源');
console.log('✓ Demo-1.1 Gate 名称、六项专业策略与中性项目使用者口径校验通过');
console.log('✓ Demo-1.1 reviewComment 在重新生成和再次通过后保留，Trace before/comment/after 不受影响');
console.log('✓ Demo-1.1 宁波商业项目未出现北京、欢乐谷或社区公园硬编码');
