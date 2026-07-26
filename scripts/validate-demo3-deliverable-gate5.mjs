import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createBlueprint } from '../src/blueprint/blueprintModel.js';
import {
  applyAgentPatch,
  canRunAgent,
  confirmCheckpoint,
  getNextRunnableAgent,
  invalidateDownstream,
  updateDesignerDecision,
} from '../src/blueprint/blueprintService.js';
import { migrateBlueprintToV2 } from '../src/blueprint/blueprintMigration.js';
import {
  isRoadshowResultsReady,
  selectPresentationArtifact,
  selectPresentationTrace,
  selectRoadshowResults,
} from '../src/blueprint/blueprintSelectors.js';
import { validatePresentationArtifact } from '../src/blueprint/presentationArtifactService.js';
import {
  approvePendingDesignStatementSections,
  buildDesignStatement,
} from '../src/blueprint/designStatementService.js';
import {
  confirmProjectDefinitionBlueprint,
  runProjectDefinitionAgent,
} from '../src/agents/projectDefinitionAgent.js';
import { runConceptGenerationAgent } from '../src/agents/conceptGenerationAgent.js';
import { DEMO_CASE, DEMO_FILES } from '../src/data/demoCase.js';
import { mockAgentProvider } from '../src/providers/mockAgentProvider.js';
import { demoPresentationArtifactProvider } from '../src/providers/demoPresentationArtifactProvider.js';

const sha256 = (buffer) => createHash('sha256').update(buffer).digest('hex');
const fullReview = {
  presentationReview: {
    checks: {
      contentComplete: true,
      schemeConsistent: true,
      pendingPreserved: true,
      filesComplete: true,
    },
    comment: '四项复核完成，确认进入最终交付。',
  },
};

async function runThroughGate4() {
  const input = { ...DEMO_CASE, siteFiles: DEMO_FILES };
  let blueprint = createBlueprint(input, 'demo3-deliverable-gate5');
  blueprint = runProjectDefinitionAgent(input, blueprint).blueprint;
  blueprint = confirmProjectDefinitionBlueprint(blueprint).blueprint;
  blueprint = runConceptGenerationAgent(blueprint, { mode: 'demo' }).blueprint;
  blueprint = applyAgentPatch(blueprint, 3, await mockAgentProvider.runAgent(3, blueprint, { delayMs: 0 }), 'Demo-3 Agent 3');
  const selectedConceptId = blueprint.agentRecommendation.conceptId;
  blueprint = updateDesignerDecision(blueprint, {
    selectedConceptId,
    acceptedRecommendation: true,
    decisionReason: 'Demo-3 验证人工选择当前方案',
  });
  blueprint = confirmCheckpoint(blueprint, 'checkpoint-2', { selectedConceptId }, 'Demo-3 验证设计师');
  blueprint = applyAgentPatch(blueprint, 4, await mockAgentProvider.runAgent(4, blueprint, { delayMs: 0 }), 'Demo-3 Agent 4');
  blueprint = buildDesignStatement(blueprint);
  blueprint = approvePendingDesignStatementSections(blueprint, 'Demo-3 验证设计师');
  blueprint = confirmCheckpoint(blueprint, 'checkpoint-3', { source: 'Design Statement' }, 'Demo-3 验证设计师');
  blueprint = applyAgentPatch(blueprint, 5, await mockAgentProvider.runAgent(5, blueprint, { delayMs: 0 }), 'Demo-3 Agent 5');
  blueprint = confirmCheckpoint(blueprint, 'checkpoint-4', {
    visualSelection: {
      scene: 'children',
      visualTaskId: 'VT-CHILDREN',
      candidateId: 'V02B',
      reasons: ['与总平空间关系更一致', '尺度感更可信'],
      comment: '采用已确认的浅层安全亲水视觉方向。',
    },
  }, 'Demo-3 验证设计师');
  return blueprint;
}

let blueprint = await runThroughGate4();
const gate4Blueprint = blueprint;

