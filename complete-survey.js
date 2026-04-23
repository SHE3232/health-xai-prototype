(function () {
  if (!window.VitaPrototype) return;

  const main = document.querySelector("main[data-page='post-survey']");
  if (!main) return;

  const {
    SURVEY_URLS,
    getConditionName,
    getCurrentGroup,
    getNextConditionInSequence,
    getRoundIndex,
    isLastConditionInSequence,
    normalizeCondition,
    preserveContextInUrl,
  } = window.VitaPrototype;

  const condition = normalizeCondition(main.dataset.condition || "a");
  const group = getCurrentGroup(condition);
  const roundIndex = getRoundIndex(condition, group);
  const roundNumber = roundIndex >= 0 ? roundIndex + 1 : 1;
  const lastCondition = isLastConditionInSequence(condition, group);
  const nextCondition = getNextConditionInSequence(condition, group);
  const postSurveyUrl = SURVEY_URLS.posts[condition];
  const finalSurveyUrl = SURVEY_URLS.final;

  const postKey = `vita-progress:${group}:post:${condition}`;
  const finalKey = `vita-progress:${group}:final`;
  const postOpenedKey = `vita-progress:${group}:post-opened:${condition}`;
  const finalOpenedKey = `vita-progress:${group}:final-opened`;

  const stageTagEl = document.getElementById("survey-stage-tag");
  const titleEl = document.getElementById("survey-stage-title");
  const copyEl = document.getElementById("survey-stage-copy");
  const statusEl = document.getElementById("survey-stage-status");
  const launchTitleEl = document.getElementById("survey-launch-title");
  const launchCopyEl = document.getElementById("survey-launch-copy");
  const openSurveyBtn = document.getElementById("open-survey-btn");
  const actionBtn = document.getElementById("survey-stage-action");
  const fallbackLink = document.getElementById("survey-fallback-link");
  const conditionPill = document.getElementById("condition-pill");

  let stage = "post";
  let surveyModal = null;

  function writeValue(key, value) {
    try {
      window.sessionStorage.setItem(key, value);
    } catch {}
  }

  function readValue(key) {
    try {
      window.sessionStorage.getItem(key);
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
            <strong class="survey-modal__title" id="survey-modal-title">问卷面板</strong>
            <p class="survey-modal__subtitle" id="survey-modal-subtitle">请在当前页面内完成问卷。提交成功后关闭面板，并返回本页继续实验。</p>
          </div>
          <button class="survey-modal__close" type="button" aria-label="关闭问卷面板">&times;</button>
        </div>
        <div class="survey-modal__body">
          <iframe class="survey-modal__frame" title="问卷面板" loading="eager" referrerpolicy="strict-origin-when-cross-origin"></iframe>
        </div>
        <div class="survey-modal__footer">
          <span class="survey-modal__hint">如果内嵌问卷加载失败，可使用右侧备用链接在新标签页打开。</span>
          <a class="survey-modal__fallback" href="${postSurveyUrl}" target="_blank" rel="noopener noreferrer">新标签页打开问卷</a>
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

  function setActionState(disabled, label) {
    if (!actionBtn) return;
    actionBtn.textContent = label;
    actionBtn.disabled = disabled;
    actionBtn.classList.toggle("is-disabled", disabled);
  }

  function setOpenButtonLabel(label) {
    if (!openSurveyBtn) return;
    openSurveyBtn.textContent = label;
  }

  function setFallbackUrl(url) {
    if (!fallbackLink) return;
    fallbackLink.href = url;
  }

  function showPostPill() {
    if (!conditionPill) return;
    conditionPill.hidden = false;
    conditionPill.textContent = `${group.toUpperCase()} 组 · 第 ${roundNumber} 轮 · ${getConditionName(condition)}`;
  }

  function showFinalPill() {
    if (!conditionPill) return;
    conditionPill.hidden = false;
    conditionPill.textContent = `${group.toUpperCase()} 组 · Final`;
  }

  function markPostOpened() {
    writeValue(postOpenedKey, "1");

    if (statusEl) {
      statusEl.textContent = "已打开本轮后测：提交后关闭面板，再点击下方继续。";
      statusEl.classList.add("is-ready");
    }

    if (copyEl) {
      copyEl.textContent = `你刚完成了条件 ${getConditionName(condition)} 的体验。请在当前页面内完成本轮后测，提交后关闭面板，再继续下一步。`;
    }

    setActionState(false, lastCondition ? "我已完成本轮后测，进入 Final" : "我已完成本轮后测，进入下一轮");
  }

  function markFinalOpened() {
    writeValue(finalOpenedKey, "1");

    if (statusEl) {
      statusEl.textContent = "已打开 Final 问卷：提交后关闭面板，再点击下方完成实验。";
      statusEl.classList.add("is-ready");
    }

    if (copyEl) {
      copyEl.textContent = "你已经完成全部 4 轮体验。请在当前页面内完成 Final 问卷，提交后关闭面板，再点击完成实验。";
    }

    setActionState(false, "我已完成 Final，结束实验");
  }

  function renderPostState() {
    stage = "post";
    showPostPill();

    if (stageTagEl) stageTagEl.textContent = `Round ${roundNumber} 已完成`;
    if (titleEl) titleEl.textContent = "请完成本轮后测";
    if (copyEl) {
      copyEl.textContent = `你刚完成了条件 ${getConditionName(condition)} 的体验。请先点击下方按钮，打开本轮后测。`;
    }
    if (statusEl) {
      statusEl.textContent = "第一步：请先点击下方按钮，打开本轮后测。";
      statusEl.classList.remove("is-ready");
    }
    if (launchTitleEl) {
      launchTitleEl.textContent = "本轮后测问卷";
    }
    if (launchCopyEl) {
      launchCopyEl.textContent = "先点击下方按钮打开本轮后测，提交成功后，再点击继续进入下一步。";
    }

    setFallbackUrl(postSurveyUrl);
    setOpenButtonLabel("第一步：打开本轮后测");
    setActionState(
      true,
      lastCondition ? "完成后测后，再点击这里进入 Final" : "完成后测后，再点击这里进入下一轮"
    );

    if (fallbackLink) {
      fallbackLink.textContent = "点此直接打开当前问卷";
    }

    if (readValue(postOpenedKey) === "1") {
      markPostOpened();
    }
  }

  function renderFinalState() {
    stage = "final";
    showFinalPill();

    if (stageTagEl) stageTagEl.textContent = "四轮体验已完成";
    if (titleEl) titleEl.textContent = "请完成 Final 问卷";
    if (copyEl) {
      copyEl.textContent = "你已经完成全部 4 轮体验。请先点击下方按钮，打开 Final 问卷。";
    }
    if (statusEl) {
      statusEl.textContent = "第一步：请先点击下方按钮，打开 Final 问卷。";
      statusEl.classList.remove("is-ready");
    }
    if (launchTitleEl) {
      launchTitleEl.textContent = "Final 问卷";
    }
    if (launchCopyEl) {
      launchCopyEl.textContent = "先点击下方按钮打开 Final 问卷，提交成功后，再点击下方按钮结束实验。";
    }

    setFallbackUrl(finalSurveyUrl);
    setOpenButtonLabel("第一步：打开 Final 问卷");
    setActionState(true, "完成 Final 后，再点击这里结束实验");

    if (fallbackLink) {
      fallbackLink.textContent = "点此直接打开 Final 问卷";
    }

    if (readValue(finalOpenedKey) === "1") {
      markFinalOpened();
    }
  }

  function goToNextRound() {
    if (!nextCondition) return;

    closeSurveyModal();

    const nextUrl = preserveContextInUrl(`./proto-${nextCondition}-start.html`, {
      condition: nextCondition,
      group,
      round: roundNumber + 1,
    });

    window.location.assign(nextUrl);
  }

  function finishExperiment() {
    closeSurveyModal();

    const endUrl = new URL("./experiment-complete.html", window.location.href);
    endUrl.searchParams.set("group", group);
    window.location.assign(endUrl.toString());
  }

  if (openSurveyBtn) {
    openSurveyBtn.addEventListener("click", function () {
      if (stage === "post") {
        const opened = openSurveyModal({
          title: `条件 ${getConditionName(condition)} 后测`,
          subtitle: "请在当前页面内完成本轮后测。提交成功后关闭面板，并返回本页继续。",
          url: postSurveyUrl,
        });

        if (!opened && fallbackLink) {
          window.open(fallbackLink.href, "_blank", "noopener,noreferrer");
        }

        markPostOpened();
        return;
      }

      if (stage === "final") {
        const opened = openSurveyModal({
          title: "Final 问卷",
          subtitle: "请在当前页面内完成 Final 问卷。提交成功后关闭面板，并返回本页完成实验。",
          url: finalSurveyUrl,
        });

        if (!opened && fallbackLink) {
          window.open(fallbackLink.href, "_blank", "noopener,noreferrer");
        }

        markFinalOpened();
      }
    });
  }

  if (actionBtn) {
    actionBtn.addEventListener("click", function () {
      if (actionBtn.disabled) return;

      if (stage === "post") {
        writeValue(postKey, "done");
        if (lastCondition) {
          renderFinalState();
        } else {
          goToNextRound();
        }
        return;
      }

      if (stage === "final") {
        writeValue(finalKey, "done");
        finishExperiment();
      }
    });
  }

  window.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      closeSurveyModal();
    }
  });

  renderPostState();
})();
