(function () {
  const main = document.querySelector("main.single-stimulus-shell");
  if (!main || !window.VitaPrototype) return;

  const condition = main.dataset.condition;
  const stage = main.dataset.stage;
  const sceneId = window.VitaPrototype.getCurrentScene();
  const scene = window.VitaPrototype.SCENARIOS[sceneId];

  if (!scene) return;

  document.querySelectorAll("[data-recommendation]").forEach((node) => {
    node.textContent = scene.recommendation;
  });

  if (stage === "task") {
    const explanationLink = document.querySelector(".task-actions a.ghost-btn");
    if (explanationLink) {
      explanationLink.href = window.VitaPrototype.buildSceneUrl(`./stimulus-${condition}.html`, sceneId);
    }
  }

  if (stage === "stimulus") {
    if (condition === "b") {
      const explanationNode = document.querySelector("[data-text-explanation]");
      if (explanationNode) explanationNode.textContent = scene.textExplanation;
    }

    if (condition === "c") {
      const list = document.querySelector("[data-source-list]");
      if (list) {
        list.innerHTML = scene.dataSources
          .map((item) => `<span class="source-chip">${item}</span>`)
          .join("");
      }
    }

    if (condition === "d") {
      document.querySelectorAll("[data-bar-key]").forEach((bar) => {
        const key = bar.dataset.barKey;
        const width = scene.visual.bars[key];
        if (typeof width === "number") {
          bar.style.width = `${width}%`;
        }
      });

      const note = document.querySelector("[data-visual-note]");
      if (note) note.textContent = scene.visual.note;
    }

    const continueLink = document.querySelector(".task-actions a.primary-btn");
    if (continueLink) {
      continueLink.href = window.VitaPrototype.buildSceneUrl(`./proto-${condition}-complete.html`, sceneId);
    }
  }
})();
