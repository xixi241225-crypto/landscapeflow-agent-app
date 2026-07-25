import {
  AGENTS,
  BLUEPRINT_MILESTONES,
  CHECKPOINTS,
  CONTENT_STATUS,
  cloneBlueprint,
  makeMeta,
  newEntityId,
} from './blueprintModel.js';
import {
  createBlueprintVersion as createVersionSnapshot,
  restoreBlueprintVersion as restoreVersionSnapshot,
} from './blueprintVersionService.js';

const AGENT_FIELD_OWNERS = {
  1: ['projectBasicInfo', 'confirmedFacts', 'explicitRequirements', 'latentGoals', 'siteConditions', 'deliverableRequirements', 'informationSources', 'unconfirmedInfo', 'systemAssumptions', 'designConstraints', 'coreDesignQuestions', 'risks', 'nextTasks'],
  2: [],
  3: ['comparison', 'agentRecommendation', 'risks', 'nextTasks'],
  4: ['coreNarrative', 'spatialStructure', 'functionalZones', 'circulationStrategy', 'professionalStrategies', 'featureNodes', 'risks', 'nextTasks'],
  5: ['visualTasks', 'analysisAssets', 'visualCandidates', 'visualReview', 'visualAssets', 'qualityReview', 'risks', 'nextTasks'],
  6: ['schemeNarrative', 'pptOutline', 'pptStructure', 'qualityReview', 'outputArtifacts', 'risks', 'nextTasks'],
};

const APPEND_BY_AGENT_FIELDS = new Set(['risks', 'nextTasks', 'qualityReview']);

const AGENT_CHAPTER = {
  1: 'projectDefinition',
  2: 'conceptGeneration',
  3: 'schemeDecision',
  4: 'spatialDevelopment',
  5: 'visualExpression',
  6: 'deliverables',
};

const AGENT_MILESTONE = {
  1: BLUEPRINT_MILESTONES.PROJECT_DEFINED,
  2: BLUEPRINT_MILESTONES.CONCEPTS_GENERATED,
  3: BLUEPRINT_MILESTONES.SCHEME_SELECTED,
  4: BLUEPRINT_MILESTONES.SPACE_DEVELOPED,
  5: BLUEPRINT_MILESTONES.VISUALS_PREPARED,
  6: BLUEPRINT_MILESTONES.DELIVERABLES_READY,
};

const FIELD_IMPACT = {
  projectBasicInfo: [2, 3, 4, 5, 6],
  confirmedFacts: [2, 3, 4, 5, 6],
  explicitRequirements: [2, 3, 4, 5, 6],
  latentGoals: [2, 3, 4, 5, 6],
  siteConditions: [2, 3, 4, 5, 6],
  deliverableRequirements: [2, 3, 4, 5, 6],
  systemAssumptions: [2, 3, 4, 5, 6],
  designConstraints: [2, 3, 4, 5, 6],
  coreDesignQuestions: [2, 3, 4, 5, 6],
  conceptCandidates: [3, 4, 5, 6],
  agentRecommendation: [4, 5, 6],
  designerDecision: [4, 5, 6],
  coreNarrative: [5, 6],
  spatialStructure: [5, 6],
  functionalZones: [5, 6],
  circulationStrategy: [5, 6],
  professionalStrategies: [5, 6],
  featureNodes: [5, 6],
  visualTasks: [6],
  analysisAssets: [6],
  visualCandidates: [6],
  selectedVisuals: [6],
  visualReview: [6],
  visualAssets: [6],
};

const now = () => new Date().toISOString();

export function readBlueprint(blueprint) {
  return cloneBlueprint(blueprint);
}

function stampValue(value, agentName, reason, version, defaultStatus) {
  if (Array.isArray(value)) {
    return value.map((item) => {
      if (item && typeof item === 'object') {
        const status = item.status || defaultStatus;
        return {
          id: item.id || newEntityId('record'),
          ...item,
          status,
          _meta: makeMeta(agentName, reason, version, status),
        };
      }
      return {
        id: newEntityId('record'),
        value: item,
        status: defaultStatus,
        _meta: makeMeta(agentName, reason, version, defaultStatus),
      };
    });
  }
  if (value && typeof value === 'object') {
    const status = value.status || defaultStatus;
    return { ...value, status, _meta: makeMeta(agentName, reason, version, status) };
  }
  return {
    value,
    status: defaultStatus,
    _meta: makeMeta(agentName, reason, version, defaultStatus),
  };
}

