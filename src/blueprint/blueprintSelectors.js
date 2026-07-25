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

export function selectRoadshowAgentSummaries(blueprint) {
  const selected = selectConceptCandidate(blueprint, blueprint?.designerDecision?.selectedConceptId);
  const zones = asArray(blueprint?.functionalZones);
  const visualTasks = asArray(blueprint?.visualTasks);
  const visualAssets = asArray(blueprint?.visualAssets);
  const pptOutline = asArray(blueprint?.pptOutline || blueprint?.pptStructure);
  const artifacts = asArray(blueprint?.outputArtifacts);
  const definitions = [
    { id: 1, name: '前期分析', result: selectAgent1ExecutionSummary(blueprint) },
    { id: 2, name: '概念生成', result: selectAgent2ExecutionSummary(blueprint) },
    {
      id: 3,
      name: '方案比选',
      result: selected
        ? `已完成概念比选，设计师最终选择 ${selected.code || selected.id}｜${selected.name}`
        : '已形成概念比选，等待设计师确认方向',
    },
    {
      id: 4,
      name: '空间推演',
      result: blueprint?.spatialStructure
        ? `已形成“${blueprint.spatialStructure.title || text(blueprint.spatialStructure)}”及 ${zones.length} 个功能/场景分区`
        : '等待形成空间结构与功能分区',
    },
    {
      id: 5,
      name: '视觉表达',
      result: visualTasks.length
        ? `已组织 ${visualTasks.length} 项视觉任务，并关联 ${visualAssets.length} 项视觉成果`
        : '等待组织视觉任务与成果',
    },
    {
      id: 6,
      name: '成果输出',
      result: pptOutline.length
        ? `已生成 ${pptOutline.length} 页汇报结构与 ${artifacts.length} 类成果清单`
        : '等待生成汇报结构与成果清单',
    },
  ];
  return definitions.map((agent) => ({
    ...agent,
    status: blueprint?.agentRuns?.[agent.id]?.status || 'pending',
  }));
}

export function isRoadshowResultsReady(blueprint) {
  if (!blueprint) return false;
  const allAgentsDone = [1, 2, 3, 4, 5, 6].every((agentId) => blueprint.agentRuns?.[agentId]?.status === 'done');
  const pptOutline = asArray(blueprint.pptOutline || blueprint.pptStructure);
  return allAgentsDone && pptOutline.length > 0;
}

function selectPptImage(page, index, assets) {
  const sourceText = `${asArray(page?.sourceFields).join(' ')} ${page?.title || ''} ${page?.suggestedVisual || ''}`;
  if (/conceptGeneration|designerDecision|概念|方案比选/.test(sourceText)) return assets.concept;
  if (/spatialStructure|functionalZones|circulationStrategy|总平|空间结构|功能分区|游线/.test(sourceText)) return assets.plan;
  if (/professionalStrategies|植物|材料|生态|环境策略/.test(sourceText)) return assets.analysis[0] || assets.plan;
  if (/visualTasks|visualAssets|视觉|场景/.test(sourceText) && assets.renderings.length) {
    return assets.renderings[index % assets.renderings.length];
  }
  return assets.renderings[index % Math.max(assets.renderings.length, 1)] || assets.concept || assets.plan || null;
}

