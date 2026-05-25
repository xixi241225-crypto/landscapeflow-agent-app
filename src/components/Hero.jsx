import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const HERO_IMAGES = [
  { src: './demo-images/aerial.jpg', alt: '鸟瞰总览效果图' },
  { src: './demo-images/awn.jpg', alt: '中央草坪区效果图' },
  { src: './demo-images/night.jpg', alt: '夜景灯光效果图' },
];

const AGENTS = [
  { num: '01', title: '项目定义 Agent', desc: '解析场地条件、识别缺失信息、做出合理假设' },
  { num: '02', title: '概念生成 Agent', desc: '生成三个差异化概念方案，覆盖不同设计策略' },
  { num: '03', title: '方案选择 Agent', desc: '六维度加权打分，推荐最优方案' },
  { num: '04', title: '空间推演 Agent', desc: '深化推荐方案，展开功能分区和游线组织' },
  { num: '05', title: '视觉表达 Agent', desc: '实时生成 + 精选成果库 + Prompt 指令包' },
  { num: '06', title: '输出成果 Agent', desc: 'Markdown 报告 + PPT 大纲 + 视觉成果包' },
];

export default function Hero() {
  const navigate = useNavigate();
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(165deg, #FFFFFF 0%, #F7F8F6 40%, #ECFDF5 100%)' }}>

      {/* ============================================ */}
      {/* LIGHTWEIGHT HEADER — Bright theme */}
      {/* ============================================ */}
      <header className="relative z-30 flex items-center justify-between px-8 py-5">
        {/* Left: Logo */}
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #16A34A, #22C55E)', boxShadow: '0 2px 8px rgba(22,163,74,0.25)' }}
          >
            <span className="text-base font-serif font-bold text-white">L</span>
          </div>
          <div className="leading-tight">
            <div className="text-xs font-medium" style={{ color: '#6B7280' }}>景观方案总监智能体</div>
            <div className="text-[11px] font-serif tracking-wide" style={{ color: '#16A34A', fontWeight: 600 }}>LandscapeFlow AI</div>
          </div>
        </div>

        {/* Right: CTA */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/workbench')}
            className="btn-primary text-xs px-5 py-2"
          >
            进入工作台
          </button>
          <button
            onClick={() => navigate('/workbench')}
            className="btn-secondary text-xs px-5 py-2"
          >
            观看演示
          </button>
        </div>
      </header>

      {/* ============================================ */}
      {/* HERO SECTION — Bright theme with green accents */}
      {/* ============================================ */}
      <div className="relative flex-1 flex flex-col items-center justify-center overflow-hidden min-h-[calc(100vh-72px)]">

        {/* Background image — very subtle on light bg */}
        <div className="absolute inset-0 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentImage}
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.06 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5, ease: 'easeInOut' }}
            >
              <img
                src={HERO_IMAGES[currentImage].src}
                alt={HERO_IMAGES[currentImage].alt}
                className="w-full h-full object-cover"
              />
            </motion.div>
          </AnimatePresence>
          {/* Light gradient overlays — white-based */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-[#F7F8F6]/60 to-[#F7F8F6]" />
          <div className="absolute inset-0 bg-gradient-to-r from-white/40 via-transparent to-white/40" />
        </div>

        {/* Subtle dot grid — light gold dots */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle, #16A34A 1px, transparent 1px)`,
            backgroundSize: '48px 48px',
          }}
        />

        {/* Ambient glows — soft green and gold on light bg */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#16A34A]/[0.06] rounded-full blur-[160px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[#D6A84F]/[0.04] rounded-full blur-[140px]" />

        {/* ---- Hero Text — Dark text for bright bg ---- */}
        <motion.div
          className="relative z-10 text-center px-6 max-w-4xl"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          {/* Hackathon badge — green accent */}
          <motion.div
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-10"
            style={{
              background: 'rgba(22, 163, 74, 0.06)',
              border: '1px solid rgba(22, 163, 74, 0.15)',
            }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <span className="w-1.5 h-1.5 rounded-full animate-pulse-glow" style={{ background: '#16A34A' }} />
            <span className="text-xs font-medium" style={{ color: '#16A34A' }}>
              腾讯云黑客松 · AI 智能体争霸赛
            </span>
          </motion.div>

          {/* Main title — dark serif */}
          <motion.h1
            className="font-serif text-5xl md:text-7xl font-bold mb-5 tracking-tight leading-tight"
            style={{ color: '#111827' }}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.7 }}
          >
            LandscapeFlow AI · 景观方案总监智能体
          </motion.h1>

          {/* English subtitle — green gradient */}
          <motion.p
            className="text-xl md:text-2xl font-serif text-gradient mb-8 tracking-widest"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.7 }}
          >
            六个AI Agent协作，输入场地条件即可完成景观设计方案全流程工作。
          </motion.p>

          {/* Main description — medium gray */}
          <motion.p
            className="text-base md:text-lg mb-3 leading-relaxed"
            style={{ color: '#4B5563' }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.6 }}
          >
            从项目定义、概念生成、方案选择、空间推演、视觉表达到成果输出，帮助景观设计师快速完成概念方案初稿、汇报大纲和视觉表达素材。
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            className="flex items-center justify-center gap-4 flex-wrap"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.75, duration: 0.6 }}
          >
            <motion.button
              onClick={() => navigate('/workbench')}
              className="btn-primary text-base px-10 py-3.5"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              进入方案工作台
            </motion.button>
            <motion.button
              onClick={() => navigate('/workbench')}
              className="btn-secondary text-base px-8 py-3.5"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              观看演示流程
            </motion.button>
          </motion.div>
        </motion.div>

        {/* ---- 6 Agent Cards — Bright white cards ---- */}
        <motion.div
          className="relative z-10 w-full max-w-5xl px-6 mt-20 pb-16"
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.7 }}
        >
          {/* Section label */}
          <div className="flex items-center gap-4 mb-6 justify-center">
            <div className="h-px flex-1 max-w-20" style={{ background: 'rgba(0,0,0,0.06)' }} />
            <span className="text-xs tracking-widest uppercase font-medium" style={{ color: '#9CA3AF' }}>
              六个 Agent 完整工作流
            </span>
            <div className="h-px flex-1 max-w-20" style={{ background: 'rgba(0,0,0,0.06)' }} />
          </div>

          {/* 2×3 static grid — bright cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {AGENTS.map((agent, i) => (
              <motion.div
                key={agent.num}
                className="agent-card group cursor-default"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1 + i * 0.06, duration: 0.4 }}
              >
                <div
                  className="text-xs font-bold mb-3 font-serif"
                  style={{ color: '#D6A84F' }}
                >
                  {agent.num}
                </div>
                <h3 className="text-sm font-semibold mb-1.5" style={{ color: '#111827' }}>{agent.title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: '#6B7280' }}>{agent.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Bottom gradient — fade to base color (not black!) */}
        <div
          className="absolute bottom-0 left-0 right-0 h-24"
          style={{ background: 'linear-gradient(to top, #F7F8F6, transparent)' }}
        />
      </div>
    </div>
  );
}