export function applyAgentPatch(blueprint, agentId, patch, reason = 'Agent 结构化写入') {
  const agent = AGENTS.find((item) => item.id === Number(agentId));
  if (!agent) throw new Error(`未知 Agent：${agentId}`);
  const allowedFields = AGENT_FIELD_OWNERS[agent.id];
  const fields = Object.keys(patch || {});
  const unauthorized = fields.filter((field) => !allowedFields.includes(field));
  if (unauthorized.length) {
    throw new Error(`${agent.name} Agent 无权写入字段：${unauthorized.join('、')}`);
  }

  const next = cloneBlueprint(blueprint);
  const version = (next.revision ?? next.currentVersion ?? 0) + 1;
  const milestoneVersion = AGENT_MILESTONE[agent.id];
  const source = `Agent ${agent.id}｜${agent.name}`;
  fields.forEach((field) => {
    const stamped = stampValue(patch[field], source, reason, version, CONTENT_STATUS.AI_SUGGESTED);
    if (APPEND_BY_AGENT_FIELDS.has(field) && Array.isArray(stamped)) {
      const retained = (next[field] || []).filter((item) => item?._meta?.sourceAgent !== source);
      next[field] = [...retained, ...stamped];
    } else {
      next[field] = stamped;
    }
  });
  const chapter = AGENT_CHAPTER[agent.id];
  const chapterPatch = Object.fromEntries(fields
    .filter((field) => !['risks', 'nextTasks', 'qualityReview'].includes(field))
    .map((field) => [field, next[field]]));
  next.chapters = {
    ...(next.chapters || {}),
    [chapter]: {
      ...(next.chapters?.[chapter] || {}),
      ...chapterPatch,
    },
  };
  next.revision = version;
  next.currentVersion = version;
  next.milestoneVersion = milestoneVersion;
  next.stage = agent.id === 6 ? 'deliverables' : 'agent-collaboration';
  next.status = agent.id === 6 ? 'review' : next.status;
  next.updatedBy = `agent-${agent.id}`;
  next.updatedAt = now();
  next.agentRuns[agent.id] = {
    ...next.agentRuns[agent.id],
    status: 'done',
    lastRunAt: now(),
    blueprintVersionRead: blueprint.milestoneVersion || `v${blueprint.currentVersion || 0}`,
    blueprintVersionWritten: milestoneVersion,
  };
  const execution = {
    id: newEntityId('execution'),
    agentId: `agent-${agent.id}`,
    agentName: agent.name,
    startedAt: blueprint.updatedAt,
    completedAt: next.updatedAt,
    inputVersion: blueprint.milestoneVersion || `v${blueprint.currentVersion || 0}`,
    outputVersion: milestoneVersion,
    readSections: ['chapters.projectDefinition', ...Object.entries(AGENT_CHAPTER).filter(([id]) => Number(id) < agent.id).map(([, name]) => `chapters.${name}`)],
    writtenSections: [`chapters.${chapter}`],
    status: 'completed',
    summary: `Agent ${agent.id} ${agent.name}已完成并写入${milestoneVersion}`,
    warnings: [],
    openItemCount: 0,
    conflictCount: 0,
    ...(agent.id === 5 ? {
      executionType: 'visual-candidate-generation',
      traceId: `visual-agent5-r${version}`,
      visualTaskIds: (next.visualTasks || []).map((item) => item.id),
      analysisAssetIds: (next.analysisAssets || []).map((item) => item.id),
      candidateIds: (next.visualCandidates || []).map((item) => item.id),
      sourceBlueprintFields: [...new Set((next.visualTasks || []).flatMap((item) => item.sourceBlueprintFields || []))],
    } : {}),
  };
  next.agentExecutions = [...(next.agentExecutions || []), execution];
  next.invalidatedOutputs = next.invalidatedOutputs.filter((item) => item.targetAgent !== agent.id);
  next.changeLog.unshift({
    id: newEntityId('change'),
    sourceAgent: source,
    modifiedAt: now(),
    reason,
    confirmationStatus: CONTENT_STATUS.AI_SUGGESTED,
    version,
    milestoneVersion,
    fields,
  });
  const checkpoint = CHECKPOINTS.find((item) => item.afterAgent === agent.id);
  if (checkpoint) {
    next.currentCheckpoint = checkpoint.id;
    next.checkpoints = next.checkpoints.map((item) => item.id === checkpoint.id
      ? { ...item, status: '待确认', confirmedAt: null, confirmedBy: null, decision: null }
      : item);
  }
  if (agent.id === 6) next.officialPackageStatus = '待最终确认';
  return next;
}