// A–C: Agent 6 can run only after all approved upstream results and Gate 4.
assert.equal(canRunAgent(blueprint, 6), true);
assert.equal(getNextRunnableAgent(blueprint), 6);
assert.throws(
  () => applyAgentPatch(gate4Blueprint, 6, {
    deliverableArtifacts: { designStatement: null },
  }),
  /无权写入成果字段/,
);
const patch = await mockAgentProvider.runAgent(6, blueprint, { delayMs: 0 });
assert.ok(patch.deliverableArtifacts.presentation);
blueprint = applyAgentPatch(blueprint, 6, patch, 'Demo-3 Agent 6 成果登记');
const artifact = selectPresentationArtifact(blueprint);
assert.equal(blueprint.currentCheckpoint, 'checkpoint-5');
assert.equal(blueprint.agentRuns[6].status, 'done');
assert.equal(blueprint.status, 'review');
assert.equal(blueprint.officialPackageStatus, '待汇报成果确认');
assert.equal(isRoadshowResultsReady(blueprint), false);

// D–H: the registered artifact is the exact 14-page image deck, never a fake PPTX.
assert.equal(artifact.artifactType, 'presentationImageDeck');
assert.equal(artifact.role, 'finalPresentationDeliverable');
assert.equal(artifact.generationMode, 'externalAgentGenerated');
assert.equal(artifact.generationProvider, 'WorkBuddy Agent');
assert.equal(artifact.editable, false);
assert.equal(artifact.isFactSource, false);
assert.equal(artifact.pageCount, 14);
assert.deepEqual(artifact.pages.map((page) => page.pageNumber), Array.from({ length: 14 }, (_, index) => index + 1));
assert.equal(validatePresentationArtifact(blueprint, artifact).valid, true);
assert.doesNotMatch(JSON.stringify({
  artifactType: artifact.artifactType,
  pages: artifact.pages,
  downloadRef: artifact.downloadRef,
}), /\.pptx|R01_original_presentation|historicalPresentationReference/i);

const pageHashes = [];
artifact.pages.forEach((page) => {
  const path = new URL(`../public/${page.runtimeRef.replace(/^\.\//, '')}`, import.meta.url);
  assert.equal(existsSync(path), true, `${page.fileName} 必须存在`);
  const bytes = readFileSync(path);
  assert.equal(bytes.subarray(1, 4).toString(), 'PNG');
  assert.equal(bytes.length, page.fileSize);
  assert.equal(sha256(bytes), page.fileHash);
  assert.equal(page.width, 3936);
  assert.equal(page.height, 2256);
  pageHashes.push(page.fileHash);
});
assert.equal(artifact.deckHashAlgorithm, 'sha256(join(page.fileHash ordered P01-P14, newline))');
assert.equal(sha256(Buffer.from(pageHashes.join('\n'))), artifact.deckHash);

// I: ZIP is a real downloadable package containing 14 PNG pages plus the manifest.
const zipUrl = new URL(`../public/${artifact.downloadRef.replace(/^\.\//, '')}`, import.meta.url);
assert.equal(existsSync(zipUrl), true);
const zipBytes = readFileSync(zipUrl);
assert.equal(zipBytes.length, artifact.download.fileSize);
assert.equal(sha256(zipBytes), artifact.download.fileHash);
const zipList = spawnSync('unzip', ['-Z1', fileURLToPath(zipUrl)], { encoding: 'utf8' });
assert.equal(zipList.status, 0);
const zipEntries = zipList.stdout.trim().split('\n').filter(Boolean);
assert.equal(zipEntries.filter((entry) => /\.png$/i.test(entry)).length, 14);
assert.ok(zipEntries.some((entry) => /presentation_manifest_v1\.json$/.test(entry)));

// J–K: registration and quality review are separately traceable.
const traceBeforeReview = selectPresentationTrace(blueprint);
assert.ok(traceBeforeReview.some((event) => event.type === 'presentation-artifact-registration' && event.pageCount === 14));
assert.ok(traceBeforeReview.some((event) => event.type === 'presentation-quality-review'));

