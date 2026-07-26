const REQUIRED_GATE5_CHECKS = [
  'contentComplete',
  'schemeConsistent',
  'pendingPreserved',
  'filesComplete',
];

function fnv1a(input) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function createPresentationContentFingerprint(blueprint, source = {}) {
  const artifact = source.artifact || blueprint?.deliverableArtifacts?.presentation || {};
  const payload = {
    projectId: blueprint?.project?.projectId || blueprint?.projectId || '',
    sourceBlueprintRevision: source.sourceBlueprintRevision
      ?? artifact.sourceBlueprintRevision
      ?? blueprint?.revision
      ?? blueprint?.currentVersion
      ?? 0,
    selectedConceptId: blueprint?.designerDecision?.selectedConceptId || '',
    sourceDesignStatementRevision: source.sourceDesignStatementRevision
      ?? artifact.sourceDesignStatementRevision
      ?? blueprint?.deliverableArtifacts?.designStatement?.statementRevision
      ?? null,
    selectedVisualIds: (blueprint?.selectedVisuals || [])
      .filter((item) => item.selectionStatus !== 'stale')
      .map((item) => item.candidateId || item.visualAssetId || item.id)
      .sort(),
    sourceVisualReviewRevision: source.sourceVisualReviewRevision
      ?? artifact.sourceVisualReviewRevision
      ?? blueprint?.visualReview?.revision
      ?? blueprint?.visualReview?.sourceBlueprintRevision
      ?? null,
    analysisAssetIds: (blueprint?.analysisAssets || []).map((item) => item.id).sort(),
  };
  return `lf-presentation-${fnv1a(JSON.stringify(payload))}`;
}

export function validatePresentationArtifact(blueprint, artifact) {
  const errors = [];
  if (!artifact) errors.push('最终汇报成果尚未注册');
  if (artifact?.artifactType !== 'presentationImageDeck') errors.push('成果类型不是 presentationImageDeck');
  if (artifact?.role !== 'finalPresentationDeliverable') errors.push('成果角色不是 finalPresentationDeliverable');
  if (artifact?.status !== 'current') errors.push('汇报成果已失效或不是当前成果');
  if (artifact?.pageCount !== 14) errors.push('汇报成果必须包含 14 页');
  if (!Array.isArray(artifact?.pages) || artifact.pages.length !== 14) errors.push('14 页成果清单不完整');
  if (artifact?.generationMode !== 'externalAgentGenerated') errors.push('成果生产方式记录不正确');
  if (artifact?.generationProvider !== 'WorkBuddy Agent') errors.push('成果生产来源记录不正确');
  if (artifact?.editable !== false) errors.push('PNG 汇报成果不得标记为可编辑');
  if (artifact?.isFactSource !== false) errors.push('汇报成果必须明确标记为非事实源');
  if (!artifact?.deckHash) errors.push('缺少 deck hash');
  if (!artifact?.downloadRef || !artifact?.download?.fileHash) errors.push('成果包下载信息不完整');

  const pages = artifact?.pages || [];
  const pageNumbers = pages.map((page) => page.pageNumber);
  if (new Set(pageNumbers).size !== pageNumbers.length) errors.push('汇报成果存在重复页码');
  if (pageNumbers.some((number, index) => number !== index + 1)) errors.push('汇报成果页码不连续');
  pages.forEach((page) => {
    if (!page.fileName || !page.runtimeRef || !page.fileHash) errors.push(`P${String(page.pageNumber).padStart(2, '0')} metadata 不完整`);
    if (!page.readable || !page.validPng || !page.width || !page.height || !page.fileSize) {
      errors.push(`P${String(page.pageNumber).padStart(2, '0')} 文件不可读取或 PNG 校验未通过`);
    }
  });

  const currentFingerprint = artifact
    ? createPresentationContentFingerprint(blueprint, { artifact })
    : '';
  if (artifact?.contentFingerprint !== currentFingerprint) errors.push('成果 content fingerprint 与当前项目状态不匹配');

  const registeredFiles = [
    artifact?.artifactType,
    artifact?.downloadRef,
    artifact?.download?.fileName,
    artifact?.download?.runtimeRef,
    ...pages.flatMap((page) => [page.fileName, page.runtimeRef, page.assetRef]),
  ].filter(Boolean).join(' ');
  if (/R01_original_presentation|historicalPresentationReference/.test(registeredFiles)) {
    errors.push('历史参考 PPT 不能注册为当前成果');
  }
  if (/\.pptx(?:[?#]|$|\s)/i.test(registeredFiles) || artifact?.artifactType === 'pptx') {
    errors.push('本轮不得注册假的 PPTX 成果');
  }

  return {
    valid: errors.length === 0,
    errors,
    currentFingerprint,
  };
}

export function validateGate5Review(review = {}) {
  const checks = review.checks || {};
  const missing = REQUIRED_GATE5_CHECKS.filter((key) => checks[key] !== true);
  return {
    valid: missing.length === 0,
    missing,
  };
}

export { REQUIRED_GATE5_CHECKS };
