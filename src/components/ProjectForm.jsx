import { useState, useRef } from 'react';
import { DEMO_CASE, PROJECT_TYPES } from '../data/demoCase';

const FORM_FIELDS = [
  { key: 'projectName', label: '项目名称', type: 'text', placeholder: '请输入项目名称' },
  { key: 'city', label: '项目地点 / 城市', type: 'text', placeholder: '如：北京市朝阳区' },
  { key: 'area', label: '项目面积', type: 'text', placeholder: '如：约 8000 平方米' },
  { key: 'targetUsers', label: '服务人群', type: 'text', placeholder: '如：老人、儿童、周边居民' },
  { key: 'designGoals', label: '设计目标', type: 'textarea', placeholder: '描述设计需要达成的目标...', rows: 3 },
  { key: 'constraints', label: '限制条件', type: 'textarea', placeholder: '如气候、预算、时间等限制...', rows: 3 },
  { key: 'stylePreference', label: '风格偏好', type: 'text', placeholder: '如：自然生态、现代简洁' },
  { key: 'maintenance', label: '运维要求', type: 'text', placeholder: '如：低维护、耐寒、耐旱' },
  { key: 'clientFocus', label: '甲方关注点', type: 'textarea', placeholder: '如：汇报效果、落地性、成本控制...', rows: 2 },
];

