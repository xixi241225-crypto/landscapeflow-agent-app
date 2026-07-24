import { AgentProvider, assertProviderPatch } from './agentProvider.js';
import { CONTENT_STATUS, getRecordValue } from '../blueprint/blueprintModel.js';

const northernPattern = /北京|河北|天津|山西|内蒙古|辽宁|吉林|黑龙江/;

function parseArea(area) {
  const parsed = Number(String(area || '').replace(/[^0-9.]/g, ''));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 5000;
}

function compact(value, fallback) {
  return String(value || '').trim() || fallback;
}

function splitText(value, fallback = []) {
  const items = String(value || '').split(/[，,；;、\n]/).map((item) => item.trim()).filter(Boolean);
  return items.length ? items : fallback;
}

function getProject(blueprint) {
  return blueprint.projectBasicInfo || {};
}

function selectedConcept(blueprint) {
  const selectedId = blueprint.designerDecision?.selectedConceptId;
  return blueprint.conceptCandidates?.find((item) => item.id === selectedId);
}

function abortableDelay(ms, signal) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    if (!signal) return;
    const onAbort = () => {
      clearTimeout(timer);
      reject(new DOMException('任务已停止', 'AbortError'));
    };
    if (signal.aborted) onAbort();
    else signal.addEventListener('abort', onAbort, { once: true });
  });
}

