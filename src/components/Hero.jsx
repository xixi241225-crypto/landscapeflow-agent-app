import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Hero() {
  const navigate = useNavigate();
  return (
    <div className="app-shell landscape-contours h-screen overflow-hidden">
      <header className="sticky top-0 z-20 border-b border-[var(--lf-border)] bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-[68px] max-w-[1440px] items-center justify-between px-6 lg:px-10">
          <button onClick={() => navigate('/')} className="flex items-center gap-3 text-left">
            <span className="brand-mark h-10 w-10 rounded-xl">L</span>
            <span>
              <span className="brand-gradient-text block text-base font-bold">LandscapeFlow AI</span>
              <span className="block text-xs text-slate-500">景观方案设计总监智能体</span>
            </span>
          </button>
          <span className="hidden rounded-full border border-violet-100 bg-violet-50/70 px-3 py-1.5 text-xs font-medium text-[var(--lf-muted)] md:inline-flex">
            腾讯云黑客松 · AI智能体争霸赛
          </span>
        </div>
      </header>

      <main className="h-[calc(100vh-68px)]">
        <section className="mx-auto flex h-full max-w-[1120px] items-center justify-center px-6 py-10 text-center">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <p className="brand-gradient-text text-3xl font-bold tracking-tight md:text-4xl">LandscapeFlow AI</p>
            <h1 className="mt-3 font-serif text-4xl font-bold tracking-tight text-[var(--lf-brand-950)] md:text-6xl">
              景观方案设计总监智能体
            </h1>
            <p className="mx-auto mt-7 max-w-4xl text-lg leading-8 text-slate-600 md:text-xl">
              1 名设计总监智能体 × 6 个专业 Agent × 1 份持续演进的项目设计蓝本
            </p>
            <div className="mx-auto mt-8 grid max-w-2xl gap-3 md:grid-cols-2">
              <p className="rounded-2xl border border-violet-100 bg-white/90 px-5 py-4 text-base font-bold text-[var(--lf-brand-900)] shadow-sm">
                对资深设计师，一人即团队
              </p>
              <p className="rounded-2xl border border-amber-100 bg-white/90 px-5 py-4 text-base font-bold text-[var(--lf-brand-900)] shadow-sm">
                对年轻设计师，随身设计导师
              </p>
            </div>
            <div className="mt-9 flex justify-center">
              <button onClick={() => navigate('/workbench', { state: { newProject: true, presentationMode: true } })} className="btn-primary min-w-[210px] px-9 py-4 text-base">开始方案设计</button>
            </div>
            <p className="mt-5 text-sm text-[var(--lf-muted)]">从项目资料开始，六阶段推进；关键判断始终由设计师确认。</p>
          </motion.div>
        </section>
      </main>
    </div>
  );
}
