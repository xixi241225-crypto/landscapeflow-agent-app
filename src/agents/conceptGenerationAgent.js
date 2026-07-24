import {
  BLUEPRINT_ITEM_STATUS,
  BLUEPRINT_MILESTONES,
  BLUEPRINT_SCHEMA_VERSION,
  cloneBlueprint,
  newEntityId,
} from '../blueprint/blueprintModel.js';
import { migrateBlueprintToV2 } from '../blueprint/blueprintMigration.js';
import {
  selectConceptGenerationInput,
  selectProjectFactByKey,
} from '../blueprint/blueprintSelectors.js';
import { assertAgentWriteScope } from './projectDefinitionAgent.js';

const now = () => new Date().toISOString();
const milestoneNumber = (value) => Number(String(value || 'v0').replace('v', '')) || 0;
const itemText = (item) => String(item?.value || '').trim();
const compact = (value, fallback) => String(value || '').trim() || fallback;

function responseMapping(sourcePath, sourceItem, response) {
  return {
    sourcePath,
    sourceItemId: sourceItem?.id || '',
    sourceLabel: sourceItem?.label || '项目设计蓝本条目',
    sourceStatus: sourceItem?.status || BLUEPRINT_ITEM_STATUS.PENDING,
    response,
  };
}

function pickRequired(input) {
  const goal = input.explicitGoals[0] || input.latentGoals[0];
  const constraint = input.constraints[0];
  const principle = input.designPrinciples[0];
  const site = input.flattenedSiteConditions[0] || input.successCriteria[0];
  if (!goal || !constraint || !principle || !site) {
    throw new Error('Agent 2 输入不足：至少需要一项目标、核心约束、设计原则，以及场地条件或成功标准。');
  }
  return { goal, constraint, principle, site };
}

function dependencyFromOpenItem(item) {
  return {
    id: `dependency-${item.id || newEntityId('open-item')}`,
    sourceItemId: item.id || '',
    label: item.label || '待补充资料',
    value: item.value || '',
    status: BLUEPRINT_ITEM_STATUS.PENDING,
    sourcePath: 'chapters.projectDefinition.openItems',
  };
}

