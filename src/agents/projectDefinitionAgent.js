import {
  BLUEPRINT_ITEM_STATUS,
  BLUEPRINT_MILESTONES,
  cloneBlueprint,
  newEntityId,
} from '../blueprint/blueprintModel.js';
import { migrateBlueprintToV2 } from '../blueprint/blueprintMigration.js';
import {
  DEMO_CASE,
  DEMO_CASE_ID,
  DEMO_PARSED_PROJECT_DEFINITION,
} from '../data/demoCase.js';

export const agentWriteScopes = {
  'agent-1': ['chapters.projectDefinition'],
  'agent-2': ['chapters.conceptGeneration'],
  'agent-3': ['chapters.schemeDecision'],
  'agent-4': ['chapters.spatialDevelopment'],
  'agent-5': ['chapters.visualExpression'],
  'agent-6': ['chapters.deliverables'],
};

const requiredFields = ['projectName', 'city', 'projectType', 'area'];
const now = () => new Date().toISOString();
const split = (value) => String(value || '').split(/[，,；;、\n。]/).map((item) => item.trim()).filter(Boolean);
const formRef = (field) => [{ fileId: 'project-form', fileName: '项目条件表单', location: field }];

function item(seed, id, defaultStatus = BLUEPRINT_ITEM_STATUS.CONFIRMED) {
  return {
    id,
    ...(seed.key ? { key: seed.key } : {}),
    label: seed.label || '项目定义信息',
    value: String(seed.value || '').trim(),
    status: seed.status || defaultStatus,
    sourceRefs: seed.sourceRefs || [],
    confidence: seed.confidence ?? (seed.status === BLUEPRINT_ITEM_STATUS.PENDING ? 0.5 : 0.9),
    updatedBy: 'agent-1',
    updatedAt: now(),
  };
}

function items(seeds = [], prefix, defaultStatus) {
  return seeds.filter((seed) => String(seed?.value || '').trim()).map((seed, index) => item(seed, `${prefix}-${String(index + 1).padStart(2, '0')}`, defaultStatus));
}

function sourceDocuments(projectInput) {
  return (projectInput.siteFiles || []).map((file, index) => ({
    id: file.id || `file-${String(index + 1).padStart(2, '0')}`,
    fileName: file.name || `项目资料 ${index + 1}`,
    fileType: file.type || '未知',
    fileSize: file.size || '未知大小',
    category: file.category || '项目资料',
    uploadedAt: file.uploadedAt || '',
    status: file.status || (file.demo ? '演示资料待复核' : '已上传，待内容解析'),
    isDemoAsset: Boolean(file.demo),
  }));
}

function factsFromInput(projectInput) {
  const fields = [
    ['projectName', '项目名称', projectInput.projectName, '项目名称'],
    ['location', '项目地点', projectInput.city, '项目地点'],
    ['area', '项目面积', projectInput.area, '项目面积'],
    ['projectType', '项目类型', projectInput.projectType, '项目类型'],
    ['designStage', '设计阶段', projectInput.designStage || '设计阶段待确认', '设计阶段'],
    ['budgetCondition', '预算条件', projectInput.budgetCondition || '预算边界待补充', '预算条件'],
    ['owner', '业主单位', '具体业主单位待补充', '业主单位'],
  ];
  return Object.fromEntries(fields.map(([key, label, value, location], index) => [key, item({
    key,
    label,
    value,
    status: ['owner'].includes(key) || !projectInput[key === 'location' ? 'city' : key] ? BLUEPRINT_ITEM_STATUS.PENDING : BLUEPRINT_ITEM_STATUS.CONFIRMED,
    sourceRefs: key === 'owner' ? [] : formRef(location),
    confidence: key === 'owner' ? 0.35 : 0.99,
  }, `fact-${String(index + 1).padStart(2, '0')}`)]));
}

