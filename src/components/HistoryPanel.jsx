import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { clearProjects, deleteProject, listProjects } from '../lib/projectStorage';

export default function HistoryPanel({ onLoad, isOpen, onToggle, versions = [], onRestore }) {
  const [records, setRecords] = useState([]);
  useEffect(() => { if (isOpen) setRecords(listProjects()); }, [isOpen]);
  return <AnimatePresence>{isOpen && <><motion.button className="fixed inset-0 z-40 bg-black/10" onClick={onToggle} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} /><motion.aside className="fixed right-0 top-0 h-full w-96 max-w-[92vw] z-50 bg-white shadow-2xl border-l border-gray-200 flex flex-col" initial={{ x: 400 }} animate={{ x: 0 }} exit={{ x: 400 }}>
    <div className="p-4 border-b border-gray-200 flex items-center justify-between"><div><h3 className="text-sm font-bold text-gray-900">项目历史</h3><p className="text-[10px] text-gray-400 mt-1">项目级保存 Blueprint、版本、确认节点与浏览阶段</p></div><button onClick={onToggle} className="w-8 h-8 rounded-lg bg-gray-100 text-gray-500">✕</button></div>
    <div className="flex-1 overflow-y-auto p-3 bg-gray-50">
      <p className="px-1 pb-2 text-xs font-bold text-[var(--lf-brand-700)]">当前 Blueprint 版本</p>
      <div className="space-y-2">{versions.map((version) => <div key={version.id} className="flex items-center justify-between gap-2 rounded-xl border border-violet-100 bg-white p-3"><div><p className="text-xs font-semibold text-gray-800">v{version.version}｜{version.reason}</p><p className="mt-1 text-[10px] text-gray-400">{new Date(version.createdAt).toLocaleString('zh-CN')}</p></div><button onClick={() => onRestore?.(version.id)} className="rounded-lg border border-amber-200 px-2 py-1 text-xs text-amber-700">恢复</button></div>)}</div>
      <p className="mt-5 px-1 pb-2 text-xs font-bold text-[var(--lf-brand-700)]">项目历史</p>
      <div className="space-y-2">{records.length ? records.map((record) => <button key={record.projectId} onClick={() => onLoad(record)} className="w-full text-left rounded-xl bg-white border border-gray-200 p-3 group"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="text-xs font-semibold text-gray-800 truncate">{record.formData?.projectName || '未命名项目'}</p><p className="text-[10px] text-gray-500 mt-1">Blueprint v{record.blueprint?.currentVersion} · {record.blueprint?.officialPackageStatus}</p><p className="text-[9px] text-gray-400 mt-1">{new Date(record.savedAt).toLocaleString('zh-CN')}</p></div><span onClick={(event) => { event.stopPropagation(); setRecords(deleteProject(record.projectId)); }} className="opacity-0 group-hover:opacity-100 text-red-400">×</span></div></button>) : <p className="text-xs text-gray-400 text-center py-8">暂无项目历史</p>}</div>
    </div>
    {records.length > 0 && <div className="p-3 border-t border-gray-200"><button onClick={() => { if (window.confirm('确定清空所有项目历史？')) { clearProjects(); setRecords([]); } }} className="w-full py-2 rounded-lg border border-red-100 text-red-500 text-[10px]">清空全部项目历史</button></div>}
  </motion.aside></>}</AnimatePresence>;
}