function projectDefinitionPatch(blueprint) {
  const project = getProject(blueprint);
  const city = compact(project.city, '地点待补充');
  const area = compact(project.area, '面积待确认');
  const projectType = compact(project.projectType, '景观项目');
  const facts = [
    ['项目名称', compact(project.projectName, '未命名景观项目'), '项目表单'],
    ['项目地点', city, '项目表单'],
    ['项目面积', area, '项目表单'],
    ['项目类型', projectType, '项目表单'],
    ['设计阶段', compact(project.designStage, '设计阶段待确认'), '项目表单'],
    ['交付时间', compact(project.deliveryDate, '交付时间待确认'), '项目表单'],
    ['预算条件', compact(project.budgetCondition, '预算条件待确认'), '项目表单'],
    ['汇报对象', compact(project.presentationAudience, '汇报对象待确认'), '项目表单'],
    ['服务人群', compact(project.targetUsers, '服务人群待确认'), '项目表单'],
    ['设计目标', compact(project.designGoals, '设计目标待确认'), '项目表单'],
    ['核心约束', compact(project.constraints, '核心约束待确认'), '项目表单'],
  ].map(([label, value, source]) => ({ label, value, source, status: CONTENT_STATUS.PENDING }));

  const unconfirmed = [];
  if (!project.siteFiles?.length) unconfirmed.push({ label: '场地资料', value: '尚未上传可解析的现状图、红线图或 CAD', status: CONTENT_STATUS.PENDING });
  if (!/预算|造价|投资/.test(project.constraints || '')) unconfirmed.push({ label: '投资边界', value: '造价与投资上限未明确', status: CONTENT_STATUS.PENDING });
  if (!/高差|竖向|地形/.test(project.constraints || '')) unconfirmed.push({ label: '竖向条件', value: '地形高差与现状标高未明确', status: CONTENT_STATUS.PENDING });

  const assumptions = [
    { title: '概念阶段场地条件', value: '暂按可进行常规景观建设的场地条件推演，待真实勘察资料复核。', status: CONTENT_STATUS.ASSUMPTION },
    { title: '市政接入', value: '暂按给排水与供电接口可正常接入处理。', status: CONTENT_STATUS.ASSUMPTION },
  ];
  if (!project.siteFiles?.length) assumptions.push({ title: '现状资料限制', value: '未读取真实图纸，本轮不对边界、高差和保留树位置作确定结论。', status: CONTENT_STATUS.ASSUMPTION });

  const goalList = splitText(project.designGoals, ['形成清晰的景观定位', '满足核心人群使用需求']);
  const constraintList = splitText(project.constraints, ['场地边界待复核', '投资与工期待确认']);
  return {
    projectBasicInfo: { ...project, status: CONTENT_STATUS.PENDING },
    confirmedFacts: facts,
    explicitRequirements: goalList.map((value) => ({ title: value, value, status: CONTENT_STATUS.PENDING })),
    latentGoals: splitText(project.clientFocus, ['形成易理解、可决策的汇报口径', '兼顾长期运营与公众体验']).map((value) => ({ title: value, value, status: CONTENT_STATUS.AI_SUGGESTED })),
    siteConditions: [
      { title: '场地资源', value: project.siteFiles?.length ? `已接收 ${project.siteFiles.length} 项项目资料，等待正式解析与现场复核。` : '现状资源资料不足，暂不形成确定性判断。', status: project.siteFiles?.length ? CONTENT_STATUS.AI_SUGGESTED : CONTENT_STATUS.PENDING },
      ...constraintList.map((value) => ({ title: '限制条件', value, status: CONTENT_STATUS.PENDING })),
    ],
    deliverableRequirements: [
      { title: '方案汇报', value: `面向${compact(project.presentationAudience, '项目决策方')}形成结构清晰的概念方案文案与 12 页汇报 PPT。`, status: CONTENT_STATUS.PENDING },
      { title: '视觉成果', value: '形成总平面、分析图和重点空间效果图任务书；演示阶段使用案例素材。', status: CONTENT_STATUS.PENDING },
      { title: '交付节点', value: compact(project.deliveryDate, '交付时间待确认'), status: CONTENT_STATUS.PENDING },
    ],
    informationSources: [
      { name: '项目条件表单', type: '设计师输入', detail: '已读取文本字段', status: CONTENT_STATUS.CONFIRMED },
      ...(project.siteFiles || []).map((file) => ({ name: file.name || String(file), type: '上传文件', detail: '仅记录文件名，待接入真实解析', status: CONTENT_STATUS.PENDING })),
    ],
    unconfirmedInfo: unconfirmed,
    systemAssumptions: assumptions,
    designConstraints: constraintList.map((value) => ({ title: value, value, status: CONTENT_STATUS.PENDING })),
    coreDesignQuestions: [
      { title: '核心命题', value: `如何在${area}的${projectType}中协调${compact(project.targetUsers, '多元人群')}的差异化需求？`, status: CONTENT_STATUS.AI_SUGGESTED },
      { title: '价值命题', value: `如何以${goalList.slice(0, 3).join('、')}形成可实施且可汇报的方案主线？`, status: CONTENT_STATUS.AI_SUGGESTED },
    ],
    risks: [{ title: '资料精度风险', value: '本轮使用演示数据与文本输入，真实边界、竖向及现状资源均需后续复核。', status: CONTENT_STATUS.PENDING }],
    nextTasks: [{ title: '设计师确认', value: '确认项目事实，逐项接受或否定系统假设。', status: CONTENT_STATUS.PENDING }],
  };
}

