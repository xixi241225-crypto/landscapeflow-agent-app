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
