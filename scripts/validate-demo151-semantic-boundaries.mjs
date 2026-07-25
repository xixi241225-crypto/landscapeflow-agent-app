import assert from 'node:assert/strict';
import { createBlueprint } from '../src/blueprint/blueprintModel.js';
import {
  selectConfirmedConstraints,
  selectConfirmedDesignPrinciples,
  selectConceptCandidates,
  selectConceptGenerationInput,
  selectDesignPreferences,
  selectPendingConstraints,
  selectProjectDefinitionDetails,
  selectProjectInputForAgents,
} from '../src/blueprint/blueprintSelectors.js';
import {
  confirmProjectDefinitionBlueprint,
  runProjectDefinitionAgent,
} from '../src/agents/projectDefinitionAgent.js';
import { runConceptGenerationAgent } from '../src/agents/conceptGenerationAgent.js';
import { DEMO_CASE, DEMO_FILES } from '../src/data/demoCase.js';
import projectInput from '../data/demo-projects/huanlegu-community-park/project_input_v1.json' with { type: 'json' };

const demoInput = { ...DEMO_CASE, siteFiles: DEMO_FILES };
let blueprint = createBlueprint(demoInput, 'demo151-semantic-boundaries');
blueprint = runProjectDefinitionAgent(demoInput, blueprint).blueprint;

// 1. Compatibility designPrinciples retain preference identity and are never confirmed principles.
const preferencePrinciples = selectProjectDefinitionDetails(blueprint).designPrinciples;
assert.equal(preferencePrinciples.length, projectInput.designPreferences.length);
preferencePrinciples.forEach((item) => {
  assert.equal(item.status, 'assumption');
  assert.equal(item.semanticType, 'designPreference');
  assert.equal(item.provenance.sourcePath, 'projectInput.designPreferences');
  assert.equal(item.enforcement, false);
  assert.equal(item.confirmedDesignPrinciple, false);
});
assert.equal(selectConfirmedDesignPrinciples(blueprint).length, 0);
assert.equal(selectDesignPreferences(blueprint).length, projectInput.designPreferences.length);
['elderlyActivityArea', 'childrenActivityArea', 'parkGreenway'].forEach((topic) => {
  const preference = selectDesignPreferences(blueprint).find((item) => item.topic === topic);
  assert.ok(preference, `缺少设计偏好 ${topic}`);
  assert.equal(preference.semanticType, 'designPreference');
  assert.equal(preference.enforcement, false);
  assert.equal(preference.confirmedDesignPrinciple, false);
});

// 2. pendingVerification remains non-enforcing and is excluded from confirmed-constraint selectors.
const pendingConstraints = selectPendingConstraints(blueprint);
assert.equal(pendingConstraints.length, projectInput.pendingVerification.length);
pendingConstraints.forEach((item) => {
  assert.equal(item.status, 'pending');
  assert.equal(item.inputStatus, 'pendingVerification');
  assert.equal(item.semanticType, 'pendingVerification');
  assert.equal(item.enforcement, false);
  assert.equal(item.confirmedConstraint, false);
});
assert.equal(selectConfirmedConstraints(blueprint).length, 0);
assert.equal(selectProjectInputForAgents(blueprint).confirmedConstraints.length, 0);
assert.equal(selectProjectInputForAgents(blueprint).constraints, '');
[
  '正式红线',
  '正式地形测绘',
  '现状乔木调查',
  '地下管线',
  '市政排水接口',
  '投资上限',
  '运维主体与要求',
].forEach((topic) => assert.ok(pendingConstraints.some((item) => item.label === topic)));

blueprint = confirmProjectDefinitionBlueprint(blueprint).blueprint;
assert.equal(selectConfirmedDesignPrinciples(blueprint).length, 0);
assert.equal(selectConfirmedConstraints(blueprint).length, 0);
assert.ok(selectPendingConstraints(blueprint).every((item) => item.enforcement === false));

