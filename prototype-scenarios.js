(function () {
  const SCENARIOS = {
    "scene-1": {
      recommendation: "请比平时提前45分钟入睡，并在晚饭后进行20分钟快走。",
      textExplanation:
        "最近睡眠不足、早餐含糖较高且活动量偏低，可能会增加疲劳感和晚间饥饿感。优先改善睡眠并增加轻度活动，是目前最容易开始的第一步。",
      dataSources: ["7天睡眠记录", "早餐问卷", "3天运动记录", "健康指南"],
      visual: {
        bars: { sleep: 82, diet: 68, exercise: 78, stress: 54 },
        note: "当前最需要优先调整的是睡眠和运动。",
      },
    },
    "scene-2": {
      recommendation: "请在起床后1小时内吃一份均衡早餐，并在上午安排10分钟步行。",
      textExplanation:
        "你的睡眠时长基本达标，但早餐规律性不足且活动量偏低，容易在白天出现精力波动。先补齐早餐，再增加一段短时步行，更有助于稳定状态。",
      dataSources: ["起床与睡眠时间", "早餐规律记录", "步数摘要", "营养建议"],
      visual: {
        bars: { sleep: 38, diet: 84, exercise: 58, stress: 42 },
        note: "当前更需要优先修正的是早餐规律和轻度活动。",
      },
    },
    "scene-3": {
      recommendation: "请保持当前睡眠节律，并在晚饭后增加10分钟拉伸来巩固状态。",
      textExplanation:
        "你当前的睡眠、早餐和活动状态相对稳定，因此建议以低负担的维持性调整为主。保持节律一致，再增加一项小幅恢复动作，就足以支持后续状态。",
      dataSources: ["近7天状态摘要", "早餐一致性记录", "活动趋势", "生活方式建议"],
      visual: {
        bars: { sleep: 30, diet: 34, exercise: 44, stress: 36 },
        note: "整体状态较稳，建议优先做低负担的维持性调整。",
      },
    },
  };

  const sleepScores = { short: 2, normal: 1, long: 0 };
  const breakfastScores = { sugary: 2, skipped: 1, balanced: 0 };
  const nextConditionMap = { a: "b", b: "c", c: "d", d: "a" };
  const CONDITION_NAMES = {
    a: "A（无解释）",
    b: "B（文本解释）",
    c: "C（数据来源解释）",
    d: "D（可视化解释）",
  };
  const GROUP_SEQUENCES = {
    g1: ["a", "b", "c", "d"],
    g2: ["b", "c", "d", "a"],
    g3: ["c", "d", "a", "b"],
    g4: ["d", "a", "b", "c"],
  };
  const SURVEY_URLS = {
    pretest: "https://www.credamo.com/answer.html#/s/iEBFNvano/",
    posts: {
      a: "https://www.credamo.com/answer.html#/s/eUv6Nfano/",
      b: "https://www.credamo.com/answer.html#/s/UB3eUfano/",
      c: "https://www.credamo.com/answer.html#/s/22qqYrano/",
      d: "https://www.credamo.com/answer.html#/s/2yIbuyano/",
    },
    final: "https://www.credamo.com/answer.html#/s/nmqIFzano/",
  };

  const normalizeCondition = (value) => {
    const normalized = String(value || "").trim().toLowerCase();
    return CONDITION_NAMES[normalized] ? normalized : "a";
  };

  const normalizeGroup = (value) => {
    const normalized = String(value || "").trim().toLowerCase();
    return GROUP_SEQUENCES[normalized] ? normalized : "";
  };

  const inferGroupFromCondition = (condition) => {
    const normalized = normalizeCondition(condition);
    return { a: "g1", b: "g2", c: "g3", d: "g4" }[normalized] || "g1";
  };

  const readSceneFromUrl = () => {
    const sceneId = new URLSearchParams(window.location.search).get("scene");
    return sceneId && SCENARIOS[sceneId] ? sceneId : null;
  };

  const resolveSceneFromSelections = ({ sleep, breakfast, exercise }) => {
    const score =
      (sleepScores[sleep] ?? 0) +
      (breakfastScores[breakfast] ?? 0) +
      (Number(exercise) <= 1 ? 2 : Number(exercise) === 2 ? 1 : 0);

    if (score >= 5) return "scene-1";
    if (score >= 3) return "scene-2";
    return "scene-3";
  };

  const buildSceneUrl = (relativePath, sceneId) => {
    return preserveContextInUrl(relativePath, { scene: sceneId });
  };

  const preserveContextInUrl = (target, overrides = {}, options = {}) => {
    const url = new URL(target, window.location.href);
    const currentParams = new URLSearchParams(window.location.search);
    const dropKeys = new Set(options.dropKeys || []);

    currentParams.forEach((value, key) => {
      if (!dropKeys.has(key) && !url.searchParams.has(key)) {
        url.searchParams.set(key, value);
      }
    });

    Object.entries(overrides).forEach(([key, value]) => {
      if (value === null || value === undefined || value === "") {
        url.searchParams.delete(key);
      } else {
        url.searchParams.set(key, value);
      }
    });

    return url.toString();
  };

  const getConditionFromPath = () => {
    const match = window.location.pathname.match(/(?:proto|stimulus)-([a-d])-/i);
    return match?.[1]?.toLowerCase() ?? "a";
  };

  const getNextCondition = (condition) => nextConditionMap[condition] ?? "a";

  const isSingleConditionMode = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get("mode") === "single" || params.get("next") === "none";
  };

  const getCurrentGroup = (fallbackCondition = null) => {
    const params = new URLSearchParams(window.location.search);
    const group = normalizeGroup(params.get("group"));
    if (group) return group;

    const conditionFromQuery = params.get("condition");
    if (conditionFromQuery) return inferGroupFromCondition(conditionFromQuery);

    return inferGroupFromCondition(fallbackCondition || getConditionFromPath());
  };

  const getConditionSequence = (group, fallbackCondition = null) => {
    if (isSingleConditionMode()) {
      return [normalizeCondition(fallbackCondition || getConditionFromPath())];
    }

    const resolvedGroup = normalizeGroup(group) || getCurrentGroup(fallbackCondition);
    return GROUP_SEQUENCES[resolvedGroup] || GROUP_SEQUENCES.g1;
  };

  const getStartCondition = (group, fallbackCondition = null) => {
    const sequence = getConditionSequence(group, fallbackCondition);
    return sequence[0] || normalizeCondition(fallbackCondition || "a");
  };

  const getRoundIndex = (condition, group) => {
    const sequence = getConditionSequence(group, condition);
    return sequence.indexOf(normalizeCondition(condition));
  };

  const getNextConditionInSequence = (condition, group) => {
    const sequence = getConditionSequence(group, condition);
    const index = getRoundIndex(condition, group);
    return index >= 0 && index < sequence.length - 1 ? sequence[index + 1] : null;
  };

  const isLastConditionInSequence = (condition, group) => {
    return getNextConditionInSequence(condition, group) === null;
  };

  const getConditionName = (condition) => {
    return CONDITION_NAMES[normalizeCondition(condition)] || CONDITION_NAMES.a;
  };

  const buildSurveyReturnUrl = (fallbackPath, meta = {}) => {
    const params = new URLSearchParams(window.location.search);
    const survey = params.get("survey");
    const url = new URL(survey || fallbackPath, window.location.href);

    if (survey) {
      Object.entries(meta).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== "") {
          url.searchParams.set(key, value);
        }
      });
    }

    return url.toString();
  };

  const setCurrentScene = (sceneId) => {
    try {
      window.sessionStorage.setItem("vita-scene", sceneId);
    } catch {}
  };

  const getCurrentScene = () => {
    const fromUrl = readSceneFromUrl();
    if (fromUrl) {
      setCurrentScene(fromUrl);
      return fromUrl;
    }

    try {
      const stored = window.sessionStorage.getItem("vita-scene");
      if (stored && SCENARIOS[stored]) return stored;
    } catch {}

    return "scene-1";
  };

  window.VitaPrototype = {
    SCENARIOS,
    CONDITION_NAMES,
    GROUP_SEQUENCES,
    SURVEY_URLS,
    buildSurveyReturnUrl,
    getConditionName,
    getConditionSequence,
    getConditionFromPath,
    getCurrentGroup,
    resolveSceneFromSelections,
    buildSceneUrl,
    getNextCondition,
    getNextConditionInSequence,
    getCurrentScene,
    getRoundIndex,
    getStartCondition,
    inferGroupFromCondition,
    isLastConditionInSequence,
    isSingleConditionMode,
    normalizeCondition,
    preserveContextInUrl,
    setCurrentScene,
  };
})();
