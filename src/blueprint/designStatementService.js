import {
  BLUEPRINT_ITEM_STATUS,
  CONTENT_STATUS,
  DESIGN_STATEMENT_REVIEW_STATUS,
  cloneBlueprint,
  makeMeta,
  newEntityId,
} from './blueprintModel.js';
import { invalidateDownstream } from './blueprintService.js';
import { selectConceptCandidate } from './blueprintSelectors.js';

const now = () => new Date().toISOString();

const CONTENT_STATUS_VALUES = new Set(Object.values(BLUEPRINT_ITEM_STATUS));
const copyValue = (value) => (value === undefined ? null : cloneBlueprint(value));

function text(value, fallback = '') {
  if (value == null) return fallback;
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  return String(value.value || value.title || value.name || fallback);
}

function getPathValue(source, path) {
  return String(path || '').split('.').reduce((value, key) => value?.[key], source);
}

function setPathValue(target, path, value) {
  const keys = String(path || '').split('.');
  const lastKey = keys.pop();
  let cursor = target;
  keys.forEach((key) => {
    cursor[key] = Array.isArray(cursor[key]) ? [...cursor[key]] : { ...(cursor[key] || {}) };
    cursor = cursor[key];
  });
  cursor[lastKey] = copyValue(value);
}

function collectStatuses(value, result = []) {
  if (!value || typeof value !== 'object') return result;
  if (value.status) result.push(value.status);
  if (value._meta?.confirmationStatus) result.push(value._meta.confirmationStatus);
  if (Array.isArray(value)) value.forEach((item) => collectStatuses(item, result));
  else Object.entries(value).forEach(([key, child]) => {
    if (!['status', '_meta'].includes(key)) collectStatuses(child, result);
  });
  return result;
}

function normalizedContentStatus(status) {
  if (CONTENT_STATUS_VALUES.has(status)) return status;
  if ([CONTENT_STATUS.CONFIRMED, '已确认'].includes(status)) return BLUEPRINT_ITEM_STATUS.CONFIRMED;
  if ([CONTENT_STATUS.ASSUMPTION, CONTENT_STATUS.AI_SUGGESTED, '系统假设', 'AI建议'].includes(status)) return BLUEPRINT_ITEM_STATUS.ASSUMPTION;
  if (['存在冲突', 'conflict'].includes(status)) return BLUEPRINT_ITEM_STATUS.CONFLICT;
  return BLUEPRINT_ITEM_STATUS.PENDING;
}

export function deriveDesignStatementContentStatus(sourceValues) {
  const statuses = collectStatuses(sourceValues).map(normalizedContentStatus);
  const serialized = JSON.stringify(sourceValues || '');
  if (statuses.includes(BLUEPRINT_ITEM_STATUS.CONFLICT)) return BLUEPRINT_ITEM_STATUS.CONFLICT;
  if (
    statuses.includes(BLUEPRINT_ITEM_STATUS.PENDING)
    || /待(?:补充|确认|复核|调查|测绘|深化|专项|现状)|需(?:经|待|在).{0,24}(?:确认|复核|调查|校核)|尚未/.test(serialized)
  ) return BLUEPRINT_ITEM_STATUS.PENDING;
  if (statuses.includes(BLUEPRINT_ITEM_STATUS.ASSUMPTION)) return BLUEPRINT_ITEM_STATUS.ASSUMPTION;
  if (statuses.length && statuses.every((status) => status === BLUEPRINT_ITEM_STATUS.CONFIRMED)) {
    return BLUEPRINT_ITEM_STATUS.CONFIRMED;
  }
  return BLUEPRINT_ITEM_STATUS.ASSUMPTION;
}

function selectedConcept(blueprint) {
  return selectConceptCandidate(blueprint, blueprint.designerDecision?.selectedConceptId);
}

function buildCoreNarrative(blueprint) {
  const concept = selectedConcept(blueprint);
  return [
    `设计定位：${blueprint.coreNarrative?.title || concept?.name || '待补充'}`,
    `核心叙事：${text(blueprint.coreNarrative, concept?.proposition || concept?.narrative || '待补充')}`,
    `方案依据：设计师选择 ${concept?.code || concept?.id || '待确认'}｜${concept?.name || '待确认'}。`,
  ].join('\n');
}

