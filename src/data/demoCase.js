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
  { name: '松林社区公园项目任务书.pdf', size: '1.8 MB', type: 'PDF', category: '项目任务书', status: '已上传，待解析', demo: true },
  { name: '松林社区公园甲方需求与汇报要点.docx', size: '620 KB', type: 'DOCX', category: '甲方需求文件', status: '已上传，待解析', demo: true },
  { name: '松林社区公园现状照片.zip', size: '8.4 MB', type: 'ZIP', category: '场地照片', status: '已上传，待解析', demo: true },
  { name: '松林社区公园区位及周边关系图.jpg', size: '2.4 MB', type: 'JPG', category: '区位资料', status: '已上传，待解析', demo: true },
  { name: '松林社区公园红线底图.dwg', size: '4.9 MB', type: 'DWG', category: 'CAD／红线／总平底图', status: '已上传，待解析', demo: true },
  { name: '松林社区公园原有汇报提纲.pptx', size: '3.1 MB', type: 'PPTX', category: '原有 PPT 或文本提纲', status: '已上传，待解析', demo: true },
];

export const DEMO_PROJECT_HISTORY = [
  { id: 'demo-history-1', projectName: '镜湖湿地生态修复概念方案', meta: '湿地公园 · 杭州市余杭区', savedAt: '2026-07-22T10:30:00+08:00', status: '已完成' },
  { id: 'demo-history-2', projectName: '北山郊野公园入口区提升', meta: '郊野公园 · 北京市海淀区', savedAt: '2026-07-20T16:10:00+08:00', status: '成果深化中' },
  { id: 'demo-history-3', projectName: '云栖路街角绿地微更新', meta: '街头绿地 · 深圳市南山区', savedAt: '2026-07-18T09:20:00+08:00', status: '已完成' },
  { id: 'demo-history-4', projectName: '海棠里居住区景观改造', meta: '居住区 · 成都市高新区', savedAt: '2026-07-15T14:45:00+08:00', status: '方案设计中' },
  { id: 'demo-history-5', projectName: '滨江商业街公共空间提升', meta: '商业街区 · 武汉市武昌区', savedAt: '2026-07-12T11:20:00+08:00', status: '待确认' },
];