function userInputDefinition(projectInput) {
  const userValues = split(projectInput.targetUsers);
  const goalValues = split(projectInput.designGoals);
  const constraintValues = split(projectInput.constraints);
  const stakeholders = userValues.length
    ? userValues.map((value) => ({ label: '主要使用者', value, sourceRefs: formRef('服务人群') }))
    : [{ label: '服务人群', value: '具体服务人群及使用时段待补充', status: BLUEPRINT_ITEM_STATUS.PENDING, sourceRefs: [], confidence: 0.3 }];
  const explicitGoals = goalValues.length
    ? goalValues.map((value) => ({ label: '显性目标', value, sourceRefs: formRef('设计目标') }))
    : [{ label: '设计目标', value: '具体设计目标待设计师或任务书补充', status: BLUEPRINT_ITEM_STATUS.PENDING, sourceRefs: [], confidence: 0.3 }];
  const constraints = constraintValues.length
    ? constraintValues.map((value) => ({ label: '核心约束', value, sourceRefs: formRef('核心约束') }))
    : [{ label: '核心约束', value: '建设预算、功能边界与实施约束待补充', status: BLUEPRINT_ITEM_STATUS.PENDING, sourceRefs: [], confidence: 0.3 }];
  let principleSeeds = [
    ...split(projectInput.stylePreference).map((value) => ({ label: '风格与体验原则', value, sourceRefs: formRef('风格偏好') })),
    ...split(projectInput.maintenance).map((value) => ({ label: '运维原则', value, sourceRefs: formRef('维护要求') })),
  ];
  if (!principleSeeds.length) {
    principleSeeds = [{
      label: '概念推演原则',
      value: `暂以${projectInput.projectType}的公共性、安全可达与弹性使用作为概念推演原则，待项目目标补充后复核`,
      status: BLUEPRINT_ITEM_STATUS.ASSUMPTION,
      sourceRefs: formRef('项目类型'),
      confidence: 0.65,
    }];
  }
  const uploadedPending = (projectInput.siteFiles || []).filter((file) => !file.demo).map((file) => ({
    label: '资料待解析',
    value: `${file.name} 已上传，但本原型尚未读取文件内容`,
    status: BLUEPRINT_ITEM_STATUS.PENDING,
    sourceRefs: [{ fileId: file.id || '', fileName: file.name, location: '' }],
    confidence: 0,
  }));
  return {
    stakeholders,
    explicitGoals,
    latentGoals: split(projectInput.clientFocus).map((value) => ({
      label: '深层诉求',
      value,
      status: BLUEPRINT_ITEM_STATUS.ASSUMPTION,
      sourceRefs: formRef('甲方关注'),
      confidence: 0.7,
    })),
    siteConditions: {
      existingAssets: [],
      existingProblems: [{
        label: '场地条件',
        value: '场地现状资源、问题与建设边界待上传资料解析及现场复核',
        status: BLUEPRINT_ITEM_STATUS.PENDING,
        sourceRefs: [],
        confidence: 0.3,
      }],
      surroundings: [],
      climateAndEcology: [],
      accessAndMobility: [],
      terrainAndWater: [],
      interfaces: [],
    },
    constraints,
    designPrinciples: principleSeeds,
    successCriteria: goalValues.length
      ? explicitGoals.map((goal) => ({ ...goal, label: '成功标准', value: `方案应有效回应：${goal.value}` }))
      : [{ label: '成功标准', value: '项目成功标准与验收口径待补充', status: BLUEPRINT_ITEM_STATUS.PENDING, sourceRefs: [], confidence: 0.3 }],
    coreQuestions: [{
      label: '核心设计问题',
      value: `如何在${projectInput.area}㎡的${projectInput.projectType}中，统筹使用需求、场地条件与实施约束？`,
      status: BLUEPRINT_ITEM_STATUS.ASSUMPTION,
      sourceRefs: formRef('项目基本信息'),
      confidence: 0.72,
    }],
    openItems: [
      ...uploadedPending,
      ...(!goalValues.length ? [{ label: '设计目标', value: '具体设计目标与成果优先级待补充', status: BLUEPRINT_ITEM_STATUS.PENDING, sourceRefs: [], confidence: 0.3 }] : []),
      ...(!constraintValues.length ? [{ label: '核心约束', value: '建设预算、功能边界与实施约束待补充', status: BLUEPRINT_ITEM_STATUS.PENDING, sourceRefs: [], confidence: 0.3 }] : []),
      ...(!userValues.length ? [{ label: '服务人群', value: '主要使用者、人群结构与使用时段待补充', status: BLUEPRINT_ITEM_STATUS.PENDING, sourceRefs: [], confidence: 0.3 }] : []),
      { label: '场地解析', value: '红线、竖向、现状资源和市政接口需在接入真实解析能力后复核', status: BLUEPRINT_ITEM_STATUS.PENDING, sourceRefs: [], confidence: 0.3 },
    ],
    conflicts: [],
  };
}

function matchesCurrentDemoDataset(projectInput) {
  const matchesFacts = ['projectName', 'city', 'area', 'projectType']
    .every((key) => String(projectInput?.[key] || '').trim() === String(DEMO_CASE[key] || '').trim());
  const explicitlyBoundFiles = (projectInput.siteFiles || [])
    .filter((file) => file.demo && file.demoCaseId === DEMO_CASE_ID);
  return matchesFacts && explicitlyBoundFiles.length > 0;
}

