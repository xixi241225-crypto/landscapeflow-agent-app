/**
 * 工作台演示案例数据
 * 统一使用“松林社区公园更新设计”，避免不同页面混用项目名称。
 */
export const DEMO_CASE = {
  projectName: '松林社区公园更新设计',
  city: '上海市浦东新区',
  area: '28000',
  projectType: '社区公园',
  targetUsers: '社区居民、儿童、老人',
  designGoals: '满足儿童、老人和社区居民日常活动，营造自然生态、邻里共享的社区公共空间，同时兼顾景观品质与全年龄使用需求。',
  constraints: '控制总体造价与后期维护成本，减少高维护水景和大面积石材铺装，保留核心活动空间，并满足安全、无障碍和生态设计要求。',
  stylePreference: '自然生态、邻里共享、轻介入',
  maintenance: '低维护、乡土植物、耐久材料',
  clientFocus: '造价控制、全年龄使用、生态品质',
  designStage: '概念方案',
  deliveryDate: '',
  budgetCondition: '中档造价｜约500元/㎡',
  presentationAudience: '',
  siteFiles: [], // { name, size, type }
};

export const PROJECT_TYPES = [
  '社区公园',
  '城市公园',
  '湿地公园',
  '郊野公园',
  '口袋公园',
  '街头绿地',
  '滨水公园',
  '居住区',
  '居住区景观',
  '商业街区',
  '商业公共空间',
  '文旅景观',
  '其他',
];

export const DESIGN_STAGES = ['概念方案', '方案设计', '方案深化', '改造提升'];

export const BUDGET_OPTIONS = [
  '低档造价｜约300元/㎡',
  '中档造价｜约500元/㎡',
  '高档造价｜约800元/㎡',
];

export const DEMO_FILES = [
  { id: 'file-01', name: '松林社区公园项目任务书.pdf', size: '1.8 MB', type: 'PDF', category: '项目任务书', status: '演示资料已结构化', demo: true },
  { id: 'file-02', name: '松林社区公园甲方需求与汇报要点.docx', size: '620 KB', type: 'DOCX', category: '甲方需求文件', status: '演示资料已结构化', demo: true },
  { id: 'file-03', name: '松林社区公园现状照片.zip', size: '8.4 MB', type: 'ZIP', category: '场地照片', status: '演示资料已结构化', demo: true },
  { id: 'file-04', name: '松林社区公园区位及周边关系图.jpg', size: '2.4 MB', type: 'JPG', category: '区位资料', status: '演示资料已结构化', demo: true },
  { id: 'file-05', name: '松林社区公园红线底图.dwg', size: '4.9 MB', type: 'DWG', category: 'CAD／红线／总平底图', status: '演示资料已结构化', demo: true },
  { id: 'file-06', name: '松林社区公园原有汇报提纲.pptx', size: '3.1 MB', type: 'PPTX', category: '原有 PPT 或文本提纲', status: '演示资料已结构化', demo: true },
];

const ref = (fileId, fileName, location = '') => ({ fileId, fileName, location });

