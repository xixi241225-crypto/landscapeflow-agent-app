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
          className="fixed right-0 top-0 h-full w-80 z-50 shadow-xl flex flex-col"
          initial={{ x: 320 }}
          animate={{ x: 0 }}
          exit={{ x: 320 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={{
            background: '#FFFFFF',
            borderLeft: '1px solid #E5E7EB',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b flex-shrink-0 bg-white" style={{ borderColor: '#E5E7EB' }}>
            <div>
              <h3 className="text-sm font-semibold text-[#111827]">历史记录</h3>
              <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>
                最近生成的 {records.length} 个方案
              </p>
            </div>
            <button
              onClick={onToggle}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
              style={{ background: '#F3F4F6', color: '#6B7280' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#E5E7EB';
                e.currentTarget.style.color = '#111827';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#F3F4F6';
                e.currentTarget.style.color = '#6B7280';
              }}
            >
              ✕
            </button>
          </div>

          {/* Records List */}
          <div className="overflow-y-auto flex-1 p-3 space-y-2" style={{ background: '#F9FAFB' }}>
            {records.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm" style={{ color: '#9CA3AF' }}>暂无历史记录</p>
                <p className="text-xs mt-1" style={{ color: '#D1D5DB' }}>生成方案后会自动保存</p>
              </div>
            ) : (
              records.map((record, i) => (
                <motion.div
                  key={record.id}
                  className="rounded-xl p-3 cursor-pointer transition-all group bg-white"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  style={{ border: '1px solid #E5E7EB' }}
                  onClick={() => handleLoad(record)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(214,168,79,0.35)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#E5E7EB';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-[#111827] truncate">
                        {record.projectName}
                      </p>
                      {record.schemeName && (
                        <p className="text-xs truncate mt-0.5" style={{ color: '#6B7280' }}>
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
                      style={{ color: '#9CA3AF' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#EF4444';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = '#9CA3AF';
                      }}
                    >
                      ✕
                    </button>
                  </div>
                  <p className="text-xs" style={{ color: '#9CA3AF' }}>
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
            <div className="p-3 border-t flex-shrink-0" style={{ borderColor: '#E5E7EB', background: '#F9FAFB' }}>
              <button
                onClick={handleClear}
                className="w-full py-2 rounded-lg text-xs transition-all"
                style={{ color: '#9CA3AF', background: '#FFFFFF', border: '1px solid #E5E7EB' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#EF4444';
                  e.currentTarget.style.borderColor = 'rgba(239,68,68,0.25)';
                  e.currentTarget.style.background = 'rgba(239,68,68,0.03)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#9CA3AF';
                  e.currentTarget.style.borderColor = '#E5E7EB';
                  e.currentTarget.style.background = '#FFFFFF';
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
