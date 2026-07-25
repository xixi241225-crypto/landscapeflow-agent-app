export const BLUEPRINT_SCHEMA_VERSION = '2.0';

export const BLUEPRINT_ITEM_STATUS = {
  CONFIRMED: 'confirmed',
  ASSUMPTION: 'assumption',
  PENDING: 'pending',
  CONFLICT: 'conflict',
};

export const DESIGN_STATEMENT_REVIEW_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  NEEDS_REVISION: 'needsRevision',
};

export const BLUEPRINT_MILESTONES = {
  DRAFT: 'v0',
  PROJECT_DEFINED: 'v1',
  DIRECTION_CONFIRMED: 'v2',
  CONCEPTS_GENERATED: 'v3',
  SCHEME_SELECTED: 'v4',
  SPACE_DEVELOPED: 'v5',
  VISUALS_PREPARED: 'v6',
  DELIVERABLES_READY: 'v7',
};

export const CONTENT_STATUS = {
  CONFIRMED: '已确认',
  AI_SUGGESTED: 'AI建议',
  ASSUMPTION: '系统假设',
  PENDING: '待确认',
  INVALID: '已失效',
  REJECTED: '已否定',
};

export const AGENTS = [
  { id: 1, name: '前期分析', checkpointId: 'checkpoint-1' },
  { id: 2, name: '概念生成' },
  { id: 3, name: '方案比选', checkpointId: 'checkpoint-2' },
  { id: 4, name: '空间推演', checkpointId: 'checkpoint-3' },
  { id: 5, name: '视觉表达', checkpointId: 'checkpoint-4' },
  { id: 6, name: '成果输出', checkpointId: 'checkpoint-5' },
];

export const CHECKPOINTS = [
  { id: 'checkpoint-1', order: 1, afterAgent: 1, name: '项目理解确认', description: '确认项目事实、目标、约束、缺口、假设和核心问题。' },
  { id: 'checkpoint-2', order: 2, afterAgent: 3, name: '方案方向决策', description: '由设计师选择方案方向，并记录融合要求和修改意见。' },
  { id: 'checkpoint-3', order: 3, afterAgent: 4, name: '设计说明书分项确认', description: '设计师逐项复核 Design Statement（含六项专业策略），通过或提出专业修改意见。' },
  { id: 'checkpoint-4', order: 4, afterAgent: 5, name: '视觉方案挑选', description: '设计师比较视觉候选，选择采用方向并记录专业判断理由。' },
  { id: 'checkpoint-5', order: 5, afterAgent: 6, name: '成果交付复核', description: '复核图文、数据、假设、视觉偏离和成果完整性。' },
];

const now = () => new Date().toISOString();
const makeId = (prefix = 'item') => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

