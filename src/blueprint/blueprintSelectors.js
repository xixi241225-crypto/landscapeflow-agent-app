import { BLUEPRINT_ITEM_STATUS } from './blueprintModel.js';

export const BLUEPRINT_STATUS_LABELS = {
  [BLUEPRINT_ITEM_STATUS.CONFIRMED]: '已确认',
  [BLUEPRINT_ITEM_STATUS.ASSUMPTION]: '合理假设',
  [BLUEPRINT_ITEM_STATUS.PENDING]: '待确认',
  [BLUEPRINT_ITEM_STATUS.CONFLICT]: '存在冲突',
};

export const BLUEPRINT_CHAPTERS = [
  ['projectDefinition', '项目定义'],
  ['conceptGeneration', '概念生成'],
  ['schemeDecision', '方案选择'],
  ['spatialDevelopment', '空间推演'],
  ['visualExpression', '视觉表达'],
  ['deliverables', '成果输出'],
];

const asArray = (value) => {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object') return Object.values(value);
  return [];
};

const text = (item) => String(item?.value ?? item?.label ?? item ?? '').trim();
const FACT_KEYS_BY_LABEL = {
  项目名称: 'projectName',
  项目地点: 'location',
  项目面积: 'area',
  场地面积: 'area',
  项目类型: 'projectType',
  设计阶段: 'designStage',
  预算条件: 'budgetCondition',
  业主单位: 'owner',
};

export function selectProjectDefinition(blueprint) {
  return blueprint?.chapters?.projectDefinition || {
    facts: {},
    stakeholders: [],
    explicitGoals: [],
    latentGoals: [],
    siteConditions: {
      existingAssets: [],
      existingProblems: [],
      surroundings: [],
      climateAndEcology: [],
      accessAndMobility: [],
      terrainAndWater: [],
      interfaces: [],
    },
    constraints: [],
    designPrinciples: [],
    successCriteria: [],
    coreQuestions: [],
    openItems: [],
    conflicts: [],
    sourceDocuments: [],
  };
}

export function selectProjectFacts(blueprint) {
  const facts = selectProjectDefinition(blueprint).facts;
  if (facts && !Array.isArray(facts) && typeof facts === 'object') {
    return Object.entries(facts).map(([key, record]) => ({
      ...record,
      key: record?.key || key,
    }));
  }
  return asArray(facts).map((record) => ({
    ...record,
    ...(record?.key || !FACT_KEYS_BY_LABEL[record?.label] ? {} : { key: FACT_KEYS_BY_LABEL[record.label] }),
  }));
}

export function selectProjectFactsByKey(blueprint) {
  return Object.fromEntries(selectProjectFacts(blueprint)
    .filter((item) => item.key)
    .map((item) => [item.key, item]));
}

export function selectProjectFactByKey(blueprint, key) {
  return selectProjectFactsByKey(blueprint)[key] || null;
}

export function selectProjectGoals(blueprint) {
  const definition = selectProjectDefinition(blueprint);
  return [...asArray(definition.explicitGoals), ...asArray(definition.latentGoals)];
}

export function selectExplicitGoals(blueprint) {
  return asArray(selectProjectDefinition(blueprint).explicitGoals);
}

export function selectLatentGoals(blueprint) {
  return asArray(selectProjectDefinition(blueprint).latentGoals);
}

export function selectCoreConstraints(blueprint) {
  return asArray(selectProjectDefinition(blueprint).constraints);
}

export function selectDesignPrinciples(blueprint) {
  return asArray(selectProjectDefinition(blueprint).designPrinciples);
}

