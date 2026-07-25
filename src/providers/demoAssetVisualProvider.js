import { CONTENT_STATUS, getRecordValue } from '../blueprint/blueprintModel.js';
import {
  selectConceptCandidate,
  selectDesignPreferences,
  selectPendingConstraints,
  selectProjectInputForAgents,
} from '../blueprint/blueprintSelectors.js';
import { getDemoAssetBinding } from '../data/demoAssetBindings.js';

const asText = (value, fallback = '') => String(getRecordValue(value, value) || '').trim() || fallback;
const clone = (value) => JSON.parse(JSON.stringify(value));

function sourceTag(item) {
  return {
    id: item.id || '',
    label: item.label || item.topic || '设计偏好',
    value: item.value || item.statement || '',
    status: item.status || 'preference',
    sourceType: item.sourceType || item.provenance?.sourceType || '',
    sourceId: item.sourceId || item.provenance?.sourceId || '',
  };
}

function genericCandidates(concept, task) {
  const conceptName = concept?.name || '已确认概念';
  return [
    {
      id: 'VG-A',
      visualTaskId: task.id,
      assetType: 'VisualCandidate',
      scene: task.scene,
      role: 'visualCandidate',
      name: `A｜${conceptName}的开放体验候选`,
      coreIntent: '以当前 Blueprint 的空间结构与专业策略组织开放、可达的项目使用场景。',
      pros: ['空间关系表达直接', '便于校核主要使用路径'],
      concerns: ['当前无绑定演示图，画面待后续视觉生产'],
      url: '',
      assetRef: '',
      sourceBlueprintFields: task.sourceBlueprintFields,
      status: CONTENT_STATUS.PENDING,
      candidateStatus: 'candidate',
      selectedVisual: false,
      provenance: { candidateOrigin: 'runtimeVisualBrief' },
      isFactSource: false,
      riskNotes: ['不得由候选画面反推项目事实'],
    },
    {
      id: 'VG-B',
      visualTaskId: task.id,
      assetType: 'VisualCandidate',
      scene: task.scene,
      role: 'visualCandidate',
      name: `B｜${conceptName}的自然体验候选`,
      coreIntent: '以当前 Blueprint 的植物、运营与节点策略组织自然、克制的项目使用场景。',
      pros: ['专业策略关系清晰', '视觉表达保持克制'],
      concerns: ['当前无绑定演示图，画面待后续视觉生产'],
      url: '',
      assetRef: '',
      sourceBlueprintFields: task.sourceBlueprintFields,
      status: CONTENT_STATUS.PENDING,
      candidateStatus: 'candidate',
      selectedVisual: false,
      provenance: { candidateOrigin: 'runtimeVisualBrief' },
      isFactSource: false,
      riskNotes: ['不得由候选画面反推项目事实'],
    },
  ];
}

export class DemoAssetVisualProvider {
  constructor(name = 'Cached Demo Asset Provider') {
    this.name = name;
  }

  createPatch(blueprint) {
    const project = selectProjectInputForAgents(blueprint);
    const concept = selectConceptCandidate(blueprint, blueprint.designerDecision?.selectedConceptId);
    const preferences = selectDesignPreferences(blueprint);
    const pendingConstraints = selectPendingConstraints(blueprint);
    const waterPreference = preferences.find((item) => (
      item.id === 'DP-06'
      || item.sourceType === 'preliminaryResidentResearch'
      || item.provenance?.sourceType === 'preliminaryResidentResearch'
      || /亲水|水互动/.test(`${item.label || ''}${item.value || ''}`)
    ));
    const binding = getDemoAssetBinding(blueprint.project?.demoAssetBinding);
    const sourceBlueprintFields = [
      'designerDecision.selectedConceptId',
      'deliverableArtifacts.designStatement',
      'spatialStructure',
      'functionalZones',
      'featureNodes',
      'circulationStrategy',
      'professionalStrategies.plant',
      'professionalStrategies.operations',
      ...(waterPreference ? [`designPreferences.${waterPreference.id || 'waterExperience'}`] : ['designPreferences']),
      'designerJudgments',
      'pendingVerification',
    ];
    const visualTask = {
      id: 'VT-CHILDREN',
      scene: 'children',
      title: '儿童活动场景视觉方向',
      objective: waterPreference
        ? '比较安全浅层亲水与自然低维护两类候选，回应偏好但不把偏好升级为工程事实。'
        : '比较两类儿童活动场景表达；具体人群需求与设施条件仍待确认。',
      selectedConceptId: concept?.id || '',
      selectedConceptName: concept?.name || '待确认',
      designStatementRevision: blueprint.deliverableArtifacts?.designStatement?.statementRevision || null,
      spatialStructure: asText(blueprint.spatialStructure, '空间结构待确认'),
      functionalZoneRefs: (blueprint.functionalZones || []).map((item) => item.id),
      featureNodeRefs: (blueprint.featureNodes || []).map((item) => item.id),
      preferenceSources: waterPreference ? [sourceTag(waterPreference)] : [],
      pendingItems: [
        ...pendingConstraints.map(sourceTag),
        ...(blueprint.pendingVerification || []).map(sourceTag),
      ],
      sourceBlueprintFields,
      status: CONTENT_STATUS.AI_SUGGESTED,
      isFactSource: false,
    };
    const analysisAssets = clone(binding?.analysisAssets || []);
    const visualCandidates = clone(binding?.visualCandidates || genericCandidates(concept, visualTask));
    return {
      visualTasks: [visualTask],
      analysisAssets,
      visualCandidates,
      visualReview: {
        status: 'pending',
        checkpointId: 'checkpoint-4',
        sourceBlueprintRevision: blueprint.revision ?? blueprint.currentVersion,
        candidateCount: visualCandidates.length,
        sceneCount: 1,
        selectionRequired: true,
      },
      visualAssets: visualCandidates.map((candidate) => ({
        id: candidate.id,
        title: candidate.name,
        assetType: candidate.assetType,
        scene: candidate.scene,
        role: candidate.role,
        url: candidate.url,
        assetRef: candidate.assetRef,
        sourceBlueprintFields: candidate.sourceBlueprintFields,
        provenance: candidate.provenance,
        candidateStatus: candidate.candidateStatus,
        isFactSource: false,
        status: candidate.status,
      })),
      qualityReview: [
        {
          check: '视觉—Blueprint 一致性',
          result: `${visualCandidates.length} 个候选均绑定视觉任务及源 Blueprint 字段，尚未自动选定。`,
          level: 'pass',
        },
        {
          check: '偏好—事实边界',
          result: waterPreference
            ? '儿童亲水来自前期调研偏好，仅用于候选方向，不构成工程决定。'
            : '未发现已确认亲水偏好，视觉任务不形成亲水工程结论。',
          level: 'pass',
        },
      ],
      risks: [{
        title: '视觉非事实源',
        value: `视觉候选不得反向覆盖 Blueprint；${pendingConstraints.length + (blueprint.pendingVerification || []).length} 项待复核条件继续保留。`,
        status: CONTENT_STATUS.PENDING,
      }],
      nextTasks: [{
        title: 'Gate 4 视觉方案挑选',
        value: '由设计师比较候选并记录选择理由；确认前不写入 selectedVisuals。',
        status: CONTENT_STATUS.PENDING,
      }],
    };
  }
}

export const demoAssetVisualProvider = new DemoAssetVisualProvider();
