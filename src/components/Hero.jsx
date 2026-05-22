import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const HERO_IMAGES = [
  { src: '/demo-images/aerial.jpg', alt: '鸟瞰总览效果图' },
  { src: '/demo-images/awn.jpg', alt: '中央草坪区效果图' },
  { src: '/demo-images/night.jpg', alt: '夜景灯光效果图' },
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
    <div className="min-h-screen flex flex-col bg-[#080908]">

      {/* ============================================ */}
      {/* LIGHTWEIGHT HEADER */}
      {/* ============================================ */}
      <header className="relative z-30 flex items-center justify-between px-8 py-5">
        {/* Left: Logo */}
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(214,181,109,0.1)', border: '1px solid rgba(214,181,109,0.22)' }}
          >
            <span className="text-sm font-serif font-bold text-gradient">L</span>
          </div>
          <div className="leading-tight">
            <div className="text-xs font-medium" style={{ color: '#A8A29A' }}>景观方案总监 Agent 应用</div>
            <div className="text-[11px] font-serif text-gradient tracking-wide">LandscapeFlow AI</div>
          </div>
        </div>

        {/* Right: CTA */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/workbench')}
            className="btn-gold text-xs px-5 py-2"
          >
            进入工作台
          </button>
          <button
            className="btn-secondary text-xs px-5 py-2"
            onClick={() => navigate('/workbench')}
          >
            观看演示
          </button>
        </div>
      </header>

      {/* ============================================ */}
      {/* HERO SECTION */}
      {/* ============================================ */}
      <div className="relative flex-1 flex flex-col items-center justify-center overflow-hidden min-h-[calc(100vh-72px)]">

        {/* Background image — very subtle */}
        <div className="absolute inset-0 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentImage}
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.10 }}
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
          {/* Gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#080908] via-[#080908]/60 to-[#080908]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#080908]/50 via-transparent to-[#080908]/50" />
        </div>

        {/* Subtle dot grid */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `radial-gradient(circle, #D6B56D 1px, transparent 1px)`,
            backgroundSize: '48px 48px',
          }}
        />

        {/* Ambient glows */}
        <div className="absolute top-1/3 left-1/3 w-[600px] h-[600px] bg-[#22C55E]/[0.025] rounded-full blur-[160px]" />
        <div className="absolute bottom-1/3 right-1/3 w-[500px] h-[500px] bg-[#D6B56D]/[0.025] rounded-full blur-[140px]" />

        {/* ---- Hero Text ---- */}
        <motion.div
          className="relative z-10 text-center px-6 max-w-4xl"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          {/* Hackathon badge */}
          <motion.div
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-10"
            style={{
              background: 'rgba(214, 181, 109, 0.07)',
              border: '1px solid rgba(214, 181, 109, 0.2)',
            }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#D6B56D] animate-pulse-glow" />
            <span className="text-xs font-medium" style={{ color: '#D6B56D' }}>
              腾讯云黑客松 · AI 智能体争霸赛
            </span>
          </motion.div>

          {/* Main title */}
          <motion.h1
            className="font-serif text-5xl md:text-7xl font-bold mb-5 tracking-tight text-[#F5F1E8] leading-tight"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.7 }}
          >
            景观方案总监
            <br />
            <span className="text-gradient">Agent 应用</span>
          </motion.h1>

          {/* English subtitle */}
          <motion.p
            className="text-xl md:text-2xl font-serif text-gradient mb-8 tracking-widest"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.7 }}
          >
            LandscapeFlow AI
          </motion.p>

          {/* Main desc */}
          <motion.p
            className="text-base md:text-lg mb-3 leading-relaxed"
            style={{ color: '#A8A29A' }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.6 }}
          >
            从场地现状到汇报成果，六个 AI Agent 协作完成景观概念方案
          </motion.p>
          <motion.p
            className="text-sm md:text-base mb-12"
            style={{ color: '#78716C' }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65, duration: 0.6 }}
          >
            输入项目条件与场地现状图，自动完成项目定义、概念生成、方案选择、空间推演、视觉表达与成果输出
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
              className="btn-gold text-base px-10 py-3.5"
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
              观看 3 分钟演示流程
            </motion.button>
          </motion.div>
        </motion.div>

        {/* ---- 6 Agent Cards ---- */}
        <motion.div
          className="relative z-10 w-full max-w-5xl px-6 mt-20 pb-16"
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.7 }}
        >
          {/* Section label */}
          <div className="flex items-center gap-4 mb-6 justify-center">
            <div className="h-px flex-1 max-w-20" style={{ background: 'rgba(255,255,255,0.06)' }} />
            <span className="text-xs tracking-widest uppercase" style={{ color: '#555955' }}>
              六个 Agent 完整工作流
            </span>
            <div className="h-px flex-1 max-w-20" style={{ background: 'rgba(255,255,255,0.06)' }} />
          </div>

          {/* 2×3 static grid — NO carousel, NO nav dots */}
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
                  style={{ color: '#D6B56D' }}
                >
                  {agent.num}
                </div>
                <h3 className="text-sm font-semibold text-[#F5F1E8] mb-1.5">{agent.title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: '#78716C' }}>{agent.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Bottom gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#080908] to-transparent" />
      </div>
    </div>
  );
}