export function selectProjectDefinitionDetails(blueprint) {
  const definition = selectProjectDefinition(blueprint);
  const conditions = definition.siteConditions || {};
  return {
    facts: selectProjectFacts(blueprint),
    stakeholders: asArray(definition.stakeholders),
    explicitGoals: asArray(definition.explicitGoals),
    latentGoals: asArray(definition.latentGoals),
    siteConditions: Object.entries(conditions).flatMap(([group, items]) => asArray(items).map((item) => ({ ...item, group }))),
    constraints: asArray(definition.constraints),
    designPrinciples: asArray(definition.designPrinciples),
    successCriteria: asArray(definition.successCriteria),
    coreQuestions: asArray(definition.coreQuestions),
    openItems: asArray(definition.openItems),
    conflicts: asArray(definition.conflicts),
    sourceDocuments: asArray(definition.sourceDocuments),
  };
}

export function selectBlueprintProgress(blueprint) {
  const chapters = blueprint?.chapters || {};
  const chapterStates = BLUEPRINT_CHAPTERS.map(([key, label], index) => ({
    key,
    label,
    complete: Boolean(chapters[key]) && blueprint?.agentRuns?.[index + 1]?.status !== 'stale',
  }));
  const completed = chapterStates.filter((chapter) => chapter.complete).length;
  return {
    completed,
    total: BLUEPRINT_CHAPTERS.length,
    percentage: Math.round((completed / BLUEPRINT_CHAPTERS.length) * 100),
    chapters: chapterStates,
  };
}

export function selectProjectInputForAgents(blueprint) {
  const facts = Object.fromEntries(selectProjectFacts(blueprint).map((item) => [item.key || item.id, text(item)]));
  const project = blueprint?.projectBasicInfo || {};
  const details = selectProjectDefinitionDetails(blueprint);
  const stakeholders = details.stakeholders.map(text).filter(Boolean);
  return {
    ...project,
    projectName: facts.projectName || project.projectName || '',
    city: facts.location || facts.city || project.city || '',
    area: facts.area || project.area || '',
    projectType: facts.projectType || project.projectType || '',
    designStage: facts.designStage || project.designStage || '',
    budgetCondition: facts.budgetCondition || project.budgetCondition || '',
    targetUsers: stakeholders.length ? stakeholders.join('、') : project.targetUsers || '',
    designGoals: details.explicitGoals.map(text).filter(Boolean).join('；') || project.designGoals || '',
    clientFocus: details.latentGoals.map(text).filter(Boolean).join('；') || project.clientFocus || '',
    constraints: details.constraints.map(text).filter(Boolean).join('；') || project.constraints || '',
    designPrinciples: details.designPrinciples.map(text).filter(Boolean),
    successCriteria: details.successCriteria.map(text).filter(Boolean),
    openItems: details.openItems,
    sourceDocuments: details.sourceDocuments,
  };
}

export function selectConceptGeneration(blueprint) {
  if (blueprint?.chapters?.conceptGeneration) return blueprint.chapters.conceptGeneration;
  if (Array.isArray(blueprint?.conceptCandidates) && blueprint.conceptCandidates.length) {
    return {
      agentId: 'agent-2',
      agentName: '概念生成',
      generatedFromVersion: blueprint?.agentRuns?.[2]?.blueprintVersionRead || 'legacy',
      conceptCandidates: blueprint.conceptCandidates,
      unresolvedDependencies: [],
      qualityChecks: null,
      legacyFallback: true,
    };
  }
  return null;
}

export function selectConceptCandidates(blueprint) {
  return asArray(selectConceptGeneration(blueprint)?.conceptCandidates);
}

export function selectConceptCandidate(blueprint, conceptId) {
  return selectConceptCandidates(blueprint).find((item) => item.id === conceptId || item.code === conceptId) || null;
}

export function selectConceptGenerationSummary(blueprint) {
  const chapter = selectConceptGeneration(blueprint);
  const candidates = selectConceptCandidates(blueprint);
  return {
    complete: Boolean(chapter && candidates.length),
    candidateCount: candidates.length,
    names: candidates.map((item) => `${item.code || item.id}｜${item.name}`),
    generatedFromVersion: chapter?.generatedFromVersion || '',
    generatedAt: chapter?.generatedAt || '',
    generationRequest: chapter?.generationRequest?.value || '',
    stageStatus: chapter?.status || (chapter ? 'completed' : 'pending'),
  };
}