function conceptPatch(blueprint) {
  const project = getProject(blueprint);
  const city = compact(project.city, '项目所在地');
  const type = compact(project.projectType, '景观空间');
  const users = compact(project.targetUsers, '多元使用者');
  const goals = compact(project.designGoals, '生态、体验与实施平衡');
  const blueprintVersion = blueprint.currentVersion + 1;
  return {
    conceptCandidates: [
      {
        id: 'A',
        name: '生态织补 · 共享绿环',
        concept: `以连续绿色网络修复场地关系，在${city}构建服务${users}的共享日常。`,
        spatialStructure: '一条复合绿环串联入口、活动、休憩与生态节点，形成清晰连续的慢行体验。',
        sceneFeatures: ['林荫慢行', '邻里会客', '雨水花园'],
        targetUsers: users,
        advantages: ['结构清晰、分期实施友好', '慢行与生态系统可复合', '日常使用稳定'],
        risks: ['环线尺度需依据真实红线复核', '节点均质化风险需通过场景差异控制'],
        fit: `适合重视低维护、连续慢行和长期运营的${type}`,
        visual: {
          id: 'CA',
          title: '生态织补 · 共享绿环概念图',
          assetType: '概念氛围图',
          url: './demo-images/aerial.jpg',
          aspectRatio: '16:9',
          status: '演示案例',
          sourceAgent: 'Agent 2｜概念生成',
          blueprintVersion,
          isDemoAsset: true,
        },
      },
      {
        id: 'B',
        name: '活力客厅 · 弹性核心',
        concept: `以可切换使用的公共核心回应“${goals}”，把场地组织为具有聚合力的城市客厅。`,
        spatialStructure: '一个弹性活动核心与若干主题功能区咬合，平日、周末与活动日可切换。',
        sceneFeatures: ['弹性草坪', '全龄活力', '城市会客'],
        targetUsers: users,
        advantages: ['汇报识别度高', '复合使用效率高', '适合社区活动与公共事件'],
        risks: ['核心空间需明确运营机制', '高峰使用对草坪或铺装耐久性提出要求'],
        fit: `适合强调公共活力、展示性与多场景使用的${type}`,
        visual: {
          id: 'CB',
          title: '活力客厅 · 弹性核心概念图',
          assetType: '概念氛围图',
          url: './demo-images/awn.jpg',
          aspectRatio: '16:9',
          status: '演示案例',
          sourceAgent: 'Agent 2｜概念生成',
          blueprintVersion,
          isDemoAsset: true,
        },
      },
      {
        id: 'C',
        name: '森氧漫游 · 自然探索',
        concept: `以近自然群落作为空间基底，为${users}提供沉浸式游憩、自然教育与疗愈体验。`,
        spatialStructure: '林下漫游主线穿行于自然探索、雨水花园、康养休憩和安静体验节点。',
        sceneFeatures: ['森林漫游', '自然教育', '静谧康养'],
        targetUsers: users,
        advantages: ['生态价值和场所气质突出', '微气候改善潜力较高', '自然教育延展性强'],
        risks: ['成景周期相对较长', '林下安全与通透性需要精细控制'],
        fit: `适合强调生态修复、自然体验与环境教育的${type}`,
        visual: {
          id: 'CC',
          title: '森氧漫游 · 自然探索概念图',
          assetType: '概念氛围图',
          url: './demo-images/elderly.jpg',
          aspectRatio: '16:9',
          status: '演示案例',
          sourceAgent: 'Agent 2｜概念生成',
          blueprintVersion,
          isDemoAsset: true,
        },
      },
    ],
    risks: [{ title: '方案精度', value: '三个概念为演示案例推演结果，待正式项目资料接入后进一步校核。', status: CONTENT_STATUS.PENDING }],
    nextTasks: [{ title: '专业比选', value: '由方案选择 Agent 按项目目标动态评分，不预设固定推荐。', status: CONTENT_STATUS.PENDING }],
  };
}

