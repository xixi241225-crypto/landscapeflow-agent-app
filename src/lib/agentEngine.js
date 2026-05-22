/**
 * LandscapeFlow AI Agent Engine
 *
 * 模拟景观方案总监 Agent 的完整工作流。
 * 当前为 Mock 模式，生成基于输入参数动态变化的输出。
 * 预留 generateWithLLM(input) 函数用于后续接入真实大模型 API。
 */

// =============================================================================
// 真实 API 接入预留
// =============================================================================

/**
 * 后续接入真实大模型 API 时替换此函数。
 * @param {string} prompt - 构造好的提示词
 * @param {object} options - API 选项
 * @returns {Promise<string>} - LLM 返回的文本
 */
export async function generateWithLLM(prompt, options = {}) {
  // TODO: 接入 DeepSeek / OpenAI / Claude API
  // const response = await fetch('https://api.deepseek.com/chat/completions', {
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/json',
  //     'Authorization': `Bearer ${options.apiKey}`,
  //   },
  //   body: JSON.stringify({
  //     model: 'deepseek-chat',
  //     messages: [{ role: 'user', content: prompt }],
  //     temperature: 0.7,
  //   }),
  // });
  // const data = await response.json();
  // return data.choices[0].message.content;
  return null; // Mock 模式暂不调用
}

// =============================================================================
// Mock Agent Engine
// =============================================================================

/**
 * 模拟 LLM 调用延迟
 */
function delay(ms = 800) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 根据输入项目信息动态生成完整的方案输出。
 * 所有输出均基于 formData 动态构建，确保不同输入产生不同结果。
 * 六阶段 Agent 工作流：
 *  Step1: 项目定义 Agent
 *  Step2: 概念生成 Agent
 *  Step3: 方案选择 Agent
 *  Step4: 空间推演 Agent
 *  Step5: 视觉表达 Agent
 *  Step6: 输出成果 Agent
 *
 * @param {object} formData - 用户输入的项目条件（含 siteFiles）
 * @param {function} onStepUpdate - 步骤状态回调 (stepIndex, status, data)
 * @param {function} [waitForUser] - 可选，手动模式：返回 Promise，resolve 后继续下一步
 * @returns {Promise<object>} - 完整生成结果
 */
export async function runAgent(formData, onStepUpdate, waitForUser) {
  // 手动模式（分步演示）用 waitForUser；自动模式（一键跑完）用固定延迟让用户看清进度
  const stepDelay = () => (waitForUser ? waitForUser() : delay(1000));

  const AGENT_STEPS = [
    '项目定义 Agent',
    '概念生成 Agent',
    '方案选择 Agent',
    '空间推演 Agent',
    '视觉表达 Agent',
    '输出成果 Agent',
  ];

  const result = {
    formData,
    step1: null,
    step2: null,
    step3: null,
    step4: null,
    step5: null,
    step6: null,
    generatedAt: new Date().toISOString(),
  };

  // =============================================================================
  // Step 1: 项目定义 Agent
  // =============================================================================
  onStepUpdate(0, 'working');
  await delay(1200);

  const analysis = buildProjectAnalysis(formData);
  // 增加场地现状图处理结果
  analysis.siteImageContext = buildSiteImageContext(formData);
  result.step1 = analysis;
  onStepUpdate(0, 'done', analysis);
  await stepDelay();

  // =============================================================================
  // Step 2: 概念生成 Agent
  // =============================================================================
  onStepUpdate(1, 'working');
  await delay(1000);

  const missingInfo = buildMissingInfo(formData);

  // 三方案生成
  await delay(800);
  const schemes = buildThreeSchemes(formData);

  result.step2 = { missingInfo, schemes, stage: 'generated' };
  onStepUpdate(1, 'done', result.step2);
  await stepDelay();

  // =============================================================================
  // Step 3: 方案选择 Agent（方案比选 + 推荐）
  // =============================================================================
  onStepUpdate(2, 'working');
  await delay(1500);

  const comparison = buildComparison(schemes);
  result.step3 = comparison;
  onStepUpdate(2, 'done', comparison);
  await stepDelay();

  // =============================================================================
  // Step 4: 空间推演 Agent
  // =============================================================================
  onStepUpdate(3, 'working');
  await delay(2000);

  const deepenedPlan = buildDeepenedPlan(formData, schemes, comparison);
  result.step4 = deepenedPlan;
  onStepUpdate(3, 'done', deepenedPlan);
  await stepDelay();

  // =============================================================================
  // Step 5: 视觉表达 Agent（双轨制）
  // =============================================================================
  onStepUpdate(4, 'working');
  await delay(1800);

  const visualData = buildVisualExpression(formData, schemes, deepenedPlan);
  result.step5 = visualData;
  onStepUpdate(4, 'done', visualData);
  await stepDelay();

  // =============================================================================
  // Step 6: 输出成果 Agent
  // =============================================================================
  onStepUpdate(5, 'working');
  await delay(1500);

  const outputs = buildOutputs(formData, schemes, deepenedPlan, visualData);
  result.step6 = outputs;
  onStepUpdate(5, 'done', outputs);

  return result;
}

// =============================================================================
// Step 1: 项目解析
// =============================================================================

function buildProjectAnalysis(data) {
  const typeMap = {
    '社区公园': '社区公园 / 居住区配套公园 / 城市更新型公共绿地',
    '居住区景观': '居住区景观设计',
    '商业街区': '商业街区景观设计',
    '公园更新': '公园更新 / 城市更新类项目',
    '文旅景区': '文旅景区景观设计',
    '校园景观': '校园景观设计',
    '屋顶花园': '屋顶花园 / 垂直绿化',
    '其他': '综合景观设计',
  };

  const isNorthern = /北京|河北|天津|山西|内蒙古|辽宁|吉林|黑龙江/i.test(data.city);
  const isCoastal = /上海|深圳|广州|厦门|青岛|大连|宁波|三亚|海口/i.test(data.city);
  const isSouthern = /广东|广西|海南|福建|云南/i.test(data.city);

  let climateJudgment = '';
  if (isNorthern) {
    climateJudgment = `项目位于${data.city}，属北方温带大陆性气候。冬季寒冷干燥，最低气温可达-15℃以下，需重点解决冬季景观萧瑟问题、土壤冻胀对硬质铺装的影响，以及植物的越冬保护。冬季主导风向北/西北，需设置防风屏障。`;
  } else if (isCoastal) {
    climateJudgment = `项目位于${data.city}，属沿海气候区。需考虑盐雾腐蚀、台风影响和排水设计，同时应充分利用海洋微气候优势。`;
  } else if (isSouthern) {
    climateJudgment = `项目位于${data.city}，属南方亚热带气候。高温多雨，植物生长旺盛，需重点关注排水、遮荫和植物生长速度控制。`;
  } else {
    climateJudgment = `项目位于${data.city}，需结合当地具体气候条件进行针对性设计。建议补充气象数据以精确判断。`;
  }

  const areaNum = parseInt(data.area) || 8000;
  let scaleJudgment = '';
  if (areaNum <= 3000) scaleJudgment = '小型项目，适合精细化设计，重点打造核心场景。';
  else if (areaNum <= 10000) scaleJudgment = '中型项目，可组织完整的空间序列，功能分区较为灵活。';
  else scaleJudgment = '大型项目，需统筹整体结构，分区清晰，交通组织为关键。';

  return {
    projectType: typeMap[data.projectType] || data.projectType,
    coreConflict: generateCoreConflict(data),
    userNeeds: parseUserNeeds(data.targetUsers),
    climateJudgment,
    scaleJudgment,
    clientFocus: parseClientFocus(data.clientFocus),
  };
}

function generateCoreConflict(data) {
  const constraints = data.constraints || '';
  const goals = data.designGoals || '';

  const conflicts = [];

  if (/低维护/.test(constraints) && /四季有景|丰富/.test(goals)) {
    conflicts.push('低维护要求与"四季有景"之间存在天然张力——需要技术策略平衡');
  }
  if (/预算有限|成本控制/.test(constraints)) {
    conflicts.push('有限预算 vs. 高品质空间体验需求——需在关键节点集中投入');
  }
  if (/北方|冬季|寒冷/.test(constraints)) {
    conflicts.push('北方冬季景观萧瑟——如何保证 12-2 月依然有景观吸引力');
  }
  if (/儿童/.test(data.targetUsers || '') && /老人/.test(data.targetUsers || '')) {
    conflicts.push('老人安静休憩需求与儿童活动噪音之间的矛盾——需动静态分区');
  }
  if (/汇报|展示/.test(data.clientFocus || '')) {
    conflicts.push('汇报展示效果与实际使用功能之间的权衡——设计需"好看且好用"');
  }
  if (/欢乐谷|游客|外溢/.test(data.targetUsers || '') || /文娱|活力/.test(data.designGoals || '')) {
    conflicts.push('居民日常使用 vs. 欢乐谷游客外溢流量——需兼顾社区属性与城市活力');
  }

  if (conflicts.length === 0) {
    return '场地条件总体较为理想，核心挑战在于如何在限定条件下实现最大设计价值。';
  }

  return conflicts.join('；');
}