export function selectConceptResponseMappings(blueprint, conceptId) {
  const candidates = conceptId ? [selectConceptCandidate(blueprint, conceptId)].filter(Boolean) : selectConceptCandidates(blueprint);
  return candidates.flatMap((candidate) => (candidate.responseMappings || []).map((mapping) => ({
    ...mapping,
    conceptId: candidate.id,
    conceptCode: candidate.code,
    conceptName: candidate.name,
  })));
}

export function selectConceptGenerationDependencies(blueprint) {
  const chapter = selectConceptGeneration(blueprint);
  return asArray(chapter?.unresolvedDependencies);
}

export function selectConceptGenerationInput(blueprint) {
  const definition = selectProjectDefinition(blueprint);
  const facts = selectProjectFactsByKey(blueprint);
  const details = selectProjectDefinitionDetails(blueprint);
  return {
    schemaVersion: blueprint?.schemaVersion || '',
    milestoneVersion: blueprint?.milestoneVersion || 'v0',
    revision: blueprint?.revision ?? blueprint?.currentVersion ?? 0,
    checkpointConfirmed: blueprint?.checkpoints?.find((item) => item.id === 'checkpoint-1')?.status === '已确认',
    facts,
    project: {
      projectName: text(facts.projectName),
      location: text(facts.location),
      area: text(facts.area),
      projectType: text(facts.projectType),
      designStage: text(facts.designStage),
      budgetCondition: text(facts.budgetCondition),
      owner: text(facts.owner),
    },
    stakeholders: asArray(definition.stakeholders),
    explicitGoals: asArray(definition.explicitGoals),
    latentGoals: asArray(definition.latentGoals),
    siteConditions: definition.siteConditions || {},
    flattenedSiteConditions: details.siteConditions,
    constraints: asArray(definition.constraints),
    designPrinciples: asArray(definition.designPrinciples),
    successCriteria: asArray(definition.successCriteria),
    coreQuestions: asArray(definition.coreQuestions),
    openItems: asArray(definition.openItems),
    conflicts: asArray(definition.conflicts),
  };
}

export function selectAgentExecution(blueprint, agentId) {
  return [...(blueprint?.agentExecutions || [])].reverse().find((item) => item.agentId === `agent-${agentId}` || item.agentId === Number(agentId)) || null;
}

export function selectAgent1ExecutionSummary(blueprint) {
  const execution = selectAgentExecution(blueprint, 1);
  if (!execution) return '等待整理项目资料';
  if (execution.openItemCount) return `已完成项目定义，并保留 ${execution.openItemCount} 项待补充信息`;
  return execution.summary || `已将项目资料整理为项目设计蓝本 ${execution.outputVersion || 'v1'}`;
}

export function selectAgent2ExecutionSummary(blueprint) {
  const execution = selectAgentExecution(blueprint, 2);
  if (!execution) return '等待生成概念方向';
  if (execution.openItemCount) return `已生成 ${execution.candidateCount || 3} 个概念候选，其中 ${execution.openItemCount} 项场地条件需后续复核`;
  return execution.summary || `已基于项目设计蓝本 ${execution.inputVersion || 'v2'} 生成 ${execution.candidateCount || 3} 个概念候选`;
}

export function deriveRoadshowStateFromBlueprint(blueprint) {
  const milestone = Number(String(blueprint?.milestoneVersion || 'v0').replace('v', '')) || 0;
  if (milestone <= 0) return { presentationStage: 0, presentationComplete: false, presentationAgentStates: Array(6).fill('等待') };
  if (milestone === 1) return { presentationStage: 1, presentationComplete: false, presentationAgentStates: ['已完成', ...Array(5).fill('等待')] };
  const states = Array(6).fill('等待').map((_, index) => {
    const run = blueprint?.agentRuns?.[index + 1];
    return run?.status === 'done' ? '已完成' : '等待';
  });
  return {
    presentationStage: 2,
    presentationComplete: states.every((status) => status === '已完成'),
    presentationAgentStates: states,
  };
}
