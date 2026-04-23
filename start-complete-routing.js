(function () {
  if (!window.VitaPrototype) return;

  const path = window.location.pathname;

  if (/-start\.html$/i.test(path)) {
    const condition = window.VitaPrototype.getConditionFromPath();
    const startButton = document.querySelector(".primary-btn.action-btn");

    if (startButton) {
      startButton.href = window.VitaPrototype.preserveContextInUrl(`./proto-${condition}-input.html`);
    }
  }
})();
