import {
  BLUEPRINT_ITEM_STATUS,
  BLUEPRINT_MILESTONES,
  BLUEPRINT_SCHEMA_VERSION,
  CHECKPOINTS,
  cloneBlueprint,
  newEntityId,
} from './blueprintModel.js';

const MIGRATION_ID = 'legacy-flat-to-chapters-v2';

const englishStatus = (status) => {
  if (['confirmed', 'assumption', 'pending', 'conflict'].includes(status)) return status;
  if (status === '已确认') return BLUEPRINT_ITEM_STATUS.CONFIRMED;
  if (status === '系统假设' || status === 'AI建议') return BLUEPRINT_ITEM_STATUS.ASSUMPTION;
  if (status === '存在冲突') return BLUEPRINT_ITEM_STATUS.CONFLICT;
  return BLUEPRINT_ITEM_STATUS.PENDING;
};

const asItem = (item, index, prefix, fallbackLabel) => {
  const value = item?.value ?? item?.title ?? item?.label ?? item ?? '';
  return {
    id: item?.id || `${prefix}-${String(index + 1).padStart(2, '0')}`,
    label: item?.label || item?.title || fallbackLabel,
    value,
    status: englishStatus(item?.status),
    sourceRefs: item?.sourceRefs || (item?.source ? [{ fileId: '', fileName: item.source, location: '' }] : []),
    confidence: item?.confidence ?? (englishStatus(item?.status) === BLUEPRINT_ITEM_STATUS.CONFIRMED ? 0.95 : 0.72),
    updatedBy: item?.updatedBy || item?._meta?.sourceAgent || 'migration',
    updatedAt: item?.updatedAt || item?._meta?.modifiedAt || new Date().toISOString(),
  };
};

const list = (items, prefix, label) => (Array.isArray(items) ? items : []).map((item, index) => asItem(item, index, prefix, label));

function inferMilestone(blueprint) {
  if (blueprint.milestoneVersion) return blueprint.milestoneVersion;
  const done = (id) => blueprint.agentRuns?.[id]?.status === 'done';
  if (done(6)) return BLUEPRINT_MILESTONES.DELIVERABLES_READY;
  if (done(5)) return BLUEPRINT_MILESTONES.VISUALS_PREPARED;
  if (done(4)) return BLUEPRINT_MILESTONES.SPACE_DEVELOPED;
  if (done(3)) return BLUEPRINT_MILESTONES.SCHEME_SELECTED;
  if (done(2)) return BLUEPRINT_MILESTONES.CONCEPTS_GENERATED;
  if (blueprint.checkpoints?.find((item) => item.id === 'checkpoint-1')?.status === '已确认') return BLUEPRINT_MILESTONES.DIRECTION_CONFIRMED;
  if (done(1)) return BLUEPRINT_MILESTONES.PROJECT_DEFINED;
  return BLUEPRINT_MILESTONES.DRAFT;
}

function legacyProjectDefinition(blueprint) {
  const basic = blueprint.projectBasicInfo || {};
  const factSeed = {
    projectName: ['项目名称', basic.projectName],
    location: ['项目地点', basic.city],
    area: ['项目面积', basic.area],
    projectType: ['项目类型', basic.projectType],
    designStage: ['设计阶段', basic.designStage],
    budgetCondition: ['预算条件', basic.budgetCondition],
  };
  const facts = Object.fromEntries(Object.entries(factSeed)
    .filter(([, [, value]]) => String(value || '').trim())
    .map(([key, [label, value]], index) => [key, asItem({ id: `fact-${String(index + 1).padStart(2, '0')}`, key, label, value, status: '已确认', source: '项目条件表单' }, index, 'fact', label)]));
  (blueprint.confirmedFacts || []).forEach((item, index) => {
    const key = Object.entries(factSeed).find(([, [label]]) => label === item.label)?.[0] || `legacyFact${index + 1}`;
    facts[key] = { ...asItem(item, index, 'fact', item.label || '项目事实'), key };
  });
  const legacyStrategies = blueprint.strategies || blueprint.designBlueprint?.strategies || [];
  return {
    facts,
    stakeholders: basic.targetUsers
      ? String(basic.targetUsers).split(/[、,，]/).filter(Boolean).map((value, index) => asItem({ label: '主要使用者', value, status: '已确认', source: '项目条件表单' }, index, 'stakeholder', '主要使用者'))
      : [],
    explicitGoals: list(blueprint.explicitRequirements, 'goal', '项目目标').length
      ? list(blueprint.explicitRequirements, 'goal', '项目目标')
      : String(basic.designGoals || '').split(/[；;。]/).filter(Boolean).map((value, index) => asItem({ label: '显性目标', value, status: '待确认', source: '项目条件表单' }, index, 'goal', '显性目标')),
    latentGoals: list(blueprint.latentGoals, 'latent-goal', '深层诉求'),
    siteConditions: {
      existingAssets: [],
      existingProblems: list(blueprint.siteConditions, 'site-problem', '场地条件'),
      surroundings: [],
      climateAndEcology: [],
      accessAndMobility: [],
      terrainAndWater: [],
      interfaces: [],
    },
    constraints: list(blueprint.designConstraints, 'constraint', '核心约束').length
      ? list(blueprint.designConstraints, 'constraint', '核心约束')
      : String(basic.constraints || '').split(/[；;。]/).filter(Boolean).map((value, index) => asItem({ label: '核心约束', value, status: '待确认', source: '项目条件表单' }, index, 'constraint', '核心约束')),
    designPrinciples: legacyStrategies.map((value, index) => asItem({ label: '设计原则', value, status: '系统假设', source: '旧版设计策略字段' }, index, 'principle', '设计原则')),
    successCriteria: [],
    coreQuestions: list(blueprint.coreDesignQuestions, 'question', '核心设计问题'),
    openItems: list(blueprint.unconfirmedInfo, 'open-item', '待补充事项'),
    conflicts: [],
    sourceDocuments: (blueprint.informationSources || []).map((item, index) => ({
      id: item.id || `source-${String(index + 1).padStart(2, '0')}`,
      fileName: item.name || item.fileName || '旧版资料来源',
      fileType: item.type || '未知',
      status: item.status === '已确认' ? '已读取' : '已上传，待内容解析',
      detail: item.detail || '',
    })),
  };
}

