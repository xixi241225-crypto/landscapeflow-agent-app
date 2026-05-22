import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getHistory, deleteRecord, clearAllHistory } from '../lib/storage';

export default function HistoryPanel({ onLoad, isOpen, onToggle }) {
  const [records, setRecords] = useState([]);

  useEffect(() => {
    setRecords(getHistory());
  }, [isOpen]);

  const handleLoad = (record) => {
    onLoad(record);
  };

  const handleDelete = (id) => {
    const updated = deleteRecord(id);
    setRecords(updated);
  };

  const handleClear = () => {
    if (window.confirm('确定清空全部历史记录？此操作不可撤销。')) {
      clearAllHistory();
      setRecords([]);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed right-0 top-0 h-full w-80 z-50 shadow-2xl flex flex-col"
          initial={{ x: 320 }}
          animate={{ x: 0 }}
          exit={{ x: 320 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={{
            background: 'rgba(14,15,14,0.95)',
            backdropFilter: 'blur(20px)',
            borderLeft: '1px solid #2B2E2A',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b flex-shrink-0" style={{ borderColor: '#2B2E2A' }}>
            <div>
              <h3 className="text-sm font-semibold text-[#F5F1E8]">历史记录</h3>
              <p className="text-xs mt-0.5" style={{ color: '#78716C' }}>
                最近生成的 {records.length} 个方案
              </p>
            </div>
            <button
              onClick={onToggle}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
              style={{ background: '#151716', color: '#78716C' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#1A1C1B';
                e.currentTarget.style.color = '#F5F1E8';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#151716';
                e.currentTarget.style.color = '#78716C';
              }}
            >
              ✕
            </button>
          </div>

          {/* Records List */}
          <div className="overflow-y-auto flex-1 p-3 space-y-2">
            {records.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm" style={{ color: '#555955' }}>暂无历史记录</p>
                <p className="text-xs mt-1" style={{ color: '#3D403C' }}>生成方案后会自动保存</p>
              </div>
            ) : (
              records.map((record, i) => (
                <motion.div
                  key={record.id}
                  className="rounded-xl p-3 cursor-pointer transition-all group"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  style={{ background: '#151716', border: '1px solid rgba(255,255,255,0.06)' }}
                  onClick={() => handleLoad(record)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(214,181,109,0.25)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                  }}
                >
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-[#F5F1E8] truncate">
                        {record.projectName}
                      </p>
                      {record.schemeName && (
                        <p className="text-xs truncate mt-0.5" style={{ color: '#78716C' }}>
                          {record.schemeName}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(record.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-all ml-2 flex-shrink-0 text-xs"
                      style={{ color: '#555955' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#EF4444';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = '#555955';
                      }}
                    >
                      ✕
                    </button>
                  </div>
                  <p className="text-xs" style={{ color: '#555955' }}>
                    {new Date(record.generatedAt).toLocaleString('zh-CN', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </motion.div>
              ))
            )}
          </div>

          {/* Footer */}
          {records.length > 0 && (
            <div className="p-3 border-t flex-shrink-0" style={{ borderColor: '#2B2E2A', background: 'rgba(14,15,14,0.95)' }}>
              <button
                onClick={handleClear}
                className="w-full py-2 rounded-lg text-xs transition-all"
                style={{ color: '#555955' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#EF4444';
                  e.currentTarget.style.background = 'rgba(239,68,68,0.06)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#555955';
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                清空全部记录
              </button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