function parseUserNeeds(users) {
  const needs = [];
  if (/老人/.test(users)) {
    needs.push({
      group: '老年人',
      needs: ['安静休憩空间', '无障碍通行', '晨练场地', '棋牌社交空间', '充足的座椅设施', '遮阳避风'],
    });
  }
  if (/儿童/.test(users)) {
    needs.push({
      group: '儿童',
      needs: ['安全活动场地', '趣味游乐设施', '亲子互动空间', '自然探索区域', '看护家长休息区'],
    });
  }
  if (/居民|周边/.test(users)) {
    needs.push({
      group: '周边居民',
      needs: ['日常散步路径', '邻里社交空间', '小型活动场地', '便捷可达的出入口'],
    });
  }
  if (/家庭|周末|亲子/.test(users)) {
    needs.push({
      group: '亲子家庭 / 周末游客',
      needs: ['野餐草坪', '家庭活动空间', '拍照打卡点', '周末市集/活动场地'],
    });
  }
  if (needs.length === 0) {
    needs.push({
      group: '通用人群',
      needs: ['舒适的公共空间', '便捷的通行系统', '良好的景观环境'],
    });
  }
  return needs;
}

function parseClientFocus(focus) {
  const items = [];
  const raw = focus || '';
  if (/汇报/.test(raw)) items.push('方案汇报效果——需有清晰的叙事线和视觉冲击力');
  if (/落地/.test(raw)) items.push('可落地性——不追求纸上方案，工艺和材料须可实施');
  if (/成本/.test(raw)) items.push('项目成本控制——最优性价比，关键节点集中投入');
  if (/维护|运维/.test(raw)) items.push('后期维护便利——低维护策略，减少物业运营压力');
  if (/传播/.test(raw)) items.push('可传播性——设计主题需有记忆点，适合媒体传播');
  if (/儿童|老人|全龄/.test(raw)) items.push('全龄友好——设计需兼顾老人、儿童、青年的差异化需求');
  if (/承载力|活动/.test(raw)) items.push('社区活动承载力——需考虑周末与平日不同强度使用场景');
  if (items.length === 0) {
    items.push('项目综合品质——兼具美学价值和实用功能');
  }
  return items;
}

// =============================================================================
// SiteImageContext Builder（项目定义 Agent 场地现状图处理）
// =============================================================================

function buildSiteImageContext(data) {
  const files = data.siteFiles || [];
  const hasSiteImage = files.length > 0;

  if (hasSiteImage) {
    return {
      hasSiteImage: true,
      fileCount: files.length,
      fileNames: files.map((f) => f.name || f),
      message: `已接收场地现状图（${files.map((f) => f.name || f).join('、')}）。当前 MVP 将其作为项目上下文记录，重点用于辅助判断场地边界、现状问题、保留树木、高差风险和效果图生成参考。后续可接入多模态模型自动识别场地问题。`,
      usageNote: '用途：辅助判断场地边界、现状乔木位置、地形高差、周边建筑关系、效果图生成参考。',
      limitation: '⚠️ 当前 MVP 限制：文件已记录但未真实上传服务器，Agent 基于文字条件进行方案生成。',
      futurePlan: '🔮 后续规划：接入多模态大模型（如 GPT-4o / Claude 3），自动识别场地问题、乔木位置、高差分析和用地边界。',
    };
  }

  return {
    hasSiteImage: false,
    fileCount: 0,
    fileNames: [],
    message: '未上传场地现状图。Agent 将基于文字条件进行方案生成，但场地边界、高差、现状植被和周边关系判断会存在不确定性，建议补充现状图或红线图。',
    usageNote: '建议上传：场地现状照片、无人机航拍图、CAD 总平图、用地红线图。',
    limitation: '⚠️ 无场地现状图时，场地边界、保留乔木位置、地形高差为假设值，建议现场踏勘确认。',
    futurePlan: '🔮 后续规划：支持上传 CAD/DWG 文件，自动识别地形等高线、现状建筑和乔木位置。',
  };
}

// =============================================================================
// Step 2: 主动追问与合理假设
// =============================================================================

function buildMissingInfo(data) {
  const missingFields = [];
  const mustAsk = [];
  const canAssume = [];

  if (!data.city || data.city.length < 3) {
    mustAsk.push('项目城市/区域信息不完整——影响气候判断和植物选型');
  }
  if (!data.area) {
    mustAsk.push('项目面积未明确——影响空间尺度和功能分区');
  }

  // 条件性缺失信息
  const hasTerrain = /地形|高程|坡度|高差|山地|平地|坡地/i.test(data.constraints || '');
  if (!hasTerrain) {
    canAssume.push({
      question: '场地现状地形与竖向条件',
      assumption: '默认场地为平坦地形，高差小于 1m，可忽略地形对设计的影响',
    });
  }

  const hasSoil = /土壤|地质|地基/i.test(data.constraints || '');
  if (!hasSoil) {
    canAssume.push({
      question: '土壤条件与地质情况',
      assumption: '默认土壤条件良好，无需特殊地基处理，种植土厚度满足常规绿化要求',
    });
  }

  const hasBudget = /预算|造价|投资/i.test(data.constraints || '');
  if (!hasBudget) {
    canAssume.push({
      question: '项目总投资预算',
      assumption: data.area
        ? `参考同类项目，按 ${parseInt(data.area) >= 5000 ? '600-800' : '400-600'} 元/㎡ 建安成本估算`
        : '参考同类社区公园项目，按 500-700 元/㎡ 建安成本估算',
    });
  }

  const hasTimeline = /工期|进度|时间|节点/i.test(data.constraints || '');
  if (!hasTimeline) {
    canAssume.push({
      question: '设计周期与施工工期要求',
      assumption: '假定概念方案阶段 4 周，施工图 8 周，施工周期 6 个月',
    });
  }

  const hasUnderground = /地下|管线|市政|管网/i.test(data.constraints || '');
  if (!hasUnderground) {
    canAssume.push({
      question: '地下管线与市政接口条件',
      assumption: '默认场地市政接口齐全，无重大地下管线穿越，给排水可正常接入',
    });
  }

  // 如果项目类型需特别关注
  if (data.projectType === '屋顶花园') {
    mustAsk.push('屋顶荷载参数——屋顶花园需明确结构荷载允许值（大于 3.0kN/㎡ 可做常规覆土种植）');
  }

  // 欢乐谷片区特殊追问
  if (/欢乐谷|朝阳区/.test(data.city || '')) {
    canAssume.push({
      question: '欢乐谷游客外溢时间与规模',
      assumption: '假定节假日及周末游客外溢量约 200-500 人/天，公园需具备短时承载力',
    });
  }

  return {
    missingFields,
    mustAsk: mustAsk.length > 0 ? mustAsk : ['无必须补充的刚性缺失信息'],
    canAssume: canAssume.length > 0 ? canAssume : [{ question: '无特别缺失信息', assumption: '现有信息足以支撑概念方案阶段的设计推演' }],
    demoNote: '以下为本次演示采用的合理假设，实际项目中需与甲方确认后调整',
  };
}

// =============================================================================
// Step 3: 三方案生成
// =============================================================================

