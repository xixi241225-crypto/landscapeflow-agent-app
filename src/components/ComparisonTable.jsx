import { motion } from 'framer-motion';

export default function ComparisonTable({ comparison }) {
  if (!comparison?.schemes?.length) return null;

  const { dimensions, schemes, recommended, note } = comparison;

  const idColor = { A: '#16A34A', B: '#3B82F6', C: '#D97706' };

  return (
    <div className="space-y-4">
      <p className="text-sm mb-1" style={{ color: '#6B7280' }}>
        Agent 从 6 个维度对三个方案进行了比选打分：
      </p>

      {/* Scoring Table */}
      <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid #E5E7EB', background: '#FFFFFF', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid #E5E7EB', background: '#F9FAFB' }}>
              <th className="text-left py-2.5 px-3 font-medium" style={{ color: '#6B7280' }}>评分维度</th>
              {schemes.map((s) => (
                <th key={s.id} className="text-center py-2.5 px-3 font-medium" style={{ color: '#6B7280' }}>
                  方案 {s.id}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dimensions.map((dim, di) => (
              <motion.tr
                key={dim.key}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: di * 0.08 }}
                style={{ borderBottom: '1px solid #F3F4F6' }}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="py-2.5 px-3" style={{ color: '#374151' }}>
                  {dim.label}
                  <span className="text-xs ml-1" style={{ color: '#9CA3AF' }}>({dim.weight * 100}%)</span>
                </td>
                {schemes.map((s) => (
                  <td key={s.id} className="text-center py-2.5 px-3">
                    <span className="font-semibold" style={{ color: idColor[s.id] || '#374151' }}>
                      {s.scores?.[dim.key]?.raw ?? '-'}
                    </span>
                  </td>
                ))}
              </motion.tr>
            ))}
            {/* Total Row */}
            <tr style={{ background: '#F9FAFB', borderTop: '2px solid #E5E7EB' }}>
              <td className="py-3 px-3 font-semibold" style={{ color: '#16A34A' }}>加权总分</td>
              {schemes.map((s) => (
                <td key={s.id} className="text-center py-3 px-3">
                  <span
                    className="text-lg font-bold"
                    style={{ color: s.id === recommended?.id ? '#16A34A' : '#374151' }}
                  >
                    {s.total}
                  </span>
                  {s.id === recommended?.id && (
                    <span className="ml-2 text-xs" style={{ color: '#D97706' }}>★ 推荐</span>
                  )}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Recommendation */}
      {recommended && (
        <motion.div
          className="rounded-2xl p-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          style={{
            background: '#FFFBEB',
            border: '1px solid rgba(217,119,6,0.2)',
            borderLeft: `3px solid #D97706`,
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span style={{ color: '#D97706' }}>★</span>
            <span className="font-semibold" style={{ color: '#92400E' }}>
              Agent 推荐：{recommended.name}
            </span>
            <span className="text-xs ml-auto" style={{ color: '#9CA3AF' }}>
              总分 {recommended.total}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-3">
            {dimensions.map((dim) => (
              <div key={dim.key} className="text-xs">
                <span style={{ color: '#9CA3AF' }}>{dim.label}：</span>
                <span style={{ color: '#4B5563' }}>
                  {recommended.reasoning?.[dim.key] || '—'}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {note && (
        <p className="text-xs mt-2" style={{ color: '#9CA3AF' }}>{note}</p>
      )}
    </div>
  );
}