function comparisonPatch(blueprint) {
  const project = getProject(blueprint);
  const text = `${project.designGoals || ''} ${project.constraints || ''} ${project.clientFocus || ''} ${project.maintenance || ''}`;
  const dimensions = [
    { key: 'siteFit', label: '场地适配', weight: 0.2 },
    { key: 'experience', label: '空间体验', weight: 0.18 },
    { key: 'feasibility', label: '实施可行', weight: 0.18 },
    { key: 'maintenance', label: '成本维护', weight: 0.16 },
    { key: 'ecology', label: '生态价值', weight: 0.14 },
    { key: 'presentation', label: '汇报表现', weight: 0.14 },
  ];
  const base = {
    A: { siteFit: 8.6, experience: 8.2, feasibility: 8.8, maintenance: 8.7, ecology: 8.5, presentation: 8.1 },
    B: { siteFit: 8.5, experience: 9.0, feasibility: 8.2, maintenance: 7.7, ecology: 7.8, presentation: 9.2 },
    C: { siteFit: 8.0, experience: 8.7, feasibility: 7.7, maintenance: 8.0, ecology: 9.3, presentation: 8.4 },
  };
  if (/生态|自然|雨洪|生物/.test(text)) ['siteFit', 'ecology'].forEach((key) => { base.C[key] += 0.5; });
  if (/活力|活动|展示|汇报|传播/.test(text)) ['experience', 'presentation'].forEach((key) => { base.B[key] += 0.5; });
  if (/低维护|成本|分期|慢行/.test(text)) ['maintenance', 'feasibility'].forEach((key) => { base.A[key] += 0.5; });
  const scored = blueprint.conceptCandidates.map((concept) => {
    const scores = base[concept.id];
    const total = dimensions.reduce((sum, dim) => sum + scores[dim.key] * dim.weight, 0);
    return { id: concept.id, name: concept.name, scores, total: Number(total.toFixed(2)) };
  }).sort((a, b) => b.total - a.total);
  const recommended = scored[0];
  return {
    comparison: { dimensions, schemes: scored, method: '基于项目目标与约束的演示案例动态加权比选。' },
    agentRecommendation: {
      conceptId: recommended.id,
      conceptName: recommended.name,
      score: recommended.total,
      reason: `该方向在当前项目的场地适配、体验、实施、维护、生态与汇报六项指标中综合得分最高；推荐仅供设计师决策，不自动替代人工选择。`,
    },
    risks: [{ title: '推荐边界', value: '当前评分用于展示多方案决策机制，正式项目仍需设计师结合场地资料判断。', status: CONTENT_STATUS.PENDING }],
    nextTasks: [{ title: '概念决策', value: '选择 A / B / C，或接受 Agent 推荐，并填写融合与修改要求。', status: CONTENT_STATUS.PENDING }],
  };
}