export const DEMO_PARSED_PROJECT_DEFINITION = {
  stakeholders: [
    { label: '主要使用者', value: '社区居民', sourceRefs: [ref('file-01', '松林社区公园项目任务书.pdf', '项目需求资料')], confidence: 0.98 },
    { label: '重点使用者', value: '儿童与陪护家庭', sourceRefs: [ref('file-02', '松林社区公园甲方需求与汇报要点.docx', '甲方需求资料')], confidence: 0.96 },
    { label: '重点使用者', value: '老年居民', sourceRefs: [ref('file-02', '松林社区公园甲方需求与汇报要点.docx', '甲方需求资料')], confidence: 0.96 },
  ],
  explicitGoals: [
    { label: '全龄活动', value: '满足儿童、老人和社区居民日常活动', sourceRefs: [ref('file-01', '松林社区公园项目任务书.pdf', '项目需求资料')], confidence: 0.97 },
    { label: '自然体验', value: '营造自然生态的公共空间体验', sourceRefs: [ref('file-01', '松林社区公园项目任务书.pdf', '项目需求资料')], confidence: 0.95 },
    { label: '成本控制', value: '控制造价与后期维护成本', sourceRefs: [ref('file-02', '松林社区公园甲方需求与汇报要点.docx', '甲方需求资料')], confidence: 0.95 },
  ],
  latentGoals: [
    { label: '深层诉求', value: '在有限投入下形成可持续且具有社区识别性的公共空间', status: 'assumption', sourceRefs: [ref('file-02', '松林社区公园甲方需求与汇报要点.docx', '甲方需求资料')], confidence: 0.82 },
  ],
  siteConditions: {
    existingAssets: [
      { label: '现状资源', value: '场地现状松林构成可保留的生态与空间骨架', sourceRefs: [ref('file-03', '松林社区公园现状照片.zip', '场地现状资料'), ref('file-05', '松林社区公园红线底图.dwg', '场地基础资料')], confidence: 0.9 },
    ],
    existingProblems: [
      { label: '现状问题', value: '活动空间品质与全龄共享能力需要提升', sourceRefs: [ref('file-01', '松林社区公园项目任务书.pdf', '项目需求资料')], confidence: 0.9 },
      { label: '运维问题', value: '高维护景观内容与后期管理成本需要控制', sourceRefs: [ref('file-02', '松林社区公园甲方需求与汇报要点.docx', '甲方需求资料')], confidence: 0.92 },
    ],
    surroundings: [
      { label: '周边关系', value: '项目服务周边社区日常公共活动', sourceRefs: [ref('file-04', '松林社区公园区位及周边关系图.jpg', '区位资料')], confidence: 0.94 },
    ],
    climateAndEcology: [
      { label: '生态条件', value: '优先保护现状乔木并提升林下生态稳定性', sourceRefs: [ref('file-03', '松林社区公园现状照片.zip', '场地现状资料')], confidence: 0.86 },
    ],
    accessAndMobility: [],
    terrainAndWater: [],
    interfaces: [],
  },
  constraints: [
    { label: '功能约束', value: '保留主要活动功能', sourceRefs: [ref('file-01', '松林社区公园项目任务书.pdf', '项目需求资料')], confidence: 0.96 },
    { label: '造价与运维', value: '减少高维护水景和大面积石材铺装', sourceRefs: [ref('file-02', '松林社区公园甲方需求与汇报要点.docx', '甲方需求资料')], confidence: 0.95 },
    { label: '规范与生态', value: '满足安全、无障碍和生态设计要求', sourceRefs: [ref('file-01', '松林社区公园项目任务书.pdf', '项目需求资料')], confidence: 0.94 },
  ],
  designPrinciples: [
    { label: '全龄共享', value: '全龄共享', sourceRefs: [ref('file-01', '松林社区公园项目任务书.pdf', '项目需求资料')], confidence: 0.96 },
    { label: '低维护优先', value: '低维护优先', sourceRefs: [ref('file-02', '松林社区公园甲方需求与汇报要点.docx', '甲方需求资料')], confidence: 0.95 },
    { label: '保留现状资源', value: '保留现状松林', sourceRefs: [ref('file-03', '松林社区公园现状照片.zip', '场地现状资料')], confidence: 0.9 },
    { label: '控制硬质铺装', value: '控制大面积硬质铺装', sourceRefs: [ref('file-02', '松林社区公园甲方需求与汇报要点.docx', '甲方需求资料')], confidence: 0.94 },
    { label: '投入聚焦', value: '核心投入集中于高频使用空间', status: 'assumption', sourceRefs: [ref('file-02', '松林社区公园甲方需求与汇报要点.docx', '甲方需求资料')], confidence: 0.82 },
  ],
  successCriteria: [
    { label: '使用价值', value: '儿童、老人和社区居民均能安全、便捷地开展日常活动', sourceRefs: [ref('file-01', '松林社区公园项目任务书.pdf', '项目需求资料')], confidence: 0.92 },
    { label: '实施价值', value: '方案在既定造价与低维护目标下具备实施可行性', sourceRefs: [ref('file-02', '松林社区公园甲方需求与汇报要点.docx', '甲方需求资料')], confidence: 0.9 },
    { label: '生态价值', value: '现状松林得到保留并形成稳定的林下生态空间', sourceRefs: [ref('file-03', '松林社区公园现状照片.zip', '场地现状资料')], confidence: 0.86 },
  ],
  coreQuestions: [
    { label: '核心设计问题', value: '如何以现状松林为基础，统筹全龄活动、低维护与社区识别性？', sourceRefs: [ref('file-01', '松林社区公园项目任务书.pdf', '项目需求资料'), ref('file-03', '松林社区公园现状照片.zip', '场地现状资料')], confidence: 0.9 },
  ],
  openItems: [
    { label: '竖向条件', value: '现状高程、排水方向与土方条件待补充', status: 'pending', sourceRefs: [], confidence: 0.45 },
    { label: '市政接口', value: '地下管线及给排水、电力接口资料待补充', status: 'pending', sourceRefs: [], confidence: 0.4 },
  ],
  conflicts: [],
};

export const DEMO_PROJECT_HISTORY = [
  { id: 'demo-history-1', projectName: '镜湖湿地生态修复概念方案', meta: '湿地公园 · 杭州市余杭区', savedAt: '2026-07-22T10:30:00+08:00', status: '已完成' },
  { id: 'demo-history-2', projectName: '北山郊野公园入口区提升', meta: '郊野公园 · 北京市海淀区', savedAt: '2026-07-20T16:10:00+08:00', status: '成果深化中' },
  { id: 'demo-history-3', projectName: '云栖路街角绿地微更新', meta: '街头绿地 · 深圳市南山区', savedAt: '2026-07-18T09:20:00+08:00', status: '已完成' },
  { id: 'demo-history-4', projectName: '海棠里居住区景观改造', meta: '居住区 · 成都市高新区', savedAt: '2026-07-15T14:45:00+08:00', status: '方案设计中' },
  { id: 'demo-history-5', projectName: '滨江商业街公共空间提升', meta: '商业街区 · 武汉市武昌区', savedAt: '2026-07-12T11:20:00+08:00', status: '待确认' },
];