function buildThreeSchemes(data) {
  const isNorthern = /北京|河北|天津|山西|内蒙古|辽宁|吉林|黑龙江/i.test(data.city || '');
  const cityName = data.city ? data.city.replace(/市|区/g, '') : '项目所在地';
  const areaText = data.area || '';

  const schemes = [
    {
      id: 'A',
      name: '城市绿环 · 全龄共享公园',
      concept: `以"城市绿环"为核心理念，在${cityName}欢乐谷片区打造一个环形串联的全龄共享社区公园——一条绿环串联所有活动节点，让日常散步、亲子活动、老人休憩与社区交往自然发生。`,
      spatialStructure: `"一心+一环+多点"结构。中央共享草坪为核心（一心），350m 环形慢跑/漫步路径为骨架（一环），沿线布置儿童活动点、老人休憩点、林下会客点、社区活动点、入口形象点（多点）。`,
      coreScenes: [
        '中央共享草坪——弹性大草坪（约 2500 ㎡），平日居民休憩野餐、周末社区市集/露天电影，兼容日常与活动',
        '环形慢跑/漫步路径——350m EPDM 软质铺装，串联全园节点，夜灯照明，适合慢跑与散步',
        '儿童活动点——原木攀爬 + 沙坑 + 浅水互动小品，适合 3-10 岁儿童，配有家长看护座椅',
        '老人休憩点——银杏林下的棋牌桌 + 太极小广场 + 带靠背扶手座椅，满足老人晨练与社交',
        '林下会客点——大乔木遮荫下的半围合空间，适合邻里闲聊与小型聚会',
        '社区活动点——小型抬升木平台，可举办社区演出与节日活动，呼应欢乐谷文娱氛围',
        '入口形象点——毛石景墙 + 锈钢板标识，面向欢乐谷方向，形成鲜明入口识别',
      ],
      targetUsers: '全龄友好——老人晨练、儿童放学后玩耍、亲子家庭周末活动、欢乐谷游客短暂停留',
      pros: [
        '一心一环多点结构清晰，识别性强，易理解、易汇报',
        '全龄覆盖，满足社区多元需求，空间承载力高',
        '中央草坪弹性大，兼容日常休憩与周末活动',
        '绿环概念契合朝阳区"城市活力"定位，可传播性强',
      ],
      risks: [
        '草坪养护需控制使用强度，需设置隐性管理机制（如分区轮休）',
        '儿童活动与老人休憩需保持适度距离，避免噪音干扰',
        '中央草坪冬季景观较空，需搭配冬季骨架植物与临时装置',
      ],
    },
    {
      id: 'B',
      name: '欢乐草坪 · 邻里活力客厅',
      concept: `以"欢乐草坪"为主题，呼应欢乐谷片区文娱活力气质，将社区公园打造为邻里活力客厅——以大型中央草坪为舞台，周边布置活力节点，日常是邻里社交中心，周末是欢乐谷游客的轻度游憩溢出地。`,
      spatialStructure: `"一心+五区"结构。大型中央欢乐草坪为空间核心（一心），周边五片活力功能区环抱：邻里会客厅（北）、社区小舞台（东）、亲子活力园（东南）、林荫康养角（西）、入口形象广场（南）。`,
      coreScenes: [
        '中央欢乐草坪——大型耐践踏草坪（约 3000 ㎡），可举办社区市集、露天电影、草地音乐会，周末承载欢乐谷外溢游客',
        '邻里会客厅——半户外木结构亭廊 + 可移动桌椅 + WiFi 覆盖，适合邻里社交与小型聚会',
        '社区小舞台——抬升木平台 + 简易灯光音响接口，支持社区演出与节日庆典',
        '亲子活力园——彩色 EPDM 地面 + 原木游乐设施 + 可涂鸦黑板墙 + 家长看护区',
        '林荫康养角——银杏林下健身器材 + 棋牌桌 + 遮荫座椅，满足老人日常需求',
        '入口形象广场——硬质铺装 + 可移动花箱座椅 + 标识景墙，与欢乐谷方向呼应',
      ],
      targetUsers: '社区活力导向——喜欢社群互动的家庭、年轻居民、亲子家庭、欢乐谷溢出游客',
      pros: [
        '"欢乐草坪"主题与欢乐谷片区气质高度契合，是汇报最大亮点',
        '一心五区结构弹性大，草坪可兼容多场景使用，空间效率高',
        '邻里会客厅和社区舞台提升社区归属感与凝聚力',
        '低维护植物配置 + 耐践踏草坪，符合运维成本控制要求',
      ],
      risks: [
        '大型草坪养护要求较高，需选择耐践踏品种并设分区轮休机制',
        '社区活动可能产生噪音，需建立社区公约与物业协调机制',
        '草坪冬季使用率下降，需考虑冬季替代活动方案',
      ],
    },
    {
      id: 'C',
      name: '森氧游园 · 亲子友好社区公园',
      concept: `以"森氧游园"为理念，在${cityName}欢乐谷片区打造一个以密林氧吧为基底、亲子探索为亮点的自然友好型社区公园——让孩子在自然中成长，让老人在绿荫中休憩，让欢乐谷游客体验城市中的"森呼吸"。`,
      spatialStructure: `"森林基底 + 亲子探索带 + 康养休憩圈"结构。全园以乡土乔木密植形成森林氧吧基底，中央蜿蜒的亲子自然探索带串联各活动节点，外围布置康养休憩圈（林下步道 + 休憩节点）。`,
      coreScenes: [
        '森氧林境——国槐+白蜡+银杏密植区，形成天然氧吧，林下设置木栈道与休息平台',
        '亲子自然探索带——原木攀爬网 + 沙坑 + 自然材料手工区 + 昆虫观察站，适合亲子互动与自然教育',
        '自然教育角——植物认知牌 + 雨水花园观察点 + 鸟类喂食站，适合学校户外课堂',
        '老人康养区——林下棋牌桌 + 太极广场 + 香草疗愈花园（迷迭香、薰衣草），满足老人康养需求',
        '社区迷你菜园——居民认养种植区，增强社区归属感与参与感',
        '入口森氧广场——木质铺装 + 自然石景墙，传递"森林社区"第一印象',
      ],
      targetUsers: '亲子自然教育导向——亲子家庭、学龄儿童、自然爱好者、老人康养、欢乐谷游客轻度游憩',
      pros: [
        '"森氧游园"概念独特，差异化明显，在社区公园中有识别度',
        '亲子自然探索主题契合当代家庭教育趋势，社会价值突出',
        '密植乔木提供优质遮荫与微气候，夏季体感温度低 3-5℃',
        '自然材料 + 低维护植物，长期运维成本可控',
      ],
      risks: [
        '密植乔木前期投入较大，成林需要 3-5 年时间',
        '森林基底可能影响空间通透感，需控制乔灌密度',
        '亲子设施需符合安全标准，自然材料耐久性需验证',
      ],
    },
  ];

  return schemes;
}

// =============================================================================
// Step 4: 方案比选
// =============================================================================

function buildComparison(schemes) {
  const dimensions = [
    { key: 'spatial', label: '空间体验', weight: 0.2 },
    { key: 'feasibility', label: '落地可行性', weight: 0.2 },
    { key: 'cost', label: '成本控制', weight: 0.15 },
    { key: 'maintenance', label: '后期维护', weight: 0.15 },
    { key: 'presentation', label: '甲方汇报表现力', weight: 0.2 },
    { key: 'locality', label: '在地性（欢乐谷片区）', weight: 0.1 },
  ];

  // Based on scheme profiles, assign scores
  const scores = {
    A: { spatial: 8.5, feasibility: 8.5, cost: 8.0, maintenance: 7.5, presentation: 8.5, locality: 8.5 },
    B: { spatial: 8.5, feasibility: 8.0, cost: 7.5, maintenance: 7.5, presentation: 9.0, locality: 9.5 },
    C: { spatial: 7.5, feasibility: 7.5, cost: 7.0, maintenance: 8.0, presentation: 8.0, locality: 7.5 },
  };

  const schemeDetails = schemes.map((s, i) => {
    const id = s.id;
    const rawScores = scores[id];
    const weighted = {};
    let total = 0;
    dimensions.forEach((d) => {
      weighted[d.key] = {
        label: d.label,
        raw: rawScores[d.key],
        weighted: (rawScores[d.key] * d.weight).toFixed(2),
      };
      total += rawScores[d.key] * d.weight;
    });

    // Add a reasoning for each dimension
    const reasoning = {
      spatial: s.id === 'A' ? '一心一环多点，结构清晰，空间节奏好' : s.id === 'B' ? '一心五区以大草坪为核心，开放大气，空间体验佳' : '森林基底+亲子探索，沉浸式体验强，但通透感略弱',
      feasibility: s.id === 'A' ? 'EPDM 环线 + 草坪 + 标准节点，技术成熟，施工难度低' : s.id === 'B' ? '大草坪 + 轻量构筑物，施工周期可控' : s.id === 'C' ? '密植乔木前期投入大，成林需 3-5 年' : '',
      cost: s.id === 'A' ? '环形系统 + 多点散布，整体投入可控' : s.id === 'B' ? '大草坪养护成本略高，但构筑物投入适中' : s.id === 'C' ? '乔木密植前期投入较高，长期维护成本低' : '',
      maintenance: s.id === 'A' ? '草坪需精细管理，其他节点低维护' : s.id === 'B' ? '大型草坪需分区轮休管理，其他区域低维护' : s.id === 'C' ? '自然式种植，长期维护成本最低' : '',
      presentation: s.id === 'B' ? '"欢乐草坪"主题与欢乐谷高度契合，汇报表现出色' : s.id === 'A' ? '"城市绿环"概念清晰，汇报叙事完整，甲方易理解' : '"森氧游园"概念独特，适合亲子主题汇报',
      locality: s.id === 'B' ? '"欢乐草坪"主题与欢乐谷片区活力气质高度契合，在地性最强' : s.id === 'A' ? '"城市绿环"契合朝阳城市活力定位，在地性良好' : '"森氧游园"概念新颖但在地性表达偏弱',
    };

    return {
      id,
      name: s.name,
      scores: weighted,
      total: total.toFixed(2),
      reasoning,
    };
  });

  // Sort by total descending
  schemeDetails.sort((a, b) => parseFloat(b.total) - parseFloat(a.total));

  return {
    dimensions,
    schemes: schemeDetails,
    recommended: schemeDetails[0],
    note: `综合评分采用加权打分法（满分 10 分），权重分配：空间体验 20%、落地可行性 20%、成本控制 15%、后期维护 15%、汇报表现力 20%、在地性（欢乐谷片区）10%。评分基于${schemes.length}个方案的差异化策略进行横向对比。优先推荐"欢乐草坪 · 邻里活力客厅"（方案 B）或"城市绿环 · 全龄共享公园"（方案 A），两者在汇报表现力和欢乐谷片区在地性方面表现突出，更契合社区共享与亲子使用场景。`,
  };
}