export default function ProjectForm({ formData, onChange, onGenerate, isGenerating, isDemoMode }) {
  const [showErrors, setShowErrors] = useState(false);
  const fileInputRef = useRef(null);

  const handleChange = (key, value) => {
    onChange({ ...formData, [key]: value });
  };

  const handleProjectTypeChange = (value) => {
    onChange({ ...formData, projectType: value });
  };

  const fillDemo = () => {
    onChange({ ...DEMO_CASE, siteFiles: [
      { name: '欢乐谷社区公园现状图.jpg', size: '2.4 MB', type: 'image/jpeg' },
    ]});
  };

  const validateAndGenerate = () => {
    const newErrors = {};
    if (!formData.projectName?.trim()) newErrors.projectName = '请输入项目名称';
    if (!formData.city?.trim()) newErrors.city = '请输入项目地点';
    if (!formData.projectType) newErrors.projectType = '请选择项目类型';

    if (Object.keys(newErrors).length > 0) {
      setShowErrors(true);
      return;
    }

    setShowErrors(false);
    onGenerate();
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-serif font-bold text-[#111827]">项目条件</h2>
          <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>填写后 Agent 将自动生成方案</p>
        </div>
        <button
          onClick={fillDemo}
          className="text-xs px-3 py-1.5 rounded-lg transition-all duration-200"
          style={{
            background: 'rgba(214,181,109,0.08)',
            border: '1px solid rgba(214,181,109,0.25)',
            color: '#D6A84F',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(214,181,109,0.12)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(214,181,109,0.08)';
          }}
        >
          填入演示案例
        </button>
      </div>

      {/* Form fields */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-4">
        {/* Project Name */}
        <div>
          <label className="form-label">
            项目名称 <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            className="form-input"
            value={formData.projectName || ''}
            onChange={(e) => handleChange('projectName', e.target.value)}
            placeholder="请输入项目名称"
          />
        </div>

        {/* City & Area */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">
              项目地点 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              className="form-input"
              value={formData.city || ''}
              onChange={(e) => handleChange('city', e.target.value)}
              placeholder="城市/区域"
            />
          </div>
          <div>
            <label className="form-label">项目面积</label>
            <input
              type="text"
              className="form-input"
              value={formData.area || ''}
              onChange={(e) => handleChange('area', e.target.value)}
              placeholder="平方米"
            />
          </div>
        </div>

        {/* Project Type */}
        <div>
          <label className="form-label">
            项目类型 <span className="text-red-400">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {PROJECT_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => handleProjectTypeChange(type)}
                className="text-xs px-3 py-2 rounded-lg border transition-all duration-200 text-left"
                style={
                  formData.projectType === type
                    ? {
                        background: 'rgba(22,163,74,0.08)',
                        borderColor: 'rgba(22,163,74,0.35)',
                        color: '#16A34A',
                      }
                    : {
                        background: '#FFFFFF',
                        borderColor: '#E5E7EB',
                        color: '#6B7280',
                      }
                }
                onMouseEnter={(e) => {
                  if (formData.projectType !== type) {
                    e.currentTarget.style.borderColor = '#16A34A';
                    e.currentTarget.style.color = '#374151';
                  }
                }}
                onMouseLeave={(e) => {
                  if (formData.projectType !== type) {
                    e.currentTarget.style.borderColor = '#E5E7EB';
                    e.currentTarget.style.color = '#6B7280';
                  }
                }}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Site file upload */}
        <div>
          <label className="form-label">
            场地现状图 / 场地照片
            {isDemoMode && (
              <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(245,158,11,0.1)', color: '#F59E0B' }}>
                演示模式
              </span>
            )}
          </label>
          <p className="text-[11px] mb-2" style={{ color: '#9CA3AF' }}>
            可上传场地照片、总平截图、红线图或现状分析图
          </p>
          {formData.siteFiles?.length > 0 && (
            <div className="mb-2 space-y-1.5">
              {formData.siteFiles.map((file, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg px-3 py-2 text-xs"
                  style={{ background: '#F9FAFB', border: '1px solid #E5E7EB' }}>
                  <div className="flex items-center gap-2 min-w-0">
                    <span>📎</span>
                    <div className="min-w-0">
                      <p className="truncate text-[#111827]">{file.name}</p>
                      <p className="text-[10px]" style={{ color: '#9CA3AF' }}>{file.type} · {file.size}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const newFiles = (formData.siteFiles || []).filter((_, j) => j !== i);
                      onChange({ ...formData, siteFiles: newFiles });
                    }}
                    className="text-red-400 hover:text-red-300 transition-colors flex-shrink-0 ml-2"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
          <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.pdf" multiple className="hidden"
            onChange={(e) => {
              const files = Array.from(e.target.files || []);
              const mapped = files.map((f) => ({
                name: f.name,
                size: (f.size / 1024 / 1024).toFixed(1) + ' MB',
                type: f.type || 'application/octet-stream',
              }));
              onChange({ ...formData, siteFiles: [...(formData.siteFiles || []), ...mapped] });
              if (fileInputRef.current) fileInputRef.current.value = '';
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-2.5 rounded-lg text-xs transition-all duration-200 bg-white"
            style={{
              border: '1px dashed #D1D5DB',
              color: '#9CA3AF',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#16A34A';
              e.currentTarget.style.color = '#16A34A';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#D1D5DB';
              e.currentTarget.style.color = '#9CA3AF';
            }}
          >
            + 点击上传场地现状图（支持 JPG / PNG / PDF，可多选）
          </button>
        </div>

        {/* Rest of fields */}
        {FORM_FIELDS.filter((f) => !['projectName', 'city', 'area', 'projectType'].includes(f.key)).map((field) => (
          <div key={field.key}>
            <label className="form-label">{field.label}</label>
            {field.type === 'textarea' ? (
              <textarea
                className="form-input resize-none"
                rows={field.rows || 3}
                value={formData[field.key] || ''}
                onChange={(e) => handleChange(field.key, e.target.value)}
                placeholder={field.placeholder}
              />
            ) : (
              <input
                type="text"
                className="form-input"
                value={formData[field.key] || ''}
                onChange={(e) => handleChange(field.key, e.target.value)}
                placeholder={field.placeholder}
              />
            )}
          </div>
        ))}
      </div>

      {/* Generate button */}
      <div className="mt-4 pt-4 border-t" style={{ borderColor: '#E5E7EB' }}>
        {showErrors && !isGenerating && (
          <div className="mb-3 text-xs rounded-lg p-2" style={{
            background: 'rgba(239,68,68,0.04)',
            border: '1px solid rgba(239,68,68,0.15)',
            color: '#EF4444',
          }}>
            请填写必填项：项目名称、项目地点、项目类型
          </div>
        )}
        <button
          onClick={validateAndGenerate}
          disabled={isGenerating}
          className="w-full py-3 rounded-xl font-semibold text-base transition-all duration-300"
          style={
            isGenerating
              ? {
                  background: '#E5E7EB',
                  color: '#9CA3AF',
                  cursor: 'not-allowed',
                }
              : {
                  background: 'linear-gradient(135deg, #16A34A, #22C55E)',
                  color: '#FFFFFF',
                }
          }
          onMouseEnter={(e) => {
            if (!isGenerating) {
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(22,163,74,0.35)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isGenerating) {
              e.currentTarget.style.boxShadow = 'none';
            }
          }}
        >
          {isGenerating ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Agent 正在工作中...
            </span>
          ) : (
            '⚡ 一键生成完整方案'
          )}
        </button>
        <p className="text-[10px] text-center mt-2" style={{ color: '#9CA3AF' }}>
          六个 Agent 将依次执行，预计耗时约 30 秒
        </p>
      </div>
    </div>
  );
}