function buildSpatialStructure(blueprint) {
  return [
    `空间结构：${blueprint.spatialStructure?.title || '待补充'}`,
    text(blueprint.spatialStructure, '总体空间结构待进一步推演。'),
  ].join('\n');
}

function buildFunctionalZones(blueprint) {
  const zones = blueprint.functionalZones || [];
  return zones.length
    ? zones.slice(0, 5).map((zone) => `${zone.name}｜${zone.area || '面积待复核'}｜${zone.function || '功能待深化'}`).join('\n')
    : '功能分区待进一步推演。';
}

function buildCirculation(blueprint) {
  return [
    `组织方式：${blueprint.circulationStrategy?.title || '待补充'}`,
    text(blueprint.circulationStrategy, '主次游线策略待进一步推演。'),
  ].join('\n');
}

function buildFeatureNodes(blueprint) {
  const nodes = blueprint.featureNodes || [];
  return nodes.length
    ? nodes.slice(0, 5).map((node) => `${node.name}｜${node.value || '节点内容待深化'}`).join('\n')
    : '核心节点与场景待进一步推演。';
}

function buildStrategy(blueprint, key, label) {
  return `${label}：${blueprint.professionalStrategies?.[key] || '待专项深化。'}`;
}

export const DESIGN_STATEMENT_SECTION_DEFINITIONS = {
  coreNarrative: {
    group: 'positioning',
    groupLabel: '定位与原则',
    title: '设计定位与核心叙事',
    sourceFields: ['coreNarrative', 'designerDecision.selectedConceptId', 'chapters.conceptGeneration.conceptCandidates'],
    targetPath: 'coreNarrative',
    impactField: 'coreNarrative',
    buildBody: buildCoreNarrative,
  },
  spatialStructure: {
    group: 'designContent',
    groupLabel: '设计内容',
    title: '总体空间结构',
    sourceFields: ['spatialStructure'],
    targetPath: 'spatialStructure',
    impactField: 'spatialStructure',
    buildBody: buildSpatialStructure,
  },
  functionalZones: {
    group: 'designContent',
    groupLabel: '设计内容',
    title: '功能分区',
    sourceFields: ['functionalZones'],
    targetPath: 'functionalZones',
    impactField: 'functionalZones',
    buildBody: buildFunctionalZones,
  },
  circulation: {
    group: 'designContent',
    groupLabel: '设计内容',
    title: '主次游线',
    sourceFields: ['circulationStrategy'],
    targetPath: 'circulationStrategy',
    impactField: 'circulationStrategy',
    buildBody: buildCirculation,
  },
  featureNodes: {
    group: 'designContent',
    groupLabel: '设计内容',
    title: '核心节点与场景',
    sourceFields: ['featureNodes'],
    targetPath: 'featureNodes',
    impactField: 'featureNodes',
    buildBody: buildFeatureNodes,
  },
  plant: {
    group: 'professionalDesign',
    groupLabel: '专项设计',
    title: '植物策略',
    sourceFields: ['professionalStrategies.plant'],
    targetPath: 'professionalStrategies.plant',
    impactField: 'professionalStrategies',
    buildBody: (blueprint) => buildStrategy(blueprint, 'plant', '植物策略'),
  },
  material: {
    group: 'professionalDesign',
    groupLabel: '专项设计',
    title: '材料策略',
    sourceFields: ['professionalStrategies.material'],
    targetPath: 'professionalStrategies.material',
    impactField: 'professionalStrategies',
    buildBody: (blueprint) => buildStrategy(blueprint, 'material', '材料策略'),
  },
  ecology: {
    group: 'professionalDesign',
    groupLabel: '专项设计',
    title: '生态策略',
    sourceFields: ['professionalStrategies.ecology'],
    targetPath: 'professionalStrategies.ecology',
    impactField: 'professionalStrategies',
    buildBody: (blueprint) => buildStrategy(blueprint, 'ecology', '生态策略'),
  },
  grading: {
    group: 'professionalDesign',
    groupLabel: '专项设计',
    title: '竖向策略',
    sourceFields: ['professionalStrategies.grading'],
    targetPath: 'professionalStrategies.grading',
    impactField: 'professionalStrategies',
    buildBody: (blueprint) => buildStrategy(blueprint, 'grading', '竖向策略'),
  },
  drainage: {
    group: 'professionalDesign',
    groupLabel: '专项设计',
    title: '排水策略',
    sourceFields: ['professionalStrategies.drainage'],
    targetPath: 'professionalStrategies.drainage',
    impactField: 'professionalStrategies',
    buildBody: (blueprint) => buildStrategy(blueprint, 'drainage', '排水策略'),
  },
  operations: {
    group: 'professionalDesign',
    groupLabel: '专项设计',
    title: '运营维护策略',
    sourceFields: ['professionalStrategies.operations'],
    targetPath: 'professionalStrategies.operations',
    impactField: 'professionalStrategies',
    buildBody: (blueprint) => buildStrategy(blueprint, 'operations', '运营维护策略'),
  },
};

