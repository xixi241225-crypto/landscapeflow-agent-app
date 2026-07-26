import {
  BLUEPRINT_ITEM_STATUS,
  BLUEPRINT_MILESTONES,
  BLUEPRINT_SCHEMA_VERSION,
  CHECKPOINTS,
  cloneBlueprint,
  newEntityId,
} from './blueprintModel.js';

const MIGRATION_ID = 'legacy-flat-to-chapters-v2';
const CONCEPT_MIGRATION_ID = 'legacy-concepts-to-chapter-v2';
const FACT_KEY_MIGRATION_ID = 'project-fact-keys-v2';
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

function normalizeCheckpoints(checkpoints) {
  const existing = Array.isArray(checkpoints) ? checkpoints : [];
  const legacyFinalCheckpoint = existing.find((checkpoint) => (
    checkpoint.id === 'checkpoint-4' && checkpoint.afterAgent === 6
  ));
  return CHECKPOINTS.map((definition) => ({
    status: '未到达',
    confirmedAt: null,
    confirmedBy: null,
    decision: null,
    ...(existing.find((checkpoint) => checkpoint.id === definition.id && checkpoint.afterAgent === definition.afterAgent)
      || (definition.id === 'checkpoint-5' && legacyFinalCheckpoint
        ? { ...legacyFinalCheckpoint, id: 'checkpoint-5' }
        : {})),
    ...definition,
  }));
}

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
    ...(item?.key ? { key: item.key } : {}),
    label: item?.label || item?.title || fallbackLabel,
    value,
    status: englishStatus(item?.status),
    sourceRefs: item?.sourceRefs || (item?.source ? [{ fileId: '', fileName: item.source, location: '' }] : []),
    confidence: item?.confidence ?? (englishStatus(item?.status) === BLUEPRINT_ITEM_STATUS.CONFIRMED ? 0.95 : 0.72),
    updatedBy: item?.updatedBy || item?._meta?.sourceAgent || 'migration',
    updatedAt: item?.updatedAt || item?._meta?.modifiedAt || new Date().toISOString(),
  };
};

function normalizeFactKeys(facts, migrationNotes = []) {
  if (!facts) return facts;
  if (!Array.isArray(facts) && typeof facts === 'object') {
    return Object.fromEntries(Object.entries(facts).map(([objectKey, record]) => [
      objectKey,
      { ...record, key: record?.key || objectKey },
    ]));
  }
  if (!Array.isArray(facts)) return facts;
  return facts.map((record) => {
    if (record?.key) return record;
    const knownKey = FACT_KEYS_BY_LABEL[record?.label];
    if (knownKey) return { ...record, key: knownKey };
    migrationNotes.push(`项目事实“${record?.label || record?.id || '未命名'}”无法安全确定 key，保留原数据。`);
    return record;
  });
}

function normalizeLegacyConcept(candidate, index) {
  const code = candidate.code || candidate.id || String.fromCharCode(65 + index);
  const id = String(candidate.id || '').startsWith('concept-') ? candidate.id : `concept-${code}`;
  const legacyVisual = candidate.referenceVisual || candidate.visual || null;
  return {
    id,
    code,
    name: candidate.name || `概念方向 ${code}`,
    status: 'candidate',
    proposition: candidate.proposition || candidate.concept || candidate.narrative || '',
    narrative: candidate.narrative || candidate.concept || '',
    strategicFocus: candidate.strategicFocus || candidate.strategy || candidate.concept || '',
    spatialHypothesis: candidate.spatialHypothesis || candidate.spatialStructure || '',
    experienceIntent: candidate.experienceIntent || candidate.concept || '',
    targetUsers: Array.isArray(candidate.targetUsers) ? candidate.targetUsers : candidate.targetUsers ? [candidate.targetUsers] : [],
    keyScenes: candidate.keyScenes || candidate.sceneFeatures || [],
    differentiationTags: candidate.differentiationTags || [],
    responseMappings: candidate.responseMappings || [],
    advantages: candidate.advantages || [],
    risks: candidate.risks || [],
    applicableConditions: candidate.applicableConditions || (candidate.fit ? [candidate.fit] : []),
    dependencies: candidate.dependencies || [],
    conceptDiagramBrief: candidate.conceptDiagramBrief || { purpose: '旧版概念图解任务待补充', mustShow: [], avoid: [] },
    referenceVisual: legacyVisual ? {
      assetId: legacyVisual.assetId || legacyVisual.id || `legacy-concept-${code}`,
      url: legacyVisual.url || '',
      title: legacyVisual.title || `${candidate.name || code}意向素材`,
      assetType: legacyVisual.assetType || '概念意向素材',
      aspectRatio: legacyVisual.aspectRatio || '16:9',
      status: legacyVisual.status || 'demo-reference',
      source: legacyVisual.source || 'legacy-demo-asset',
      isDemoAsset: legacyVisual.isDemoAsset ?? true,
    } : null,
    generatedBy: candidate.generatedBy || 'legacy-migration',
    generatedAt: candidate.generatedAt || candidate?._meta?.modifiedAt || '',
    migrationStatus: candidate.responseMappings?.length ? 'mapped' : 'pending',
  };
}

