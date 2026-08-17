(() => {
  const dialog = document.querySelector("#terminal-menu");
  const trigger = document.querySelector("#terminal-menu-trigger");
  const closeButton = document.querySelector("#terminal-close");
  const input = document.querySelector("#terminal-input");
  const status = document.querySelector("#terminal-status");
  const resultsContainer = document.querySelector("#terminal-results");
  const results = Array.from(document.querySelectorAll(".terminal-result"));
  const themeButton = document.querySelector("#theme-toggle");
  const themeLabel = document.querySelector("#theme-label");
  const themes = ["auto", "light", "dark"];
  let visibleResults = [];
  let selectedIndex = 0;

  if (!dialog || !trigger || !input) return;

  const currentTheme = () => localStorage.getItem("theme") || "auto";

  const applyTheme = (theme) => {
    if (theme === "auto") localStorage.removeItem("theme");
    else localStorage.setItem("theme", theme);

    const systemIsDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("dark", theme === "dark" || (theme === "auto" && systemIsDark));
    themeLabel.textContent = theme;
  };

  const setSelected = (index) => {
    if (!visibleResults.length) return;
    selectedIndex = (index + visibleResults.length) % visibleResults.length;
    results.forEach((result) => {
      result.classList.remove("is-selected");
      result.setAttribute("aria-selected", "false");
    });
    const selected = visibleResults[selectedIndex];
    selected.classList.add("is-selected");
    selected.setAttribute("aria-selected", "true");
    selected.scrollIntoView({ block: "nearest" });
  };

  const renderResults = () => {
    const query = input.value.trim().toLocaleLowerCase();
    const isListCommand = query === "ls";
    resultsContainer.classList.toggle("is-ls", isListCommand);

    visibleResults = results.filter((result) => {
      const matches = isListCommand || (query && result.dataset.search.toLocaleLowerCase().includes(query));
      result.hidden = !matches;
      return matches;
    });

    selectedIndex = 0;
    if (!query) status.innerHTML = "type <code>ls</code> to list posts, or search by title";
    else if (!visibleResults.length) status.textContent = `zsh: no posts match “${input.value.trim()}”`;
    else if (isListCommand) status.textContent = "";
    else status.textContent = `${visibleResults.length} match${visibleResults.length === 1 ? "" : "es"}`;

    results.forEach((result) => {
      result.classList.remove("is-selected");
      result.setAttribute("aria-selected", "false");
    });
    if (visibleResults.length) setSelected(0);
  };

  const openDialog = () => {
    dialog.showModal();
    document.body.classList.add("menu-open");
    input.value = "";
    renderResults();
    requestAnimationFrame(() => input.focus());
  };

  const closeDialog = () => {
    dialog.close();
    document.body.classList.remove("menu-open");
    trigger.focus();
  };

  document.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLocaleLowerCase() === "k") {
      event.preventDefault();
      dialog.open ? closeDialog() : openDialog();
    }
  });

  trigger.addEventListener("click", openDialog);
  closeButton.addEventListener("click", closeDialog);
  dialog.addEventListener("cancel", () => document.body.classList.remove("menu-open"));
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) closeDialog();
  });

  input.addEventListener("input", renderResults);
  input.addEventListener("keydown", (event) => {
    const next = event.key === "ArrowDown" || (event.ctrlKey && event.key.toLocaleLowerCase() === "n") || (event.key === "Tab" && !event.shiftKey);
    const previous = event.key === "ArrowUp" || (event.ctrlKey && event.key.toLocaleLowerCase() === "p") || (event.key === "Tab" && event.shiftKey);

    if (next || previous) {
      if (!visibleResults.length) return;
      event.preventDefault();
      setSelected(selectedIndex + (next ? 1 : -1));
    } else if (event.key === "Home" && visibleResults.length) {
      event.preventDefault();
      setSelected(0);
    } else if (event.key === "End" && visibleResults.length) {
      event.preventDefault();
      setSelected(visibleResults.length - 1);
    } else if (event.key === "Enter" && visibleResults.length && input.value.trim().toLocaleLowerCase() !== "ls") {
      event.preventDefault();
      visibleResults[selectedIndex].click();
    }
  });

  results.forEach((result) => {
    result.addEventListener("pointerenter", () => setSelected(visibleResults.indexOf(result)));
  });

  themeButton.addEventListener("click", () => {
    const nextTheme = themes[(themes.indexOf(currentTheme()) + 1) % themes.length];
    applyTheme(nextTheme);
  });

  const colorScheme = window.matchMedia("(prefers-color-scheme: dark)");
  colorScheme.addEventListener("change", () => {
    if (currentTheme() === "auto") applyTheme("auto");
  });

  applyTheme(currentTheme());
})();