export function createBlueprint(formData = {}, projectId = makeId('project')) {
  const createdAt = now();
  const blueprintId = makeId('blueprint');
  return {
    id: blueprintId,
    blueprintId,
    projectId,
    schemaVersion: BLUEPRINT_SCHEMA_VERSION,
    revision: 0,
    milestoneVersion: BLUEPRINT_MILESTONES.DRAFT,
    stage: 'project-input',
    status: 'draft',
    updatedBy: 'designer',
    currentVersion: 0,
    createdAt,
    updatedAt: createdAt,
    chapters: {
      projectDefinition: null,
      conceptGeneration: null,
      schemeDecision: null,
      spatialDevelopment: null,
      visualExpression: null,
      deliverables: null,
    },
    project: null,
    projectFacts: {
      confirmed: [],
      measurements: [],
      observations: [],
    },
    designPreferences: [],
    designerJudgments: [],
    pendingVerification: [],
    sourceRefs: [],
    demoPolicies: {},
    decisions: [],
    agentExecutions: [],
    projectBasicInfo: {
      projectName: formData.projectName || '',
      city: formData.city || '',
      area: formData.area || '',
      projectType: formData.projectType || '',
      targetUsers: formData.targetUsers || '',
      designGoals: formData.designGoals || '',
      constraints: formData.constraints || '',
      stylePreference: formData.stylePreference || '',
      maintenance: formData.maintenance || '',
      clientFocus: formData.clientFocus || '',
      designStage: formData.designStage || '',
      deliveryDate: formData.deliveryDate || '',
      budgetCondition: formData.budgetCondition || '',
      presentationAudience: formData.presentationAudience || '',
      areaEvidenceType: formData.areaEvidenceType || '',
      areaStatus: formData.areaStatus || '',
      areaConfidence: formData.areaConfidence || '',
      demoProjectInput: formData.demoProjectInput || null,
      siteFiles: formData.siteFiles || [],
      status: CONTENT_STATUS.PENDING,
      _meta: makeMeta('设计师输入', '创建项目草稿', 0, CONTENT_STATUS.PENDING),
    },
    confirmedFacts: [],
    explicitRequirements: [],
    latentGoals: [],
    siteConditions: [],
    deliverableRequirements: [],
    informationSources: [],
    unconfirmedInfo: [],
    systemAssumptions: [],
    designConstraints: [],
    coreDesignQuestions: [],
    comparison: null,
    agentRecommendation: null,
    designerDecision: {
      selectedConceptId: '',
      acceptedRecommendation: false,
      fusionRequirements: '',
      modificationNotes: '',
      decisionReason: '',
      status: CONTENT_STATUS.PENDING,
      _meta: makeMeta('设计师', '等待方案方向决策', 0, CONTENT_STATUS.PENDING),
    },
    coreNarrative: null,
    spatialStructure: null,
    functionalZones: [],
    circulationStrategy: null,
    professionalStrategies: {
      plant: null,
      material: null,
      ecology: null,
      grading: null,
      drainage: null,
      operations: null,
    },
    featureNodes: [],
    visualTasks: [],
    analysisAssets: [],
    visualCandidates: [],
    selectedVisuals: [],
    visualReview: {
      status: 'notStarted',
      checkpointId: 'checkpoint-4',
      confirmedAt: null,
      confirmedBy: null,
      sourceBlueprintRevision: null,
    },
    visualAssets: [],
    schemeNarrative: null,
    pptOutline: [],
    pptStructure: [],
    qualityReview: [],
    risks: [],
    nextTasks: [],
    outputArtifacts: [],
    deliverableArtifacts: {
      designStatement: null,
    },
    checkpoints: CHECKPOINTS.map((checkpoint) => ({
      ...checkpoint,
      status: '未到达',
      confirmedAt: null,
      confirmedBy: null,
      decision: null,
    })),
    currentCheckpoint: null,
    changeLog: [{
      id: makeId('change'),
      sourceAgent: '系统',
      modifiedAt: createdAt,
      reason: '创建项目草稿',
      confirmationStatus: CONTENT_STATUS.PENDING,
      version: 0,
      fields: ['projectBasicInfo'],
    }],
    invalidatedOutputs: [],
    agentRuns: Object.fromEntries(AGENTS.map((agent) => [agent.id, {
      agentId: agent.id,
      agentName: agent.name,
      status: 'pending',
      lastRunAt: null,
      blueprintVersionRead: null,
      blueprintVersionWritten: null,
    }])),
    officialPackageStatus: '演示方案进行中',
  };
}

export function makeMeta(sourceAgent, reason, version, confirmationStatus) {
  return {
    sourceAgent,
    modifiedAt: now(),
    reason,
    confirmationStatus,
    version,
  };
}

export function getRecordValue(record, fallback = '') {
  if (record == null) return fallback;
  if (Object.prototype.hasOwnProperty.call(record, 'value')) return record.value;
  return record;
}

export function getBlueprintStatusCounts(blueprint) {
  const counts = {
    [CONTENT_STATUS.CONFIRMED]: 0,
    [CONTENT_STATUS.AI_SUGGESTED]: 0,
    [CONTENT_STATUS.ASSUMPTION]: 0,
    [CONTENT_STATUS.PENDING]: 0,
    [CONTENT_STATUS.INVALID]: 0,
  };
  const visited = new WeakSet();
  const walk = (value) => {
    if (!value || typeof value !== 'object' || visited.has(value)) return;
    visited.add(value);
    const normalizedStatus = {
      confirmed: CONTENT_STATUS.CONFIRMED,
      assumption: CONTENT_STATUS.ASSUMPTION,
      pending: CONTENT_STATUS.PENDING,
      conflict: CONTENT_STATUS.PENDING,
    }[value.status] || value.status;
    if (normalizedStatus && counts[normalizedStatus] !== undefined) counts[normalizedStatus] += 1;
    if (Array.isArray(value)) value.forEach(walk);
    else Object.entries(value).forEach(([key, child]) => {
      if (!['_meta', 'changeLog'].includes(key)) walk(child);
    });
  };
  walk(blueprint);
  return counts;
}

export function cloneBlueprint(value) {
  return JSON.parse(JSON.stringify(value));
}

export function newEntityId(prefix) {
  return makeId(prefix);
}
