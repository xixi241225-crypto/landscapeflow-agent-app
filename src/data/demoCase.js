/**
 * Demo-0A 唯一默认项目输入。
 * 只有 DEMO_CASE 中明确提供的字段可作为项目事实；其余信息必须在
 * DEMO_PARSED_PROJECT_DEFINITION 中保持待补充、待复核或假设状态。
 */
export const DEMO_CASE_ID = 'beijing-happy-valley-community-park-demo';

export const DEMO_CASE = {
  projectName: '北京市欢乐谷社区公园景观设计',
  city: '北京市朝阳区',
  area: '10000',
  projectType: '社区公园景观设计',
  targetUsers: '',
  designGoals: '',
  constraints: '',
  stylePreference: '',
  maintenance: '',
  clientFocus: '',
  designStage: '',
  deliveryDate: '',
  budgetCondition: '',
  presentationAudience: '',
  siteFiles: [], // { name, size, type }
};

export const PROJECT_TYPES = [
  '社区公园景观设计',
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
  { id: 'file-01', name: '北京市欢乐谷社区公园项目资料目录.pdf', size: '1.2 MB', type: 'PDF', category: '项目任务书', status: '演示资料待复核', demo: true, demoCaseId: DEMO_CASE_ID },
  { id: 'file-02', name: '北京市欢乐谷社区公园项目沟通纪要.docx', size: '520 KB', type: 'DOCX', category: '甲方需求文件', status: '演示资料待复核', demo: true, demoCaseId: DEMO_CASE_ID },
  { id: 'file-03', name: '北京市欢乐谷社区公园场地现状照片.zip', size: '8.1 MB', type: 'ZIP', category: '场地照片', status: '演示资料待复核', demo: true, demoCaseId: DEMO_CASE_ID },
  { id: 'file-04', name: '北京市欢乐谷社区公园区位资料.jpg', size: '2.1 MB', type: 'JPG', category: '区位资料', status: '演示资料待复核', demo: true, demoCaseId: DEMO_CASE_ID },
  { id: 'file-05', name: '北京市欢乐谷社区公园红线及现状底图.dwg', size: '4.6 MB', type: 'DWG', category: 'CAD／红线／总平底图', status: '演示资料待复核', demo: true, demoCaseId: DEMO_CASE_ID },
  { id: 'file-06', name: '北京市欢乐谷社区公园原始汇报资料.pptx', size: '2.9 MB', type: 'PPTX', category: '原有 PPT 或文本提纲', status: '演示资料待复核', demo: true, demoCaseId: DEMO_CASE_ID },
];

const ref = (fileId, fileName, location = '') => ({ fileId, fileName, location });

export const DEMO_PARSED_PROJECT_DEFINITION = {
  stakeholders: [
    { label: '服务人群', value: '具体服务人群及使用时段待项目资料补充', status: 'pending', sourceRefs: [], confidence: 0.3 },
  ],
  explicitGoals: [
    { label: '设计目标', value: '具体设计目标待项目任务书或设计师补充', status: 'pending', sourceRefs: [], confidence: 0.3 },
  ],
  latentGoals: [],
  siteConditions: {
    existingAssets: [
      { label: '现状资源', value: '现状植物、构筑物及其他可保留资源待现场资料复核', status: 'pending', sourceRefs: [ref('file-03', '北京市欢乐谷社区公园场地现状照片.zip', '场地现状资料'), ref('file-05', '北京市欢乐谷社区公园红线及现状底图.dwg', '场地基础资料')], confidence: 0.4 },
    ],
    existingProblems: [
      { label: '现状问题', value: '场地现状问题与改造重点待调研和任务书复核', status: 'pending', sourceRefs: [], confidence: 0.3 },
    ],
    surroundings: [
      { label: '周边关系', value: '周边用地、社区界面与公共交通关系待区位资料复核', status: 'pending', sourceRefs: [ref('file-04', '北京市欢乐谷社区公园区位资料.jpg', '区位资料')], confidence: 0.4 },
    ],
    climateAndEcology: [
      { label: '生态条件', value: '现状植物、生境与生态敏感条件待专项资料复核', status: 'pending', sourceRefs: [], confidence: 0.3 },
    ],
    accessAndMobility: [
      { label: '出入口与交通', value: '现状出入口、消防及慢行衔接条件待底图复核', status: 'pending', sourceRefs: [ref('file-05', '北京市欢乐谷社区公园红线及现状底图.dwg', '场地基础资料')], confidence: 0.4 },
    ],
    terrainAndWater: [
      { label: '竖向与水系', value: '地形高程、排水方向及现状水体条件待测绘资料复核', status: 'pending', sourceRefs: [], confidence: 0.3 },
    ],
    interfaces: [
      { label: '市政接口', value: '给排水、电力、地下管线等市政接口待补充', status: 'pending', sourceRefs: [], confidence: 0.3 },
    ],
  },
  constraints: [
    { label: '核心约束', value: '建设预算、功能边界、工期与专项规范要求待补充', status: 'pending', sourceRefs: [], confidence: 0.3 },
  ],
  designPrinciples: [
    { label: '概念推演原则', value: '暂以社区公园的公共性、安全可达与弹性使用作为概念推演原则，待项目目标补充后复核', status: 'assumption', sourceRefs: [], confidence: 0.65 },
  ],
  successCriteria: [
    { label: '成功标准', value: '项目成功标准及可量化验收口径待补充', status: 'pending', sourceRefs: [], confidence: 0.3 },
  ],
  coreQuestions: [
    { label: '核心设计问题', value: '在目标、使用需求和场地条件尚待补充的情况下，如何建立可复核、可调整的社区公园概念方向？', status: 'assumption', sourceRefs: [], confidence: 0.65 },
  ],
  openItems: [
    { label: '设计目标', value: '具体设计目标与成果优先级待补充', status: 'pending', sourceRefs: [], confidence: 0.3 },
    { label: '服务人群', value: '主要使用者、人群结构与使用时段待补充', status: 'pending', sourceRefs: [], confidence: 0.3 },
    { label: '功能需求', value: '必选功能、可选功能及面积需求待补充', status: 'pending', sourceRefs: [], confidence: 0.3 },
    { label: '投资与工期', value: '建设预算、分期计划与交付时间待补充', status: 'pending', sourceRefs: [], confidence: 0.3 },
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
