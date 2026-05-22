/**
 * localStorage 历史记录管理
 * 保存最近生成的方案，最多保留 10 条
 */

const STORAGE_KEY = 'landscapeflow_history';
const MAX_RECORDS = 10;

export function getHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveHistory(record) {
  try {
    const history = getHistory();
    // 新记录插到最前面
    history.unshift({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      projectName: record.formData?.projectName || '未命名项目',
      schemeName: record.step5?.recommendedScheme?.name || '',
      generatedAt: record.generatedAt || new Date().toISOString(),
      formData: record.formData,
      data: record, // 保存完整数据
    });
    // 只保留最近 MAX_RECORDS 条
    if (history.length > MAX_RECORDS) {
      history.length = MAX_RECORDS;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    return history;
  } catch {
    return [];
  }
}

export function getRecordById(id) {
  const history = getHistory();
  return history.find((r) => r.id === id);
}

export function deleteRecord(id) {
  const history = getHistory();
  const filtered = history.filter((r) => r.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  return filtered;
}

export function clearAllHistory() {
  localStorage.removeItem(STORAGE_KEY);
}
