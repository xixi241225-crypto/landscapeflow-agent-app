/**
 * 导出工具
 * - 导出 Markdown 报告
 * - 复制效果图 Prompt
 */
import {
  BLUEPRINT_STATUS_LABELS,
  selectConceptCandidate,
  selectConceptCandidates,
  selectConceptGeneration,
  selectProjectDefinitionDetails,
  selectProjectInputForAgents,
} from '../blueprint/blueprintSelectors.js';

/**
 * 下载 Markdown 文件
 * 支持新的 report 字段（agentEngine v2+）
 */
export function downloadMarkdown(markdownContent, projectName) {
  const content = markdownContent?.report || markdownContent || '';
  const filename = `${projectName || '方案报告'}_${new Date().toISOString().slice(0, 10)}.md`;
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadBlueprintJSON(blueprint) {
  const projectName = blueprint?.projectBasicInfo?.projectName || '项目设计蓝本';
  downloadText(
    JSON.stringify(blueprint, null, 2),
    `${safeFilename(projectName)}_Blueprint_${blueprint?.milestoneVersion || 'v0'}.json`,
    'application/json;charset=utf-8',
  );
}

export function generateBlueprintMarkdown(blueprint) {
  const project = selectProjectInputForAgents(blueprint);
  const definition = selectProjectDefinitionDetails(blueprint);
  const concept = selectConceptCandidate(blueprint, blueprint?.designerDecision?.selectedConceptId);
  const conceptGeneration = selectConceptGeneration(blueprint);
  const conceptCandidates = selectConceptCandidates(blueprint);
  const value = (record, fallback = '—') => record?.value ?? record ?? fallback;
  const list = (items, formatter) => (items?.length ? items.map(formatter).join('\n') : '- 暂无');
  const strategy = blueprint?.professionalStrategies || {};
  const status = (item) => BLUEPRINT_STATUS_LABELS[item.status] || item.status || '待确认';
  const sources = (item) => item.sourceRefs?.length
    ? item.sourceRefs.map((source) => `${source.fileName}${source.location ? `（${source.location}）` : ''}`).join('；')
    : '待补充';
  let report = `# 项目设计蓝本 ${blueprint?.milestoneVersion || 'v0'}\n\n`;
  report += `> ${project.projectName || '未命名项目'}\n`;
  report += `> LandscapeFlow AI｜景观方案设计总监智能体\n`;
  report += `> schemaVersion ${blueprint?.schemaVersion || '2.0'}｜revision ${blueprint?.revision ?? blueprint?.currentVersion ?? 0}｜导出时间：${new Date().toLocaleString('zh-CN')}\n`;
  report += `> 本文档是当前 Blueprint JSON 的 Markdown 视图，不构成第二份数据源。\n\n`;
  report += `## 项目基本信息\n\n| 字段 | 内容 | 状态 | 来源 |\n|---|---|---|---|\n`;
  definition.facts.forEach((item) => {
    report += `| ${item.label} | ${String(item.value || '—').replace(/\n/g, ' ')} | ${status(item)} | ${sources(item)} |\n`;
  });
  report += `\n## 业主与使用者\n\n${list(definition.stakeholders, (item) => `- **${item.label}**：${item.value}（${status(item)}；来源：${sources(item)}）`)}\n`;
  report += `\n## 项目目标\n\n### 显性目标\n\n${list(definition.explicitGoals, (item) => `- ${item.value}（${status(item)}；来源：${sources(item)}）`)}\n`;
  report += `\n### 深层诉求\n\n${list(definition.latentGoals, (item) => `- ${item.value}（${status(item)}；来源：${sources(item)}）`)}\n`;
  report += `\n## 场地条件\n\n${list(definition.siteConditions, (item) => `- **${item.label}**：${item.value}（${status(item)}；来源：${sources(item)}）`)}\n`;
  report += `\n## 核心约束\n\n${list(definition.constraints, (item) => `- ${item.value}（${status(item)}；来源：${sources(item)}）`)}\n`;
  report += `\n## 设计原则\n\n${list(definition.designPrinciples, (item) => `- ${item.value}（${status(item)}；来源：${sources(item)}）`)}\n`;
  report += `\n## 成功标准\n\n${list(definition.successCriteria, (item) => `- ${item.value}（${status(item)}）`)}\n`;
  report += `\n## 待补充事项\n\n${list(definition.openItems, (item) => `- **${item.label}**：${item.value}（${status(item)}）`)}\n`;
  report += `\n## 信息冲突\n\n${list(definition.conflicts, (item) => `- **${item.label}**：${item.value}（${status(item)}）`)}\n`;
  report += `\n## 资料来源\n\n${list(definition.sourceDocuments, (item) => `- ${item.fileName}｜${item.fileType}｜${item.fileSize || '未知大小'}｜${item.status}`)}\n`;
  report += `\n## 版本记录\n\n${list(blueprint.changeLog, (item) => `- ${item.milestoneVersion || `r${item.version}`}｜${item.sourceAgent}｜${item.reason}｜${new Date(item.modifiedAt).toLocaleString('zh-CN')}`)}\n`;

  report += `\n---\n\n# 后续章节\n\n`;
  report += `## 概念生成\n\n`;
  if (conceptGeneration) {
    report += `### 生成基线\n\n- Blueprint ${conceptGeneration.generatedFromVersion || 'v2'}\n- Agent 2｜概念生成\n- 生成时间：${conceptGeneration.generatedAt ? new Date(conceptGeneration.generatedAt).toLocaleString('zh-CN') : '—'}\n- 设计师补充要求：${conceptGeneration.generationRequest?.value || '无'}\n\n`;
    conceptCandidates.forEach((candidate) => {
      report += `### 方向 ${candidate.code || candidate.id}｜${candidate.name}\n\n`;
      report += `- **一句话命题**：${candidate.proposition || '—'}\n`;
      report += `- **概念叙事**：${candidate.narrative || '—'}\n`;
      report += `- **核心策略**：${candidate.strategicFocus || '—'}\n`;
      report += `- **概念级空间组织假设**：${candidate.spatialHypothesis || '—'}\n`;
      report += `- **关键场景**：${candidate.keyScenes?.join('、') || '—'}\n`;
      report += `- **优势**：${candidate.advantages?.join('；') || '—'}\n`;
      report += `- **风险**：${candidate.risks?.join('；') || '—'}\n`;
      report += `- **适用条件**：${candidate.applicableConditions?.join('；') || '—'}\n`;
      report += `- **蓝本对应关系**：${candidate.responseMappings?.map((mapping) => `${mapping.sourceLabel} → ${mapping.response}`).join('；') || '待补充'}\n`;
      report += `- **待复核资料**：${candidate.dependencies?.map((item) => item.value).join('；') || '无'}\n\n`;
    });
    report += `> 三个方向均为候选，尚未经过 Agent 3 比选及设计师最终确认。\n`;
  } else {
    report += `等待 Agent 2 写入。\n`;
  }
  report += `\n## 方案选择\n\n- Agent 推荐：${blueprint.agentRecommendation?.conceptId || '等待 Agent 3 写入'}\n- 设计师选择：${concept ? `${concept.id}｜${concept.name}` : '待确认'}\n`;
  report += `\n## 空间推演\n\n- 核心叙事：${value(blueprint.coreNarrative)}\n- 空间结构：${value(blueprint.spatialStructure)}\n- 动线策略：${value(blueprint.circulationStrategy)}\n`;
  report += `\n### 功能分区\n\n${list(blueprint.functionalZones, (item) => `- ${item.name}：${item.function}`)}\n`;
  report += `\n### 专业策略\n\n- 植物：${strategy.plant || '等待 Agent 4 写入'}\n- 材料：${strategy.material || '等待 Agent 4 写入'}\n- 生态：${strategy.ecology || '等待 Agent 4 写入'}\n- 竖向：${strategy.grading || '等待 Agent 4 写入'}\n- 排水：${strategy.drainage || '等待 Agent 4 写入'}\n`;
  report += `\n## 视觉表达\n\n${list(blueprint.visualTasks, (item) => `- ${item.id}｜${item.title}｜${item.status}`)}\n`;
  const pptOutline = blueprint.pptOutline?.length ? blueprint.pptOutline : blueprint.pptStructure;
  report += `\n## 成果输出与 PPT\n\n${list(pptOutline, (item) => `- **${item.page} ${item.title}**：${item.content}\n  - 建议视觉：${item.suggestedVisual || '—'}\n  - 数据源：${item.sourceFields?.join('、') || 'Blueprint'}`)}\n`;
  report += `\n---\n\n当前成果状态：**${blueprint.officialPackageStatus}**\n`;
  return report;
}

export function downloadBlueprintMarkdown(blueprint) {
  const projectName = blueprint?.projectBasicInfo?.projectName || '方案报告';
  downloadText(
    generateBlueprintMarkdown(blueprint),
    `${safeFilename(projectName)}_项目设计蓝本_${blueprint?.milestoneVersion || 'v0'}.md`,
    'text/markdown;charset=utf-8',
  );
}

function safeFilename(name) {
  return String(name || 'LandscapeFlow').replace(/[\\/:*?"<>|]/g, '_');
}

function downloadText(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/**
 * 复制纯文本报告到剪贴板
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    return true;
  }
}

/**
 * 合并所有 Prompt 为可复制文本
 */
export function combinePrompts(prompts) {
  return prompts
    .map((p, i) => {
      return `【${i + 1}】${p.title}\n视角：${p.angle}\n时间：${p.time}\n风格：${p.style}\n\n中文提示词：\n${p.cn}\n\nEnglish Prompt:\n${p.en}\n\n---\n`;
    })
    .join('\n');
}