function sectionSourceValues(blueprint, definition) {
  return Object.fromEntries(definition.sourceFields.map((path) => [path, copyValue(getPathValue(blueprint, path))]));
}

function compileSection(blueprint, key, previous = null, options = {}) {
  const definition = DESIGN_STATEMENT_SECTION_DEFINITIONS[key];
  if (!definition) throw new Error(`未知设计说明书 section：${key}`);
  const generatedAt = options.generatedAt || now();
  const sourceValues = sectionSourceValues(blueprint, definition);
  return {
    id: previous?.id || `design-statement-${key}`,
    key,
    group: definition.group,
    title: definition.title,
    body: definition.buildBody(blueprint),
    contentStatus: deriveDesignStatementContentStatus(sourceValues),
    reviewStatus: DESIGN_STATEMENT_REVIEW_STATUS.PENDING,
    sourceFields: [...definition.sourceFields],
    sourceRevision: blueprint.revision ?? blueprint.currentVersion ?? 0,
    generatedBy: 'agent-4',
    generatedAt,
    reviewComment: options.reviewComment ?? previous?.reviewComment ?? '',
    reviewedBy: options.reviewedBy ?? previous?.reviewedBy ?? null,
    reviewedAt: options.reviewedAt ?? previous?.reviewedAt ?? null,
    revision: previous ? (previous.revision || 1) + 1 : 1,
  };
}

function statementStatus(sections) {
  if (sections.some((section) => section.reviewStatus === DESIGN_STATEMENT_REVIEW_STATUS.NEEDS_REVISION)) return 'needsRevision';
  if (sections.length && sections.every((section) => section.reviewStatus === DESIGN_STATEMENT_REVIEW_STATUS.APPROVED)) return 'approved';
  return 'inReview';
}

export function buildDesignStatement(blueprint) {
  const next = cloneBlueprint(blueprint);
  const generatedAt = now();
  const sections = Object.keys(DESIGN_STATEMENT_SECTION_DEFINITIONS)
    .map((key) => compileSection(next, key, null, { generatedAt }));
  next.deliverableArtifacts = {
    ...(next.deliverableArtifacts || {}),
    designStatement: {
      id: 'design-statement',
      artifactType: 'design-statement',
      schemaVersion: '1.0',
      statementRevision: 1,
      status: 'inReview',
      generatedBy: 'agent-4',
      generatedAt,
      sourceBlueprintVersion: next.milestoneVersion,
      sourceBlueprintRevision: next.revision ?? next.currentVersion ?? 0,
      reviewedAt: null,
      approvedAt: null,
      sections,
    },
  };
  const latestChange = next.changeLog?.[0];
  if (latestChange?.sourceAgent?.startsWith('Agent 4')) {
    latestChange.fields = [...new Set([...(latestChange.fields || []), 'deliverableArtifacts.designStatement'])];
    latestChange.compiledArtifacts = ['deliverableArtifacts.designStatement'];
  }
  return next;
}

function requireDesignStatement(blueprint) {
  const statement = blueprint.deliverableArtifacts?.designStatement;
  if (!statement?.sections?.length) throw new Error('设计说明书尚未生成');
  return statement;
}