function conceptCandidates(input, designerBrief, generatedAt) {
  const projectName = compact(input.project.projectName, '当前景观项目');
  const location = compact(input.project.location, '项目所在地');
  const projectType = compact(input.project.projectType, '公共景观空间');
  const users = input.stakeholders.map(itemText).filter(Boolean);
  const userLabel = users.length ? users.join('、') : '主要使用者';
  const required = pickRequired(input);
  const sharedDependencies = input.openItems.map(dependencyFromOpenItem);
  const sharedResponseMappings = (responses) => [
    responseMapping('chapters.projectDefinition.explicitGoals', required.goal, responses.goal),
    responseMapping('chapters.projectDefinition.constraints', required.constraint, responses.constraint),
    responseMapping('chapters.projectDefinition.designPrinciples', required.principle, responses.principle),
    responseMapping(
      input.flattenedSiteConditions.length ? 'chapters.projectDefinition.siteConditions' : 'chapters.projectDefinition.successCriteria',
      required.site,
      responses.site,
    ),
  ];
  const briefSuffix = designerBrief ? `同时回应设计师补充要求：“${designerBrief}”。` : '';

  return [
    {
      id: 'concept-A',
      code: 'A',
      name: '林下织补｜松林共享客厅',
      status: 'candidate',
      proposition: '保留松林骨架，以轻介入织补日常邻里生活。',
      narrative: `${projectName}以现状树荫和林下空间为起点，通过小尺度修补形成属于${userLabel}的共享客厅。${briefSuffix}`,
      strategicFocus: '现状保留优先、林下轻介入、日常共享、低维护和分期实施。',
      spatialHypothesis: '以连续林下共享带串联入口、会客、全龄活动与安静休憩，节点采用可分期的小尺度织补。',
      experienceIntent: '形成亲切、松弛、可日常反复使用的林下邻里体验。',
      targetUsers: users,
      keyScenes: ['林下共享客厅', '邻里会客节点', '全龄活动口袋', '树荫慢行连接'],
      differentiationTags: ['保留优先', '轻介入', '日常共享', '分期友好'],
      responseMappings: sharedResponseMappings({
        goal: '以林下复合活动兼顾全龄日常使用，并保留社区交往的弹性。',
        constraint: '通过减少新建硬质界面和高维护设施，控制建造与长期运维压力。',
        principle: '以现状资源为设计骨架，采用可逆、低干扰的节点织补。',
        site: '将现状松林与已有活动基础转化为可持续使用的空间资源。',
      }),
      advantages: ['现状保留度高', '投资与维护可控', '分期实施友好', '日常使用稳定'],
      risks: ['轻介入可能降低首轮展示冲击力', '林下安全、照度和根系保护需后续复核'],
      applicableConditions: ['适合重视现状保护、低维护和渐进式更新的项目条件'],
      dependencies: sharedDependencies,
      conceptDiagramBrief: {
        purpose: '表达现状松林如何通过轻介入节点转化为共享生活网络',
        mustShow: ['保留树木基底', '林下共享带', '四类日常节点', '分期实施逻辑'],
        avoid: ['大拆大建', '高维护水景', '过度商业化构筑物'],
      },
      referenceVisual: {
        assetId: 'concept-reference-A',
        url: './demo-images/aerial.jpg',
        title: '林下织补概念意向',
        assetType: '演示概念意向素材',
        aspectRatio: '16:9',
        status: 'demo-reference',
        source: 'demoCase',
        isDemoAsset: true,
      },
      generatedBy: 'agent-2',
      generatedAt,
    },
    {
      id: 'concept-B',
      code: 'B',
      name: '全龄聚场｜弹性邻里核心',
      status: 'candidate',
      proposition: '以可切换的全龄公共核心，聚合社区日常与公共事件。',
      narrative: `${projectName}将高频活动集中为具有识别度的邻里核心，在平日、周末与社区活动之间灵活切换。${briefSuffix}`,
      strategicFocus: '高频活动优先、弹性公共核心、全龄共享关系与较强公共展示性。',
      spatialHypothesis: '以一个弹性聚场为中心，连接儿童、老人、陪护家庭和社区活动界面，外围以林荫缓冲带衔接。',
      experienceIntent: '形成活跃、可见、可参与，且不同人群能够彼此照看的公共生活体验。',
      targetUsers: users,
      keyScenes: ['弹性邻里核心', '全龄共享看台', '亲子互动边界', '社区活动界面'],
      differentiationTags: ['活力优先', '弹性核心', '全龄共融', '公共展示'],
      responseMappings: sharedResponseMappings({
        goal: '将儿童、老人和家庭的高频需求集中组织，提高公共活动的可见性与共享效率。',
        constraint: '以单一复合核心替代多个高投入节点，把有限资源集中在高频使用空间。',
        principle: '通过可切换场景落实全龄共享，非活动时保持开放和低维护。',
        site: '利用现状开敞空间或活动基础形成聚合核心，避免对完整林地进行大范围扰动。',
      }),
      advantages: ['公共活力和识别度强', '复合使用效率高', '便于社区活动组织', '路演表达清晰'],
      risks: ['活动高峰可能产生噪声和冲突', '核心空间的运营、耐久性与安全边界需明确'],
      applicableConditions: ['适合强调公共活力、社区活动和高频空间投入的项目条件'],
      dependencies: sharedDependencies,
      conceptDiagramBrief: {
        purpose: '表达一个弹性核心如何组织全龄活动和多时段使用',
        mustShow: ['弹性公共核心', '全龄关系', '平日/周末/活动日切换', '林荫缓冲'],
        avoid: ['固定单一功能', '大面积无荫硬铺', '高维护活动设备堆叠'],
      },
      referenceVisual: {
        assetId: 'concept-reference-B',
        url: './demo-images/awn.jpg',
        title: '全龄聚场概念意向',
        assetType: '演示概念意向素材',
        aspectRatio: '16:9',
        status: 'demo-reference',
        source: 'demoCase',
        isDemoAsset: true,
      },
      generatedBy: 'agent-2',
      generatedAt,
    },
    {
      id: 'concept-C',
      code: 'C',
      name: '生态漫游｜自然教育环',
      status: 'candidate',
      proposition: '以松林、生境与自然观察串联慢行漫游和安静康养。',
      narrative: `${projectName}以${location}的生态条件为线索，将自然观察、环境教育与安静康养组织为连续漫游体验。${briefSuffix}`,
      strategicFocus: '生态体验优先、生境连续、自然教育、慢行漫游和安静康养。',
      spatialHypothesis: '以自然教育环串联松林、生境观察、雨水体验和康养停留点，活动强度由入口向安静区域逐渐降低。',
      experienceIntent: '形成沉浸、安静、富有季相变化和自然学习价值的漫游体验。',
      targetUsers: users,
      keyScenes: ['松林自然课堂', '生境观察点', '生态漫游环', '安静康养节点'],
      differentiationTags: ['生态优先', '自然教育', '慢行漫游', '安静康养'],
      responseMappings: sharedResponseMappings({
        goal: '以自然教育和慢行体验补充日常活动需求，提升生态公共空间的持续吸引力。',
        constraint: '控制硬质建设，以生态化、可渗透和低干扰方式组织体验。',
        principle: '保护松林并将生态资源转化为可感知、可学习的场所体验。',
        site: `以${projectType}的生态基础组织生境连续性，所有生态判断等待现场与专业资料复核。`,
      }),
      advantages: ['场所气质和生态价值突出', '自然教育延展性强', '微气候改善潜力高', '安静人群体验完整'],
      risks: ['更依赖生态维护和场地条件复核', '成景周期、林下通透性和夜间安全需专业校核'],
      applicableConditions: ['适合生态资源较好、重视自然教育和安静体验的项目条件'],
      dependencies: sharedDependencies,
      conceptDiagramBrief: {
        purpose: '表达生态教育环如何串联松林、生境、雨水与康养体验',
        mustShow: ['自然教育环', '生境节点', '活动强度梯度', '待复核生态条件'],
        avoid: ['把生态假设当成已确认事实', '精确工程参数', '高干扰娱乐设施'],
      },
      referenceVisual: {
        assetId: 'concept-reference-C',
        url: './demo-images/elderly.jpg',
        title: '生态漫游概念意向',
        assetType: '演示概念意向素材',
        aspectRatio: '16:9',
        status: 'demo-reference',
        source: 'demoCase',
        isDemoAsset: true,
      },
      generatedBy: 'agent-2',
      generatedAt,
    },
  ];
}

