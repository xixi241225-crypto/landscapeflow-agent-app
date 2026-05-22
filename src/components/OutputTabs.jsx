import { useState } from 'react';
import { motion } from 'framer-motion';
import { downloadMarkdown, copyToClipboard, combinePrompts } from '../lib/reportExporter';

const TABS = [
  { key: 'prompts', label: '效果图 Prompt', icon: '🖼️' },
  { key: 'ppt', label: 'PPT 汇报大纲', icon: '📊' },
  { key: 'report', label: 'Markdown 报告', icon: '📝' },
];

export default function OutputTabs({ outputs, projectName }) {
  const [activeTab, setActiveTab] = useState('prompts');
  const [copiedId, setCopiedId] = useState(null);
  const [showFullReport, setShowFullReport] = useState(false);

  if (!outputs) return null;

  const { prompts = [], pptOutline = [], markdownReport = '' } = outputs;

  const handleCopySingle = async (text, id) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleCopyAllPrompts = async () => {
    await copyToClipboard(combinePrompts(prompts));
    setCopiedId('all-prompts');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadMD = () => {
    downloadMarkdown(markdownReport, projectName);
  };

  return (
    <div className="space-y-4">
      {/* Tab Bar */}
      <div className="flex gap-1 bg-landscape-800/50 p-1 rounded-xl">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium transition-all duration-200 ${
              activeTab === tab.key
                ? 'bg-landscape-accent/20 text-landscape-glow'
                : 'text-landscape-400 hover:text-landscape-300'
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Prompts Tab */}
        {activeTab === 'prompts' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-landscape-300">
                生成 {prompts.length} 条专业景观效果图 Prompt
              </p>
              <button
                onClick={handleCopyAllPrompts}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-all duration-200 ${
                  copiedId === 'all-prompts'
                    ? 'border-landscape-accent bg-landscape-accent/20 text-landscape-glow'
                    : 'border-landscape-500/30 text-landscape-400 hover:text-landscape-300'
                }`}
              >
                {copiedId === 'all-prompts' ? '已复制 ✓' : '复制全部 Prompt'}
              </button>
            </div>

            {prompts.map((prompt, index) => (
              <motion.div
                key={prompt.id}
                className="glass-card p-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-white">
                    {prompt.id}. {prompt.title}
                  </h4>
                  <button
                    onClick={() => handleCopySingle(prompt.cn, prompt.id)}
                    className={`text-xs px-2 py-1 rounded transition-all ${
                      copiedId === prompt.id
                        ? 'text-landscape-glow'
                        : 'text-landscape-400 hover:text-landscape-300'
                    }`}
                  >
                    {copiedId === prompt.id ? '已复制 ✓' : '复制'}
                  </button>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex flex-wrap gap-2">
                    <span className="bg-landscape-700/50 px-2 py-0.5 rounded text-landscape-300">视角：{prompt.angle}</span>
                    <span className="bg-landscape-700/50 px-2 py-0.5 rounded text-landscape-300">时间：{prompt.time}</span>
                    <span className="bg-landscape-700/50 px-2 py-0.5 rounded text-landscape-300">风格：{prompt.style}</span>
                  </div>

                  <div>
                    <span className="text-landscape-400">中文提示词：</span>
                    <p className="text-landscape-200 mt-1 leading-relaxed">{prompt.cn}</p>
                  </div>

                  <div>
                    <span className="text-landscape-400">English Prompt：</span>
                    <p className="text-landscape-300 mt-1 leading-relaxed italic">{prompt.en}</p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <div>
                      <span className="text-landscape-400">必须出现：</span>
                      <span className="text-landscape-200">{prompt.mustInclude?.join('、')}</span>
                    </div>
                    <div>
                      <span className="text-landscape-400">避免：</span>
                      <span className="text-landscape-300">{prompt.avoid?.join('、')}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* PPT Outline Tab */}
        {activeTab === 'ppt' && (
          <div className="space-y-3">
            <p className="text-sm text-landscape-300 mb-2">
              生成 {pptOutline.length} 页 PPT 汇报大纲
            </p>

            {pptOutline.map((page, index) => (
              <motion.div
                key={page.page}
                className="glass-card p-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="w-8 h-8 rounded-lg bg-landscape-accent/15 text-landscape-glow flex items-center justify-center text-xs font-bold">
                    {page.page}
                  </span>
                  <h4 className="text-sm font-semibold text-white">{page.title}</h4>
                </div>

                <ul className="space-y-1 mb-2">
                  {page.content.map((item, i) => (
                    <li key={i} className="text-xs text-landscape-300">· {item}</li>
                  ))}
                </ul>

                <div className="text-xs">
                  <span className="text-landscape-500">建议配图：</span>
                  <span className="text-landscape-400">{page.suggestedImage}</span>
                </div>
                <div className="text-xs mt-1">
                  <span className="text-landscape-500">讲解重点：</span>
                  <span className="text-landscape-400 italic">{page.keyPoints}</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Markdown Report Tab */}
        {activeTab === 'report' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-landscape-300">完整 Markdown 方案报告</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowFullReport(!showFullReport)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-landscape-500/30 text-landscape-400 hover:text-landscape-300 transition-all"
                >
                  {showFullReport ? '收起' : '展开全文'}
                </button>
                <button
                  onClick={handleDownloadMD}
                  className="text-xs px-3 py-1.5 rounded-lg border border-landscape-accent/40 text-landscape-glow hover:bg-landscape-accent/10 transition-all"
                >
                  下载 Markdown 报告
                </button>
              </div>
            </div>

            {showFullReport ? (
              <motion.div
                className="code-block text-xs leading-relaxed max-h-[500px] overflow-y-auto whitespace-pre-wrap"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
              >
                {markdownReport}
              </motion.div>
            ) : (
              <div className="glass-card p-4 text-center">
                <p className="text-landscape-400 text-sm mb-2">报告已生成，共 {markdownReport.length.toLocaleString()} 字符</p>
                <p className="text-landscape-500 text-xs">点击"展开全文"预览或"下载 Markdown 报告"保存到本地</p>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