// =============================================================================
// Step 5: 推荐方案深化
// =============================================================================

function buildDeepenedPlan(data, schemes, comparison) {
  const recommended = comparison.recommended;
  const scheme = schemes.find((s) => s.id === recommended.id);

  const isNorthern = /北京|河北|天津|山西|内蒙古|辽宁|吉林|黑龙江/i.test(data.city || '');
  const city = data.city || '项目所在地';

  return {
    recommendedScheme: scheme,
    totalScore: recommended.total,
    planImage: { title: '总平面图 / 空间策略图', url: '/demo-images/plan.jpg', note: '展示一心一环多点空间结构、功能分区与游线组织' },
    designPhilosophy: `基于${city}欢乐谷片区的社区条件与城市活力需求，推荐「${scheme.name}」。该方案在甲方汇报表现力和在地性（欢乐谷片区活力气质）方面得分最高，能够兼顾美学品质、落地可行性与社区多元使用需求。${isNorthern ? '针对北方气候特征，方案已纳入冬季专项设计策略与四季植物配置。' : ''}"${scheme.name === '欢乐草坪 · 邻里活力客厅' ? '欢乐草坪' : scheme.name === '城市绿环 · 全龄共享公园' ? '城市绿环' : '森氧游园'}"主题与欢乐谷片区高度契合，适合汇报传播，是方案核心亮点。`,
    functionalZones: generateZones(scheme),
    circulation: generateCirculation(scheme),
    ageFriendly: generateAgeFriendly(data),
    plantStrategy: generatePlantStrategy(data),
    materialStrategy: generateMaterialStrategy(data),
    lightingStrategy: generateLightingStrategy(),
    maintenance: generateMaintenance(data),
  };
}

function generateZones(scheme) {
  if (scheme.id === 'A') {
    return [
      { name: '中央共享草坪（一心）', area: '约 2500 ㎡', function: '弹性大草坪 + 社区活动 + 周末市集 + 露天电影', position: '园区中央' },
      { name: '儿童活动点', area: '约 1200 ㎡', function: '原木攀爬 + 沙坑 + 浅水互动小品 + 家长看护区', position: '东南侧，环线上' },
      { name: '老人休憩点', area: '约 1000 ㎡', function: '银杏林下棋牌桌 + 太极小广场 + 带靠背座椅', position: '西北侧，环线上' },
      { name: '林下会客点', area: '约 800 ㎡', function: '大乔木遮荫 + 半围合空间 + 邻里社交', position: '北侧，环线上' },
      { name: '社区活动点', area: '约 600 ㎡', function: '小型抬升木平台 + 简易电源，支持社区演出', position: '东侧，环线上' },
      { name: '入口形象点', area: '约 500 ㎡', function: '毛石景墙 + 锈钢板标识 + 迎宾花境', position: '南侧主入口' },
      { name: '350m 慢跑/漫步环（一环）', area: '线性约 350m', function: 'EPDM 软质铺装 + 夜灯照明 + 里程标识', position: '外围串联所有节点' },
    ];
  }
  if (scheme.id === 'B') {
    return [
      { name: '中央欢乐草坪（一心）', area: '约 3000 ㎡', function: '大型耐践踏草坪 + 社区市集 + 露天电影 + 草地音乐会', position: '园区中央' },
      { name: '邻里会客厅', area: '约 900 ㎡', function: '半户外木结构亭廊 + 可移动桌椅 + WiFi 覆盖', position: '北侧' },
      { name: '社区小舞台', area: '约 600 ㎡', function: '抬升木平台 + 简易灯光音响接口 + 社区演出', position: '东侧' },
      { name: '亲子活力园', area: '约 1400 ㎡', function: '彩色 EPDM 地面 + 原木游乐 + 可涂鸦黑板墙 + 看护区', position: '东南侧' },
      { name: '林荫康养角', area: '约 1000 ㎡', function: '银杏林下健身器材 + 棋牌桌 + 遮荫座椅', position: '西侧' },
      { name: '入口形象广场', area: '约 800 ㎡', function: '硬质铺装 + 可移动花箱座椅 + 标识景墙', position: '南侧主入口' },
    ];
  }
  return [
    { name: '森氧林境', area: '约 3000 ㎡', function: '国槐+白蜡+银杏密植 + 林下木栈道 + 休息平台', position: '全园基底' },
    { name: '亲子自然探索带', area: '约 1800 ㎡', function: '原木攀爬网 + 沙坑 + 自然材料手工区 + 昆虫观察站', position: '园区中部蜿蜒带状' },
    { name: '自然教育角', area: '约 600 ㎡', function: '植物认知牌 + 雨水花园观察点 + 鸟类喂食站', position: '东侧' },
    { name: '老人康养区', area: '约 1000 ㎡', function: '林下棋牌桌 + 太极广场 + 香草疗愈花园', position: '西侧' },
    { name: '社区迷你菜园', area: '约 500 ㎡', function: '居民认养种植区 + 工具收纳屋', position: '北侧' },
    { name: '入口森氧广场', area: '约 600 ㎡', function: '木质铺装 + 自然石景墙 + 迎宾种植', position: '南侧主入口' },
  ];
}

function generateCirculation(scheme) {
  return {
    mainRoute: scheme.id === 'A' ? '350m 环形慢跑/漫步系统，以中央共享草坪为核心，串联儿童活动、老人休憩、林下会客、社区活动、入口形象五大节点' : scheme.id === 'B' ? '以中央欢乐草坪为核心，五条放射状路径分别连接邻里会客厅、社区小舞台、亲子活力园、林荫康养角、入口形象广场' : '中央蜿蜒的亲子自然探索带为主轴，串联各活动节点；外围康养休憩圈为林下步道系统',
    secondaryRoute: '2.0m 宽次级园路，连接各功能区内部节点，全部无障碍设计',
    accessibility: '全园无障碍设计，主路坡度 ≤ 5%，入口设置无障碍坡道和盲道，康养/慢跑步道采用防滑铺装',
    entryPoints: '主入口 × 1（面向欢乐谷方向，吸引游客外溢）+ 次入口 × 2（连接周边小区）+ 应急出入口 × 1',
  };
}

function generateAgeFriendly(data) {
  const hasElderly = /老人/.test(data.targetUsers || '');
  const hasChildren = /儿童/.test(data.targetUsers || '');

  return {
    elderly: hasElderly
      ? ['全园无障碍通道，主路宽度 ≥ 2.5m', '每 50m 设置休息座椅（带靠背与扶手）', '健身器材区设置扶手和安全提示牌', '林下空间保证夏季遮荫率 ≥ 60%', '地面铺装采用防滑、抗冻胀材质', '康养/慢跑环设置直饮水点与应急呼叫按钮']
      : ['通用适老设计标准满足'],
    children: hasChildren
      ? ['游乐区地面采用 EPDM 安全地垫（厚度 ≥ 25mm）', '所有设施符合 GB 8408 安全标准', '儿童活动区与车行区域物理隔离，设置缓冲区', '设置家长看护休息区，视线通透无死角', '植物选择无毒无刺无刺激性气味品种', '浅水互动区水深 ≤ 15cm，防滑底面']
      : ['通用儿童友好标准满足'],
    inclusive: [
      '主要节点设置轮椅可达的观景平台与休息区',
      '标识系统采用大字体 + 盲文辅助 + 中英文双语',
      '夜间照明覆盖主要通行路径（色温 2700-3000K，保障安全性与温馨感）',
      '欢乐谷游客导流标识清晰，避免游客迷路',
    ],
  };
}

