import { getPresentationArtifactBinding } from '../data/presentationArtifactBindings.js';
import {
  createPresentationContentFingerprint,
  validatePresentationArtifact,
} from '../blueprint/presentationArtifactService.js';
import { selectPresentationDeliverableInput } from '../blueprint/blueprintSelectors.js';

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export class DemoPresentationArtifactProvider {
  constructor() {
    this.name = 'External Presentation Artifact Provider';
  }

  createPatch(blueprint) {
    const input = selectPresentationDeliverableInput(blueprint);
    const binding = getPresentationArtifactBinding(input.demoArtifactBinding);
    if (!binding || binding.projectId !== input.projectId) {
      throw new Error('当前项目未显式绑定可交付的方案汇报成果');
    }

    const registeredAt = new Date().toISOString();
    const sourceBlueprintRevision = blueprint.revision ?? blueprint.currentVersion ?? 0;
    const sourceDesignStatementRevision = input.designStatement?.statementRevision ?? null;
    const sourceVisualReviewRevision = input.visualReview?.revision
      ?? input.visualReview?.sourceBlueprintRevision
      ?? null;
    const artifact = {
      ...clone(binding),
      pages: binding.pages.map((page) => ({ ...clone(page), isFactSource: false })),
      sourceBlueprintRevision,
      sourceDesignStatementRevision,
      sourceVisualReviewRevision,
      contentFingerprint: createPresentationContentFingerprint(blueprint, {
        sourceBlueprintRevision,
        sourceDesignStatementRevision,
        sourceVisualReviewRevision,
      }),
      registeredAt,
      downloadRef: binding.download.runtimeRef,
      validation: {
        pagesComplete: true,
        allPagesReadable: true,
        pageNumbersContinuous: true,
        hashesVerified: true,
        checkedAt: registeredAt,
      },
    };
    const validation = validatePresentationArtifact(blueprint, artifact);
    if (!validation.valid) throw new Error(`方案汇报成果校验失败：${validation.errors.join('；')}`);

    const presentationSummary = {
      projectName: input.project.projectName,
      selectedConceptId: input.selectedConcept?.id || '',
      selectedConceptName: input.selectedConcept?.name || '待确认',
      artifactType: artifact.artifactType,
      pageCount: artifact.pageCount,
      analysisAssetCount: input.analysisAssets.length,
      selectedVisualNames: input.selectedVisuals.map((item) => item.candidateName || item.visualAssetId),
      pendingVerificationCount: input.pendingVerification.length,
      editable: artifact.editable,
      artifactRevision: artifact.revision,
      status: 'current',
    };
    const qualityReview = [
      { id: 'presentation-content-complete', check: '汇报内容完整', result: 'P01–P14 页码连续，14 页成果文件全部存在且可读取。', level: 'pass' },
      { id: 'presentation-scheme-consistent', check: '图文与当前方案一致', result: `成果绑定当前方案 ${input.selectedConcept?.id || '—'}｜${input.selectedConcept?.name || '待确认'}、Design Statement r${sourceDesignStatementRevision || '—'} 与 Gate 4 视觉选择。`, level: 'pass' },
      { id: 'presentation-pending-preserved', check: '待深化事项已正确保留', result: `${input.pendingVerification.length} 项 pendingVerification 继续保留在 Blueprint，不由汇报页面反向改写。`, level: 'pass' },
      { id: 'presentation-files-complete', check: '14 页成果文件完整可查看', result: `每页 PNG 尺寸、大小与 SHA-256 已登记；deck hash：${artifact.deckHash.slice(0, 12)}…`, level: 'pass' },
    ];
    const pptOutline = artifact.pages.map((page) => ({
      page: String(page.pageNumber).padStart(2, '0'),
      title: page.title,
      content: `外部专业 Agent 已生产的第 ${page.pageNumber} 页方案汇报成果。`,
      upScreenCopy: page.title,
      suggestedVisual: page.fileName,
      sourceFields: ['deliverableArtifacts.presentation', 'pages'],
      image: page.runtimeRef,
      status: '已生成',
    }));

    return {
      presentationSummary,
      deliverableArtifacts: {
        presentation: artifact,
      },
      schemeNarrative: {
        title: `${input.project.projectName}｜成果交付摘要`,
        sections: [
          { title: '当前方案', value: `${input.selectedConcept?.id || '—'}｜${input.selectedConcept?.name || '待确认'}` },
          { title: '汇报成果', value: `${artifact.pageCount} 页景观概念方案汇报成果已准备。` },
          { title: '成果边界', value: 'Presentation Image Deck 是当前 Blueprint 的成果快照，不是项目事实源。' },
        ],
        status: 'AI建议',
      },
      pptOutline,
      pptStructure: pptOutline,
      qualityReview,
      outputArtifacts: [
        { type: '设计说明', state: '已完成分项复核', action: 'design-statement' },
        { type: '专业分析图', state: `${input.analysisAssets.length} 项已登记`, action: 'analysis' },
        { type: '重点视觉成果', state: `${input.selectedVisuals.length} 项已确认`, action: 'visual' },
        {
          type: '景观概念方案汇报',
          state: `${artifact.pageCount} 页成果已生成`,
          action: 'presentation',
          downloadRef: artifact.downloadRef,
          fileName: artifact.download.fileName,
        },
      ],
      risks: [{
        title: '成果文件边界',
        value: '当前正式汇报成果为 14 页 PNG presentation image deck，不是 PPTX，也不标记为可编辑。',
        status: '待确认',
      }],
      nextTasks: [{
        title: 'Gate 5｜汇报成果确认',
        value: '复核汇报完整性、方案一致性、待深化事项和 14 页文件可查看性。',
        status: '待确认',
      }],
    };
  }
}

export const demoPresentationArtifactProvider = new DemoPresentationArtifactProvider();