function spatialPatch(blueprint) {
  const project = getProject(blueprint);
  const concept = selectedConcept(blueprint);
  if (!concept) throw new Error('空间推演前必须由设计师确认概念方向');
  const area = parseArea(project.area);
  const areaLabel = compact(project.area, `${area}㎡`);
  const structureById = {
    A: '复合绿环 + 共享核心 + 多点织补',
    B: '弹性核心 + 主题分区 + 多向连接',
    C: '森林基底 + 漫游主线 + 生态节点',
  };
  const structure = structureById[concept.id];
  const zoneTemplates = {
    A: ['共享活动核心', '全龄活动节点', '林下会客节点', '安静康养节点', '生态雨水节点'],
    B: ['弹性活动核心', '亲子活力区', '邻里会客区', '林荫康养区', '形象展示区'],
    C: ['森氧体验区', '自然探索区', '雨水花园区', '林下康养区', '自然教育区'],
  };
  const ratios = [0.32, 0.2, 0.16, 0.17, 0.15];
  const zones = zoneTemplates[concept.id].map((name, index) => ({
    name,
    area: `约 ${Math.round(area * ratios[index] / 10) * 10}㎡（演示估算）`,
    function: index === 0 ? '承载核心叙事与主要公共活动' : `回应${compact(project.targetUsers, '主要使用者')}的分层需求`,
    status: CONTENT_STATUS.AI_SUGGESTED,
  }));
  const northern = northernPattern.test(project.city || '');
  const blueprintVersion = blueprint.currentVersion + 1;
  const planAsset = {
    id: 'SP01',
    title: `${concept.name}｜空间策略总平面`,
    assetType: '总平面图',
    url: './demo-images/plan.jpg',
    aspectRatio: '3:4',
    objectFit: 'contain',
    status: '演示案例',
    sourceAgent: 'Agent 4｜空间推演',
    blueprintVersion,
    isDemoAsset: true,
  };
  return {
    coreNarrative: {
      title: concept.name,
      value: `${concept.concept}${blueprint.designerDecision.fusionRequirements ? ` 融合要求：${blueprint.designerDecision.fusionRequirements}` : ''}`,
    },
    spatialStructure: {
      title: structure,
      value: `${structure}。基于${areaLabel}进行概念级面积分配，所有尺度需待真实测绘资料复核。`,
      planImage: './demo-images/plan.jpg',
      planAsset,
      analysisAssets: [
        { id: 'AN01', title: '功能分区图', assetType: '功能分区分析图', aspectRatio: '4:3', status: '待深化', sourceAgent: 'Agent 4｜空间推演', blueprintVersion, isDemoAsset: false },
        { id: 'AN02', title: '动线组织图', assetType: '动线组织分析图', aspectRatio: '4:3', status: '待深化', sourceAgent: 'Agent 4｜空间推演', blueprintVersion, isDemoAsset: false },
        { id: 'AN03', title: '生态与植物策略图', assetType: '生态/植物策略分析图', aspectRatio: '4:3', status: '待深化', sourceAgent: 'Agent 4｜空间推演', blueprintVersion, isDemoAsset: false },
      ],
      isDemoAsset: true,
    },
    functionalZones: zones,
    circulationStrategy: {
      title: concept.id === 'A' ? '连续慢行绿环' : concept.id === 'B' ? '核心放射 + 环向补充' : '林下漫游 + 生态观察支线',
      value: '主路径组织连续无障碍通行，次路径连接主题节点；入口数量、消防与竖向关系待真实图纸复核。',
    },
    professionalStrategies: {
      plant: `${northern ? '耐寒乡土骨架树种' : '适地乡土常绿与季相树种'} + 低维护多年生地被，建立四季层次。`,
      material: '主路径采用耐久防滑、可维护材料；节点材料服从概念主题并控制全生命周期成本。',
      ecology: concept.id === 'C' ? '以近自然群落、雨水花园和生境连续性为重点。' : '以树荫覆盖、透水铺装和小微生境织补为重点。',
      grading: '当前仅提出缓坡无障碍与场地排水方向，待现状标高和土方数据接入后计算。',
      drainage: '采用源头减排—过程滞蓄—安全溢流的海绵策略，具体指标待当地规范与降雨数据复核。',
      operations: concept.id === 'B' ? '以平日休憩、周末亲子和社区活动三种模式组织弹性空间，建立低成本预约与维护机制。' : '以日常开放、主题活动和季节运营组织空间使用，明确分区维护责任。',
    },
    featureNodes: zones.slice(0, 4).map((zone, index) => ({ name: zone.name, value: `${concept.name}的特色节点 ${index + 1}，需在下一轮深化中落实尺度、活动与材料。` })),
    risks: [{ title: '空间成果精度', value: '当前总平面采用演示案例视觉素材，空间结论以项目设计蓝本文本为准。', status: CONTENT_STATUS.PENDING }],
    nextTasks: [{ title: '蓝本确认', value: '确认核心叙事、空间结构、分区、动线与五项专业策略。', status: CONTENT_STATUS.PENDING }],
  };
}

