import { useState } from 'react';
import { motion } from 'framer-motion';
import ImageModal from './ImageModal';

export default function DeepenPlan({ data }) {
  const [modalImage, setModalImage] = useState(null);
  if (!data) return null;

  const {
    recommendedScheme, designPhilosophy, planImage,
    functionalZones, circulation, ageFriendly,
    plantStrategy, materialStrategy, lightingStrategy, maintenance,
  } = data;

  const cardStyle = {
    background: 'rgba(16,18,17,0.9)',
    border: '1px solid rgba(255,255,255,0.08)',
  };

  return (
    <div className="space-y-4">
      {/* Recommended Scheme Header */}
      <motion.div
        className="rounded-2xl p-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: 'rgba(16,18,17,0.9)',
          border: '1px solid rgba(214,181,109,0.15)',
          borderLeft: '2px solid rgba(214,181,109,0.5)',
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <span style={{ color: '#D6B56D', fontSize: '18px' }}>🎯</span>
          <span className="font-serif font-bold text-lg" style={{ color: '#D6B56D' }}>
            {recommendedScheme?.name || '推荐方案'}
          </span>
        </div>
        <p className="text-sm leading-relaxed" style={{ color: '#A8A29A' }}>{designPhilosophy}</p>
      </motion.div>

      {/* 总平面图 / 空间策略图 — LARGE display */}
      {planImage && (
        <motion.div
          className="rounded-2xl p-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.4 }}
          style={cardStyle}
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-semibold" style={{ color: '#22C55E' }}>🗺️ {planImage.title || '总平面图 / 空间策略图'}</span>
          </div>
          <div
            className="rounded-xl overflow-hidden cursor-pointer group relative"
            style={{ background: '#0B0C0B', border: '1px solid #2B2E2A' }}
            onClick={() => setModalImage({ src: planImage.url, title: planImage.title })}
          >
            <img
              src={planImage.url}
              alt={planImage.title}
              className="w-full object-contain"
              style={{ maxHeight: '380px', minHeight: '200px' }}
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
              <span className="opacity-0 group-hover:opacity-100 transition-opacity px-4 py-1.5 rounded-lg text-xs text-white"
                style={{ background: 'rgba(0,0,0,0.6)' }}>
                点击查看大图
              </span>
            </div>
          </div>
          {planImage.note && (
            <p className="text-xs mt-2" style={{ color: '#78716C' }}>{planImage.note}</p>
          )}
        </motion.div>
      )}

      {/* Functional Zones */}
      {functionalZones?.length > 0 && (
        <Card title="功能分区" delay={0.1}>
          <div className="space-y-2">
            {functionalZones.map((z, i) => (
              <div key={i} className="rounded-lg p-3" style={{ background: '#101211', border: '1px solid #2B2E2A' }}>
                <span className="text-xs font-medium" style={{ color: '#F5F1E8' }}>{z.name}</span>
                <span className="text-[10px] ml-2" style={{ color: '#555955' }}>{z.area}</span>
                <p className="text-xs mt-1" style={{ color: '#A8A29A' }}>{z.function}（位于{z.position}）</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Circulation */}
      {circulation && (
        <Card title="游线组织" delay={0.15}>
          <div className="space-y-1.5 text-xs">
            <p style={{ color: '#A8A29A' }}>
              <span style={{ color: '#78716C' }}>主游线：</span>{circulation.mainRoute}
            </p>
            <p style={{ color: '#A8A29A' }}>
              <span style={{ color: '#78716C' }}>次游线：</span>{circulation.secondaryRoute}
            </p>
            <p style={{ color: '#A8A29A' }}>
              <span style={{ color: '#78716C' }}>无障碍：</span>{circulation.accessibility}
            </p>
            <p style={{ color: '#A8A29A' }}>
              <span style={{ color: '#78716C' }}>出入口：</span>{circulation.entryPoints}
            </p>
          </div>
        </Card>
      )}

      {/* Age Friendly */}
      {ageFriendly && (
        <Card title="老人儿童友好策略" delay={0.2}>
          {typeof ageFriendly === 'string' ? (
            <p className="text-sm leading-relaxed" style={{ color: '#A8A29A' }}>{ageFriendly}</p>
          ) : (
            <ul className="space-y-1">
              {(Array.isArray(ageFriendly) ? ageFriendly : []).map((item, i) => (
                <li key={i} className="text-xs" style={{ color: '#A8A29A' }}>
                  · {typeof item === 'string' ? item : `${item.name || ''}：${item.function || item.content || ''}`}
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {/* Plant Strategy */}
      {plantStrategy && (
        <Card title="植物策略" delay={0.25}>
          <p className="text-sm mb-3" style={{ color: '#A8A29A' }}>{plantStrategy.principle}</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span style={{ color: '#78716C' }}>乔木：</span>
              <span style={{ color: '#A8A29A' }}>{plantStrategy.trees}</span>
            </div>
            <div>
              <span style={{ color: '#78716C' }}>灌木：</span>
              <span style={{ color: '#A8A29A' }}>{plantStrategy.shrubs}</span>
            </div>
            <div>
              <span style={{ color: '#78716C' }}>地被：</span>
              <span style={{ color: '#A8A29A' }}>{plantStrategy.groundcover}</span>
            </div>
            <div>
              <span style={{ color: '#78716C' }}>冬季：</span>
              <span style={{ color: '#A8A29A' }}>{plantStrategy.winter}</span>
            </div>
          </div>
        </Card>
      )}

      {/* Material Strategy */}
      {materialStrategy && (
        <Card title="材料策略" delay={0.3}>
          {typeof materialStrategy === 'string' ? (
            <p className="text-sm leading-relaxed" style={{ color: '#A8A29A' }}>{materialStrategy}</p>
          ) : (
            <div className="space-y-1 text-xs">
              {Object.entries(materialStrategy).map(([key, val]) => (
                <p key={key} style={{ color: '#A8A29A' }}>
                  <span style={{ color: '#78716C' }}>{key}：</span>{val}
                </p>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Lighting */}
      {lightingStrategy && (
        <Card title="夜景策略" delay={0.35}>
          {typeof lightingStrategy === 'string' ? (
            <p className="text-sm leading-relaxed" style={{ color: '#A8A29A' }}>{lightingStrategy}</p>
          ) : (
            <div className="space-y-1 text-xs">
              {Object.entries(lightingStrategy).map(([key, val]) => (
                <p key={key} style={{ color: '#A8A29A' }}>
                  <span style={{ color: '#78716C' }}>{key}：</span>{val}
                </p>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Maintenance */}
      {maintenance && (
        <Card title="运营与维护建议" delay={0.4}>
          <p className="text-sm mb-2" style={{ color: '#A8A29A' }}>{maintenance.approach}</p>
          <div className="space-y-1 text-xs">
            <p style={{ color: '#A8A29A' }}>
              <span style={{ color: '#78716C' }}>植物维护：</span>{maintenance.plants}
            </p>
            <p style={{ color: '#A8A29A' }}>
              <span style={{ color: '#78716C' }}>设施维护：</span>{maintenance.facilities}
            </p>
            <p style={{ color: '#A8A29A' }}>
              <span style={{ color: '#78716C' }}>社区参与：</span>{maintenance.community}
            </p>
            <p className="mt-1 font-medium" style={{ color: '#22C55E' }}>{maintenance.annualCost}</p>
          </div>
        </Card>
      )}

      {/* Image Modal */}
      {modalImage && (
        <ImageModal
          src={modalImage.src}
          title={modalImage.title}
          onClose={() => setModalImage(null)}
        />
      )}
    </div>
  );
}

function Card({ title, delay = 0, children }) {
  return (
    <motion.div
      className="rounded-2xl p-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      style={{
        background: 'rgba(16,18,17,0.9)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <h4 className="text-sm font-semibold mb-2" style={{ color: '#22C55E' }}>{title}</h4>
      {children}
    </motion.div>
  );
}
