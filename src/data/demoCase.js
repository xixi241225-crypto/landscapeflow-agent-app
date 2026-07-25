import demoProjectInput from '../../data/demo-projects/huanlegu-community-park/project_input_v1.json' with { type: 'json' };
import demoSourceIndex from '../../data/demo-projects/huanlegu-community-park/source_index.json' with { type: 'json' };

/**
 * 默认欢乐谷 Demo 的唯一输入源。
 * 表单字段仅是 project_input_v1 的展示投影，Agent 1 仍读取完整结构化输入。
 */
export const DEMO_CASE_ID = 'beijing-happy-valley-community-park-demo';

export const DEMO_PROJECT_INPUT = demoProjectInput;
export const DEMO_SOURCE_INDEX = demoSourceIndex;

const projectFact = (field) => [
  ...demoProjectInput.projectFacts.confirmed,
  ...demoProjectInput.projectFacts.measurements,
  ...demoProjectInput.projectFacts.observations,
].find((record) => record.field === field);

const areaMeasurement = projectFact('siteArea');

export const DEMO_CASE = {
  projectName: projectFact('projectName').value,
  city: projectFact('location').value,
  area: String(areaMeasurement.value),
  projectType: projectFact('projectType').value,
  targetUsers: '',
  designGoals: '',
  constraints: '',
  stylePreference: '',
  maintenance: '',
  clientFocus: '',
  designStage: projectFact('designStage').value,
  deliveryDate: '',
  budgetCondition: '',
  presentationAudience: '',
  areaEvidenceType: areaMeasurement.evidenceType,
  areaStatus: areaMeasurement.status,
  areaConfidence: areaMeasurement.confidence,
  demoProjectInput,
  siteFiles: [],
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
  {
    id: 'demo-input-v1',
    name: 'project_input_v1.json',
    size: '结构化输入',
    type: 'JSON',
    category: '项目任务书',
    status: '已编译，来源可追溯',
    demo: true,
    demoCaseId: DEMO_CASE_ID,
    sourceId: 'SRC-DESIGNER-01',
  },
  ...demoSourceIndex.sources
    .filter((source) => ['siteImage', 'referenceImage'].includes(source.type))
    .map((source) => ({
      id: source.id,
      name: source.copiedPath.split('/').pop(),
      size: '来源资产',
      type: source.copiedPath.split('.').pop().toUpperCase(),
      category: source.type === 'siteImage' ? '区位资料' : '参考案例',
      status: source.type === 'siteImage' ? '量测与影像观察，待正式资料复核' : '设计偏好参考，非最终决策',
      demo: true,
      demoCaseId: DEMO_CASE_ID,
      sourceId: source.id,
    })),
];

export const DEMO_PROJECT_HISTORY = [
  { id: 'demo-history-1', projectName: '镜湖湿地生态修复概念方案', meta: '湿地公园 · 杭州市余杭区', savedAt: '2026-07-22T10:30:00+08:00', status: '已完成' },
  { id: 'demo-history-2', projectName: '北山郊野公园入口区提升', meta: '郊野公园 · 北京市海淀区', savedAt: '2026-07-20T16:10:00+08:00', status: '成果深化中' },
  { id: 'demo-history-3', projectName: '云栖路街角绿地微更新', meta: '街头绿地 · 深圳市南山区', savedAt: '2026-07-18T09:20:00+08:00', status: '已完成' },
  { id: 'demo-history-4', projectName: '海棠里居住区景观改造', meta: '居住区 · 成都市高新区', savedAt: '2026-07-15T14:45:00+08:00', status: '方案设计中' },
  { id: 'demo-history-5', projectName: '滨江商业街公共空间提升', meta: '商业街区 · 武汉市武昌区', savedAt: '2026-07-12T11:20:00+08:00', status: '待确认' },
];