function normalizeDefinition(projectInput) {
  const source = matchesCurrentDemoDataset(projectInput)
    ? DEMO_PARSED_PROJECT_DEFINITION
    : userInputDefinition(projectInput);
  const conditions = source.siteConditions || {};
  return {
    facts: factsFromInput(projectInput),
    stakeholders: items(source.stakeholders, 'stakeholder'),
    explicitGoals: items(source.explicitGoals, 'goal'),
    latentGoals: items(source.latentGoals, 'latent-goal', BLUEPRINT_ITEM_STATUS.ASSUMPTION),
    siteConditions: {
      existingAssets: items(conditions.existingAssets, 'site-asset'),
      existingProblems: items(conditions.existingProblems, 'site-problem'),
      surroundings: items(conditions.surroundings, 'site-surrounding'),
      climateAndEcology: items(conditions.climateAndEcology, 'site-ecology'),
      accessAndMobility: items(conditions.accessAndMobility, 'site-access'),
      terrainAndWater: items(conditions.terrainAndWater, 'site-terrain'),
      interfaces: items(conditions.interfaces, 'site-interface'),
    },
    constraints: items(source.constraints, 'constraint'),
    designPrinciples: items(source.designPrinciples, 'principle'),
    successCriteria: items(source.successCriteria, 'criterion'),
    coreQuestions: items(source.coreQuestions, 'question', BLUEPRINT_ITEM_STATUS.ASSUMPTION),
    openItems: items(source.openItems, 'open-item', BLUEPRINT_ITEM_STATUS.PENDING),
    conflicts: items(source.conflicts, 'conflict', BLUEPRINT_ITEM_STATUS.CONFLICT),
    sourceDocuments: sourceDocuments(projectInput),
  };
}

export function assertAgentWriteScope(agentId, paths) {
  const allowed = agentWriteScopes[agentId] || [];
  const unauthorized = paths.filter((path) => !allowed.includes(path));
  if (unauthorized.length) throw new Error(`${agentId} 无权写入：${unauthorized.join('、')}`);
}

export function runProjectDefinitionAgent(projectInput, currentBlueprint) {
  const missing = requiredFields.filter((field) => !String(projectInput?.[field] || '').trim());
  if (missing.length) throw new Error(`Agent 1 缺少必填项目字段：${missing.join('、')}`);
  assertAgentWriteScope('agent-1', ['chapters.projectDefinition']);

  const source = migrateBlueprintToV2(currentBlueprint);
  const next = cloneBlueprint(source);
  const startedAt = now();
  const definition = normalizeDefinition(projectInput);
  const completedAt = now();
  const revision = (source.revision ?? source.currentVersion ?? 0) + 1;
  const execution = {
    id: newEntityId('execution'),
    agentId: 'agent-1',
    agentName: '项目定义',
    startedAt,
    completedAt,
    inputVersion: source.milestoneVersion || BLUEPRINT_MILESTONES.DRAFT,
    outputVersion: BLUEPRINT_MILESTONES.PROJECT_DEFINED,
    readSections: ['projectBasicInfo', 'projectBasicInfo.siteFiles'],
    writtenSections: ['chapters.projectDefinition'],
    status: 'completed',
    summary: `已将项目资料整理为项目设计蓝本 ${BLUEPRINT_MILESTONES.PROJECT_DEFINED}`,
    warnings: definition.openItems.map((entry) => entry.value),
    openItemCount: definition.openItems.length,
    conflictCount: definition.conflicts.length,
  };

  next.projectBasicInfo = { ...next.projectBasicInfo, ...projectInput };
  next.chapters = { ...next.chapters, projectDefinition: definition };
  next.revision = revision;
  next.currentVersion = revision;
  next.milestoneVersion = BLUEPRINT_MILESTONES.PROJECT_DEFINED;
  next.stage = 'project-definition';
  next.status = 'review';
  next.updatedAt = completedAt;
  next.updatedBy = 'agent-1';
  next.agentExecutions = [...(next.agentExecutions || []), execution];
  next.agentRuns = {
    ...next.agentRuns,
    1: {
      ...next.agentRuns?.[1],
      agentId: 1,
      agentName: '项目定义',
      status: 'done',
      lastRunAt: completedAt,
      blueprintVersionRead: source.milestoneVersion || BLUEPRINT_MILESTONES.DRAFT,
      blueprintVersionWritten: BLUEPRINT_MILESTONES.PROJECT_DEFINED,
    },
  };
  next.currentCheckpoint = 'checkpoint-1';
  next.checkpoints = (next.checkpoints || []).map((checkpoint) => checkpoint.id === 'checkpoint-1'
    ? { ...checkpoint, status: '待确认', confirmedAt: null, confirmedBy: null, decision: null }
    : checkpoint);
  next.changeLog = [{
    id: newEntityId('change'),
    sourceAgent: 'Agent 1｜项目定义',
    modifiedAt: completedAt,
    reason: '将项目资料整理为统一项目定义基线',
    confirmationStatus: '待确认',
    version: revision,
    milestoneVersion: BLUEPRINT_MILESTONES.PROJECT_DEFINED,
    fields: ['chapters.projectDefinition'],
  }, ...(next.changeLog || [])];

  const changedSections = ['项目事实', '项目目标', '核心约束', '设计原则', '待补充事项'];
  return {
    blueprint: next,
    execution,
    changeSet: {
      added: changedSections.map((label) => `chapters.projectDefinition.${label}`),
      updated: source.chapters?.projectDefinition ? ['chapters.projectDefinition'] : [],
      removed: [],
    },
    version: {
      milestoneVersion: BLUEPRINT_MILESTONES.PROJECT_DEFINED,
      revision,
      createdAt: completedAt,
      createdBy: 'agent-1',
      title: '项目定义完成',
      summary: '形成项目事实、目标、约束、设计原则和待补充事项',
      changedSections,
    },
  };
}

