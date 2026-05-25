import { motion } from 'framer-motion';

export default function SchemeCards({ schemes = [] }) {
  if (!schemes.length) return null;

  const colorMap = {
    A: { border: '#16A34A', bg: 'rgba(22,163,74,0.08)', text: '#16A34A', dot: '#16A34A' },
    B: { border: '#3B82F6', bg: 'rgba(59,130,246,0.08)', text: '#3B82F6', dot: '#3B82F6' },
    C: { border: '#D97706', bg: 'rgba(217,119,6,0.08)', text: '#D97706', dot: '#D97706' },
  };

  return (
    <div className="space-y-4">
      <p className="text-sm mb-3" style={{ color: '#6B7280' }}>
        Agent 基于项目条件生成了 3 个差异化概念方案，请审阅：
      </p>
      {schemes.map((scheme, index) => {
        const colors = colorMap[scheme.id] || colorMap.A;
        return (
          <motion.div
            key={scheme.id}
            className="rounded-2xl p-5"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.15, duration: 0.5 }}
            style={{
              background: '#FFFFFF',
              border: `1px solid ${colors.border}`,
              borderLeft: `3px solid ${colors.border}`,
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 mb-3">
              <span
                className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
                style={{ background: colors.bg, color: colors.text }}
              >
                {scheme.id}
              </span>
              <div>
                <h3 className="font-serif font-bold" style={{ color: '#111827' }}>{scheme.name}</h3>
                <span className="text-xs" style={{ color: colors.text }}>方案 {scheme.id}</span>
              </div>
            </div>

            {/* Concept */}
            <div className="mb-3">
              <span className="text-xs font-medium tracking-wider" style={{ color: '#9CA3AF' }}>核心概念</span>
              <p className="text-sm mt-1 leading-relaxed" style={{ color: '#374151' }}>{scheme.concept}</p>
            </div>

            {/* Spatial Structure */}
            <div className="mb-3">
              <span className="text-xs font-medium tracking-wider" style={{ color: '#9CA3AF' }}>空间结构</span>
              <p className="text-sm mt-1" style={{ color: '#374151' }}>{scheme.spatialStructure}</p>
            </div>

            {/* Core Scenes */}
            <div className="mb-3">
              <span className="text-xs font-medium tracking-wider" style={{ color: '#9CA3AF' }}>核心场景</span>
              <ul className="mt-1 space-y-1">
                {scheme.coreScenes.map((scene, i) => (
                  <li key={i} className="text-sm flex items-start gap-2" style={{ color: '#4B5563' }}>
                    <span
                      className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                      style={{ background: colors.dot }}
                    />
                    {scene}
                  </li>
                ))}
              </ul>
            </div>

            {/* Target Users */}
            <div className="mb-3">
              <span className="text-xs font-medium tracking-wider" style={{ color: '#9CA3AF' }}>适用人群</span>
              <p className="text-sm mt-1" style={{ color: '#4B5563' }}>{scheme.targetUsers}</p>
            </div>

            {/* Pros & Risks */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-xs font-medium tracking-wider" style={{ color: '#16A34A' }}>优点</span>
                <ul className="mt-1 space-y-0.5">
                  {scheme.pros.map((p, i) => (
                    <li key={i} className="text-xs" style={{ color: '#4B5563' }}>+ {p}</li>
                  ))}
                </ul>
              </div>
              <div>
                <span className="text-xs font-medium tracking-wider" style={{ color: '#D97706' }}>风险</span>
                <ul className="mt-1 space-y-0.5">
                  {scheme.risks.map((r, i) => (
                    <li key={i} className="text-xs" style={{ color: '#6B7280' }}>⚠ {r}</li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