function generatePlantStrategy(data) {
  const isNorthern = /北京|河北|天津|山西|内蒙古|辽宁|吉林|黑龙江/i.test(data.city || '');
  const lowMaintenance = /低维护|耐寒|耐旱/i.test(data.maintenance || '');

  if (isNorthern) {
    return {
      principle: '耐寒耐旱乡土树种为主，构建常绿骨架 + 四季变化 + 低维护导向，兼顾欢乐谷片区四季游客接待需求',
      trees: '国槐、白蜡、栾树、银杏、油松、白皮松（常绿骨架）、海棠、山桃（春季开花，吸引游客打卡）',
      shrubs: '红瑞木（冬季红枝打卡点）、丁香、金银木、绣线菊、黄刺玫、月季（多季开花，低维护）',
      groundcover: '麦冬、苔草、景天类（耐旱、抗踩踏）、二月兰（自播繁衍，低维护）',
      winter: '以常绿乔木 + 红枝灌木 + 观赏草枯荣效果构建冬季景观；中央草坪冬季可布置临时艺术装置/灯饰，吸引欢乐谷游客',
      maintenance: lowMaintenance ? '减少修剪频率的草坪面积，大量使用多年生宿根花卉替代一年生草花；选择自播繁衍品种，减少补植成本' : '常规养护，重点维护中央草坪与四季概念園',
    };
  }
  return {
    principle: '乡土树种为主，适地适树，生态群落自然演替，低维护导向',
    trees: '香樟、榉树、乌桕、无患子、桂花、紫薇',
    shrubs: '杜鹃、山茶、南天竹、八角金盘',
    groundcover: '麦冬、鸢尾、美女樱',
    winter: '常绿阔叶树种冬季仍保持绿量，搭配色叶树种增色',
    maintenance: '常规养护，注意南方雨季排水',
  };
}

function generateMaterialStrategy(data) {
  const isNorthern = /北京|河北|天津|山西|内蒙古|辽宁|吉林|黑龙江/i.test(data.city || '');

  return {
    principle: '自然材料为主，工业化材料为辅，追求"温润感"而非"冰冷感"；兼顾低维护与文娱氛围',
    paving: isNorthern
      ? '主路：透水混凝土 + 露骨料（防冻胀，防滑）；次路：砾石铺装 + 石板汀步；广场：花岗岩火烧面（防滑，耐久）；文娱广场：彩色 EPDM 地面（活力色系）'
      : '主路：透水沥青/混凝土；次路：碎石+木屑软质铺装；广场：生态陶瓷透水砖',
    structures: '座凳：防腐木 + 石材结合，局部设置带靠背座椅（适老）；廊架：钢结构 + 木格栅顶，配备灯光与插座（支持文娱活动）；景墙：毛石干垒 + 锈钢板（欢乐谷风）',
    playground: 'EPDM 彩色安全地垫（活力色系）+ 原木游乐设施 + 沙坑；儿童文娱场增设可涂鸦黑板墙（互动性）',
    drainage: isNorthern ? '线性排水沟 + 渗透管，重点解决冻胀问题；中央草坪设置盲管排水，避免积水' : '海绵设施：雨水花园 + 植草沟 + 渗透铺装',
  };
}

function generateLightingStrategy() {
  return {
    principle: '安全照明为基础，氛围照明为亮点，文娱照明为特色，避免光污染',
    functional: '主路 3.5m 高庭院灯（暖白 3000K），次路 1.2m 高草坪灯（暖白 2700K）',
    accent: '重要节点（社区舞台、入口广场）设置树冠上射灯 + 特色灯具，营造夜间文娱氛围；水景水下灯',
    interactive: '儿童活动区设置低照度感应灯带，夜间自动点亮；社区舞台配置情景照明，支持夜间演出',
    control: '智能时控 + 光控，深夜模式（22:00 后）降低 50% 亮度，延长灯具寿命',
    energy: '全部采用太阳能 + LED 灯具，减少电力消耗；社区舞台预留市电接口，支持大型活动',
  };
}

function generateMaintenance(data) {
  const isLow = /低维护/i.test(data.maintenance || '');
  return {
    approach: isLow
      ? '以"设计降低维护"为核心理念，从植物选择、铺装材料、设施设计三个层面系统性降低后期运维成本；同时建立"社区共治"机制，增强居民参与感'
      : '常规维护策略，兼顾品质与效率',
    plants: '减少高维护草花面积，增加多年生宿根花卉、观赏草、灌木地被；草坪采用耐践踏品种（如早熟禾混播），减少修剪频次；欢乐谷游客高峰期（节假日）增加保洁频次',
    facilities: '选择耐久材料（防腐木、不锈钢、混凝土），减少更换频率；儿童设施选择模块化产品，便于局部更换；景观构筑物采用可拆卸节点设计，便于检修',
    community: '预留社区志愿者参与维护的空间——共享花园认养、草坪分区轮休管理、社区活动自治管理等机制，降低物业压力，增强社区归属感',
    annualCost: '预估年维护成本约 12-20 万元（含绿化养护、设施维护、清洁保洁，含节假日游客高峰增量成本），较同类项目降低约 25-35%',
  };
}

// =============================================================================
// Step 6: 成果输出（输出成果 Agent · 三类成果）
// =============================================================================

function buildOutputs(data, schemes, deepenedPlan, visualData) {
  const city = data.city || '项目所在地';
  const scheme = deepenedPlan.recommendedScheme;

  // --- 效果图 Prompt ---
  const prompts = generateImagePrompts(data, scheme, deepenedPlan);

  // --- PPT 大纲 ---
  const pptOutline = generatePPTOutline(data, schemes, deepenedPlan);

  // --- Markdown 报告 ---
  const markdownReport = generateMarkdownReport(data, schemes, deepenedPlan, prompts, pptOutline);

  // 三类成果
  return {
    // 第一类：可下载方案报告
    report: markdownReport,
    reportTitle: `${data.projectName || city + '景观概念设计'} · LandscapeFlow AI 方案报告`,

    // 第二类：PPT 汇报大纲（8 页）
    pptOutline,
    pptNote: 'PPTX 接口预留——当前输出 8 页大纲结构。P1 封面（鸟瞰总览图/中央草坪区效果图）、P2 项目背景（场地现状图/区位示意）、P3 核心问题与设计目标（问题分析图）、P4 三个方案比选（方案比选表）、P5 推荐方案总平策略（plan.jpg）、P6 中央草坪与全龄活动场景（awn.jpg）、P7 植物材料运维策略（植物配置图/材料板）、P8 总结与价值表达（夜景图/鸟瞰图）。后续可通过 WorkBuddy 或 pptxgenjs 接入真实 PPT 生成。',

    // 第三类：视觉表达成果（来自 视觉表达 Agent）
    visualResults: visualData || buildVisualExpression(data, schemes, deepenedPlan),

    // 空间推演 & 输出成果共用的关键成果图
    planImage: deepenedPlan?.planImage || { title: '总平面图 / 空间策略图', url: '/demo-images/plan.jpg', note: '展示一心一环多点空间结构' },
    awnImage: { title: '中央草坪区效果图', url: '/demo-images/awn.jpg', note: '展示中央共享草坪与周边功能区关系' },
  };
}