export function selectRoadshowResults(blueprint) {
  const projectInput = selectProjectInputForAgents(blueprint);
  const definitionDetails = selectProjectDefinitionDetails(blueprint);
  const selectedConcept = selectConceptCandidate(blueprint, blueprint?.designerDecision?.selectedConceptId);
  const candidates = selectConceptCandidates(blueprint);
  const schemeSections = asArray(blueprint?.schemeNarrative?.sections);
  const positioning = schemeSections.find((item) => item.title === '设计定位')?.value
    || selectedConcept?.proposition
    || selectedConcept?.narrative
    || '项目设计定位待 Blueprint 完善';
  const spatialStructure = blueprint?.spatialStructure || null;
  const functionalZones = asArray(blueprint?.functionalZones);
  const featureNodes = asArray(blueprint?.featureNodes);
  const professionalStrategies = blueprint?.professionalStrategies || {};
  const planAsset = spatialStructure?.planAsset
    || (spatialStructure?.planImage ? {
      id: 'legacy-plan',
      title: spatialStructure.title || '空间策略总平面',
      assetType: '总平面图',
      url: spatialStructure.planImage,
      isDemoAsset: Boolean(spatialStructure.isDemoAsset),
    } : null);
  const analysisAssets = asArray(spatialStructure?.analysisAssets).map((asset) => {
    const content = /功能分区/.test(`${asset.title} ${asset.assetType}`)
      ? functionalZones.map((item) => item.name || text(item)).filter(Boolean).join('、')
      : /动线|交通|游线/.test(`${asset.title} ${asset.assetType}`)
        ? text(blueprint?.circulationStrategy)
        : [professionalStrategies.ecology, professionalStrategies.plant].filter(Boolean).join('；');
    return {
      ...asset,
      content: content || '分析结论待 Blueprint 进一步深化',
    };
  });
  const visualTasks = asArray(blueprint?.visualTasks);
  const visualAssets = asArray(blueprint?.visualAssets);
  const planVisuals = visualAssets.filter((asset) => /总平|正投影/.test(`${asset.assetType || ''} ${asset.angle || ''}`));
  const analysisVisuals = visualAssets.filter((asset) => /分析/.test(`${asset.assetType || ''} ${asset.angle || ''}`));
  const renderings = visualAssets.filter((asset) => !planVisuals.includes(asset) && !analysisVisuals.includes(asset));
  const pptOutline = asArray(blueprint?.pptOutline || blueprint?.pptStructure);
  const pptArtifact = asArray(blueprint?.outputArtifacts).find((item) => item.action === 'ppt' || /PPT/i.test(item.type || ''));
  const imageSources = {
    concept: selectedConcept?.referenceVisual || null,
    plan: planAsset || planVisuals[0] || null,
    analysis: analysisVisuals,
    renderings,
  };
  const slides = pptOutline.map((page, index) => {
    const imageAsset = selectPptImage(page, index, imageSources);
    return {
      number: page.page || index + 1,
      title: page.title || `第 ${index + 1} 页`,
      content: page.content || page.upScreenCopy || '',
      upScreenCopy: page.upScreenCopy || page.content || '',
      suggestedVisual: page.suggestedVisual || '视觉内容待深化',
      sourceFields: asArray(page.sourceFields),
      image: imageAsset?.url || '',
      imageAsset,
    };
  });
  const project = {
    projectName: projectInput.projectName,
    location: projectInput.city,
    city: projectInput.city,
    area: projectInput.area,
    projectType: projectInput.projectType,
  };
  const summary = [
    { key: 'definition', value: blueprint?.chapters?.projectDefinition ? 1 : 0, label: '份项目定义' },
    { key: 'concepts', value: candidates.length, label: '个概念候选' },
    { key: 'masterplan', value: planAsset ? 1 : 0, label: '张总平面' },
    { key: 'analysis', value: analysisAssets.length, label: '项分析内容' },
    { key: 'visual', value: visualAssets.length, label: '项视觉成果' },
    { key: 'ppt', value: pptOutline.length, label: '页 PPT 结构' },
  ];
  return {
    project,
    summary,
    definition: {
      positioning,
      selectedConcept,
      selectedConceptId: blueprint?.designerDecision?.selectedConceptId || '',
      conceptImage: selectedConcept?.referenceVisual || null,
      strategies: [selectedConcept?.strategicFocus, ...asArray(selectedConcept?.keyScenes)].filter(Boolean),
      projectDefinition: definitionDetails,
    },
    spatial: {
      coreNarrative: blueprint?.coreNarrative || null,
      spatialStructure,
      functionalZones,
      circulationStrategy: blueprint?.circulationStrategy || null,
      professionalStrategies,
      featureNodes,
      planAsset,
      analysisAssets,
    },
    visual: {
      visualTasks,
      visualAssets,
      renderings,
      analysisAssets: analysisVisuals,
      planAssets: planVisuals,
      professionalStrategies,
    },
    ppt: {
      pageCount: pptOutline.length,
      fileName: `${project.projectName || '景观方案'}｜方案汇报.pptx`,
      fileUrl: pptArtifact?.fileUrl || '',
      status: pptArtifact?.fileUrl ? '可下载' : `${pptOutline.length} 页内容结构已生成；可编辑 PPTX 待后续接入`,
      slides,
      outline: pptOutline,
    },
  };
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