function legacyConceptChapter(blueprint) {
  const candidates = Array.isArray(blueprint.conceptCandidates) ? blueprint.conceptCandidates : [];
  if (!candidates.length) return null;
  return {
    agentId: 'agent-2',
    agentName: '概念生成',
    generatedFromVersion: blueprint.agentRuns?.[2]?.blueprintVersionRead || 'legacy',
    generatedAt: blueprint.agentRuns?.[2]?.lastRunAt || '',
    generationRequest: { value: '', source: 'legacy', status: BLUEPRINT_ITEM_STATUS.PENDING },
    inputRefs: { facts: [], goals: [], siteConditions: [], constraints: [], designPrinciples: [], successCriteria: [], openItems: [] },
    sharedRequirements: [],
    conceptCandidates: candidates.map(normalizeLegacyConcept),
    unresolvedDependencies: [],
    qualityChecks: {
      candidateCount: candidates.length,
      allMappedToBlueprint: candidates.every((item) => item.responseMappings?.length),
      strategicallyDifferentiated: null,
      containsRecommendation: false,
      containsScoring: false,
      migrationStatus: 'pending',
    },
    status: 'migrated',
  };
}

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
    conceptGeneration: legacyConceptChapter(blueprint),
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
    visualExpression: blueprint.visualTasks?.length ? {
      visualTasks: blueprint.visualTasks,
      analysisAssets: blueprint.analysisAssets || [],
      visualCandidates: blueprint.visualCandidates || [],
      selectedVisuals: blueprint.selectedVisuals || [],
      visualReview: blueprint.visualReview || null,
      visualAssets: blueprint.visualAssets,
    } : null,
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
    const migrationNotes = [];
    const migratedConcepts = existingBlueprint.chapters.conceptGeneration || legacyConceptChapter(existingBlueprint);
    const hadLegacyConcepts = !existingBlueprint.chapters.conceptGeneration && Boolean(migratedConcepts);
    const keyedFacts = normalizeFactKeys(existingBlueprint.chapters.projectDefinition?.facts, migrationNotes);
    const keyChanged = JSON.stringify(keyedFacts) !== JSON.stringify(existingBlueprint.chapters.projectDefinition?.facts);
    const migrationEntries = [...(existingBlueprint.changeLog || [])];
    const migratedAt = new Date().toISOString();
    if (hadLegacyConcepts && !migrationEntries.some((entry) => entry.migrationId === CONCEPT_MIGRATION_ID)) {
      migrationEntries.unshift({
        id: newEntityId('change'),
        sourceAgent: '系统迁移',
        modifiedAt: migratedAt,
        reason: '旧顶层 conceptCandidates 已迁移到 chapters.conceptGeneration；未自动生成不存在的蓝本响应关系。',
        confirmationStatus: '待确认',
        version: existingBlueprint.revision ?? existingBlueprint.currentVersion ?? 0,
        fields: ['chapters.conceptGeneration'],
        migrationId: CONCEPT_MIGRATION_ID,
      });
    }
    if ((keyChanged || migrationNotes.length) && !migrationEntries.some((entry) => entry.migrationId === FACT_KEY_MIGRATION_ID)) {
      migrationEntries.unshift({
        id: newEntityId('change'),
        sourceAgent: '系统迁移',
        modifiedAt: migratedAt,
        reason: `补齐项目事实稳定 key。${migrationNotes.join('')}`,
        confirmationStatus: '待确认',
        version: existingBlueprint.revision ?? existingBlueprint.currentVersion ?? 0,
        fields: ['chapters.projectDefinition.facts'],
        migrationId: FACT_KEY_MIGRATION_ID,
      });
    }
    const normalized = {
      ...existingBlueprint,
      blueprintId: existingBlueprint.blueprintId || existingBlueprint.id,
      revision: existingBlueprint.revision ?? existingBlueprint.currentVersion ?? 0,
      milestoneVersion: inferMilestone(existingBlueprint),
      stage: existingBlueprint.stage || 'project-input',
      status: existingBlueprint.status || 'draft',
      updatedBy: existingBlueprint.updatedBy || 'system',
      project: existingBlueprint.project || null,
      projectFacts: existingBlueprint.projectFacts || { confirmed: [], measurements: [], observations: [] },
      designPreferences: existingBlueprint.designPreferences || [],
      designerJudgments: existingBlueprint.designerJudgments || [],
      pendingVerification: existingBlueprint.pendingVerification || [],
      sourceRefs: existingBlueprint.sourceRefs || [],
      demoPolicies: existingBlueprint.demoPolicies || {},
      decisions: existingBlueprint.decisions || [],
      agentExecutions: existingBlueprint.agentExecutions || [],
      analysisAssets: existingBlueprint.analysisAssets || [],
      visualCandidates: existingBlueprint.visualCandidates || [],
      selectedVisuals: existingBlueprint.selectedVisuals || [],
      visualReview: existingBlueprint.visualReview || {
        status: existingBlueprint.visualTasks?.length ? 'pending' : 'notStarted',
        checkpointId: 'checkpoint-4',
        confirmedAt: null,
        confirmedBy: null,
        sourceBlueprintRevision: null,
      },
      checkpoints: normalizeCheckpoints(existingBlueprint.checkpoints),
      deliverableArtifacts: {
        ...(existingBlueprint.deliverableArtifacts || {}),
        designStatement: existingBlueprint.deliverableArtifacts?.designStatement || null,
        presentation: existingBlueprint.deliverableArtifacts?.presentation || null,
      },
      presentationSummary: existingBlueprint.presentationSummary || null,
      chapters: {
        projectDefinition: existingBlueprint.chapters.projectDefinition
          ? { ...existingBlueprint.chapters.projectDefinition, facts: keyedFacts }
          : null,
        conceptGeneration: migratedConcepts ?? null,
        schemeDecision: existingBlueprint.chapters.schemeDecision ?? null,
        spatialDevelopment: existingBlueprint.chapters.spatialDevelopment ?? null,
        visualExpression: existingBlueprint.chapters.visualExpression ?? null,
        deliverables: existingBlueprint.chapters.deliverables ?? null,
      },
      changeLog: migrationEntries,
    };
    delete normalized.conceptCandidates;
    return normalized;
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
    next.project = next.project || null;
    next.projectFacts = next.projectFacts || { confirmed: [], measurements: [], observations: [] };
    next.designPreferences = next.designPreferences || [];
    next.designerJudgments = next.designerJudgments || [];
    next.pendingVerification = next.pendingVerification || [];
    next.sourceRefs = next.sourceRefs || [];
    next.demoPolicies = next.demoPolicies || {};
    next.chapters = legacyChapters(next, projectDefinition);
    delete next.conceptCandidates;
    next.decisions = next.decisions || [];
    next.agentExecutions = next.agentExecutions || [];
    next.analysisAssets = next.analysisAssets || [];
    next.visualCandidates = next.visualCandidates || [];
    next.selectedVisuals = next.selectedVisuals || [];
    next.visualReview = next.visualReview || {
      status: next.visualTasks?.length ? 'pending' : 'notStarted',
      checkpointId: 'checkpoint-4',
      confirmedAt: null,
      confirmedBy: null,
      sourceBlueprintRevision: null,
    };
    next.deliverableArtifacts = {
      ...(next.deliverableArtifacts || {}),
      designStatement: next.deliverableArtifacts?.designStatement || null,
      presentation: next.deliverableArtifacts?.presentation || null,
    };
    next.presentationSummary = next.presentationSummary || null;
    next.checkpoints = normalizeCheckpoints(next.checkpoints);
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

export { CONCEPT_MIGRATION_ID, FACT_KEY_MIGRATION_ID, MIGRATION_ID };
