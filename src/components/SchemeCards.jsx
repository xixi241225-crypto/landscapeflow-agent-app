import { motion } from 'framer-motion';

export default function SchemeCards({ schemes = [] }) {
  if (!schemes.length) return null;

  const colorMap = {
    A: { border: 'rgba(52,211,153,0.2)', bg: 'rgba(52,211,153,0.06)', text: '#34D399', dot: '#34D399', accent: '#22C55E' },
    B: { border: 'rgba(96,165,250,0.2)', bg: 'rgba(96,165,250,0.06)', text: '#60A5FA', dot: '#60A5FA', accent: '#3B82F6' },
    C: { border: 'rgba(251,191,36,0.2)', bg: 'rgba(251,191,36,0.06)', text: '#FBBF24', dot: '#FBBF24', accent: '#F59E0B' },
  };

  return (
    <div className="space-y-4">
      <p className="text-sm mb-3" style={{ color: '#A8A29A' }}>
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
              background: 'rgba(16,18,17,0.9)',
              border: `1px solid rgba(255,255,255,0.08)`,
              borderLeft: `2px solid ${colors.border}`,
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
                <h3 className="font-serif font-bold text-[#F5F1E8]">{scheme.name}</h3>
                <span className="text-xs" style={{ color: colors.text }}>方案 {scheme.id}</span>
              </div>
            </div>

            {/* Concept */}
            <div className="mb-3">
              <span className="text-xs uppercase tracking-wider" style={{ color: '#78716C' }}>核心概念</span>
              <p className="text-sm mt-1 leading-relaxed" style={{ color: '#A8A29A' }}>{scheme.concept}</p>
            </div>

            {/* Spatial Structure */}
            <div className="mb-3">
              <span className="text-xs uppercase tracking-wider" style={{ color: '#78716C' }}>空间结构</span>
              <p className="text-sm mt-1" style={{ color: '#A8A29A' }}>{scheme.spatialStructure}</p>
            </div>

            {/* Core Scenes */}
            <div className="mb-3">
              <span className="text-xs uppercase tracking-wider" style={{ color: '#78716C' }}>核心场景</span>
              <ul className="mt-1 space-y-1">
                {scheme.coreScenes.map((scene, i) => (
                  <li key={i} className="text-sm flex items-start gap-2" style={{ color: '#A8A29A' }}>
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
              <span className="text-xs uppercase tracking-wider" style={{ color: '#78716C' }}>适用人群</span>
              <p className="text-sm mt-1" style={{ color: '#A8A29A' }}>{scheme.targetUsers}</p>
            </div>

            {/* Pros & Risks */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-xs uppercase tracking-wider" style={{ color: '#34D399' }}>优点</span>
                <ul className="mt-1 space-y-0.5">
                  {scheme.pros.map((p, i) => (
                    <li key={i} className="text-xs" style={{ color: '#A8A29A' }}>+ {p}</li>
                  ))}
                </ul>
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider" style={{ color: '#F59E0B' }}>风险</span>
                <ul className="mt-1 space-y-0.5">
                  {scheme.risks.map((r, i) => (
                    <li key={i} className="text-xs" style={{ color: '#A8A29A' }}>⚠ {r}</li>
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