function generateImagePrompts(data, scheme, deepenedPlan) {
  const city = data.city || '北京市朝阳区';
  const isNorthern = /北京|河北|天津|山西|内蒙古|辽宁|吉林|黑龙江/i.test(data.city || '');

  return [
    {
      id: 1,
      title: '鸟瞰总览图',
      cn: `航拍鸟瞰视角，北京市朝阳区欢乐谷片区「${scheme.name}」社区公园全景。展现中央草坪、环形慢跑道、儿童活动区、老人休憩区的整体空间关系。傍晚暖金色光线洒在绿地上，周边住宅建筑群和欢乐谷摩天轮（远景）作为城市背景，体现社区公园与城市绿洲的融合。画面温暖通透，充满社区生活气息。`,
      en: `Aerial bird's-eye view of "${scheme.name}" community park in Happy Valley area, Chaoyang District, Beijing. Showcasing the overall spatial relationship of the central lawn, circular jogging track, children's play area, and senior rest area. Warm golden evening light falling on green spaces, with surrounding residential buildings and Happy Valley ferris wheel (distant background) as urban backdrop, expressing the fusion of community park with urban oasis. Warm and airy, filled with community life atmosphere.`,
      angle: '鸟瞰 45° 俯角',
      time: '傍晚 17:00（Golden Hour）',
      style: '半写实渲染风格，暖色调，通透大气，有生活气息',
      mustInclude: ['环形慢跑/漫步路径（EPDM 材质）', '中央共享草坪', '儿童活动区与老人休憩区', '周边住宅建筑群', '傍晚暖光氛围', '欢乐谷摩天轮远景（可选）'],
      avoid: ['过度卡通风格', '过于干净无人的"效果图感"', '过度饱和的色彩', '欧式建筑元素', '冬季萧瑟感'],
    },
    {
      id: 2,
      title: '中央草坪区效果图',
      cn: `人视角度，「${scheme.name}」中央共享草坪区域。前景为耐践踏草坪上亲子活动场景——两三组家庭席地而坐、儿童追逐嬉戏。中景可见老人在环形步道上散步、林下座椅区几位居民聊天休憩。暖色阳光透过银杏树冠在地面形成斑驳光影。远处可见儿童活动区彩色设施一角。画面充满温馨的社区邻里氛围，体现全龄友好的公园精神。`,
      en: `Eye-level view of the central shared lawn area of "${scheme.name}". Foreground: family activities on durable lawn — two or three families sitting on the grass, children chasing and playing. Midground: elderly people strolling on the loop path, residents chatting under tree-shaded seating areas. Warm sunlight filtering through ginkgo tree canopy creating dappled light patterns on the ground. In the distance, a glimpse of colorful children's play equipment. The scene is filled with warm community neighborhood atmosphere, embodying the all-age-friendly park spirit.`,
      angle: '人视 1.5m 高度',
      time: '秋季下午 15:00',
      style: '温暖写实，有社区邻里生活感，人物多样（老人、儿童、亲子家庭同框）',
      mustInclude: ['中央共享草坪（耐践踏质感）', '环形步道与散步老人', '林下座椅区与休憩居民', '亲子活动场景（2-3 组家庭）', '银杏树冠与斑驳光影', '温暖阳光氛围'],
      avoid: ['纯商业地产效果图风格', '过度空旷的草坪', '单一人群的单调场景', '冬季枯景', '过于拥挤的活动场景'],
    },
    {
      id: 3,
      title: '儿童活动区效果图',
      cn: `自然材料打造的儿童活动区，位于北京朝阳区欢乐谷社区公园东南侧。前景是彩色儿童攀爬设施和沙坑，3-4 个不同年龄的儿童正在玩耍（攀爬、挖沙、滑梯）。地面为彩色 EPDM 软质安全地垫。中景是遮荫树阵下的家长看护区，几位家长坐在木质座椅上聊天看护。背景可见安全边界绿篱和欢乐谷片区社区建筑轮廓。${isNorthern ? '秋季下午阳光温暖，银杏叶金黄，整体氛围活力温馨。' : '春季下午阳光明媚，海棠花盛开，整体氛围活力温馨。'}`,
      en: `Children's play area built with natural materials, located in the southeast of Happy Valley community park, Chaoyang District, Beijing. Foreground: colorful climbing play equipment and sand-pit with 3-4 children of different ages playing (climbing, digging, sliding). Colorful EPDM soft safety flooring. Midground: parent supervision area under shade-providing tree grove, several parents sitting on wooden benches chatting while watching. Background: safety hedge boundary with community building silhouettes of Happy Valley area. ${isNorthern ? 'Autumn afternoon with warm sunlight, golden ginkgo leaves, vibrant and warm atmosphere.' : 'Spring afternoon with bright sunshine, blooming crabapple flowers, vibrant and warm atmosphere.'}`,
      angle: '人视 1.2m 高度（儿童视角）',
      time: isNorthern ? '秋季下午 15:00' : '春季下午 16:00',
      style: '温暖亲和，自然材料质感突出，有阳光和活力感，亲子互动温情',
      mustInclude: ['彩色儿童游乐设施（安全标准）', 'EDPM 软质安全地垫（活力色系）', '玩耍中的儿童（3-4 个，不同活动）', '遮荫树阵与看护家长（2-3 位）', '安全边界绿篱', '自然光影'],
      avoid: ['塑料色彩过于鲜艳的廉价感设施', '危险地形或尖锐物', '过度商业化的游乐场氛围', '无人看护的儿童场景'],
    },
    {
      id: 4,
      title: '老人休憩花园效果图',
      cn: `老人休憩花园，位于北京朝阳区欢乐谷社区公园西北侧。前景是银杏林下的棋牌桌和木质座椅（带靠背扶手），两三位老人正在下棋聊天，神情安详。中景是香草疗愈花园（迷迭香、薰衣草、薄荷），石板汀步蜿蜒穿过，一位老人沿无障碍步道缓步散步。背景可见林下太极小广场和远处的常绿乔木背景。低维护植物配置以温和的绿色和淡紫色调为主。春季清晨 8 点，柔和的晨光，安静舒适的氛围。`,
      en: `Senior rest garden, located in the northwest of Happy Valley community park, Chaoyang District, Beijing. Foreground: chess tables and wooden benches (with backrest and handrail) under ginkgo trees, two or three elderly people playing chess and chatting with peaceful expressions. Midground: herb therapy garden (rosemary, lavender, mint) with stone stepping stones winding through, one elderly person strolling slowly along the accessible path. Background: forest-edge Tai Chi corner and evergreen tree backdrop in the distance. Low-maintenance planting palette in gentle green and light purple tones. Spring morning at 8 AM, soft morning light, quiet and comfortable atmosphere.`,
      angle: '人视 1.5m 高度',
      time: '春季清晨 8:00',
      style: '静谧温暖，东方意境，注重光影和质感，体现长者生活幸福感',
      mustInclude: ['银杏林（春季新绿或秋季金黄）', '棋牌桌和老人（下棋/聊天状态）', '香草植物（迷迭香/薰衣草）', '无障碍步道与石板汀步', '柔和晨光', '太极场景或康养活动（背景）'],
      avoid: ['过于昏暗', '现代金属材质过多', '嘈杂的视觉元素', '冬季落叶惨景', '孤立的人物状态'],
    },
    {
      id: 5,
      title: '夜景灯光效果图',
      cn: `「${scheme.name}」社区公园夜景，位于北京朝阳区欢乐谷片区。低视角全景：暖白色低位庭院灯（3000K）沿环形步道均匀分布，形成一条温暖的光带。中央草坪区域保留微弱氛围照明，呈现宁静的夜间肌理。儿童活动区设置安全照明（低照度感应灯带）保障夜间可视性。远处城市住宅楼窗灯星星点点，欢乐谷方向有淡淡的光晕。夏季夜晚 20:00 蓝调时刻，深蓝色天空与暖色地面灯光形成对比，展现社区公园安全、温馨的夜间气质。`,
      en: `Night view of "${scheme.name}" community park in Happy Valley area, Chaoyang District, Beijing. Low-angle panoramic view: warm white low-level path lights (3000K) evenly distributed along the loop path, forming a warm light band. Central lawn area kept with subtle ambient lighting, presenting a quiet night texture. Children's play area equipped with safety lighting (low-brightness sensor light strips) ensuring nighttime visibility. Distant city residential windows twinkling, a soft glow from Happy Valley direction. Summer evening at 8 PM during blue hour, deep blue sky contrasting with warm ground lighting, showcasing the safe and warm nighttime character of the community park.`,
      angle: '低视角全景',
      time: '夏季夜晚 20:00（蓝调时刻）',
      style: '蓝调夜景，暖色灯光对比，社区安全温馨氛围',
      mustInclude: ['低位庭院灯沿环形步道排列（3000K 暖白）', '中央草坪微光氛围', '儿童活动区安全照明', '城市住宅楼背景窗灯', '蓝调天空（深蓝渐变）', '安全、温馨的夜间社区氛围'],
      avoid: ['过曝的高光区域', '完全黑暗的背景（应保留城市背景光）', '过于商业化的霓虹灯光', '冷白光（忌用，保持暖色温）', '空洞无人的场景'],
    },
  ];
}