export function invalidateDownstream(blueprint, changedFields, reason = '上游内容发生修改') {
  const next = cloneBlueprint(blueprint);
  const impactedAgents = [...new Set(changedFields.flatMap((field) => FIELD_IMPACT[field] || []))]
    .filter((agentId) => Boolean(next.agentRuns[agentId]?.blueprintVersionWritten))
    .sort();
  impactedAgents.forEach((agentId) => {
    const existing = next.invalidatedOutputs.find((item) => item.targetAgent === agentId);
    if (!existing) {
      next.invalidatedOutputs.push({
        id: newEntityId('invalid'),
        targetAgent: agentId,
        targetName: AGENTS.find((item) => item.id === agentId)?.name,
        reason,
        changedFields,
        invalidatedAt: now(),
        status: '需要重新生成',
      });
    }
    if (next.agentRuns[agentId]) next.agentRuns[agentId].status = 'stale';
  });
  if (impactedAgents.includes(5)) {
    next.visualReview = {
      ...(next.visualReview || {}),
      status: 'stale',
      staleAt: now(),
      staleReason: reason,
      changedFields,
    };
    next.selectedVisuals = (next.selectedVisuals || []).map((selection) => ({
      ...selection,
      selectionStatus: 'stale',
      staleAt: now(),
      staleReason: reason,
    }));
    next.chapters = {
      ...(next.chapters || {}),
      visualExpression: next.chapters?.visualExpression ? {
        ...next.chapters.visualExpression,
        visualReview: next.visualReview,
        selectedVisuals: next.selectedVisuals,
      } : next.chapters?.visualExpression,
    };
  }
  if (impactedAgents.length) {
    next.checkpoints = next.checkpoints.map((checkpoint) => impactedAgents.some((agentId) => agentId <= checkpoint.afterAgent)
      ? { ...checkpoint, status: '需重新确认', confirmedAt: null, confirmedBy: null }
      : checkpoint);
    next.officialPackageStatus = '需重新生成';
  }
  return next;
}

export function applyDesignerPatch(blueprint, patch, reason = '设计师修改上游内容') {
  let next = cloneBlueprint(blueprint);
  const fields = Object.keys(patch || {});
  const version = (next.revision ?? next.currentVersion ?? 0) + 1;
  fields.forEach((field) => {
    next[field] = stampValue(patch[field], '设计师', reason, version, CONTENT_STATUS.CONFIRMED);
  });
  next.revision = version;
  next.currentVersion = version;
  next.updatedAt = now();
  next.changeLog.unshift({
    id: newEntityId('change'),
    sourceAgent: '设计师',
    modifiedAt: now(),
    reason,
    confirmationStatus: CONTENT_STATUS.CONFIRMED,
    version,
    fields,
  });
  next = invalidateDownstream(next, fields, reason);
  return next;
}

export function updateDesignerDecision(blueprint, decision, reason = '设计师确认概念方向') {
  let next = cloneBlueprint(blueprint);
  const version = (next.revision ?? next.currentVersion ?? 0) + 1;
  const mergedDecision = {
    ...next.designerDecision,
    ...decision,
  };
  const confirmationStatus = mergedDecision.selectedConceptId ? CONTENT_STATUS.CONFIRMED : CONTENT_STATUS.PENDING;
  next.designerDecision = {
    ...mergedDecision,
    status: confirmationStatus,
    _meta: makeMeta('设计师', reason, version, confirmationStatus),
  };
  next.revision = version;
  next.currentVersion = version;
  next.updatedAt = now();
  next.changeLog.unshift({
    id: newEntityId('change'),
    sourceAgent: '设计师',
    modifiedAt: now(),
    reason,
    confirmationStatus: next.designerDecision.status,
    version,
    fields: ['designerDecision'],
  });
  next = invalidateDownstream(next, ['designerDecision'], reason);
  return next;
}