function legacyChapters(blueprint, projectDefinition) {
  return {
    projectDefinition,
    conceptGeneration: blueprint.conceptCandidates?.length ? { conceptCandidates: blueprint.conceptCandidates } : null,
    schemeDecision: blueprint.comparison || blueprint.agentRecommendation ? {
      comparison: blueprint.comparison,
      agentRecommendation: blueprint.agentRecommendation,
      designerDecision: blueprint.designerDecision,
    } : null,
    spatialDevelopment: blueprint.spatialStructure ? {
      coreNarrative: blueprint.coreNarrative,
      spatialStructure: blueprint.spatialStructure,
      functionalZones: blueprint.functionalZones,
      circulationStrategy: blueprint.circulationStrategy,
      professionalStrategies: blueprint.professionalStrategies,
      featureNodes: blueprint.featureNodes,
    } : null,
    visualExpression: blueprint.visualTasks?.length ? { visualTasks: blueprint.visualTasks, visualAssets: blueprint.visualAssets } : null,
    deliverables: blueprint.pptOutline?.length ? {
      schemeNarrative: blueprint.schemeNarrative,
      pptOutline: blueprint.pptOutline,
      qualityReview: blueprint.qualityReview,
      outputArtifacts: blueprint.outputArtifacts,
    } : null,
  };
}

export function migrateBlueprintToV2(existingBlueprint) {
  if (!existingBlueprint || typeof existingBlueprint !== 'object') return existingBlueprint;
  if (existingBlueprint.schemaVersion === BLUEPRINT_SCHEMA_VERSION && existingBlueprint.chapters?.projectDefinition !== undefined) {
    return {
      ...existingBlueprint,
      blueprintId: existingBlueprint.blueprintId || existingBlueprint.id,
      revision: existingBlueprint.revision ?? existingBlueprint.currentVersion ?? 0,
      milestoneVersion: inferMilestone(existingBlueprint),
      stage: existingBlueprint.stage || 'project-input',
      status: existingBlueprint.status || 'draft',
      updatedBy: existingBlueprint.updatedBy || 'system',
      decisions: existingBlueprint.decisions || [],
      agentExecutions: existingBlueprint.agentExecutions || [],
      chapters: {
        projectDefinition: existingBlueprint.chapters.projectDefinition ?? null,
        conceptGeneration: existingBlueprint.chapters.conceptGeneration ?? null,
        schemeDecision: existingBlueprint.chapters.schemeDecision ?? null,
        spatialDevelopment: existingBlueprint.chapters.spatialDevelopment ?? null,
        visualExpression: existingBlueprint.chapters.visualExpression ?? null,
        deliverables: existingBlueprint.chapters.deliverables ?? null,
      },
    };
  }
  try {
    const next = cloneBlueprint(existingBlueprint);
    const migratedAt = new Date().toISOString();
    const projectDefinition = legacyProjectDefinition(next);
    next.schemaVersion = BLUEPRINT_SCHEMA_VERSION;
    next.blueprintId = next.blueprintId || next.id || newEntityId('blueprint');
    next.revision = next.revision ?? next.currentVersion ?? 0;
    next.currentVersion = next.revision;
    next.milestoneVersion = inferMilestone(next);
    next.stage = next.stage || (next.milestoneVersion === 'v0' ? 'project-input' : 'project-definition');
    next.status = next.status || 'draft';
    next.updatedBy = next.updatedBy || 'migration';
    next.chapters = legacyChapters(next, projectDefinition);
    next.decisions = next.decisions || [];
    next.agentExecutions = next.agentExecutions || [];
    next.checkpoints = next.checkpoints || CHECKPOINTS.map((item) => ({ ...item, status: '未到达', confirmedAt: null, confirmedBy: null, decision: null }));
    next.migratedFrom = {
      schemaVersion: existingBlueprint.schemaVersion || 'legacy',
      migrationId: MIGRATION_ID,
      migratedAt,
    };
    next.changeLog = next.changeLog || [];
    next.changeLog.unshift({
      id: newEntityId('change'),
      sourceAgent: '系统迁移',
      modifiedAt: migratedAt,
      reason: '旧版 Blueprint 兼容迁移：goals、constraints、strategies 等字段映射到 chapters.projectDefinition；原 strategies 作为设计原则迁移。',
      confirmationStatus: '待确认',
      version: next.revision,
      fields: ['chapters.projectDefinition'],
      migrationId: MIGRATION_ID,
    });
    return next;
  } catch (error) {
    console.error('Blueprint v2 迁移失败，已保留原始数据：', error);
    return existingBlueprint;
  }
}

export { MIGRATION_ID };