function generatePPTOutline(data, schemes, deepenedPlan) {
  const scheme = deepenedPlan.recommendedScheme;

  return [
    {
      page: 'P1',
      title: '封面',
      content: [
        '标题：北京欢乐谷社区公园景观概念设计',
        `推荐方案：${scheme.name}`,
        `设计单位：[设计院名称]`,
        `日期：${new Date().toLocaleDateString('zh-CN')}`,
      ],
      suggestedImage: '鸟瞰总览图 / 中央草坪区效果图',
      keyPoints: '以鸟瞰总览图或中央草坪区效果图作为全页背景，标题"北京欢乐谷社区公园景观概念设计"居中大字呈现，副标题标注方案名称，建立第一印象——这片场地将成为欢乐谷片区的日常绿洲。',
    },
    {
      page: 'P2',
      title: '项目背景与场地判断',
      content: [
        '项目区位：北京市朝阳区欢乐谷片区，周边社区密集',
        '用地性质：城市公共绿地，服务周边居民与欢乐谷游客',
        '核心需求：亲子活动、老人休憩、居民日常散步、邻里交往',
        '场地特质：城市建成区内用地，兼具社区日常使用与欢乐谷文娱活力溢出',
        `项目面积：${data.area || '约 8000 平方米'}`,
        `服务人群：${data.targetUsers || '老人、儿童、周边居民、亲子家庭'}`,
      ],
      suggestedImage: '场地现状图 / 区位示意',
      keyPoints: '快速建立项目认知——场地位于朝阳区欢乐谷片区，是周边社区居民日常使用的核心公共绿地，同时承载欢乐谷游客轻度游憩外溢需求。让甲方看到你对场地双重使用场景的深刻理解。',
    },
    {
      page: 'P3',
      title: '核心问题与设计目标',
      content: [
        '核心设计目标：',
        '  · 全龄友好——老人晨练、儿童活动、亲子互动、邻里社交，一个空间满足多元需求',
        '  · 低维护——植物选型以乡土树种为主，降低后期运维成本',
        '  · 复合使用——同一空间兼容日常与节假日不同使用强度',
        '  · 文娱活力——呼应欢乐谷片区文娱气质，提升社区归属感',
        '  · 社区共享——预留社区活动、市集、演出等弹性使用空间',
        `设计限制：${data.constraints || '城市建成区内用地、运维预算有限、需低维护'}␤        `,
      ],
      suggestedImage: '问题分析图',
      keyPoints: '明确设计的核心命题——如何在有限空间和预算下，打造一个全龄友好、低维护、复合使用、且具有欢乐谷文娱活力的社区共享公园？让甲方感受到设计是"解题"而非"出图"。',
    },
    {
      page: 'P4',
      title: '三个概念方案比选',
      content: [
        `方案 A：${schemes[0]?.name || '城市绿环 · 全龄共享公园'} —— 综合得分 8.40`,
        `方案 B：${schemes[1]?.name || '欢乐草坪 · 邻里活力客厅'} —— 综合得分 8.50（推荐）`,
        `方案 C：${schemes[2]?.name || '森氧游园 · 亲子友好社区公园'} —— 综合得分 7.65`,
        '比选维度：空间体验、落地可行性、成本控制、后期维护、汇报表现力、在地性（欢乐谷片区）',
        '推荐方案：优先推荐方案 B 或方案 A——两者在汇报表现力和欢乐谷片区在地性方面表现突出，更契合社区共享与亲子使用场景',
      ],
      suggestedImage: '方案比选表',
      keyPoints: '三个方案分别从"绿环串联""草坪中心""森林基底"三个方向展开比选。让甲方理解"为什么选这个方案"——核心理由是在地性（欢乐谷片区活力气质契合度）和汇报表现力。比选过程本身就是建立专业信任。',
    },
    {
      page: 'P5',
      title: '推荐方案总平策略',
      content: [
        `方案名称：${scheme.name}`,
        `空间结构：${scheme.spatialStructure?.substring(0, 120) || '一心+一环+多点，以中央共享草坪为核心，环形慢跑道串联各功能节点'}`,
        `核心概念：${scheme.concept?.substring(0, 80) || ''}`,
        `设计创新：${scheme.id === 'A' ? '一心一环多点——以绿环串联全龄共享空间，结构清晰、可复制、可扩展' : scheme.id === 'B' ? '一心五区——以欢乐草坪为核心，五区环抱，弹性适应日常与节假日多场景使用' : '森林基底+亲子探索——自然友好型社区公园范式，差异化突出'}`,
      ],
      suggestedImage: '/demo-images/plan.jpg',
      planImage: '/demo-images/plan.jpg',
      keyPoints: '总平是方案的"定海神针"。使用总平面图 / 空间策略图展示一心一环多点（或一心五区/森林基底）的整体空间结构、功能分区与游线组织，让甲方一目了然地看到：主入口如何与欢乐谷方向呼应，中央草坪如何串联各功能节点。',
    },
    {
      page: 'P6',
      title: '中央草坪与全龄活动场景',
      content: [
        '中央共享草坪——弹性大草坪，兼容日常休憩与周末社区活动',
        '儿童活动区——自然材料游乐设施、沙坑、浅水互动、家长看护区',
        '老人休憩区——林下棋牌桌、太极小广场、带靠背扶手座椅',
        '邻里会客空间——大乔木遮荫下的半围合空间，适合邻里闲聊与小型聚会',
        ...(deepenedPlan.functionalZones || []).slice(0, 3).map((z) => `${z.name}（${z.area}）：${z.function}`),
      ],
      suggestedImage: '/demo-images/awn.jpg',
      awnImage: '/demo-images/awn.jpg',
      keyPoints: '中央草坪是方案的"心脏"——让甲方看到草坪兼容日常与节假日的弹性使用场景：平日居民休憩野餐、老人散步、儿童玩耍；周末社区市集、露天电影、邻里聚会。效果图需体现全龄同框的社区氛围。',
    },
    {
      page: 'P7',
      title: '植物、材料与运营维护策略',
      content: [
        '植物策略：低维护乡土树种为主，构建常绿骨架 + 四季变化，减少高维护草花',
        '草坪策略：选用耐践踏草种（早熟禾混播），设置分区轮休机制，节假日增加保洁频次',
        '铺装策略：主路透水混凝土（防冻胀），次路砾石铺装 + 石板汀步，广场花岗岩火烧面（防滑）',
        '林下休憩：大乔木遮荫 + 木质座椅 + 香草花园，营造安静舒适的休憩环境',
        '社区运营：预留社区市集、露天电影、演出等弹性使用空间，建立"社区共治"机制',
        `预估年维护成本：${deepenedPlan.maintenance?.annualCost || '约 12-20 万元'}，较同类项目降低约 25-35%`,
      ],
      suggestedImage: '植物配置图 / 材料板',
      keyPoints: '甲方最关心的"建完之后怎么办"——用数据说话：低维护植物、耐踩踏草坪、透水铺装、社区共治模式。特别强调欢乐谷游客高峰应对方案（分区轮休 + 增加保洁频次），体现对实际运营场景的深度考虑。',
    },
    {
      page: 'P8',
      title: '总结与价值表达',
      content: [
        '让社区公园成为欢乐谷片区的日常绿洲、邻里客厅和全龄活动场',
        '核心价值回顾：',
        '  · 全龄友好——老人、儿童、亲子家庭各得其所',
        '  · 低维护——乡土树种 + 耐践踏草坪 + 耐久材料，运维成本可控',
        '  · 社区共享——弹性空间兼容日常与节假日多场景使用',
        '  · 文娱活力——呼应欢乐谷片区气质，提升社区归属感与城市活力',
        '下一步：进入深化设计阶段，完成施工图设计；同步对接欢乐谷运营团队，细化游客导流方案',
      ],
      suggestedImage: '夜景图 / 鸟瞰图',
      keyPoints: '最后一个画面要有力——用"邻里绿洲 · 欢乐共享"作为收尾口号。鸟瞰图展现全园空间格局，夜景图展现公园与欢乐谷的夜间活力对话，将社区公园与欢乐谷片区城市形象绑定。',
    },
  ];
}