export function reviewDesignStatementSection(blueprint, sectionKey, review) {
  const statement = requireDesignStatement(blueprint);
  const existing = statement.sections.find((section) => section.key === sectionKey);
  if (!existing) throw new Error(`未找到设计说明书 section：${sectionKey}`);
  const reviewStatus = review?.reviewStatus;
  if (![DESIGN_STATEMENT_REVIEW_STATUS.APPROVED, DESIGN_STATEMENT_REVIEW_STATUS.NEEDS_REVISION].includes(reviewStatus)) {
    throw new Error('无效的设计说明书复核状态');
  }
  const submittedComment = String(review?.comment || '').trim();
  if (reviewStatus === DESIGN_STATEMENT_REVIEW_STATUS.NEEDS_REVISION && !submittedComment) {
    throw new Error('选择“需调整”时必须填写专业意见');
  }
  const reviewComment = submittedComment || (
    reviewStatus === DESIGN_STATEMENT_REVIEW_STATUS.APPROVED
      ? existing.reviewComment || ''
      : ''
  );

  const next = cloneBlueprint(blueprint);
  const reviewedAt = now();
  const revision = (next.revision ?? next.currentVersion ?? 0) + 1;
  const traceId = review?.traceId || newEntityId('trace');
  const definition = DESIGN_STATEMENT_SECTION_DEFINITIONS[sectionKey];
  const before = {
    body: existing.body,
    contentStatus: existing.contentStatus,
    reviewStatus: existing.reviewStatus,
    sourceFields: [...existing.sourceFields],
    sourceValues: sectionSourceValues(blueprint, definition),
    sectionRevision: existing.revision,
  };
  const sections = next.deliverableArtifacts.designStatement.sections.map((section) => section.key === sectionKey
    ? {
        ...section,
        reviewStatus,
        reviewComment,
        reviewedBy: review?.reviewedBy || 'designer',
        reviewedAt,
      }
    : section);
  const status = statementStatus(sections);
  next.deliverableArtifacts.designStatement = {
    ...next.deliverableArtifacts.designStatement,
    sections,
    status,
    reviewedAt,
    approvedAt: status === 'approved' ? reviewedAt : null,
  };
  if (reviewStatus === DESIGN_STATEMENT_REVIEW_STATUS.NEEDS_REVISION) {
    next.currentCheckpoint = 'checkpoint-3';
    next.checkpoints = next.checkpoints.map((checkpoint) => checkpoint.id === 'checkpoint-3'
      ? { ...checkpoint, status: '待确认', confirmedAt: null, confirmedBy: null, decision: null }
      : checkpoint);
  }
  next.revision = revision;
  next.currentVersion = revision;
  next.updatedAt = reviewedAt;
  next.updatedBy = 'designer';
  next.changeLog.unshift({
    id: newEntityId('change'),
    type: 'design-statement-section-review',
    traceId,
    action: reviewStatus,
    sourceAgent: '设计师',
    modifiedAt: reviewedAt,
    reason: reviewStatus === DESIGN_STATEMENT_REVIEW_STATUS.APPROVED ? `通过设计说明书分项：${existing.title}` : `要求调整设计说明书分项：${existing.title}`,
    confirmationStatus: reviewStatus,
    version: revision,
    blueprintRevision: revision,
    milestoneVersion: next.milestoneVersion,
    statementRevision: next.deliverableArtifacts.designStatement.statementRevision,
    sectionKey,
    sectionTitle: existing.title,
    comment: submittedComment,
    before,
    fields: [`deliverableArtifacts.designStatement.sections.${sectionKey}.reviewStatus`],
  });
  return { blueprint: next, traceId };
}

