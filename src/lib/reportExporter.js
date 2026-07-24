/**
 * 导出工具
 * - 导出 Markdown 报告
 * - 复制效果图 Prompt
 */

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
    `${safeFilename(projectName)}_Blueprint_v${blueprint?.currentVersion || 1}.json`,
    'application/json;charset=utf-8',
  );
}

export function generateBlueprintMarkdown(blueprint) {
  const project = blueprint?.projectBasicInfo || {};
  const concept = blueprint?.conceptCandidates?.find((item) => item.id === blueprint?.designerDecision?.selectedConceptId);
  const value = (record, fallback = '—') => record?.value ?? record ?? fallback;
  const list = (items, formatter) => (items?.length ? items.map(formatter).join('\n') : '- 暂无');
  const strategy = blueprint?.professionalStrategies || {};
  let report = `# ${project.projectName || '未命名项目'}\n\n`;
  report += `> LandscapeFlow AI｜景观方案设计总监智能体\n`;
  report += `> Blueprint v${blueprint?.currentVersion || 1}｜导出时间：${new Date().toLocaleString('zh-CN')}\n`;
  report += `> 数据说明：本报告仅从当前项目设计蓝本生成；“系统假设”和“AI建议”需结合设计师确认状态阅读。\n\n`;
  report += `## 一、项目基本信息\n\n| 字段 | 内容 |\n|---|---|\n`;
  [['项目名称', project.projectName], ['地点', project.city], ['面积', project.area], ['类型', project.projectType], ['服务人群', project.targetUsers], ['设计目标', project.designGoals], ['限制条件', project.constraints]].forEach(([label, content]) => {
    report += `| ${label} | ${String(content || '—').replace(/\n/g, ' ')} |\n`;
  });
  report += `\n## 二、已确认事实与信息来源\n\n`;
  report += list(blueprint.confirmedFacts, (item) => `- **${item.label}**：${item.value}（${item.status}；来源：${item.source || item._meta?.sourceAgent || '—'}）`);
  report += `\n\n### 信息来源\n\n${list(blueprint.informationSources, (item) => `- ${item.name}｜${item.type}｜${item.detail}｜${item.status}`)}\n`;
  report += `\n## 三、未确认信息与系统假设\n\n### 未确认信息\n\n${list(blueprint.unconfirmedInfo, (item) => `- ${item.label}：${item.value}（${item.status}）`)}\n`;
  report += `\n### 系统假设\n\n${list(blueprint.systemAssumptions, (item) => `- ${item.title}：${item.value}（${item.status}）`)}\n`;
  report += `\n## 四、设计约束与核心问题\n\n### 设计约束\n\n${list(blueprint.designConstraints, (item) => `- ${item.value || item.title}（${item.status}）`)}\n`;
  report += `\n### 核心设计问题\n\n${list(blueprint.coreDesignQuestions, (item) => `- ${item.value}（${item.status}）`)}\n`;
  report += `\n## 五、三个概念候选\n\n${list(blueprint.conceptCandidates, (item) => `### 方案 ${item.id}｜${item.name}\n\n${item.concept}\n\n- 空间结构：${item.spatialStructure}\n- 优势：${item.advantages?.join('；') || '—'}\n- 风险：${item.risks?.join('；') || '—'}\n- 状态：${item.status}`)}\n`;
  report += `\n## 六、概念决策\n\n- Agent 推荐：${blueprint.agentRecommendation?.conceptId || '—'} ${blueprint.agentRecommendation?.conceptName || ''}\n- 设计师最终选择：${concept ? `${concept.id} ${concept.name}` : '待确认'}\n- 融合要求：${blueprint.designerDecision?.fusionRequirements || '无'}\n- 修改意见：${blueprint.designerDecision?.modificationNotes || '无'}\n`;
  report += `- 最终选择理由：${blueprint.designerDecision?.decisionReason || '未记录'}\n`;
  report += `\n## 七、项目设计蓝本\n\n- 核心叙事：${value(blueprint.coreNarrative)}\n- 空间结构：${value(blueprint.spatialStructure)}\n- 动线策略：${value(blueprint.circulationStrategy)}\n\n### 功能分区\n\n${list(blueprint.functionalZones, (item) => `- **${item.name}**｜${item.area}｜${item.function}（${item.status}）`)}\n`;
  report += `\n### 专业策略\n\n- 植物：${strategy.plant || '—'}\n- 材料：${strategy.material || '—'}\n- 生态：${strategy.ecology || '—'}\n- 竖向：${strategy.grading || '—'}\n- 排水：${strategy.drainage || '—'}\n`;
  report += `- 运营与活动：${strategy.operations || '—'}\n`;
  report += `\n### 特色节点\n\n${list(blueprint.featureNodes, (item) => `- ${item.name}：${item.value}`)}\n`;
  report += `\n## 八、视觉任务与演示案例视觉成果\n\n${list(blueprint.visualTasks, (item) => `- ${item.id} ${item.title}｜${item.angle}｜${item.status}`)}\n\n`;
  report += `${list(blueprint.visualAssets, (item) => `- ${item.title}：${item.label || '演示案例视觉成果'}（${item.status}）`)}\n`;
  const pptOutline = blueprint.pptOutline?.length ? blueprint.pptOutline : blueprint.pptStructure;
  report += `\n## 九、完整方案文案\n\n${list(blueprint.schemeNarrative?.sections, (item) => `### ${item.title}\n\n${item.value}`)}\n`;
  report += `\n## 十、PPT 逐页结构\n\n${list(pptOutline, (item) => `- **${item.page} ${item.title}**：${item.content}\n  - 上屏文案：${item.upScreenCopy || item.content}\n  - 建议视觉：${item.suggestedVisual || '—'}\n  - 数据源：${item.sourceFields?.join('、') || 'Blueprint'}（${item.status}）\n  - 演讲提示：${item.speechNotes || '—'}`)}\n`;
  report += `\n## 十、质量复核\n\n${list(blueprint.qualityReview, (item) => `- ${item.check}：${item.result} [${item.level}]`)}\n`;
  report += `\n## 十一、风险、失效成果与下一步\n\n### 风险\n\n${list(blueprint.risks, (item) => `- ${item.title}：${item.value}（${item.status}）`)}\n`;
  report += `\n### 已失效/需重新生成\n\n${list(blueprint.invalidatedOutputs, (item) => `- Agent ${item.targetAgent} ${item.targetName}：${item.reason}（${item.status}）`)}\n`;
  report += `\n### 下一步任务\n\n${list(blueprint.nextTasks, (item) => `- ${item.title}：${item.value}（${item.status}）`)}\n`;
  report += `\n---\n\n当前成果状态：**${blueprint.officialPackageStatus}**\n`;
  return report;
}

export function downloadBlueprintMarkdown(blueprint) {
  const projectName = blueprint?.projectBasicInfo?.projectName || '方案报告';
  downloadText(
    generateBlueprintMarkdown(blueprint),
    `${safeFilename(projectName)}_方案报告_v${blueprint?.currentVersion || 1}.md`,
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
