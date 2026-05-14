(() => {
  const containers = document.querySelectorAll(".utility-shell");

  const syncFullscreenState = () => {
    const hasActive = document.querySelector(".utility-stage.is-fullscreen");
    containers.forEach((container) => {
      container.classList.toggle("utility-shell--fullscreen", Boolean(hasActive));
    });
    document.body.classList.toggle("utility-is-fullscreen", Boolean(hasActive));
  };

  containers.forEach((container) => {
    const stage = container.querySelector(".utility-stage");
    const infoPanel = container.querySelector(".utility-info");
    const exitZone = container.querySelector(".utility-fullscreen-exit-zone");
    if (!stage) {
      return;
    }

    if (infoPanel) {
      const setCollapsed = (collapsed) => {
        infoPanel.classList.toggle("is-collapsed", collapsed);
        const toggleBtn = container.querySelector(".utility-toggle");
        if (toggleBtn) {
          toggleBtn.setAttribute("aria-expanded", (!collapsed).toString());
          toggleBtn.textContent = collapsed ? "Show info" : "Hide info";
        }
      };

      setCollapsed(false);
    }

    const exitFullscreen = (targetStage, btn) => {
      targetStage.classList.remove("is-fullscreen");
      if (btn) {
        btn.textContent = "Full screen";
        btn.setAttribute("aria-pressed", "false");
      }
      syncFullscreenState();
    };

    const handleFullscreen = (triggerBtn) => {
      const active = stage.classList.contains("is-fullscreen");
      const fullscreenBtn = triggerBtn ?? container.querySelector(".utility-fullscreen");
      if (active) {
        exitFullscreen(stage, fullscreenBtn);
        stage.scrollIntoView({behavior: "smooth", block: "start"});
        return;
      }

      document.querySelectorAll(".utility-stage.is-fullscreen").forEach((otherStage) => {
        const otherBtn = otherStage.closest(".utility-shell")?.querySelector(".utility-fullscreen");
        exitFullscreen(otherStage, otherBtn);
      });

      stage.classList.add("is-fullscreen");
      if (fullscreenBtn) {
        fullscreenBtn.textContent = "Exit full screen";
        fullscreenBtn.setAttribute("aria-pressed", "true");
      }
      syncFullscreenState();
    };

    container.addEventListener("click", (event) => {
      const toggleBtn = event.target.closest(".utility-toggle");
      if (toggleBtn && infoPanel) {
        const nextState = !infoPanel.classList.contains("is-collapsed");
        infoPanel.classList.toggle("is-collapsed", nextState);
        toggleBtn.setAttribute("aria-expanded", (!nextState).toString());
        toggleBtn.textContent = nextState ? "Show info" : "Hide info";
        return;
      }

      const fullscreenBtn = event.target.closest(".utility-fullscreen");
      if (fullscreenBtn) {
        handleFullscreen(fullscreenBtn);
        return;
      }

      if (exitZone && event.target.closest(".utility-fullscreen-exit-button")) {
        handleFullscreen();
      }
    });
  });
})();