// L–M: Gate 5 cannot be bypassed with missing checks, then completes the project with a real review event.
assert.throws(
  () => confirmCheckpoint(blueprint, 'checkpoint-5', {
    presentationReview: { checks: { contentComplete: true } },
  }),
  /全部复核项|Gate 5/,
);
blueprint = confirmCheckpoint(blueprint, 'checkpoint-5', fullReview, 'Demo-3 验证设计师');
assert.equal(blueprint.checkpoints.find((item) => item.id === 'checkpoint-5').status, '已确认');
assert.equal(blueprint.deliverableArtifacts.presentation.review.status, 'confirmed');
assert.equal(blueprint.status, 'completed');
assert.equal(blueprint.stage, 'completed');
assert.equal(blueprint.officialPackageStatus, '已完成');
assert.equal(isRoadshowResultsReady(blueprint), true);
assert.ok(selectPresentationTrace(blueprint).some((event) => event.type === 'presentation-deliverable-review' && event.action === 'confirmed'));

// N: Results exposes the same registered pages and real ZIP.
const results = selectRoadshowResults(blueprint);
assert.equal(results.presentation.pageCount, 14);
assert.equal(results.presentation.slides[0].image, artifact.pages[0].runtimeRef);
assert.equal(results.presentation.slides[13].image, artifact.pages[13].runtimeRef);
assert.equal(results.presentation.fileUrl, artifact.downloadRef);
assert.equal(results.summary.find((item) => item.key === 'presentation').value, 14);

// O: reload preserves artifact, download information, trace and Gate 5.
const reloaded = migrateBlueprintToV2(JSON.parse(JSON.stringify(blueprint)));
assert.equal(reloaded.deliverableArtifacts.presentation.deckHash, artifact.deckHash);
assert.equal(reloaded.deliverableArtifacts.presentation.download.fileHash, artifact.download.fileHash);
assert.equal(reloaded.checkpoints.find((item) => item.id === 'checkpoint-5').status, '已确认');
assert.equal(isRoadshowResultsReady(reloaded), true);

// P: upstream visual/professional changes make Agent 6, its artifact and Gate 5 stale without deleting history.
const invalidated = invalidateDownstream(
  blueprint,
  ['professionalStrategies'],
  'Demo-3 专业策略修改验证',
);
assert.equal(invalidated.agentRuns[5].status, 'stale');
assert.equal(invalidated.agentRuns[6].status, 'stale');
assert.equal(invalidated.deliverableArtifacts.presentation.status, 'stale');
assert.equal(invalidated.checkpoints.find((item) => item.id === 'checkpoint-5').status, '需重新确认');
assert.equal(invalidated.deliverableArtifacts.presentation.deckHash, artifact.deckHash);
assert.equal(isRoadshowResultsReady(invalidated), false);

// Q: no other project can receive the Huanlegu presentation without an explicit project binding.
const other = createBlueprint({
  projectName: '滨水商业街区景观设计',
  city: '宁波市海曙区',
  area: '26000',
  projectType: '商业公共空间',
}, 'demo3-cross-project');
assert.throws(
  () => demoPresentationArtifactProvider.createPatch(other),
  /未显式绑定/,
);
assert.doesNotMatch(JSON.stringify(other), /huanlegu|欢乐谷|7081b6cf|景观概念方案汇报\.zip/i);

// R: active UI uses the actual deck/ZIP and contains no fake editable-deliverable claims.
const activeUi = [
  '../src/components/PresentationDeliverable.jsx',
  '../src/components/PresentationDeckViewer.jsx',
  '../src/components/CheckpointPanel.jsx',
  '../src/components/roadshow/RoadshowMode.jsx',
].map((path) => readFileSync(new URL(path, import.meta.url), 'utf8')).join('\n');
assert.match(activeUi, /查看方案汇报/);
assert.match(activeUi, /下载完整成果包/);
assert.match(activeUi, /确认最终成果/);
assert.doesNotMatch(activeUi, /下载可编辑 PPT|生成可编辑 PPT|PPTX 待后续接入/);
assert.equal(statSync(zipUrl).isFile(), true);

console.log('✓ A–F Agent 6 前置条件、14 页真实成果登记、文件/页码/hash 校验通过');
console.log('✓ G–K 外部专业 Agent provenance、非事实源、真实 ZIP 与双 Trace 校验通过');
console.log('✓ L–O Gate 5 强制复核、最终完成状态、Results 与 reload persistence 校验通过');
console.log('✓ P–R 下游失效、跨项目隔离与活跃 UI 防伪交付回归校验通过');
