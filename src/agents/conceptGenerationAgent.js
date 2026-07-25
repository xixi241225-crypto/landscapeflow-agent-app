import {
  BLUEPRINT_ITEM_STATUS,
  BLUEPRINT_MILESTONES,
  BLUEPRINT_SCHEMA_VERSION,
  cloneBlueprint,
  newEntityId,
} from '../blueprint/blueprintModel.js';
import { migrateBlueprintToV2 } from '../blueprint/blueprintMigration.js';
import {
  selectConceptGenerationInput,
  selectProjectFactByKey,
} from '../blueprint/blueprintSelectors.js';
import { assertAgentWriteScope } from './projectDefinitionAgent.js';
import conceptReference from '../../data/demo-projects/huanlegu-community-park/concepts/concept_reference_v1.json' with { type: 'json' };

const now = () => new Date().toISOString();
const milestoneNumber = (value) => Number(String(value || 'v0').replace('v', '')) || 0;
const itemText = (item) => String(item?.value || '').trim();
const compact = (value, fallback) => String(value || '').trim() || fallback;

function responseMapping(sourcePath, sourceItem, response) {
  return {
    sourcePath,
    sourceItemId: sourceItem?.id || '',
    sourceLabel: sourceItem?.label || '项目设计蓝本条目',
    sourceStatus: sourceItem?.status || BLUEPRINT_ITEM_STATUS.PENDING,
    response,
  };
}

function pickRequired(input) {
  const goal = input.explicitGoals[0] || input.latentGoals[0];
  const constraint = input.confirmedConstraints[0] || input.pendingConstraints[0];
  const constraintSourcePath = input.confirmedConstraints[0]
    ? 'chapters.projectDefinition.constraints'
    : 'projectInput.pendingVerification';
  const principle = input.confirmedDesignPrinciples[0] || input.designPreferences[0];
  const principleSourcePath = input.confirmedDesignPrinciples[0]
    ? 'chapters.projectDefinition.designPrinciples'
    : 'projectInput.designPreferences';
  const site = input.flattenedSiteConditions[0] || input.successCriteria[0];
  if (!goal || !constraint || !principle || !site) {
    throw new Error('Agent 2 输入不足：至少需要一项目标、约束或待复核项、已确认原则或设计偏好，以及场地条件或成功标准。');
  }
  return {
    goal,
    constraint,
    constraintSourcePath,
    principle,
    principleSourcePath,
    site,
  };
}

function dependencyFromOpenItem(item) {
  return {
    id: `dependency-${item.id || newEntityId('open-item')}`,
    sourceItemId: item.id || '',
    label: item.label || '待补充资料',
    value: item.value || '',
    status: BLUEPRINT_ITEM_STATUS.PENDING,
    sourcePath: 'chapters.projectDefinition.openItems',
  };
}

function confirmedTexts(items = []) {
  return items
    .filter((item) => item?.status === BLUEPRINT_ITEM_STATUS.CONFIRMED)
    .map(itemText)
    .filter(Boolean);
}