export function updateAssumptionDecision(blueprint, assumptionId, accepted) {
  const next = cloneBlueprint(blueprint);
  const version = (next.revision ?? next.currentVersion ?? 0) + 1;
  next.systemAssumptions = next.systemAssumptions.map((item) => item.id === assumptionId ? {
    ...item,
    status: accepted ? CONTENT_STATUS.CONFIRMED : CONTENT_STATUS.REJECTED,
    designerDecision: accepted ? '接受' : '否定',
    _meta: makeMeta('设计师', accepted ? '接受系统假设' : '否定系统假设', version, accepted ? CONTENT_STATUS.CONFIRMED : CONTENT_STATUS.REJECTED),
  } : item);
  next.revision = version;
  next.currentVersion = version;
  next.updatedAt = now();
  next.changeLog.unshift({
    id: newEntityId('change'),
    sourceAgent: '设计师',
    modifiedAt: now(),
    reason: accepted ? '接受系统假设' : '否定系统假设',
    confirmationStatus: accepted ? CONTENT_STATUS.CONFIRMED : CONTENT_STATUS.REJECTED,
    version,
    fields: ['systemAssumptions'],
  });
  return invalidateDownstream(next, ['systemAssumptions'], '系统假设确认结果发生变化');
}

export function confirmCheckpoint(blueprint, checkpointId, decision = {}, confirmedBy = '设计师') {
  const checkpoint = blueprint.checkpoints.find((item) => item.id === checkpointId);
  if (!checkpoint) throw new Error(`未知确认节点：${checkpointId}`);
  if (checkpointId === 'checkpoint-2' && !blueprint.designerDecision?.selectedConceptId) {
    throw new Error('请先选择 A / B / C 概念方向');
  }
  if (checkpointId === 'checkpoint-3') {
    const designStatement = blueprint.deliverableArtifacts?.designStatement;
    if (!designStatement?.sections?.length) {
      throw new Error('设计说明书尚未生成，无法完成专业复核');
    }
    if (['regenerating', 'needsRevision', 'stale'].includes(designStatement.status)) {
      throw new Error('设计说明书仍有待修改或重新生成内容');
    }
    if (designStatement.sections.some((section) => section.reviewStatus !== 'approved')) {
      throw new Error('请先完成设计说明书全部分项复核');
    }
  }
  if (checkpointId === 'checkpoint-4') {
    const visualSelection = decision.visualSelection;
    if (blueprint.agentRuns?.[5]?.status !== 'done') {
      throw new Error('视觉表达尚未完成，无法进行视觉方案挑选');
    }
    if (blueprint.invalidatedOutputs?.some((item) => item.targetAgent === 5)) {
      throw new Error('视觉候选已因上游修改失效，请重新运行视觉表达');
    }
    if (!visualSelection?.candidateId || !visualSelection?.scene) {
      throw new Error('请先选择一个视觉候选');
    }
    const candidate = (blueprint.visualCandidates || []).find((item) => (
      item.id === visualSelection.candidateId && item.scene === visualSelection.scene
    ));
    if (!candidate) throw new Error('所选视觉候选不属于当前 Blueprint');
    if (candidate.isFactSource !== false) throw new Error('视觉候选必须明确标记为非事实源');
    if (!Array.isArray(visualSelection.reasons) || !visualSelection.reasons.length) {
      throw new Error('请至少选择一项视觉判断理由');
    }
  }
  if (checkpointId === 'checkpoint-5' && blueprint.invalidatedOutputs.length) {
    throw new Error('仍有需重新生成的下游成果，无法完成最终确认');
  }
  const next = cloneBlueprint(blueprint);
  const version = (next.revision ?? next.currentVersion ?? 0) + 1;
  next.revision = version;
  next.currentVersion = version;
  next.updatedAt = now();
  if (checkpointId === 'checkpoint-4') {
    const visualSelection = decision.visualSelection;
    const candidate = next.visualCandidates.find((item) => item.id === visualSelection.candidateId);
    const previous = (next.selectedVisuals || []).find((item) => item.scene === visualSelection.scene) || null;
    const traceId = newEntityId('visual-trace');
    const selection = {
      id: newEntityId('visual-selection'),
      traceId,
      scene: visualSelection.scene,
      visualTaskId: visualSelection.visualTaskId || candidate.visualTaskId,
      candidateId: candidate.id,
      visualAssetId: candidate.assetRef || candidate.id,
      candidateName: candidate.name,
      reasons: [...visualSelection.reasons],
      comment: String(visualSelection.comment || '').trim(),
      sourceBlueprintFields: [...new Set([
        ...(candidate.sourceBlueprintFields || []),
        ...(visualSelection.sourceBlueprintFields || []),
      ])],
      selectedAt: now(),
      selectedBy: confirmedBy,
      selectionStatus: 'confirmed',
      isFactSource: false,
    };
    next.selectedVisuals = [
      ...(next.selectedVisuals || []).filter((item) => item.scene !== selection.scene),
      selection,
    ];
    next.visualReview = {
      ...(next.visualReview || {}),
      status: 'confirmed',
      checkpointId: 'checkpoint-4',
      confirmedAt: selection.selectedAt,
      confirmedBy,
      sourceBlueprintRevision: blueprint.revision ?? blueprint.currentVersion,
      selectedScenes: next.selectedVisuals.map((item) => item.scene),
    };
    next.chapters = {
      ...(next.chapters || {}),
      visualExpression: {
        ...(next.chapters?.visualExpression || {}),
        selectedVisuals: next.selectedVisuals,
        visualReview: next.visualReview,
      },
    };
    next.changeLog.unshift({
      id: newEntityId('change'),
      traceId,
      type: 'visual-selection-review',
      actor: confirmedBy,
      sourceAgent: confirmedBy,
      action: 'confirmed',
      modifiedAt: selection.selectedAt,
      reason: '设计师确认 Gate 4 视觉候选',
      confirmationStatus: CONTENT_STATUS.CONFIRMED,
      version,
      fields: ['selectedVisuals', 'visualReview', 'checkpoints'],
      scene: selection.scene,
      candidate: {
        id: candidate.id,
        name: candidate.name,
        assetRef: candidate.assetRef,
      },
      reasons: selection.reasons,
      comment: selection.comment,
      before: previous,
      after: selection,
      relatedBlueprintFields: selection.sourceBlueprintFields,
    });
  }
  next.checkpoints = next.checkpoints.map((item) => item.id === checkpointId ? {
    ...item,
    status: '已确认',
    confirmedAt: now(),
    confirmedBy,
    decision,
  } : item);
  next.currentCheckpoint = null;
  if (checkpointId === 'checkpoint-1') {
    next.projectBasicInfo.status = CONTENT_STATUS.CONFIRMED;
    next.projectBasicInfo._meta = makeMeta(confirmedBy, '确认项目事实', version, CONTENT_STATUS.CONFIRMED);
    next.confirmedFacts = next.confirmedFacts.map((item) => ({ ...item, status: CONTENT_STATUS.CONFIRMED, _meta: makeMeta(confirmedBy, '确认项目事实', version, CONTENT_STATUS.CONFIRMED) }));
    next.designConstraints = next.designConstraints.map((item) => ({ ...item, status: CONTENT_STATUS.CONFIRMED, _meta: makeMeta(confirmedBy, '确认设计约束', version, CONTENT_STATUS.CONFIRMED) }));
    ['explicitRequirements', 'latentGoals', 'siteConditions', 'deliverableRequirements'].forEach((field) => {
      next[field] = (next[field] || []).map((item) => ({ ...item, status: CONTENT_STATUS.CONFIRMED, _meta: makeMeta(confirmedBy, '确认项目定义', version, CONTENT_STATUS.CONFIRMED) }));
    });
  }
  if (checkpointId === 'checkpoint-5') next.officialPackageStatus = '演示方案已完成｜正式成果可继续深化';
  next.changeLog.unshift({
    id: newEntityId('change'),
    sourceAgent: confirmedBy,
    modifiedAt: now(),
    reason: `完成${checkpoint.name}`,
    confirmationStatus: CONTENT_STATUS.CONFIRMED,
    version,
    fields: ['checkpoints'],
  });
  return next;
}

