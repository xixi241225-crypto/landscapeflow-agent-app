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
  return asArray(selectProjectDefinition(blueprint).facts);
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
  const completed = BLUEPRINT_CHAPTERS.filter(([key]) => Boolean(chapters[key])).length;
  return {
    completed,
    total: BLUEPRINT_CHAPTERS.length,
    percentage: Math.round((completed / BLUEPRINT_CHAPTERS.length) * 100),
    chapters: BLUEPRINT_CHAPTERS.map(([key, label]) => ({
      key,
      label,
      complete: Boolean(chapters[key]),
    })),
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

export function selectAgentExecution(blueprint, agentId) {
  return [...(blueprint?.agentExecutions || [])].reverse().find((item) => item.agentId === `agent-${agentId}` || item.agentId === Number(agentId)) || null;
}

export function selectAgent1ExecutionSummary(blueprint) {
  const execution = selectAgentExecution(blueprint, 1);
  if (!execution) return '等待整理项目资料';
  if (execution.openItemCount) return `已完成项目定义，并保留 ${execution.openItemCount} 项待补充信息`;
  return execution.summary || `已将项目资料整理为项目设计蓝本 ${execution.outputVersion || 'v1'}`;
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
