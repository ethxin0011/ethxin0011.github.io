(() => {
  const board = document.querySelector("[data-work-board]");
  const rail = board.querySelector(".work-rail");
  const panels = [...board.querySelectorAll(".work-panel")];
  const toggles = [...board.querySelectorAll("[data-work-toggle]")];
  const panelFor = new Map(panels.map(panel => [panel.id, panel]));
  const labelFor = new Map(toggles.filter(button => button.classList.contains("panel-toggle"))
    .map(button => [button, button.firstElementChild.textContent]));
  const dialog = document.querySelector(".paper-dialog");
  const dialogContent = dialog.querySelector(".paper-dialog-content");
  let active = "";
  let dialogOpener;

  function showSection(id, { updateUrl = false, focusHeading = false } = {}) {
    active = id;
    board.dataset.view = id ? "focused" : "overview";
    for (const panel of panels) {
      const state = !id ? "preview" : panel.id === id ? "expanded" : "folded";
      panel.dataset.state = state;
      panel.querySelector(".panel-content").hidden = state === "folded";
    }

    for (const button of toggles) {
      const expanded = button.dataset.workToggle === id;
      button.setAttribute("aria-expanded", String(expanded));
      if (labelFor.has(button)) {
        button.firstElementChild.textContent = expanded ? "Show overview" : labelFor.get(button);
      }
    }

    if (updateUrl) {
      const hash = id ? `#${id}` : "";
      if (hash !== location.hash) {
        const url = new URL(location.href);
        url.hash = hash;
        history.pushState(null, "", url);
      }
    }

    if (focusHeading) {
      const target = (id ? document.getElementById(`${id}-title`) : null) ?? rail.querySelector("button");
      target.focus({ preventScroll: true });
      (panelFor.get(id) ?? board).scrollIntoView({ block: "start" });
    }
    if (!id) requestAnimationFrame(fitBlogCards);
  }

  function readHash() {
    const id = location.hash.slice(1);
    showSection(panelFor.has(id) ? id : "");
    if (active) panelFor.get(active).scrollIntoView({ block: "start", behavior: "instant" });
  }

  for (const button of toggles) {
    button.addEventListener("click", () => {
      const id = button.dataset.workToggle;
      showSection(id === active ? "" : id, { updateUrl: true, focusHeading: true });
    });
    button.hidden = false;
  }

  for (const link of document.querySelectorAll('.site-header a[href^="#"]')) {
    const id = link.hash.slice(1);
    if (!panelFor.has(id)) continue;
    link.addEventListener("click", event => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      showSection(id, { updateUrl: true, focusHeading: true });
    });
  }

  if (typeof dialog.showModal === "function") {
    for (const thread of board.querySelectorAll(".research-thread")) {
      const grid = document.createElement("div");
      grid.className = "paper-grid";
      for (const paper of thread.querySelectorAll(".paper")) {
        const card = document.createElement("article");
        card.className = "paper-card";
        const heading = document.createElement("h4");
        const button = document.createElement("button");
        button.type = "button";
        button.className = "paper-card-button";
        button.setAttribute("aria-haspopup", "dialog");
        button.textContent = paper.querySelector("h4").textContent;
        heading.append(button);

        const findings = paper.querySelector(".paper-findings").cloneNode(true);
        const links = paper.querySelector(".paper-links").cloneNode(true);
        for (const a of links.querySelectorAll("a")) {
          a.target = "_blank";
          a.rel = "noopener noreferrer";
        }
        card.append(paper.querySelector(".paper-date").cloneNode(true), heading, findings, links);
        grid.append(card);

        button.addEventListener("click", () => {
          showSection("research", { updateUrl: true });
          dialogOpener = button;
          const fullPaper = paper.cloneNode(true);
          const title = document.createElement("h2");
          const methodTitle = document.createElement("h3");
          title.id = "paper-dialog-title";
          title.append(...fullPaper.querySelector("h4").childNodes);
          fullPaper.querySelector("h4").replaceWith(title);
          methodTitle.textContent = fullPaper.querySelector("h5").textContent;
          fullPaper.querySelector("h5").replaceWith(methodTitle);
          dialogContent.replaceChildren(fullPaper);
          dialog.showModal();
          dialog.scrollTop = 0;
        });
      }
      thread.querySelector("h3").after(grid);
    }
    board.classList.add("papers-ready");

    dialog.addEventListener("click", event => {
      if (event.target !== dialog) return;
      const { left, right, top, bottom } = dialog.getBoundingClientRect();
      if (event.clientX < left || event.clientX > right || event.clientY < top || event.clientY > bottom) {
        dialog.close();
      }
    });

    dialog.addEventListener("close", () => {
      dialogOpener?.focus();
    });
  }

  const blogsPanel = panelFor.get("blogs");
  const blogsContent = document.getElementById("blogs-content");

  function fitBlogCards() {
    blogsPanel.style.removeProperty("--blog-title-size");
    blogsPanel.style.removeProperty("--blog-summary-size");
    blogsPanel.style.removeProperty("--blog-img-h");
    if (board.dataset.view !== "overview" || window.innerWidth <= 850) return;
    if (blogsContent.scrollHeight <= blogsContent.clientHeight + 1) return;

    const firstTitle = blogsContent.querySelector(".blog-card h3");
    const firstSummary = blogsContent.querySelector(".blog-summary");
    const firstImg = blogsContent.querySelector(".blog-card-image");
    if (!firstTitle || !firstSummary || !firstImg) return;

    let titlePx = parseFloat(getComputedStyle(firstTitle).fontSize);
    let summaryPx = parseFloat(getComputedStyle(firstSummary).fontSize);
    let imgH = firstImg.getBoundingClientRect().height;

    for (let step = 0; step < 24 && blogsContent.scrollHeight > blogsContent.clientHeight + 1; step++) {
      if (summaryPx > 8.2) summaryPx = Math.max(8.2, summaryPx - 0.3);
      if (titlePx > 9.8) titlePx = Math.max(9.8, titlePx - 0.25);
      if (step >= 6 && imgH > 34) imgH = Math.max(34, imgH - 4);
      blogsPanel.style.setProperty("--blog-summary-size", `${summaryPx.toFixed(2)}px`);
      blogsPanel.style.setProperty("--blog-title-size", `${titlePx.toFixed(2)}px`);
      blogsPanel.style.setProperty("--blog-img-h", `${Math.round(imgH)}px`);
    }
  }

  rail.hidden = false;
  window.addEventListener("hashchange", readHash);
  window.addEventListener("resize", fitBlogCards);
  readHash();
  requestAnimationFrame(fitBlogCards);
})();
