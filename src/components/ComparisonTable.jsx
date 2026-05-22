import { motion } from 'framer-motion';

export default function ComparisonTable({ comparison }) {
  if (!comparison?.schemes?.length) return null;

  const { dimensions, schemes, recommended, note } = comparison;

  const idColor = { A: '#34D399', B: '#60A5FA', C: '#FBBF24' };

  return (
    <div className="space-y-4">
      <p className="text-sm mb-1" style={{ color: '#A8A29A' }}>
        Agent 从 6 个维度对三个方案进行了比选打分：
      </p>

      {/* Scoring Table */}
      <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid #2B2E2A' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid #2B2E2A', background: '#0E0F0E' }}>
              <th className="text-left py-2.5 px-3 font-medium" style={{ color: '#78716C' }}>评分维度</th>
              {schemes.map((s) => (
                <th key={s.id} className="text-center py-2.5 px-3 font-medium" style={{ color: '#78716C' }}>
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
                style={{ borderBottom: '1px solid rgba(43,46,42,0.5)' }}
                className="hover:bg-[#151716] transition-colors"
              >
                <td className="py-2.5 px-3" style={{ color: '#A8A29A' }}>
                  {dim.label}
                  <span className="text-xs ml-1" style={{ color: '#555955' }}>({dim.weight * 100}%)</span>
                </td>
                {schemes.map((s) => (
                  <td key={s.id} className="text-center py-2.5 px-3">
                    <span className="font-semibold" style={{ color: idColor[s.id] || '#A8A29A' }}>
                      {s.scores?.[dim.key]?.raw ?? '-'}
                    </span>
                  </td>
                ))}
              </motion.tr>
            ))}
            {/* Total Row */}
            <tr style={{ background: 'rgba(16,18,17,0.8)' }}>
              <td className="py-3 px-3 font-semibold" style={{ color: '#22C55E' }}>加权总分</td>
              {schemes.map((s) => (
                <td key={s.id} className="text-center py-3 px-3">
                  <span
                    className="text-lg font-bold"
                    style={{ color: s.id === recommended?.id ? '#22C55E' : '#A8A29A' }}
                  >
                    {s.total}
                  </span>
                  {s.id === recommended?.id && (
                    <span className="ml-2 text-xs" style={{ color: '#D6B56D' }}>★推荐</span>
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
            background: 'rgba(16,18,17,0.9)',
            border: '1px solid rgba(214,181,109,0.2)',
            borderLeft: '2px solid rgba(214,181,109,0.5)',
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span style={{ color: '#D6B56D' }}>★</span>
            <span className="font-semibold" style={{ color: '#D6B56D' }}>
              Agent 推荐：{recommended.name}
            </span>
            <span className="text-xs ml-auto" style={{ color: '#78716C' }}>
              总分 {recommended.total}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-3">
            {dimensions.map((dim) => (
              <div key={dim.key} className="text-xs">
                <span style={{ color: '#78716C' }}>{dim.label}：</span>
                <span style={{ color: '#A8A29A' }}>
                  {recommended.reasoning?.[dim.key] || '—'}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {note && (
        <p className="text-xs mt-2" style={{ color: '#555955' }}>{note}</p>
      )}
    </div>
  );
}