const forbiddenKeys = new Set(['score', 'total', 'weight', 'rank', 'recommended', 'selected', 'winner', 'finalDecision']);

function collectForbiddenKeys(value, result = []) {
  if (!value || typeof value !== 'object') return result;
  Object.entries(value).forEach(([key, child]) => {
    if (forbiddenKeys.has(key)) result.push(key);
    collectForbiddenKeys(child, result);
  });
  return result;
}

export function validateConceptGenerationChapter(chapter, options = {}) {
  const candidates = chapter?.conceptCandidates || [];
  const errors = [];
  const expectedCount = options.mode === 'demo' ? 3 : null;
  if (candidates.length < 2 || candidates.length > 3) errors.push('概念候选数量必须为 2—3 个');
  if (expectedCount && candidates.length !== expectedCount) errors.push('演示案例必须稳定生成 3 个候选');
  ['id', 'code', 'name'].forEach((key) => {
    if (new Set(candidates.map((item) => item[key])).size !== candidates.length) errors.push(`${key} 必须唯一`);
  });
  candidates.forEach((candidate) => {
    ['proposition', 'strategicFocus', 'spatialHypothesis'].forEach((key) => {
      if (!String(candidate[key] || '').trim()) errors.push(`${candidate.code || candidate.id} 缺少 ${key}`);
    });
    if (!candidate.responseMappings?.length) errors.push(`${candidate.code || candidate.id} 缺少蓝本响应关系`);
    const paths = candidate.responseMappings?.map((item) => item.sourcePath) || [];
    if (!paths.some((path) => path.includes('Goals'))) errors.push(`${candidate.code || candidate.id} 未回应项目目标`);
    if (!paths.some((path) => path.includes('constraints'))) errors.push(`${candidate.code || candidate.id} 未回应核心约束`);
    if (!paths.some((path) => path.includes('designPrinciples'))) errors.push(`${candidate.code || candidate.id} 未回应设计原则`);
    if (!paths.some((path) => path.includes('siteConditions') || path.includes('successCriteria'))) errors.push(`${candidate.code || candidate.id} 未回应场地条件或成功标准`);
    if (candidate.referenceVisual?.status !== 'demo-reference') errors.push(`${candidate.code || candidate.id} 的参考视觉未标记为演示意向素材`);
  });
  if (new Set(candidates.map((item) => JSON.stringify(item.differentiationTags || []))).size !== candidates.length) {
    errors.push('三个方向的差异化标签不得相同');
  }
  const forbidden = collectForbiddenKeys(chapter);
  if (forbidden.length) errors.push(`Agent 2 章节包含职责越界字段：${[...new Set(forbidden)].join('、')}`);
  const serialized = JSON.stringify(chapter);
  if (/第\s*\d+\s*页|GB\s*\d+|CJJ\s*\d+/.test(serialized)) errors.push('Agent 2 不得伪造页码或法规引用');
  return { valid: errors.length === 0, errors };
}