const explicitPrincipleInput = {
  projectName: '城市街角公共空间',
  city: '杭州市西湖区',
  area: '6000',
  projectType: '街头绿地',
  targetUsers: '',
  designGoals: '改善步行停留体验',
  constraints: '正式边界由设计师提供',
  stylePreference: '开放连续',
  maintenance: '',
  clientFocus: '',
  designStage: '概念方案',
  deliveryDate: '',
  budgetCondition: '',
  presentationAudience: '',
  siteFiles: [],
};
let explicitPrincipleBlueprint = createBlueprint(explicitPrincipleInput, 'demo151-explicit-principle');
explicitPrincipleBlueprint = runProjectDefinitionAgent(explicitPrincipleInput, explicitPrincipleBlueprint).blueprint;
assert.equal(selectConfirmedDesignPrinciples(explicitPrincipleBlueprint).length, 0);
assert.equal(
  selectProjectDefinitionDetails(explicitPrincipleBlueprint).designPrinciples[0].semanticType,
  'designPrincipleCandidate',
);
explicitPrincipleBlueprint = confirmProjectDefinitionBlueprint(explicitPrincipleBlueprint).blueprint;
assert.equal(selectConfirmedDesignPrinciples(explicitPrincipleBlueprint).length, 1);
assert.equal(selectConfirmedDesignPrinciples(explicitPrincipleBlueprint)[0].semanticType, 'designPrinciple');
assert.equal(selectConfirmedDesignPrinciples(explicitPrincipleBlueprint)[0].enforcement, true);

// 3. Agent 2 provenance does not create a Gate 2 designer decision.
const conceptInput = selectConceptGenerationInput(blueprint);
assert.equal(conceptInput.confirmedDesignPrinciples.length, 0);
assert.equal(conceptInput.confirmedConstraints.length, 0);
assert.equal(conceptInput.designPreferences.length, projectInput.designPreferences.length);
assert.equal(conceptInput.pendingConstraints.length, projectInput.pendingVerification.length);
blueprint = runConceptGenerationAgent(blueprint, { mode: 'demo' }).blueprint;
const candidateB = selectConceptCandidates(blueprint).find((item) => item.code === 'B');
assert.equal(candidateB.candidateOrigin, 'projectReferenceDirection');
assert.equal(candidateB.referenceRole, 'historicalFinalDirection');
assert.equal(blueprint.designerDecision.selectedConceptId, '');
assert.equal(blueprint.designerDecision.status, '待确认');
assert.equal(blueprint.agentRecommendation, null);
assert.equal(
  blueprint.decisions.some((item) => item.type === 'concept-direction-decision'),
  false,
);
assert.equal(blueprint.chapters.conceptGeneration.sharedRequirements.length, 0);
assert.equal(
  blueprint.chapters.conceptGeneration.preferenceInputs.length,
  projectInput.designPreferences.length,
);
assert.equal(blueprint.chapters.conceptGeneration.inputRefs.constraints.length, 0);
assert.equal(
  blueprint.chapters.conceptGeneration.inputRefs.pendingConstraints.length,
  projectInput.pendingVerification.length,
);

// 4. Children water interaction is a resident-research preference, never a fact or engineering decision.
const waterPreference = projectInput.designPreferences.find((item) => item.id === 'DP-06');
assert.ok(waterPreference);
assert.equal(waterPreference.type, 'designPreference');
assert.equal(waterPreference.source, 'preliminaryResidentResearch');
assert.equal(waterPreference.status, 'preference');
assert.equal(waterPreference.isFinalDecision, false);
assert.match(waterPreference.statement, /浅层、安全、可视、可控的儿童亲水互动/);
assert.match(waterPreference.note, /不是现状水体事实、正式水景工程决定或已确认施工条件/);
const waterCompatibilityItem = selectProjectDefinitionDetails(blueprint).designPrinciples
  .find((item) => item.provenance?.sourceId === 'DP-06');
assert.ok(waterCompatibilityItem);
assert.equal(waterCompatibilityItem.semanticType, 'designPreference');
assert.equal(waterCompatibilityItem.enforcement, false);
assert.equal(waterCompatibilityItem.confirmedDesignPrinciple, false);
assert.doesNotMatch(
  JSON.stringify({
    facts: selectProjectDefinitionDetails(blueprint).facts,
    siteConditions: selectProjectDefinitionDetails(blueprint).siteConditions,
    confirmedConstraints: selectConfirmedConstraints(blueprint),
    confirmedDesignPrinciples: selectConfirmedDesignPrinciples(blueprint),
  }),
  /浅层、安全、可视、可控的儿童亲水互动/,
);

console.log('✓ designPreference 与 confirmedDesignPrinciple 语义及 selector 已分离');
console.log('✓ pendingVerification enforcement=false，已确认约束 selector 不会读取');
console.log('✓ B provenance 与 Gate 2 designerDecision 状态已分离');
console.log('✓ 儿童亲水输入保持 preliminaryResidentResearch preference 身份');