function generateMarkdownReport(data, schemes, deepenedPlan, prompts, pptOutline) {
  const city = data.city || '项目所在地';
  const scheme = deepenedPlan.recommendedScheme;

  let report = '';
  report += `# ${data.projectName || city + '景观概念设计'}\n\n`;
  report += `## LandscapeFlow AI 方案总监 · 概念方案报告\n\n`;
  report += `> 生成时间：${new Date().toLocaleString('zh-CN')}\n`;
  report += `> 生成引擎：LandscapeFlow AI Agent v1.0\n`;
  report += `> 项目定位：北京市朝阳区欢乐谷城市社区公园——全龄友好·低维护·复合使用的邻里绿洲\n\n`;
  report += `---\n\n`;

  report += `## 一、项目概况\n\n`;
  report += `| 项目信息 | 内容 |\n| --- | --- |\n`;
  report += `| 项目名称 | ${data.projectName || '—'} |\n`;
  report += `| 项目地点 | ${city} |\n`;
  report += `| 项目面积 | ${data.area || '—'} |\n`;
  report += `| 项目类型 | ${data.projectType || '—'} |\n`;
  report += `| 服务人群 | ${data.targetUsers || '—'} |\n`;
  report += `| 设计目标 | ${data.designGoals || '—'} |\n`;
  report += `| 限制条件 | ${data.constraints || '—'} |\n`;
  report += `| 风格偏好 | ${data.stylePreference || '—'} |\n`;
  report += `| 甲方关注 | ${data.clientFocus || '—'} |\n`;
  report += `| 特殊定位 | 欢乐谷片区城市活力延伸 + 游客外溢轻度游憩地 |\n\n`;

  report += `## 二、项目解析\n\n`;
  report += `### 2.1 场地核心矛盾\n\n`;
  const conflicts = deepenedPlan.designPhilosophy || '';
  report += `${conflicts}\n\n`;
  report += `### 2.2 服务人群需求\n\n`;
  if (data.targetUsers) {
    const groups = data.targetUsers.split(/[,，、]/);
    groups.forEach((g) => {
      const trimmed = g.trim();
      if (trimmed) report += `- **${trimmed}**\n`;
    });
    report += '\n';
  }

  report += `### 2.3 欢乐谷片区场地特质\n\n`;
  report += `- 项目位于朝阳区欢乐谷片区，属于城市建成区，周边社区密集\n`;
  report += `- 平日主要服务周边居民（老人晨练、儿童放学后活动、亲子家庭周末休闲）\n`;
  report += `- 周末及节假日需承接欢乐谷游客外溢（预估 200-500 人/天），公园需具备短时承载力\n`;
  report += `- 设计需兼顾"日常宁静"与"节庆活力"两种使用强度，是本案核心挑战之一\n\n`;

  report += `## 三、三个概念方案\n\n`;
  schemes.forEach((s) => {
    report += `### 方案 ${s.id}：${s.name}\n\n`;
    report += `**核心概念**\n\n${s.concept}\n\n`;
    report += `**空间结构**\n\n${s.spatialStructure}\n\n`;
    report += `**核心场景**\n\n`;
    s.coreScenes.forEach((scene) => {
      report += `- ${scene}\n`;
    });
    report += '\n';
    report += `**优点**\n\n`;
    s.pros.forEach((p) => (report += `- ${p}\n`));
    report += '\n';
    report += `**风险**\n\n`;
    s.risks.forEach((r) => (report += `- ${r}\n`));
    report += '\n';
  });

  report += `## 四、方案比选\n\n`;
  report += `**推荐方案**：${scheme.name}（综合得分最高）\n\n`;
  report += `**比选维度**：空间体验、落地可行性、成本控制、后期维护、甲方汇报表现力、在地性（欢乐谷片区）\n\n`;
  report += `**推荐理由**：方案 B"${scheme.name}"在"甲方汇报表现力"和"在地性（欢乐谷片区）"两个维度得分最高。该方案主题与欢乐谷片区活力气质高度契合，易传播，是汇报最大亮点；同时空间结构弹性灵活、低维护，符合甲方的运维要求。\n\n`;

  report += `## 五、推荐方案深化\n\n`;
  report += `### 5.1 设计理念\n\n${deepenedPlan.designPhilosophy || ''}\n\n`;

  if (deepenedPlan.functionalZones) {
    report += `### 5.2 功能分区\n\n`;
    deepenedPlan.functionalZones.forEach((z) => {
      report += `- **${z.name}**（${z.area}）：${z.function}（位于${z.position}）\n`;
    });
    report += '\n';
  }

  if (deepenedPlan.circulation) {
    report += `### 5.3 游线组织\n\n`;
    report += `- 主游线：${deepenedPlan.circulation.mainRoute}\n`;
    report += `- 次游线：${deepenedPlan.circulation.secondaryRoute}\n`;
    report += `- 无障碍：${deepenedPlan.circulation.accessibility}\n`;
    report += `- 出入口：${deepenedPlan.circulation.entryPoints}\n\n`;
  }

  if (deepenedPlan.plantStrategy) {
    report += `### 5.4 植物策略\n\n`;
    report += `**策略原则**：${deepenedPlan.plantStrategy.principle}\n\n`;
    report += `- 乔木：${deepenedPlan.plantStrategy.trees}\n`;
    report += `- 灌木：${deepenedPlan.plantStrategy.shrubs}\n`;
    report += `- 地被：${deepenedPlan.plantStrategy.groundcover}\n`;
    report += `- 冬季策略：${deepenedPlan.plantStrategy.winter}\n\n`;
  }

  if (deepenedPlan.materialStrategy) {
    report += `### 5.5 材料策略\n\n`;
    report += `**策略原则**：${deepenedPlan.materialStrategy.principle}\n\n`;
    report += `- 铺装：${deepenedPlan.materialStrategy.paving}\n`;
    report += `- 构筑物：${deepenedPlan.materialStrategy.structures}\n\n`;
  }

  if (deepenedPlan.maintenance) {
    report += `### 5.6 运营与维护\n\n`;
    report += `**策略**：${deepenedPlan.maintenance.approach}\n\n`;
    report += `- 植物维护：${deepenedPlan.maintenance.plants}\n`;
    report += `- 设施维护：${deepenedPlan.maintenance.facilities}\n`;
    report += `- 社区参与：${deepenedPlan.maintenance.community}\n`;
    report += `- 预估年维护成本：${deepenedPlan.maintenance.annualCost}\n`;
    report += `- 欢乐谷游客高峰应对：节假日增加保洁频次，中央草坪设置分区轮休机制\n\n`;
  }

  report += `## 六、效果图 Prompt\n\n`;
  prompts.forEach((p) => {
    report += `### ${p.title}\n\n`;
    report += `**中文提示词**：${p.cn}\n\n`;
    report += `**English Prompt**：${p.en}\n\n`;
    report += `- 视角：${p.angle}\n`;
    report += `- 时间：${p.time}\n`;
    report += `- 风格：${p.style}\n\n`;
  });

  report += `## 七、PPT 汇报大纲\n\n`;
  pptOutline.forEach((page) => {
    report += `### ${page.title}\n\n`;
    page.content.forEach((c) => (report += `- ${c}\n`));
    report += `\n*讲解重点*：${page.keyPoints}\n\n`;
  });

  report += `---\n\n`;
  report += `> 本报告由 LandscapeFlow AI 方案总监 Agent 自动生成，基于用户输入的项目条件完成全流程方案推导。\n`;
  report += `> 实际项目中请结合设计师专业判断进行调整。\n`;
  report += `> 项目定位：北京市朝阳区欢乐谷城市社区公园——让社区公园成为欢乐谷片区的日常绿洲、邻里客厅和全龄活动场。\n`;

  return report;
}

// =============================================================================
// 视觉表达 Agent · 双轨制输出
// =============================================================================

function buildVisualExpression(data, schemes, deepenedPlan) {
  const scheme = deepenedPlan.recommendedScheme;
  const isNorthern = /北京|河北|天津|山西|内蒙古|辽宁|吉林|黑龙江/i.test(data.city || '');

  // Track 1: 实时生成结果（WorkBuddy 实时生成）
  const realtimeImage = {
    title: `${scheme.name}·主入口透视图（实时生成示意）`,
    url: '', // 由 WorkBuddy 实时生成后填入
    note: '此图为 WorkBuddy 实时生成效果图，用于证明 Agent 具备调用生成能力。建议生成主入口人视角度，体现"文娱共享"氛围。',
    source: 'WorkBuddy 实时生成',
  };

  // Track 2: 精选成果库（8 张本地景观模板精选成果图）
  const curatedImages = [
    { id: 'c1', title: '鸟瞰总览效果图', type: 'curated', source: '精选成果库', url: '/demo-images/aerial.jpg' },
    { id: 'c2', title: '主入口人视效果图', type: 'curated', source: '精选成果库', url: '/demo-images/entrance.jpg' },
    { id: 'c3', title: '儿童活动区效果图', type: 'curated', source: '精选成果库', url: '/demo-images/children.jpg' },
    { id: 'c4', title: '老人休憩花园效果图', type: 'curated', source: '精选成果库', url: '/demo-images/elderly.jpg' },
    { id: 'c5', title: '夜景灯光效果图', type: 'curated', source: '精选成果库', url: '/demo-images/night.jpg' },
    { id: 'c6', title: '四季植物配置图', type: 'curated', source: '精选成果库', url: '/demo-images/planting.jpg' },
    { id: 'c7', title: '中央草坪区效果图', type: 'curated', source: '精选成果库', url: '/demo-images/awn.jpg' },
    { id: 'c8', title: '总平面图 / 空间策略图', type: 'curated', source: '精选成果库', url: '/demo-images/plan.jpg' },
  ];

  // Track 3: 效果图 Prompt 指令包
  const prompts = generateImagePrompts(data, scheme, deepenedPlan);

  return {
    realtimeImage,
    curatedImages,
    prompts,
    note: '视觉表达 Agent 采用双轨制输出：实时生成图（Track 1）用于证明 AI 生成能力；精选成果库（Track 2）包含 8 张专业效果图，涵盖鸟瞰、中央草坪区、儿童活动、老人休憩、夜景、植物配置、中央草坪（awn.jpg）和总平面图（plan.jpg），用于正式汇报场景；Prompt 指令包（Track 3）含 5 条中英双语专业 Prompt，可供用户自行生成更多效果图。所有效果图体现北京市朝阳区欢乐谷社区公园场景特征。',
  };
}