function visualPatch(blueprint) {
  const concept = selectedConcept(blueprint);
  const project = getProject(blueprint);
  const structure = blueprint.spatialStructure?.title || getRecordValue(blueprint.spatialStructure, '空间结构待确认');
  const blueprintVersion = blueprint.currentVersion + 1;
  const tasks = [
    ['V01', '鸟瞰总览', '45°鸟瞰', './demo-images/aerial.jpg'],
    ['V02', '主入口人视', '1.6m 人视', './demo-images/entrance.jpg'],
    ['V03', '核心公共场景', '1.6m 人视', './demo-images/awn.jpg'],
    ['V04', '全龄活动场景', '1.4m 人视', './demo-images/children.jpg'],
    ['V05', '林下康养场景', '1.6m 人视', './demo-images/elderly.jpg'],
    ['V06', '夜景氛围', '蓝调时刻', './demo-images/night.jpg'],
    ['V07', '植物策略', '分析图', './demo-images/planting.jpg'],
    ['V08', '空间策略总平', '正投影', './demo-images/plan.jpg'],
  ];
  return {
    visualTasks: tasks.map(([id, title, angle], index) => ({
      id,
      title,
      angle,
      season: index === 5 ? '夏季' : '春末至初夏',
      time: index === 5 ? '蓝调时刻' : index === 0 ? '上午' : '午后',
      light: index === 5 ? '暖色场景照明与自然余晖' : '柔和侧光，树影层次清晰',
      people: index === 0 ? '适量全龄使用者' : '老人、儿童与社区家庭，密度适中',
      activity: title.includes('入口') ? '到达、停留与导视识别' : title.includes('活动') ? '亲子互动与全龄活动' : '漫步、休憩与自然体验',
      plant: '乡土乔木骨架、低维护多年生地被与四季层次',
      material: '耐久防滑铺装、温暖木色设施与克制金属收边',
      atmosphere: '自然、专业、温暖、可实施，具有社区活力',
      mustInclude: `${concept?.name || '已确认概念'}的核心空间特征、真实尺度关系与主要使用人群`,
      avoid: '禁止脱离总平面的夸张构筑物、过度商业化设施、错误植物季相与不合理高差',
      prompt: `${compact(project.projectName, '景观项目')}，概念“${concept?.name}”，空间结构“${structure}”，${title}，体现${compact(project.stylePreference, '自然、专业、可实施')}，人物与材料服从蓝本。`,
      status: CONTENT_STATUS.AI_SUGGESTED,
    })),
    visualAssets: tasks.map(([id, title, angle, url]) => ({
      id,
      title,
      assetType: angle === '分析图' ? '植物策略分析图' : angle === '正投影' ? '空间策略总平面' : '景观效果图',
      angle,
      url,
      aspectRatio: angle === '正投影' ? '3:4' : angle === '分析图' ? '4:3' : '16:9',
      objectFit: ['分析图', '正投影'].includes(angle) ? 'contain' : 'cover',
      sourceAgent: 'Agent 5｜视觉表达',
      blueprintVersion,
      isDemoAsset: true,
      label: '演示案例视觉成果',
      status: '演示案例',
    })),
    qualityReview: [
      { check: '视觉—概念一致性', result: '演示视觉的场景气质与概念方向一致，正式深化时再按任务书逐张复核。', level: 'pass' },
      { check: '视觉—空间一致性', result: '视觉任务已关联空间结构与特色节点。', level: 'pass' },
    ],
    risks: [{ title: '视觉深化边界', value: '当前图片为演示案例成果，正式项目需依据视觉任务书进行定向生产。', status: CONTENT_STATUS.PENDING }],
    nextTasks: [{ title: '视觉深化', value: '在正式成果阶段按 V01-V08 逐项生产、选图与复核。', status: CONTENT_STATUS.PENDING }],
  };
}

