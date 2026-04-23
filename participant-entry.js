(function () {
  if (!window.VitaPrototype) return;

  const {
    SURVEY_URLS,
    getConditionName,
    getConditionSequence,
    getCurrentGroup,
    getStartCondition,
    isSingleConditionMode,
    normalizeCondition,
    preserveContextInUrl,
  } = window.VitaPrototype;

  const params = new URLSearchParams(window.location.search);
  const requestedCondition = normalizeCondition(params.get("condition") || "a");
  const group = getCurrentGroup(requestedCondition);
  const sequence = getConditionSequence(group, requestedCondition);
  const startCondition = getStartCondition(group, requestedCondition);
  const isSingleMode = isSingleConditionMode();

  const pretestKey = `vita-progress:${group}:pretest`;
  const pretestOpenedKey = `vita-progress:${group}:pretest-opened`;

  const fallbackLink = document.getElementById("survey-fallback-link");
  const statusEl = document.getElementById("pretest-status");
  const copyEl = document.getElementById("pretest-copy");
  const launchTitleEl = document.getElementById("survey-launch-title");
  const launchCopyEl = document.getElementById("survey-launch-copy");
  const openSurveyBtn = document.getElementById("open-survey-btn");
  const continueBtn = document.getElementById("continue-btn");
  const conditionPill = document.getElementById("condition-pill");

  const targetUrl = preserveContextInUrl(`./proto-${startCondition}-start.html`, {
    condition: startCondition,
    group,
    round: 1,
  });

  let surveyModal = null;

  function writeValue(key, value) {
    try {
      window.sessionStorage.setItem(key, value);
    } catch {}
  }

  function readValue(key) {
    try {
      return window.sessionStorage.getItem(key);
    } catch {
      return null;
    }
  }

  function createSurveyModal() {
    if (surveyModal) return surveyModal;

    const overlay = document.createElement("div");
    overlay.className = "survey-modal";
    overlay.hidden = true;
    overlay.innerHTML = `
      <div class="survey-modal__backdrop" data-close="true"></div>
      <div class="survey-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="survey-modal-title">
        <div class="survey-modal__header">
          <div>
            <strong class="survey-modal__title" id="survey-modal-title">前测问卷</strong>
            <p class="survey-modal__subtitle" id="survey-modal-subtitle">请在当前页面内完成前测。提交成功后关闭面板，并返回本页继续实验。</p>
          </div>
          <button class="survey-modal__close" type="button" aria-label="关闭问卷面板">&times;</button>
        </div>
        <div class="survey-modal__body">
          <iframe class="survey-modal__frame" title="前测问卷面板" loading="eager" referrerpolicy="strict-origin-when-cross-origin"></iframe>
        </div>
        <div class="survey-modal__footer">
          <span class="survey-modal__hint">如果内嵌问卷加载失败，可使用右侧备用链接在新标签页打开。</span>
          <a class="survey-modal__fallback" href="${SURVEY_URLS.pretest}" target="_blank" rel="noopener noreferrer">新标签页打开问卷</a>
        </div>
      </div>
    `;

    overlay.addEventListener("click", function (event) {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (target.dataset.close === "true" || target.classList.contains("survey-modal__close")) {
        closeSurveyModal();
      }
    });

    document.body.appendChild(overlay);

    surveyModal = {
      root: overlay,
      title: overlay.querySelector(".survey-modal__title"),
      subtitle: overlay.querySelector(".survey-modal__subtitle"),
      frame: overlay.querySelector(".survey-modal__frame"),
      fallback: overlay.querySelector(".survey-modal__fallback"),
    };

    return surveyModal;
  }

  function openSurveyModal(config) {
    const modal = createSurveyModal();
    if (!modal.frame || !modal.title || !modal.subtitle || !modal.fallback) return false;

    modal.title.textContent = config.title;
    modal.subtitle.textContent = config.subtitle;
    modal.frame.title = config.title;
    modal.frame.src = config.url;
    modal.fallback.href = config.url;
    modal.root.hidden = false;
    document.body.classList.add("survey-modal-open");
    return true;
  }

  function closeSurveyModal() {
    if (!surveyModal) return;
    surveyModal.root.hidden = true;
    document.body.classList.remove("survey-modal-open");
  }

  function enableContinue(label) {
    if (!continueBtn) return;
    continueBtn.disabled = false;
    continueBtn.classList.remove("is-disabled");
    continueBtn.textContent = label;
  }

  function setPillText() {
    const firstConditionName = getConditionName(sequence[0] || startCondition);
    if (!conditionPill) return;

    conditionPill.textContent = isSingleMode
      ? `单轮 · ${firstConditionName}`
      : `${group.toUpperCase()} 组 · 第 1 轮 · ${firstConditionName}`;
  }

  function setInitialState() {
    if (statusEl) {
      statusEl.textContent = "第一步：请先点击下方按钮，打开前测问卷。";
      statusEl.classList.remove("is-ready");
    }

    if (copyEl) {
      copyEl.textContent = "请先完成前测问卷。提交成功后关闭问卷面板，再继续进入实验。";
    }

    if (launchTitleEl) {
      launchTitleEl.textContent = "前测问卷";
    }

    if (launchCopyEl) {
      launchCopyEl.textContent = "先点击下方按钮打开前测问卷，提交成功后，再点击继续进入实验。";
    }

    if (openSurveyBtn) {
      openSurveyBtn.textContent = "第一步：打开前测问卷";
    }

    if (continueBtn) {
      continueBtn.disabled = true;
      continueBtn.classList.add("is-disabled");
      continueBtn.textContent = "完成前测后，再点击这里进入第 1 轮";
    }

    if (fallbackLink) {
      fallbackLink.textContent = "点此直接打开前测问卷";
    }
  }

  function setOpenedState() {
    if (statusEl) {
      statusEl.textContent = "已打开前测问卷：提交后关闭面板，再点击下方继续。";
      statusEl.classList.add("is-ready");
    }

    if (copyEl) {
      copyEl.textContent = "请在当前页面的问卷面板内完成前测。提交成功后关闭面板，再点击下方继续按钮。";
    }

    enableContinue(isSingleMode ? "我已完成前测，进入本轮实验" : "我已完成前测，进入第 1 轮");
  }

  if (fallbackLink) {
    fallbackLink.href = SURVEY_URLS.pretest;
  }

  if (openSurveyBtn) {
    openSurveyBtn.addEventListener("click", function () {
      const opened = openSurveyModal({
        title: "前测问卷",
        subtitle: "请在当前页面内完成前测。提交成功后关闭面板，并返回本页继续实验。",
        url: SURVEY_URLS.pretest,
      });

      if (!opened && fallbackLink) {
        window.open(fallbackLink.href, "_blank", "noopener,noreferrer");
      }

      writeValue(pretestOpenedKey, "1");
      setOpenedState();
    });
  }

  if (continueBtn) {
    continueBtn.addEventListener("click", function () {
      if (continueBtn.disabled) return;
      writeValue(pretestKey, "done");
      closeSurveyModal();
      window.location.assign(targetUrl);
    });
  }

  window.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      closeSurveyModal();
    }
  });

  setPillText();

  if (readValue(pretestOpenedKey) === "1") {
    setOpenedState();
  } else {
    setInitialState();
  }
})();
