import { useEffect, useMemo, useState } from 'react';
import { listProjects } from '../lib/projectStorage';
import { DEMO_PROJECT_HISTORY } from '../data/demoCase';

const PAGE_SIZE = 5;

function formatTime(value) {
  if (!value) return '刚刚更新';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '最近更新';
  return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
}

function getProjectStatus(record) {
  if (record.blueprint?.officialPackageStatus?.includes('已完成')) return '已完成';
  if (record.blueprint?.currentCheckpoint) return '待确认';
  if (Object.values(record.blueprint?.agentRuns || {}).some((item) => item.status === 'working')) return '整理中';
  if (record.presentationMode && !record.blueprint?.currentVersion) return '资料整理中';
  return record.blueprint?.currentVersion > 0 ? '方案设计中' : '资料填写中';
}

export default function ProjectHistorySidebar({
  activeProjectId,
  currentProject,
  refreshKey,
  onLoad,
  presentationMode = false,
}) {
  const [records, setRecords] = useState([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => setRecords(listProjects()), 220);
    return () => clearTimeout(timer);
  }, [activeProjectId, refreshKey]);

  const displayRecords = useMemo(() => {
    const persisted = records.map((record) => record.projectId === activeProjectId ? { ...record, ...currentProject } : record);
    if (!persisted.some((record) => record.projectId === activeProjectId) && currentProject) persisted.unshift(currentProject);
    if (presentationMode) {
      const current = persisted.find((record) => record.projectId === activeProjectId) || currentProject;
      return [
        ...(current ? [current] : []),
        ...DEMO_PROJECT_HISTORY.map((record) => ({ ...record, demoOnly: true })),
      ];
    }
    if (persisted.length) {
      const seen = new Set();
      return persisted.filter((record) => {
        const name = record.formData?.projectName || record.projectName || record.projectId;
        if (seen.has(name)) return false;
        seen.add(name);
        return true;
      });
    }
    return DEMO_PROJECT_HISTORY.map((record) => ({ ...record, demoOnly: true }));
  }, [activeProjectId, currentProject, presentationMode, records]);

  const pageCount = Math.max(1, Math.ceil(displayRecords.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageRecords = displayRecords.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="flex h-full flex-col bg-[#F7F8FF]">
      <div className="border-b border-[var(--lf-border)] bg-white px-5 py-5">
        <h2 className="text-base font-bold text-[var(--lf-brand-950)]">历史项目</h2>
        <p className="mt-1 text-xs text-[var(--lf-muted)]">最近设计项目</p>
      </div>

      <div className="flex-1 px-3 py-4">
        <div className="space-y-2">
          {pageRecords.map((record) => {
            const active = record.projectId === activeProjectId;
            const projectName = record.formData?.projectName || record.projectName || '未命名景观项目';
            const meta = record.meta || [record.formData?.projectType, record.formData?.city].filter(Boolean).join(' · ') || '项目信息待完善';
            const status = record.status || getProjectStatus(record);
            return (
              <button
                key={record.projectId || record.id}
                type="button"
                disabled={record.demoOnly}
                onClick={() => !record.demoOnly && onLoad(record)}
                title={projectName}
                className={`project-history-item w-full text-left ${active ? 'active' : ''} ${record.demoOnly ? 'demo-only' : ''}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="min-w-0 truncate text-sm font-semibold text-[var(--lf-text)]">{projectName}</p>
                  {active && <span className="shrink-0 rounded-full bg-[var(--lf-brand-600)] px-2 py-0.5 text-[10px] font-bold text-white">当前</span>}
                </div>
                <p className="mt-1.5 truncate text-xs text-[var(--lf-muted)]">{meta}</p>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className={`text-xs font-medium ${status === '已完成' ? 'text-emerald-700' : status === '待确认' ? 'text-amber-700' : 'text-[var(--lf-brand-600)]'}`}>{status}</span>
                  <span className="text-[11px] text-slate-400">{record.demoOnly ? '演示记录' : formatTime(record.savedAt)}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-center gap-3 border-t border-[var(--lf-border)] bg-white px-4 py-4">
        <button type="button" disabled={safePage <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="project-history-page-button" aria-label="历史项目上一页">←</button>
        <span className="min-w-[52px] text-center text-xs font-semibold text-[var(--lf-muted)]">{safePage} / {pageCount}</span>
        <button type="button" disabled={safePage >= pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))} className="project-history-page-button" aria-label="历史项目下一页">→</button>
      </div>
    </div>
  );
}