const confirmItems = (records = []) => records.map((entry) => (
  entry.status === BLUEPRINT_ITEM_STATUS.CONFIRMED
    ? { ...entry, updatedBy: 'designer', updatedAt: now() }
    : entry
));

export function confirmProjectDefinitionBlueprint(currentBlueprint) {
  const source = migrateBlueprintToV2(currentBlueprint);
  if (!source.chapters?.projectDefinition) throw new Error('请先运行 Agent 1 形成项目定义');
  const next = cloneBlueprint(source);
  const confirmedAt = now();
  const revision = (source.revision ?? source.currentVersion ?? 0) + 1;
  const definition = next.chapters.projectDefinition;
  next.chapters.projectDefinition = {
    ...definition,
    explicitGoals: confirmItems(definition.explicitGoals),
    constraints: confirmItems(definition.constraints),
    designPrinciples: confirmItems(definition.designPrinciples),
  };
  next.revision = revision;
  next.currentVersion = revision;
  next.milestoneVersion = BLUEPRINT_MILESTONES.DIRECTION_CONFIRMED;
  next.stage = 'agent-collaboration';
  next.status = 'confirmed';
  next.updatedAt = confirmedAt;
  next.updatedBy = 'designer';
  next.currentCheckpoint = null;
  next.checkpoints = next.checkpoints.map((checkpoint) => checkpoint.id === 'checkpoint-1' ? {
    ...checkpoint,
    status: '已确认',
    confirmedAt,
    confirmedBy: '设计师',
    decision: { source: '路演唯一人工确认', scope: ['项目目标', '核心约束', '设计原则'] },
  } : checkpoint);
  next.decisions = [...(next.decisions || []), {
    id: newEntityId('decision'),
    type: 'project-definition-confirmation',
    decidedBy: 'designer',
    decidedAt: confirmedAt,
    milestoneVersion: BLUEPRINT_MILESTONES.DIRECTION_CONFIRMED,
    summary: '设计师确认项目目标、核心约束与设计原则',
  }];
  next.changeLog = [{
    id: newEntityId('change'),
    sourceAgent: '设计师',
    modifiedAt: confirmedAt,
    reason: '确认项目目标、核心约束与设计原则',
    confirmationStatus: '已确认',
    version: revision,
    milestoneVersion: BLUEPRINT_MILESTONES.DIRECTION_CONFIRMED,
    fields: ['chapters.projectDefinition.explicitGoals', 'chapters.projectDefinition.constraints', 'chapters.projectDefinition.designPrinciples'],
  }, ...(next.changeLog || [])];
  return {
    blueprint: next,
    changeSet: {
      added: ['decisions.project-definition-confirmation'],
      updated: ['chapters.projectDefinition.explicitGoals', 'chapters.projectDefinition.constraints', 'chapters.projectDefinition.designPrinciples'],
      removed: [],
    },
    version: {
      milestoneVersion: BLUEPRINT_MILESTONES.DIRECTION_CONFIRMED,
      revision,
      createdAt: confirmedAt,
      createdBy: 'designer',
      title: '设计方向已确认',
      summary: '设计师确认项目目标、核心约束与设计原则',
      changedSections: ['项目目标', '核心约束', '设计原则'],
    },
  };
}