function assertPrerequisites(blueprint, input) {
  if (blueprint.schemaVersion !== BLUEPRINT_SCHEMA_VERSION) throw new Error(`Agent 2 不支持 Blueprint schemaVersion ${blueprint.schemaVersion || 'unknown'}`);
  if (!blueprint.chapters?.projectDefinition) throw new Error('Agent 2 必须读取 Agent 1 已形成的项目定义');
  if (milestoneNumber(blueprint.milestoneVersion) < 2) throw new Error('Agent 2 只能读取设计师已确认的 Blueprint v2 或更高版本');
  if (!input.checkpointConfirmed) throw new Error('Agent 2 前置条件未满足：checkpoint-1 尚未由设计师确认');
  ['projectName', 'location', 'area', 'projectType'].forEach((key) => {
    if (!selectProjectFactByKey(blueprint, key)?.value) throw new Error(`Agent 2 缺少带稳定 key 的项目事实：${key}`);
  });
  const conflicts = input.conflicts.filter((item) => item.status === BLUEPRINT_ITEM_STATUS.CONFLICT);
  if (conflicts.length) throw new Error(`Agent 2 已停止：存在 ${conflicts.length} 项未裁决信息冲突`);
}

function downstreamInvalidation(next, reason) {
  const invalidated = [...(next.invalidatedOutputs || [])];
  [3, 4, 5, 6].forEach((agentId) => {
    if (!next.agentRuns?.[agentId]?.blueprintVersionWritten) return;
    next.agentRuns[agentId] = { ...next.agentRuns[agentId], status: 'stale' };
    if (!invalidated.some((item) => item.targetAgent === agentId)) {
      invalidated.push({
        id: newEntityId('invalid'),
        targetAgent: agentId,
        targetName: next.agentRuns[agentId].agentName,
        reason,
        changedFields: ['chapters.conceptGeneration'],
        invalidatedAt: now(),
        status: '需要重新生成',
      });
    }
  });
  next.invalidatedOutputs = invalidated;
  next.checkpoints = (next.checkpoints || []).map((checkpoint) => (
    checkpoint.order >= 2
      ? {
          ...checkpoint,
          status: '未到达',
          confirmedAt: null,
          confirmedBy: null,
          decision: null,
        }
      : checkpoint
  ));
  if (['checkpoint-2', 'checkpoint-3', 'checkpoint-4'].includes(next.currentCheckpoint)) {
    next.currentCheckpoint = null;
  }
}