export function approvePendingDesignStatementSections(blueprint, reviewedBy = 'designer') {
  const statement = requireDesignStatement(blueprint);
  const pendingKeys = statement.sections
    .filter((section) => section.reviewStatus === DESIGN_STATEMENT_REVIEW_STATUS.PENDING)
    .map((section) => section.key);
  if (!pendingKeys.length) return blueprint;
  const next = cloneBlueprint(blueprint);
  const reviewedAt = now();
  const revision = (next.revision ?? next.currentVersion ?? 0) + 1;
  const sections = next.deliverableArtifacts.designStatement.sections.map((section) => (
    pendingKeys.includes(section.key)
      ? { ...section, reviewStatus: DESIGN_STATEMENT_REVIEW_STATUS.APPROVED, reviewedBy, reviewedAt }
      : section
  ));
  const status = statementStatus(sections);
  next.deliverableArtifacts.designStatement = {
    ...next.deliverableArtifacts.designStatement,
    sections,
    status,
    reviewedAt,
    approvedAt: status === 'approved' ? reviewedAt : null,
  };
  next.revision = revision;
  next.currentVersion = revision;
  next.updatedAt = reviewedAt;
  next.updatedBy = reviewedBy;
  next.changeLog.unshift({
    id: newEntityId('change'),
    type: 'design-statement-bulk-review',
    sourceAgent: '设计师',
    modifiedAt: reviewedAt,
    reason: '通过其余待复核设计说明书分项',
    confirmationStatus: DESIGN_STATEMENT_REVIEW_STATUS.APPROVED,
    version: revision,
    blueprintRevision: revision,
    milestoneVersion: next.milestoneVersion,
    statementRevision: next.deliverableArtifacts.designStatement.statementRevision,
    sectionKeys: pendingKeys,
    fields: pendingKeys.map((key) => `deliverableArtifacts.designStatement.sections.${key}.reviewStatus`),
  });
  return next;
}

function syncSpatialChapter(next, path) {
  const chapter = next.chapters?.spatialDevelopment;
  if (!chapter) return;
  const [root, nested] = path.split('.');
  if (nested) {
    chapter[root] = { ...(chapter[root] || {}), [nested]: cloneBlueprint(getPathValue(next, path)) };
  } else {
    chapter[root] = cloneBlueprint(next[root]);
  }
}