export function createBlueprintVersion(blueprint, history = [], reason = '保存版本', metadata = {}) {
  return createVersionSnapshot(blueprint, history, reason, metadata);
}

export function restoreBlueprintVersion(history, versionId, currentBlueprint) {
  return restoreVersionSnapshot(history, versionId, currentBlueprint);
}

export function getNextRunnableAgent(blueprint) {
  const stale = Object.values(blueprint.agentRuns).find((run) => run.status === 'stale');
  if (stale) return stale.agentId;
  const pending = Object.values(blueprint.agentRuns).find((run) => run.status !== 'done');
  return pending?.agentId || null;
}

export function canRunAgent(blueprint, agentId) {
  if (agentId >= 2 && blueprint.checkpoints.find((item) => item.id === 'checkpoint-1')?.status !== '已确认') return false;
  if (agentId >= 3 && !blueprint.chapters?.conceptGeneration?.conceptCandidates?.length) return false;
  if (agentId >= 4 && blueprint.checkpoints.find((item) => item.id === 'checkpoint-2')?.status !== '已确认') return false;
  if (agentId >= 5 && blueprint.checkpoints.find((item) => item.id === 'checkpoint-3')?.status !== '已确认') return false;
  if (agentId >= 6 && blueprint.checkpoints.find((item) => item.id === 'checkpoint-4')?.status !== '已确认') return false;
  return true;
}