function outputPatch(blueprint) {
  const project = getProject(blueprint);
  const concept = selectedConcept(blueprint);
  const assumptionsPending = blueprint.systemAssumptions.filter((item) => item.status === CONTENT_STATUS.ASSUMPTION || item.status === CONTENT_STATUS.PENDING).length;
  const strategy = blueprint.professionalStrategies || {};
  const zones = blueprint.functionalZones.map((item) => item.name).join('、');
  const nodes = blueprint.featureNodes.map((item) => item.name).join('、');
  const sources = blueprint.informationSources.map((item) => item.name).join('、');
  const pages = [
    ['01', '封面', `${compact(project.projectName, '景观概念方案')}｜${concept?.name || '概念方向待确认'}`, '项目主视觉全幅', ['projectBasicInfo.projectName', 'designerDecision.selectedConceptId']],
    ['02', '项目背景与设计任务', `${compact(project.city, '项目地点待确认')}｜${compact(project.area, '面积待确认')}｜${compact(project.projectType, '项目类型待确认')}；设计目标：${compact(project.designGoals, '待确认')}`, '区位图 + 任务关键词', ['projectBasicInfo', 'informationSources']],
    ['03', '场地理解与核心问题', blueprint.coreDesignQuestions.map((item) => item.value).join('；'), '现状照片 + 问题分析图', ['confirmedFacts', 'coreDesignQuestions', 'unconfirmedInfo']],
    ['04', '项目目标与设计约束', `${compact(project.designGoals, '目标待确认')}；核心约束：${blueprint.designConstraints.map((item) => item.value).join('、')}`, '目标与约束双栏信息图', ['projectBasicInfo.designGoals', 'designConstraints']],
    ['05', '核心设计概念', `${concept?.name || '待选择'}：${concept?.concept || '待生成'}；核心叙事：${blueprint.coreNarrative?.value || '待生成'}`, '概念主视觉 + 叙事关键词', ['conceptCandidates', 'coreNarrative']],
    ['06', '方案比选与设计师决策', `A/B/C 多维度比选；Agent 推荐 ${blueprint.agentRecommendation?.conceptId || '—'}；设计师选择 ${concept?.id || '—'}；融合要求：${blueprint.designerDecision.fusionRequirements || '无'}`, '比选表 + 设计师决策高亮', ['comparison', 'agentRecommendation', 'designerDecision']],
    ['07', '总体空间结构', blueprint.spatialStructure?.value || '待生成', '总平面 + 结构示意', ['spatialStructure', 'coreNarrative']],
    ['08', '功能分区与游线组织', `功能分区：${zones || '待生成'}；动线：${blueprint.circulationStrategy?.value || '待生成'}`, '分区色块图 + 游线箭头', ['functionalZones', 'circulationStrategy']],
    ['09', '植物、材料与生态策略', `植物：${strategy.plant || '待生成'}；材料：${strategy.material || '待生成'}；生态：${strategy.ecology || '待生成'}；竖向与排水：${strategy.grading || '待生成'} ${strategy.drainage || ''}`, '植物群落 + 材料样板 + 生态剖面', ['professionalStrategies']],
    ['10', '特色节点与场景设计', nodes || '特色节点待生成', '节点索引图 + 2–3 张重点场景', ['featureNodes', 'visualTasks']],
    ['11', '视觉成果展示', `${blueprint.visualTasks.length} 项视觉任务已组织，展示鸟瞰、入口、核心场景、全龄活动与夜景等演示案例视觉成果。`, '多图网格 + 大图强调', ['visualTasks', 'visualAssets']],
    ['12', '项目价值与下一步工作', `以一份可演进蓝本统一概念、空间、视觉与汇报；信息来源：${sources || '设计师输入'}；下一步：${blueprint.nextTasks.map((item) => item.value).join('、')}`, '价值总结 + 下一步时间线', ['qualityReview', 'risks', 'nextTasks']],
  ];
  const pptOutline = pages.map(([page, title, content, suggestedVisual, sourceFields]) => ({
    page,
    title,
    content,
    upScreenCopy: content,
    suggestedVisual,
    sourceFields,
    speechNotes: `本页围绕“${title}”展开，先说明核心结论，再用${suggestedVisual}对应 Blueprint 依据。`,
    status: CONTENT_STATUS.AI_SUGGESTED,
  }));
  return {
    schemeNarrative: {
      title: `${compact(project.projectName, '景观概念方案')}｜完整方案文案`,
      sections: [
        { title: '项目理解', value: `${compact(project.city, '项目地点待确认')}的${compact(project.projectType, '景观项目')}，面向${compact(project.targetUsers, '主要使用者')}。` },
        { title: '设计定位', value: compact(project.designGoals, '形成生态、体验与实施平衡的景观方案。') },
        { title: '核心概念', value: `${concept?.name || '待确认'}：${blueprint.coreNarrative?.value || concept?.concept || '待生成'}` },
        { title: '方案比选结论', value: `AI 推荐方案 ${blueprint.agentRecommendation?.conceptId || '—'}；设计师最终选择方案 ${concept?.id || '—'}。${blueprint.designerDecision.decisionReason ? `选择理由：${blueprint.designerDecision.decisionReason}` : ''}` },
        { title: '空间结构', value: blueprint.spatialStructure?.value || '待生成' },
        { title: '功能分区', value: zones || '待生成' },
        { title: '动线系统', value: blueprint.circulationStrategy?.value || '待生成' },
        { title: '专业策略', value: `植物：${strategy.plant || '待生成'}；材料：${strategy.material || '待生成'}；生态：${strategy.ecology || '待生成'}；运营：${strategy.operations || '待生成'}` },
        { title: '特色节点', value: nodes || '待生成' },
        { title: '视觉表达', value: `围绕 ${blueprint.visualTasks.length} 项画面任务形成演示案例视觉成果。` },
        { title: '项目价值', value: '以持续演进的项目设计蓝本统一概念、空间、视觉与汇报表达。' },
      ],
      status: CONTENT_STATUS.AI_SUGGESTED,
    },
    pptOutline,
    pptStructure: pptOutline,
    qualityReview: [
      { check: '图文一致性', result: '页面标题、核心内容与建议视觉均对应当前蓝本字段。', level: 'pass' },
      { check: '数据一致性', result: 'PPT 与报告均从当前 Blueprint 读取', level: 'pass' },
      { check: '未确认假设', result: `${assumptionsPending} 项仍为待确认/系统假设`, level: assumptionsPending ? 'warning' : 'pass' },
      { check: '视觉偏离', result: '演示案例视觉已按任务类型组织，正式深化时再进行项目级定向生产。', level: 'warning' },
      { check: '成果完整性', result: '项目设计蓝本、方案报告、视觉成果集与 12 页 PPT 结构已齐备。', level: 'pass' },
    ],
    outputArtifacts: [
      { type: '项目设计蓝本', state: 'JSON 可导出', action: 'json' },
      { type: '方案设计报告', state: 'Markdown 可导出', action: 'markdown' },
      { type: '视觉成果集', state: '演示案例已展示', action: 'visual' },
      { type: '汇报 PPT', state: '12 页内容已准备', action: 'ppt' },
    ],
    risks: [{ title: '成果深化边界', value: '可编辑 PPT 文件将在最终成果阶段生成，本轮展示内容与页面结构。', status: CONTENT_STATUS.PENDING }],
    nextTasks: [{ title: '最终确认', value: '完成图文、数据、假设、视觉与完整性复核，确认演示方案。', status: CONTENT_STATUS.PENDING }],
  };
}

export class MockAgentProvider extends AgentProvider {
  constructor() {
    super('Mock Provider');
  }

  async runAgent(agentId, blueprint, context = {}) {
    await abortableDelay(context.delayMs ?? 520, context.signal);
    if (context.signal?.aborted) throw new DOMException('任务已停止', 'AbortError');
    const builders = {
      1: projectDefinitionPatch,
      2: conceptPatch,
      3: comparisonPatch,
      4: spatialPatch,
      5: visualPatch,
      6: outputPatch,
    };
    const builder = builders[Number(agentId)];
    if (!builder) throw new Error(`Mock Provider 不支持 Agent ${agentId}`);
    return assertProviderPatch(builder(blueprint));
  }
}

export const mockAgentProvider = new MockAgentProvider();
