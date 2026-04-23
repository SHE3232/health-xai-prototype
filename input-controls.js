(function () {
  const rangeLabels = {
    0: "0次，明显低于推荐水平",
    1: "1次，低于推荐水平",
    2: "2次，接近推荐水平",
    3: "3次，达到推荐水平",
    4: "4次，超过推荐水平",
  };

  const main = document.querySelector("main.single-stimulus-shell");
  const nextLink = document.querySelector(".scenario-next-link");

  const readActiveValue = (field) => {
    const active = document.querySelector(`.choice-row[data-field="${field}"] .choice-btn.active`);
    return active?.dataset.value ?? "";
  };

  const updateRange = (input) => {
    const min = Number(input.min || 0);
    const max = Number(input.max || 100);
    const value = Number(input.value);
    const progress = max === min ? 0 : ((value - min) / (max - min)) * 100;
    input.style.setProperty("--range-progress", `${progress}%`);

    const outputId = input.dataset.rangeOutput;
    const output = outputId ? document.getElementById(outputId) : null;
    if (output) {
      output.textContent = rangeLabels[value] ?? `${value}次`;
    }
  };

  const updateScenarioLink = () => {
    if (!main || !nextLink || !window.VitaPrototype) return;

    const condition = main.dataset.condition;
    const rangeInput = document.querySelector(".range-input");
    const sceneId = window.VitaPrototype.resolveSceneFromSelections({
      sleep: readActiveValue("sleep"),
      breakfast: readActiveValue("breakfast"),
      exercise: Number(rangeInput?.value ?? 1),
    });

    nextLink.href = window.VitaPrototype.buildSceneUrl(`./proto-${condition}-task.html`, sceneId);
    nextLink.dataset.scene = sceneId;
  };

  document.querySelectorAll(".choice-row").forEach((row) => {
    const buttons = [...row.querySelectorAll(".choice-btn")];
    if (!buttons.length) return;

    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        buttons.forEach((item) => {
          item.classList.remove("active");
          item.setAttribute("aria-pressed", "false");
        });

        button.classList.add("active");
        button.setAttribute("aria-pressed", "true");
        updateScenarioLink();
      });
    });
  });

  document.querySelectorAll(".range-input").forEach((input) => {
    updateRange(input);
    input.addEventListener("input", () => {
      updateRange(input);
      updateScenarioLink();
    });
    input.addEventListener("change", () => {
      updateRange(input);
      updateScenarioLink();
    });
  });

  if (nextLink) {
    nextLink.addEventListener("click", () => {
      const sceneId = nextLink.dataset.scene || "scene-1";
      window.VitaPrototype?.setCurrentScene(sceneId);
    });
  }

  updateScenarioLink();
})();
