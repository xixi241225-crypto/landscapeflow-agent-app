import { cloneBlueprint, newEntityId } from './blueprintModel.js';
import { migrateBlueprintToV2 } from './blueprintMigration.js';

const now = () => new Date().toISOString();

const milestoneTitles = {
  v0: ['项目资料草稿', '项目基本信息与资料元数据已保存'],
  v1: ['项目定义完成', '形成项目事实、目标、约束、设计原则和待补充事项'],
  v2: ['项目理解已确认', '设计师确认项目事实、偏好、判断与待复核项的状态边界'],
  v3: ['概念生成完成', '形成差异化概念候选'],
  v4: ['方案选择完成', '形成多维比选与设计师概念决策'],
  v5: ['空间推演完成', '形成空间结构与专业策略'],
  v6: ['视觉表达完成', '形成视觉任务书与演示成果'],
  v7: ['成果输出完成', '形成方案报告与汇报 PPT 结构'],
};

export function createBlueprintVersion(blueprint, history = [], reason = '', metadata = {}) {
  const normalized = migrateBlueprintToV2(blueprint);
  const milestoneVersion = metadata.milestoneVersion || normalized.milestoneVersion || 'v0';
  const [defaultTitle, defaultSummary] = milestoneTitles[milestoneVersion] || ['项目设计蓝本更新', reason || '保存项目设计蓝本快照'];
  const record = {
    id: metadata.id || newEntityId('version'),
    milestoneVersion,
    version: normalized.revision ?? normalized.currentVersion ?? 0,
    revision: normalized.revision ?? normalized.currentVersion ?? 0,
    createdAt: metadata.createdAt || now(),
    createdBy: metadata.createdBy || normalized.updatedBy || 'system',
    title: metadata.title || defaultTitle,
    summary: metadata.summary || reason || defaultSummary,
    reason: reason || metadata.summary || defaultSummary,
    changedSections: metadata.changedSections || normalized.changeLog?.[0]?.fields || [],
    changeSet: metadata.changeSet || { added: [], updated: normalized.changeLog?.[0]?.fields || [], removed: [] },
    snapshot: cloneBlueprint(normalized),
  };
  const retained = history.filter((item) => (item.milestoneVersion || `v${item.version}`) !== milestoneVersion);
  return [record, ...retained].sort((a, b) => Number(String(b.milestoneVersion || '').replace('v', '')) - Number(String(a.milestoneVersion || '').replace('v', ''))).slice(0, 30);
}

function stageForMilestone(milestoneVersion) {
  const value = Number(String(milestoneVersion || 'v0').replace('v', '')) || 0;
  if (value === 0) return 'project-input';
  if (value === 1) return 'project-definition';
  if (value === 3) return 'concept-generation';
  if (value >= 7) return 'deliverables';
  return 'agent-collaboration';
}

export function restoreBlueprintVersion(history, versionId, currentBlueprint) {
  const version = history.find((item) => item.id === versionId
    || item.milestoneVersion === versionId
    || item.version === versionId
    || item.revision === versionId);
  if (!version?.snapshot) throw new Error('未找到要恢复的蓝本版本');
  const current = migrateBlueprintToV2(currentBlueprint);
  const restored = cloneBlueprint(migrateBlueprintToV2(version.snapshot));
  const restoredAt = now();
  restored.revision = Math.max(current?.revision || 0, restored.revision || 0) + 1;
  restored.currentVersion = restored.revision;
  restored.milestoneVersion = version.milestoneVersion || restored.milestoneVersion || `v${version.version || 0}`;
  restored.stage = stageForMilestone(restored.milestoneVersion);
  restored.updatedAt = restoredAt;
  restored.updatedBy = 'designer';
  restored.changeLog = [{
    id: newEntityId('change'),
    sourceAgent: '设计师',
    modifiedAt: restoredAt,
    reason: `恢复项目设计蓝本 ${restored.milestoneVersion}`,
    confirmationStatus: restored.status === 'confirmed' ? '已确认' : '待确认',
    version: restored.revision,
    milestoneVersion: restored.milestoneVersion,
    fields: ['项目状态'],
  }, ...(restored.changeLog || [])];
  return restored;
}

export function migrateVersionHistory(history = []) {
  return history.map((record) => {
    if (!record?.snapshot) return record;
    const snapshot = migrateBlueprintToV2(record.snapshot);
    return {
      ...record,
      milestoneVersion: record.milestoneVersion || snapshot.milestoneVersion || `v${record.version || 0}`,
      revision: record.revision ?? record.version ?? snapshot.revision ?? 0,
      title: record.title || milestoneTitles[record.milestoneVersion || snapshot.milestoneVersion]?.[0] || record.reason || '历史版本',
      summary: record.summary || record.reason || '',
      changedSections: record.changedSections || [],
      changeSet: record.changeSet || { added: [], updated: [], removed: [] },
      snapshot,
    };
  });
}