export function regenerateDesignStatementSections(blueprint, scopedResult) {
  const statement = requireDesignStatement(blueprint);
  const updates = scopedResult?.sectionUpdates || [];
  if (!updates.length) throw new Error('Agent 4 未返回任何 scoped section 更新');
  const next = cloneBlueprint(blueprint);
  const startedAt = scopedResult.startedAt || now();
  const completedAt = now();
  const inputRevision = next.revision ?? next.currentVersion ?? 0;
  const outputRevision = inputRevision + 1;
  const statementRevisionBefore = statement.statementRevision || 1;
  const traceId = scopedResult.traceId || newEntityId('trace');
  const before = [];
  const impactFields = [];

  updates.forEach((update) => {
    const definition = DESIGN_STATEMENT_SECTION_DEFINITIONS[update.sectionKey];
    const section = statement.sections.find((item) => item.key === update.sectionKey);
    if (!definition || !section) throw new Error(`无法重新生成未知 section：${update.sectionKey}`);
    if (section.reviewStatus !== DESIGN_STATEMENT_REVIEW_STATUS.NEEDS_REVISION) {
      throw new Error(`${section.title} 尚未标记为需调整`);
    }
    if (update.sourcePath !== definition.targetPath) {
      throw new Error(`${section.title} scoped 更新越权：${update.sourcePath}`);
    }
    before.push({
      sectionKey: update.sectionKey,
      body: section.body,
      sectionRevision: section.revision,
      sourcePath: update.sourcePath,
      sourceValue: copyValue(getPathValue(next, update.sourcePath)),
    });
    setPathValue(next, update.sourcePath, update.value);
    syncSpatialChapter(next, update.sourcePath);
    impactFields.push(definition.impactField);
  });

  next.revision = outputRevision;
  next.currentVersion = outputRevision;
  next.updatedAt = completedAt;
  next.updatedBy = 'agent-4';
  next.agentRuns[4] = {
    ...next.agentRuns[4],
    status: 'done',
    lastRunAt: completedAt,
  };
  if (updates.some((update) => update.sourcePath.startsWith('professionalStrategies.'))) {
    next.professionalStrategies = {
      ...next.professionalStrategies,
      status: next.professionalStrategies.status || CONTENT_STATUS.AI_SUGGESTED,
      _meta: makeMeta('Agent 4｜空间推演', '根据设计师分项意见重新生成专业策略', outputRevision, next.professionalStrategies.status || CONTENT_STATUS.AI_SUGGESTED),
    };
    if (next.chapters?.spatialDevelopment) {
      next.chapters.spatialDevelopment.professionalStrategies = cloneBlueprint(next.professionalStrategies);
    }
  }

  let invalidated = invalidateDownstream(next, [...new Set(impactFields)], 'Agent 4 根据设计师意见更新设计说明书源字段');
  invalidated.currentCheckpoint = 'checkpoint-3';
  invalidated.checkpoints = invalidated.checkpoints.map((checkpoint) => checkpoint.id === 'checkpoint-3'
    ? { ...checkpoint, status: '待确认', confirmedAt: null, confirmedBy: null, decision: null }
    : checkpoint);
  const regeneratedAt = now();
  const updatedKeys = new Set(updates.map((update) => update.sectionKey));
  const sections = invalidated.deliverableArtifacts.designStatement.sections.map((section) => (
    updatedKeys.has(section.key)
      ? compileSection(invalidated, section.key, section, {
          generatedAt: regeneratedAt,
          reviewComment: section.reviewComment,
          reviewedBy: section.reviewedBy,
          reviewedAt: section.reviewedAt,
        })
      : section
  ));
  const statementRevisionAfter = statementRevisionBefore + 1;
  invalidated.deliverableArtifacts.designStatement = {
    ...invalidated.deliverableArtifacts.designStatement,
    statementRevision: statementRevisionAfter,
    status: 'inReview',
    sourceBlueprintVersion: invalidated.milestoneVersion,
    sourceBlueprintRevision: outputRevision,
    generatedAt: regeneratedAt,
    reviewedAt: null,
    approvedAt: null,
    sections,
  };
  const after = updates.map((update) => {
    const section = sections.find((item) => item.key === update.sectionKey);
    return {
      sectionKey: update.sectionKey,
      body: section.body,
      sectionRevision: section.revision,
      sourcePath: update.sourcePath,
      sourceValue: copyValue(getPathValue(invalidated, update.sourcePath)),
    };
  });
  const execution = {
    id: newEntityId('execution'),
    traceId,
    executionType: 'section-regeneration',
    agentId: 'agent-4',
    agentName: '空间推演',
    sectionKeys: updates.map((update) => update.sectionKey),
    trigger: {
      type: 'designer-review',
      comment: scopedResult.comment || '',
    },
    before,
    after,
    inputVersion: blueprint.milestoneVersion,
    outputVersion: invalidated.milestoneVersion,
    inputRevision,
    outputRevision,
    statementRevisionBefore,
    statementRevisionAfter,
    startedAt,
    completedAt,
    readSections: updates.map((update) => update.sourcePath),
    writtenSections: updates.flatMap((update) => [
      update.sourcePath,
      `deliverableArtifacts.designStatement.sections.${update.sectionKey}`,
    ]),
    status: 'completed',
    summary: `Agent 4 已按设计师意见重新生成 ${updates.length} 个设计说明书分项`,
    warnings: [],
    openItemCount: 0,
    conflictCount: 0,
  };
  invalidated.agentExecutions = [...(invalidated.agentExecutions || []), execution];
  invalidated.changeLog.unshift({
    id: newEntityId('change'),
    type: 'design-statement-section-regeneration',
    traceId,
    sourceAgent: 'Agent 4｜空间推演',
    modifiedAt: completedAt,
    reason: '根据设计师意见更新 Blueprint 源字段并重新编译设计说明书分项',
    confirmationStatus: CONTENT_STATUS.AI_SUGGESTED,
    version: outputRevision,
    blueprintRevision: outputRevision,
    milestoneVersion: invalidated.milestoneVersion,
    statementRevision: statementRevisionAfter,
    sectionKeys: updates.map((update) => update.sectionKey),
    before,
    after,
    fields: execution.writtenSections,
  });
  return invalidated;
}

export function canConfirmDesignStatement(blueprint) {
  const statement = blueprint.deliverableArtifacts?.designStatement;
  if (!statement?.sections?.length) return { valid: false, reason: '设计说明书尚未生成' };
  if (['regenerating', 'needsRevision', 'stale'].includes(statement.status)) {
    return { valid: false, reason: '仍有分项需要调整或重新生成' };
  }
  const pending = statement.sections.filter((section) => section.reviewStatus !== DESIGN_STATEMENT_REVIEW_STATUS.APPROVED);
  if (pending.length) return { valid: false, reason: `仍有 ${pending.length} 个分项待复核` };
  return { valid: true, reason: '' };
}