export function runConceptGenerationAgent(currentBlueprint, options = {}) {
  assertAgentWriteScope('agent-2', ['chapters.conceptGeneration']);
  const source = migrateBlueprintToV2(currentBlueprint);
  const input = selectConceptGenerationInput(source);
  assertPrerequisites(source, input);

  const startedAt = now();
  const generatedAt = now();
  const designerBrief = String(options.designerBrief || '').trim();
  const candidates = conceptCandidates(input, designerBrief, generatedAt);
  const dependencies = input.openItems.map(dependencyFromOpenItem);
  const chapter = {
    agentId: 'agent-2',
    agentName: '概念生成',
    generatedFromVersion: BLUEPRINT_MILESTONES.DIRECTION_CONFIRMED,
    generatedAt,
    generationRequest: {
      value: designerBrief,
      source: 'designer',
      status: BLUEPRINT_ITEM_STATUS.CONFIRMED,
    },
    inputRefs: {
      facts: Object.values(input.facts).map((item) => item.id),
      goals: [...input.explicitGoals, ...input.latentGoals].map((item) => item.id),
      siteConditions: input.flattenedSiteConditions.map((item) => item.id),
      constraints: input.constraints.map((item) => item.id),
      designPrinciples: input.designPrinciples.map((item) => item.id),
      successCriteria: input.successCriteria.map((item) => item.id),
      openItems: input.openItems.map((item) => item.id),
    },
    sharedRequirements: input.designPrinciples.map((item) => ({
      sourceItemId: item.id,
      value: item.value,
      status: item.status,
    })),
    conceptCandidates: candidates,
    unresolvedDependencies: dependencies,
    qualityChecks: {
      candidateCount: candidates.length,
      allMappedToBlueprint: candidates.every((item) => item.responseMappings.length >= 4),
      strategicallyDifferentiated: new Set(candidates.map((item) => item.strategicFocus)).size === candidates.length,
      containsRecommendation: false,
      containsScoring: false,
    },
    status: 'completed',
  };
  const validation = validateConceptGenerationChapter(chapter, { mode: options.mode || 'demo' });
  if (!validation.valid) throw new Error(`Agent 2 概念章节校验失败：${validation.errors.join('；')}`);

  const next = cloneBlueprint(source);
  const previousChapter = next.chapters?.conceptGeneration || null;
  const revision = (source.revision ?? source.currentVersion ?? 0) + 1;
  const completedAt = now();
  next.chapters = { ...next.chapters, conceptGeneration: chapter };
  delete next.conceptCandidates;
  next.revision = revision;
  next.currentVersion = revision;
  next.milestoneVersion = BLUEPRINT_MILESTONES.CONCEPTS_GENERATED;
  next.stage = 'concept-generation';
  next.status = 'review';
  next.updatedAt = completedAt;
  next.updatedBy = 'agent-2';
  next.agentRuns = {
    ...next.agentRuns,
    2: {
      ...next.agentRuns?.[2],
      agentId: 2,
      agentName: '概念生成',
      status: 'done',
      lastRunAt: completedAt,
      blueprintVersionRead: BLUEPRINT_MILESTONES.DIRECTION_CONFIRMED,
      blueprintVersionWritten: BLUEPRINT_MILESTONES.CONCEPTS_GENERATED,
    },
  };
  const execution = {
    id: newEntityId('execution'),
    agentId: 'agent-2',
    agentName: '概念生成',
    startedAt,
    completedAt,
    inputVersion: BLUEPRINT_MILESTONES.DIRECTION_CONFIRMED,
    outputVersion: BLUEPRINT_MILESTONES.CONCEPTS_GENERATED,
    inputRevision: source.revision ?? source.currentVersion ?? 0,
    outputRevision: revision,
    readSections: ['chapters.projectDefinition'],
    writtenSections: ['chapters.conceptGeneration'],
    status: 'completed',
    summary: `已基于项目设计蓝本 ${BLUEPRINT_MILESTONES.DIRECTION_CONFIRMED} 生成 3 个概念候选，并写入 ${BLUEPRINT_MILESTONES.CONCEPTS_GENERATED}`,
    candidateCount: candidates.length,
    warnings: dependencies.map((item) => item.value),
    openItemCount: dependencies.length,
    conflictCount: 0,
  };
  next.agentExecutions = [...(next.agentExecutions || []), execution];
  if (previousChapter) downstreamInvalidation(next, '概念生成要求或候选集发生变化');
  next.changeLog = [{
    id: newEntityId('change'),
    sourceAgent: 'Agent 2｜概念生成',
    modifiedAt: completedAt,
    reason: previousChapter ? '根据新的概念生成要求完整重新生成三个候选' : '基于已确认项目定义生成三个差异化概念候选',
    confirmationStatus: 'AI建议',
    version: revision,
    milestoneVersion: BLUEPRINT_MILESTONES.CONCEPTS_GENERATED,
    fields: ['chapters.conceptGeneration'],
    previousGenerationRequest: previousChapter?.generationRequest?.value || '',
    currentGenerationRequest: designerBrief,
    downstreamImpact: previousChapter ? [3, 4, 5, 6] : [],
  }, ...(next.changeLog || [])];

  const changedSections = ['三个概念候选', '概念命题与叙事', '概念级空间组织假设', '蓝本响应关系', '风险与资料依赖'];
  const changeSet = {
    added: previousChapter ? [] : ['chapters.conceptGeneration'],
    updated: previousChapter ? ['chapters.conceptGeneration'] : [],
    removed: [],
  };
  return {
    blueprint: next,
    chapter,
    execution,
    changeSet,
    version: {
      milestoneVersion: BLUEPRINT_MILESTONES.CONCEPTS_GENERATED,
      revision,
      createdAt: completedAt,
      createdBy: 'agent-2',
      title: previousChapter ? '概念生成更新' : '概念生成完成',
      summary: previousChapter ? `按补充要求重新生成 3 个概念候选（r${revision}）` : '形成三个策略本质不同的概念候选',
      changedSections,
    },
  };
}