function parseArea(value) {
  const parsed = Number(String(value || '').replace(/[^0-9.]/g, ''));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function deriveConceptProfile(input) {
  const projectType = compact(input.project.projectType, '公共景观空间');
  const evidence = [
    projectType,
    ...confirmedTexts(input.explicitGoals),
    ...confirmedTexts(input.latentGoals),
    ...confirmedTexts(input.flattenedSiteConditions),
    ...confirmedTexts(input.confirmedConstraints),
    ...confirmedTexts(input.confirmedDesignPrinciples),
    ...confirmedTexts(input.stakeholders),
  ].join(' ');
  const waterfront = /滨水|水岸|滨江|滨河|河道|湖滨|岸线/.test(evidence);
  const commercial = /商业|街区|消费|零售|市集/.test(evidence);
  const community = /社区|居住|邻里/.test(evidence);
  const ecological = /生态修复|湿地|生境|自然保护/.test(evidence);
  const area = parseArea(input.project.area);
  const scale = area && area <= 15000
    ? { label: '紧凑尺度', spatial: '以短距离、复合节点和清晰环线控制空间效率' }
    : area && area >= 50000
      ? { label: '较大尺度', spatial: '以分段组织、层级路径和多核心协同控制空间节奏' }
      : { label: '中等尺度', spatial: '以连续骨架和分区节点平衡整体性与使用弹性' };

  if (waterfront && commercial) {
    return {
      family: '滨水商业街区',
      place: '滨水商业公共空间',
      everyday: { name: '岸线缝合｜连续慢行界面', noun: '岸线缝合', scene: '连续滨水步行界面', material: '可停留的沿街灰空间' },
      active: { name: '活力聚核｜商业复合客厅', noun: '活力聚核', scene: '弹性活动与消费核心', material: '可切换的公共活动界面' },
      nature: { name: '蓝绿漫游｜滨水生态廊', noun: '蓝绿漫游', scene: '滨水生态体验廊', material: '亲水但边界可控的观察节点' },
      tags: ['岸线关系', '商业界面', '步行连续'],
      scale,
    };
  }
  if (commercial) {
    return {
      family: '商业街区',
      place: '商业公共空间',
      everyday: { name: '街区缝合｜连续步行界面', noun: '街区缝合', scene: '连续步行与停留界面', material: '沿街可停留灰空间' },
      active: { name: '活力聚核｜商业共享客厅', noun: '活力聚核', scene: '复合活动与展示核心', material: '可切换的公共事件界面' },
      nature: { name: '绿荫漫游｜舒缓体验廊', noun: '绿荫漫游', scene: '慢行休憩体验廊', material: '遮荫与季相体验节点' },
      tags: ['街区连通', '界面激活', '复合经营'],
      scale,
    };
  }
  if (ecological || waterfront) {
    return {
      family: waterfront ? '滨水公共空间' : '生态景观空间',
      place: waterfront ? '滨水公共景观' : '生态景观空间',
      everyday: { name: '低扰织补｜日常共享路径', noun: '低扰织补', scene: '低干预共享路径', material: '分散式日常停留节点' },
      active: { name: '弹性聚点｜复合活动驿站', noun: '弹性聚点', scene: '复合活动驿站', material: '可收可放的公共活动节点' },
      nature: { name: waterfront ? '蓝绿漫游｜水岸体验环' : '生境漫游｜自然观察环', noun: waterfront ? '蓝绿漫游' : '生境漫游', scene: waterfront ? '水岸自然体验环' : '生境观察与学习环', material: '低干扰自然观察节点' },
      tags: waterfront ? ['岸线连续', '安全亲水', '蓝绿协同'] : ['生境连续', '低扰动', '自然观察'],
      scale,
    };
  }
  if (community) {
    return {
      family: '社区公共空间',
      place: projectType,
      everyday: { name: '日常织补｜社区共享网络', noun: '日常织补', scene: '社区日常共享网络', material: '小尺度邻里停留节点' },
      active: { name: '复合聚场｜弹性公共客厅', noun: '复合聚场', scene: '弹性公共活动核心', material: '可切换的复合活动界面' },
      nature: { name: '绿意漫游｜社区自然环', noun: '绿意漫游', scene: '社区慢行自然环', material: '安静观察与季相体验节点' },
      tags: ['社区日常', '公共共享', '弹性使用'],
      scale,
    };
  }
  return {
    family: '公共景观空间',
    place: projectType,
    everyday: { name: '轻量织补｜日常使用网络', noun: '轻量织补', scene: '连续日常使用网络', material: '小尺度共享节点' },
    active: { name: '公共聚核｜弹性复合中心', noun: '公共聚核', scene: '弹性复合活动中心', material: '可切换的公共界面' },
    nature: { name: '自然漫游｜慢行体验环', noun: '自然漫游', scene: '慢行自然体验环', material: '季相观察与安静停留节点' },
    tags: ['使用连续', '空间弹性', '自然体验'],
    scale,
  };
}

function sourceCondition(item, confirmedText, unresolvedText) {
  return item?.status === BLUEPRINT_ITEM_STATUS.CONFIRMED
    ? confirmedText(itemText(item))
    : unresolvedText(itemText(item));
}

function isHuanleguDemoInput(input) {
  return input.project?.sourceCaseId === 'L2-001'
    && input.demoPolicies?.doNotInferFromProjectName === true
    && input.project?.excludedL2CaseIds?.includes('L2-001');
}

function huanleguConceptCandidates(input, designerBrief, generatedAt) {
  const required = pickRequired(input);
  const dependencies = input.openItems.map(dependencyFromOpenItem);
  const siteSourcePath = input.flattenedSiteConditions.length
    ? 'chapters.projectDefinition.siteConditions'
    : 'chapters.projectDefinition.successCriteria';
  const normalizedBrief = designerBrief.replace(/[。！？!?]+$/g, '');
  const briefSuffix = normalizedBrief ? ` 设计师补充要求：“${normalizedBrief}”。` : '';
  const mappings = [
    responseMapping(
      'chapters.projectDefinition.explicitGoals',
      required.goal,
      '回应“多种实用功能交叉融合”的项目判断，并保留 Gate 2 人工选择。',
    ),
    responseMapping(
      required.constraintSourcePath,
      required.constraint,
      '将该项保留为 pendingVerification 依赖，不作为已确认硬约束执行；空间数量、面积、工程条件与实施方式等待资料复核。',
    ),
    responseMapping(
      required.principleSourcePath,
      required.principle,
      '将设计偏好作为可调整的候选推演输入，不升级为 confirmed design principle 或最终设计决策。',
    ),
    responseMapping(
      siteSourcePath,
      required.site,
      '仅依据量测与影像观察建立概念级空间假设，不虚构红线、竖向、现状树或市政条件。',
    ),
  ];
  return conceptReference.candidates.map((candidate) => ({
    ...candidate,
    narrative: `${candidate.narrative}${briefSuffix}`,
    targetUsers: confirmedTexts(input.stakeholders),
    responseMappings: mappings.map((mapping) => ({ ...mapping })),
    dependencies: dependencies.map((dependency) => ({ ...dependency })),
    generatedBy: 'agent-2',
    generatedAt,
  }));
}

function conceptCandidates(input, designerBrief, generatedAt) {
  const projectName = compact(input.project.projectName, '当前景观项目');
  const location = compact(input.project.location, '项目所在地');
  const projectType = compact(input.project.projectType, '公共景观空间');
  const area = compact(input.project.area, '面积待确认');
  const users = confirmedTexts(input.stakeholders);
  const userLabel = users.length ? users.join('、') : '待确认的主要使用者';
  const required = pickRequired(input);
  const profile = deriveConceptProfile(input);
  const sharedDependencies = input.openItems.map(dependencyFromOpenItem);
  const siteSourcePath = input.flattenedSiteConditions.length
    ? 'chapters.projectDefinition.siteConditions'
    : 'chapters.projectDefinition.successCriteria';
  const openItemSummary = input.openItems.slice(0, 3).map((item) => item.label || itemText(item)).filter(Boolean).join('、');
  const dependencyRisk = openItemSummary
    ? `${openItemSummary}尚未确认，空间位置、规模和实施方式需随资料更新。`
    : '后续仍需用现场资料校核空间尺度与实施条件。';
  const normalizedBrief = designerBrief.replace(/[。！？!?]+$/g, '');
  const briefSuffix = normalizedBrief ? `同时回应设计师补充要求：“${normalizedBrief}”。` : '';
  const factSummary = `${location}、约${area}㎡的${projectType}`;

  const sharedResponseMappings = (direction) => [
    responseMapping('chapters.projectDefinition.explicitGoals', required.goal, sourceCondition(
      required.goal,
      (value) => `围绕已确认目标“${value}”，以${direction.goalAction}形成可核对的空间回应。`,
      (value) => `“${value}”尚未确认，本方向先以${direction.goalAction}建立可调整的概念框架，不把目标假设当作项目事实。`,
    )),
    responseMapping(required.constraintSourcePath, required.constraint, sourceCondition(
      required.constraint,
      (value) => `针对已确认约束“${value}”，通过${direction.constraintAction}控制实施风险。`,
      (value) => `“${value}”仍待补充，暂以${direction.constraintAction}保持方案弹性，待边界明确后复核。`,
    )),
    responseMapping(required.principleSourcePath, required.principle, sourceCondition(
      required.principle,
      (value) => `落实“${value}”，以${direction.principleAction}组织概念表达。`,
      (value) => `“${value}”属于设计偏好，不是已确认原则；本方向以${direction.principleAction}作为可调整的概念假设。`,
    )),
    responseMapping(
      siteSourcePath,
      required.site,
      sourceCondition(
        required.site,
        (value) => `依据已确认条件“${value}”，以${direction.siteAction}组织空间骨架。`,
        (value) => `“${value}”尚待复核，空间骨架暂采用${direction.siteAction}，不预设具体植物、水体、地形或构筑物。`,
      ),
    ),
  ];

  return [
    {
      id: 'concept-A',
      code: 'A',
      name: profile.everyday.name,
      status: 'candidate',
      proposition: `以${profile.everyday.noun}减少一次性定型，让${profile.family}优先承载连续、可调整的日常使用。`,
      narrative: `${projectName}位于${factSummary}。本方向不预设具体场地资源，以${profile.everyday.scene}串联${userLabel}的日常活动，并根据后续资料逐点确认保留、更新与新增内容。${briefSuffix}`,
      strategicFocus: `日常使用优先、轻量介入、连续可达、分步校核；${profile.scale.label}下${profile.scale.spatial}。`,
      spatialHypothesis: `以${profile.everyday.scene}作为基本骨架，将入口、共享停留和必要服务组织成可分期调整的节点系统；具体边界服从后续现状资料。`,
      experienceIntent: `形成尺度亲切、路径清楚、能够被反复使用的${profile.place}日常体验。`,
      targetUsers: users,
      keyScenes: [profile.everyday.scene, profile.everyday.material, '清晰连续的到达路径', `${profile.scale.label}共享节点`],
      differentiationTags: ['日常优先', '轻量介入', profile.tags[0], profile.scale.label],
      responseMappings: sharedResponseMappings({
        goalAction: `${profile.everyday.scene}与复合停留节点`,
        constraintAction: '小尺度、可逆和可分期的空间单元',
        principleAction: '连续路径连接日常共享节点',
        siteAction: '可调整的轻量织补网络',
      }),
      advantages: [`对${profile.scale.label}项目具有较强适配性`, '便于随新增资料逐步校正', `有利于建立${profile.tags[0]}与日常使用连续性`, '实施节奏可拆分'],
      risks: ['轻量策略的形象集中度可能有限', dependencyRisk],
      applicableConditions: [`适用于强调日常使用、渐进实施，或现状资源尚待进一步确认的${profile.place}`],
      dependencies: sharedDependencies,
      conceptDiagramBrief: {
        purpose: `表达${profile.everyday.scene}如何通过轻量节点形成日常使用网络`,
        mustShow: [profile.everyday.scene, profile.everyday.material, '可调整节点', '分步校核逻辑'],
        avoid: ['把待复核条件画成既有事实', '未经输入支持的大型设施', '无法随资料调整的刚性结论'],
      },
      referenceVisual: {
        assetId: 'concept-reference-A',
        url: './demo-images/aerial.jpg',
        title: `${profile.everyday.name}概念意向`,
        assetType: '演示概念意向素材',
        aspectRatio: '16:9',
        status: 'demo-reference',
        source: 'demoCase',
        isDemoAsset: true,
      },
      generatedBy: 'agent-2',
      generatedAt,
    },
    {
      id: 'concept-B',
      code: 'B',
      name: profile.active.name,
      status: 'candidate',
      proposition: `以${profile.active.noun}集中公共资源，用可切换界面承载多时段复合使用。`,
      narrative: `${projectName}位于${factSummary}。本方向将有限空间组织为${profile.active.scene}，通过开放、活动与事件三种状态提高公共使用效率；活动类型与人群规模等待真实需求确认。${briefSuffix}`,
      strategicFocus: `公共核心优先、活动聚合、复合使用、状态切换；${profile.scale.label}下集中关键投入并保留外围缓冲。`,
      spatialHypothesis: `以${profile.active.scene}为中心，连接到达、停留、服务与弹性活动界面，外围空间承担疏散、缓冲和日常开放。`,
      experienceIntent: `形成可见、可参与、能够在日常与公共事件之间切换的${profile.place}体验。`,
      targetUsers: users,
      keyScenes: [profile.active.scene, profile.active.material, '公共服务与停留边界', '日常/活动双状态场景'],
      differentiationTags: ['活动聚合', '弹性核心', profile.tags[1], '公共展示'],
      responseMappings: sharedResponseMappings({
        goalAction: `${profile.active.scene}与多时段切换机制`,
        constraintAction: '集中核心投入并让外围空间保持通用',
        principleAction: '弹性界面组织复合公共活动',
        siteAction: '可根据场地边界移动和缩放的公共核心',
      }),
      advantages: ['公共识别度与活动可见性较强', `有利于提升${profile.tags[1]}和复合使用效率`, '关键投入相对集中', `适合${profile.scale.label}下建立明确空间重心`],
      risks: ['活动强度、噪声和高峰疏散条件需要专项校核', dependencyRisk],
      applicableConditions: [`适用于需要集中公共活动、强化复合使用或建立明确空间核心的${profile.place}`],
      dependencies: sharedDependencies,
      conceptDiagramBrief: {
        purpose: `表达${profile.active.scene}如何组织多时段公共使用`,
        mustShow: [profile.active.scene, profile.active.material, '日常/活动状态切换', '外围缓冲与疏散'],
        avoid: ['把未确认活动类型画成事实', '固定单一功能', '未经需求支持的设施堆叠'],
      },
      referenceVisual: {
        assetId: 'concept-reference-B',
        url: './demo-images/awn.jpg',
        title: `${profile.active.name}概念意向`,
        assetType: '演示概念意向素材',
        aspectRatio: '16:9',
        status: 'demo-reference',
        source: 'demoCase',
        isDemoAsset: true,
      },
      generatedBy: 'agent-2',
      generatedAt,
    },
    {
      id: 'concept-C',
      code: 'C',
      name: profile.nature.name,
      status: 'candidate',
      proposition: `以${profile.nature.noun}建立慢行体验骨架，在不预设现状生态资源的前提下预留自然策略接口。`,
      narrative: `${projectName}位于${factSummary}。本方向以${profile.nature.scene}组织连续慢行、安静停留与自然感知；植物、生境、水体等具体内容仅在专项资料确认后落实。${briefSuffix}`,
      strategicFocus: `自然体验优先、慢行连续、活动强度分级、生态条件复核；${profile.scale.label}下控制路径长度与节点密度。`,
      spatialHypothesis: `以${profile.nature.scene}串联入口、安静停留和${profile.nature.material}，从公共界面向低强度空间形成体验梯度。`,
      experienceIntent: `形成节奏舒缓、方向清晰、自然内容可随真实场地条件深化的${profile.place}漫游体验。`,
      targetUsers: users,
      keyScenes: [profile.nature.scene, profile.nature.material, '低强度安静停留点', '季相与环境感知界面'],
      differentiationTags: ['自然体验', '慢行连续', profile.tags[2], '条件复核'],
      responseMappings: sharedResponseMappings({
        goalAction: `${profile.nature.scene}与分级体验节点`,
        constraintAction: '低干扰、可渗透并可随生态资料调整的空间方式',
        principleAction: '慢行体验连接自然感知节点',
        siteAction: '不预设具体生态资源的自然体验骨架',
      }),
      advantages: [`有利于强化${profile.tags[2]}与慢行体验`, '自然策略可随专项资料逐级深化', '活动强度梯度清晰', `能够形成区别于活动核心方案的${profile.nature.noun}叙事`],
      risks: ['生态价值、植物策略和自然节点成立与否依赖真实场地资料', dependencyRisk],
      applicableConditions: [`适用于重视慢行、自然感知，且愿意在场地资料确认后深化生态策略的${profile.place}`],
      dependencies: sharedDependencies,
      conceptDiagramBrief: {
        purpose: `表达${profile.nature.scene}如何组织慢行、安静停留与自然感知`,
        mustShow: [profile.nature.scene, profile.nature.material, '活动强度梯度', '待复核自然条件'],
        avoid: ['把生态假设当成已确认事实', '未经资料支持的水体或植物结论', '精确工程参数'],
      },
      referenceVisual: {
        assetId: 'concept-reference-C',
        url: './demo-images/elderly.jpg',
        title: `${profile.nature.name}概念意向`,
        assetType: '演示概念意向素材',
        aspectRatio: '16:9',
        status: 'demo-reference',
        source: 'demoCase',
        isDemoAsset: true,
      },
      generatedBy: 'agent-2',
      generatedAt,
    },
  ];
}

const forbiddenKeys = new Set(['score', 'total', 'weight', 'rank', 'recommended', 'selected', 'winner', 'finalDecision']);

function collectForbiddenKeys(value, result = []) {
  if (!value || typeof value !== 'object') return result;
  Object.entries(value).forEach(([key, child]) => {
    if (forbiddenKeys.has(key)) result.push(key);
    collectForbiddenKeys(child, result);
  });
  return result;
}

export function validateConceptGenerationChapter(chapter, options = {}) {
  const candidates = chapter?.conceptCandidates || [];
  const errors = [];
  const expectedCount = options.mode === 'demo' ? 3 : null;
  if (candidates.length < 2 || candidates.length > 3) errors.push('概念候选数量必须为 2—3 个');
  if (expectedCount && candidates.length !== expectedCount) errors.push('演示案例必须稳定生成 3 个候选');
  ['id', 'code', 'name'].forEach((key) => {
    if (new Set(candidates.map((item) => item[key])).size !== candidates.length) errors.push(`${key} 必须唯一`);
  });
  candidates.forEach((candidate) => {
    ['proposition', 'strategicFocus', 'spatialHypothesis'].forEach((key) => {
      if (!String(candidate[key] || '').trim()) errors.push(`${candidate.code || candidate.id} 缺少 ${key}`);
    });
    if (!candidate.responseMappings?.length) errors.push(`${candidate.code || candidate.id} 缺少蓝本响应关系`);
    const paths = candidate.responseMappings?.map((item) => item.sourcePath) || [];
    if (!paths.some((path) => path.includes('Goals'))) errors.push(`${candidate.code || candidate.id} 未回应项目目标`);
    if (!paths.some((path) => path.includes('constraints') || path.includes('pendingVerification'))) errors.push(`${candidate.code || candidate.id} 未回应约束或待复核项`);
    if (!paths.some((path) => path.includes('designPrinciples') || path.includes('designPreferences'))) errors.push(`${candidate.code || candidate.id} 未回应已确认原则或设计偏好`);
    if (!paths.some((path) => path.includes('siteConditions') || path.includes('successCriteria'))) errors.push(`${candidate.code || candidate.id} 未回应场地条件或成功标准`);
    if (candidate.referenceVisual?.status !== 'demo-reference') errors.push(`${candidate.code || candidate.id} 的参考视觉未标记为演示意向素材`);
  });
  if (new Set(candidates.map((item) => JSON.stringify(item.differentiationTags || []))).size !== candidates.length) {
    errors.push('三个方向的差异化标签不得相同');
  }
  const forbidden = collectForbiddenKeys(chapter);
  if (forbidden.length) errors.push(`Agent 2 章节包含职责越界字段：${[...new Set(forbidden)].join('、')}`);
  const serialized = JSON.stringify(chapter);
  if (/第\s*\d+\s*页|GB\s*\d+|CJJ\s*\d+/.test(serialized)) errors.push('Agent 2 不得伪造页码或法规引用');
  return { valid: errors.length === 0, errors };
}

function assertPrerequisites(blueprint, input) {
  if (blueprint.schemaVersion !== BLUEPRINT_SCHEMA_VERSION) throw new Error(`Agent 2 不支持 Blueprint schemaVersion ${blueprint.schemaVersion || 'unknown'}`);
  if (!blueprint.chapters?.projectDefinition) throw new Error('Agent 2 必须读取 Agent 1 已形成的项目定义');
  if (milestoneNumber(blueprint.milestoneVersion) < 2) throw new Error('Agent 2 只能读取设计师已确认的 Blueprint v2 或更高版本');
  if (!input.checkpointConfirmed) throw new Error('Agent 2 前置条件未满足：checkpoint-1 尚未由设计师确认');
  ['projectName', 'location', 'area', 'projectType'].forEach((key) => {
    if (!selectProjectFactByKey(blueprint, key)?.value) throw new Error(`Agent 2 缺少带稳定 key 的项目事实：${key}`);
  });
  const conflicts = input.conflicts.filter((item) => item.status === BLUEPRINT_ITEM_STATUS.CONFLICT);
  if (conflicts.length) throw new Error(`Agent 2 已停止：存在 ${conflicts.length} 项未裁决信息冲突`);
}

function downstreamInvalidation(next, reason) {
  const invalidated = [...(next.invalidatedOutputs || [])];
  [3, 4, 5, 6].forEach((agentId) => {
    if (!next.agentRuns?.[agentId]?.blueprintVersionWritten) return;
    next.agentRuns[agentId] = { ...next.agentRuns[agentId], status: 'stale' };
    if (!invalidated.some((item) => item.targetAgent === agentId)) {
      invalidated.push({
        id: newEntityId('invalid'),
        targetAgent: agentId,
        targetName: next.agentRuns[agentId].agentName,
        reason,
        changedFields: ['chapters.conceptGeneration'],
        invalidatedAt: now(),
        status: '需要重新生成',
      });
    }
  });
  next.invalidatedOutputs = invalidated;
  next.checkpoints = (next.checkpoints || []).map((checkpoint) => (
    checkpoint.order >= 2
      ? {
          ...checkpoint,
          status: '未到达',
          confirmedAt: null,
          confirmedBy: null,
          decision: null,
        }
      : checkpoint
  ));
  if (['checkpoint-2', 'checkpoint-3', 'checkpoint-4'].includes(next.currentCheckpoint)) {
    next.currentCheckpoint = null;
  }
}

export function runConceptGenerationAgent(currentBlueprint, options = {}) {
  assertAgentWriteScope('agent-2', ['chapters.conceptGeneration']);
  const source = migrateBlueprintToV2(currentBlueprint);
  const input = selectConceptGenerationInput(source);
  assertPrerequisites(source, input);

  const startedAt = now();
  const generatedAt = now();
  const designerBrief = String(options.designerBrief || '').trim();
  const candidates = isHuanleguDemoInput(input)
    ? huanleguConceptCandidates(input, designerBrief, generatedAt)
    : conceptCandidates(input, designerBrief, generatedAt);
  const dependencies = input.openItems.map(dependencyFromOpenItem);
  const chapter = {
    agentId: 'agent-2',
    agentName: '概念生成',
    generatedFromVersion: BLUEPRINT_MILESTONES.DIRECTION_CONFIRMED,
    generatedAt,
    generationRequest: {
      value: designerBrief,
      source: 'designer',
      status: BLUEPRINT_ITEM_STATUS.CONFIRMED,
    },
    inputRefs: {
      facts: Object.values(input.facts).map((item) => item.id),
      goals: [...input.explicitGoals, ...input.latentGoals].map((item) => item.id),
      siteConditions: input.flattenedSiteConditions.map((item) => item.id),
      constraints: input.confirmedConstraints.map((item) => item.id),
      pendingConstraints: input.pendingConstraints.map((item) => item.id),
      designPrinciples: input.confirmedDesignPrinciples.map((item) => item.id),
      designPreferences: input.designPreferences.map((item) => item.id),
      successCriteria: input.successCriteria.map((item) => item.id),
      openItems: input.openItems.map((item) => item.id),
    },
    sharedRequirements: input.confirmedDesignPrinciples.map((item) => ({
      sourceItemId: item.id,
      value: item.value,
      status: item.status,
    })),
    preferenceInputs: input.designPreferences.map((item) => ({
      sourceItemId: item.id,
      value: item.value,
      status: item.status,
      semanticType: 'designPreference',
      enforcement: false,
    })),
    conceptCandidates: candidates,
    unresolvedDependencies: dependencies,
    qualityChecks: {
      candidateCount: candidates.length,
      allMappedToBlueprint: candidates.every((item) => item.responseMappings.length >= 4),
      strategicallyDifferentiated: new Set(candidates.map((item) => item.strategicFocus)).size === candidates.length,
      containsRecommendation: false,
      containsScoring: false,
    },
    status: 'completed',
  };
  const validation = validateConceptGenerationChapter(chapter, { mode: options.mode || 'demo' });
  if (!validation.valid) throw new Error(`Agent 2 概念章节校验失败：${validation.errors.join('；')}`);

  const next = cloneBlueprint(source);
  const previousChapter = next.chapters?.conceptGeneration || null;
  const revision = (source.revision ?? source.currentVersion ?? 0) + 1;
  const completedAt = now();
  next.chapters = { ...next.chapters, conceptGeneration: chapter };
  delete next.conceptCandidates;
  next.revision = revision;
  next.currentVersion = revision;
  next.milestoneVersion = BLUEPRINT_MILESTONES.CONCEPTS_GENERATED;
  next.stage = 'concept-generation';
  next.status = 'review';
  next.updatedAt = completedAt;
  next.updatedBy = 'agent-2';
  next.agentRuns = {
    ...next.agentRuns,
    2: {
      ...next.agentRuns?.[2],
      agentId: 2,
      agentName: '概念生成',
      status: 'done',
      lastRunAt: completedAt,
      blueprintVersionRead: BLUEPRINT_MILESTONES.DIRECTION_CONFIRMED,
      blueprintVersionWritten: BLUEPRINT_MILESTONES.CONCEPTS_GENERATED,
    },
  };
  const execution = {
    id: newEntityId('execution'),
    agentId: 'agent-2',
    agentName: '概念生成',
    startedAt,
    completedAt,
    inputVersion: BLUEPRINT_MILESTONES.DIRECTION_CONFIRMED,
    outputVersion: BLUEPRINT_MILESTONES.CONCEPTS_GENERATED,
    inputRevision: source.revision ?? source.currentVersion ?? 0,
    outputRevision: revision,
    readSections: ['chapters.projectDefinition'],
    writtenSections: ['chapters.conceptGeneration'],
    status: 'completed',
    summary: `已基于项目设计蓝本 ${BLUEPRINT_MILESTONES.DIRECTION_CONFIRMED} 生成 3 个概念候选，并写入 ${BLUEPRINT_MILESTONES.CONCEPTS_GENERATED}`,
    candidateCount: candidates.length,
    warnings: dependencies.map((item) => item.value),
    openItemCount: dependencies.length,
    conflictCount: 0,
  };
  next.agentExecutions = [...(next.agentExecutions || []), execution];
  if (previousChapter) downstreamInvalidation(next, '概念生成要求或候选集发生变化');
  next.changeLog = [{
    id: newEntityId('change'),
    sourceAgent: 'Agent 2｜概念生成',
    modifiedAt: completedAt,
    reason: previousChapter ? '根据新的概念生成要求完整重新生成三个候选' : '基于已确认项目定义生成三个差异化概念候选',
    confirmationStatus: 'AI建议',
    version: revision,
    milestoneVersion: BLUEPRINT_MILESTONES.CONCEPTS_GENERATED,
    fields: ['chapters.conceptGeneration'],
    previousGenerationRequest: previousChapter?.generationRequest?.value || '',
    currentGenerationRequest: designerBrief,
    downstreamImpact: previousChapter ? [3, 4, 5, 6] : [],
  }, ...(next.changeLog || [])];

  const changedSections = ['三个概念候选', '概念命题与叙事', '概念级空间组织假设', '蓝本响应关系', '风险与资料依赖'];
  const changeSet = {
    added: previousChapter ? [] : ['chapters.conceptGeneration'],
    updated: previousChapter ? ['chapters.conceptGeneration'] : [],
    removed: [],
  };
  return {
    blueprint: next,
    chapter,
    execution,
    changeSet,
    version: {
      milestoneVersion: BLUEPRINT_MILESTONES.CONCEPTS_GENERATED,
      revision,
      createdAt: completedAt,
      createdBy: 'agent-2',
      title: previousChapter ? '概念生成更新' : '概念生成完成',
      summary: previousChapter ? `按补充要求重新生成 3 个概念候选（r${revision}）` : '形成三个策略本质不同的概念候选',
      changedSections,
    },
  };
}
