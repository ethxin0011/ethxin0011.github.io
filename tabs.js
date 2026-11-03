(() => {
  const tabList = document.getElementById("work-tabs");
  const tabs = [...tabList.querySelectorAll('[role="tab"]')];
  const panels = tabs.map(tab => document.getElementById(tab.getAttribute("aria-controls")));

  function select(tab, updateHash = true) {
    tabs.forEach((candidate, index) => {
      const active = candidate === tab;
      candidate.setAttribute("aria-selected", String(active));
      candidate.tabIndex = active ? 0 : -1;
      panels[index].hidden = !active;
    });
    if (updateHash) {
      history.replaceState(null, "", `#${tab.getAttribute("aria-controls")}`);
    }
  }

  tabs.forEach((tab, index) => {
    panels[index].setAttribute("role", "tabpanel");
    panels[index].setAttribute("aria-labelledby", tab.id);
    panels[index].tabIndex = 0;
    panels[index].querySelector(".panel-heading").hidden = true;
    tab.addEventListener("click", () => select(tab));
    tab.addEventListener("keydown", event => {
      let next;
      if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
      else if (event.key === "ArrowLeft") next = (index + tabs.length - 1) % tabs.length;
      else if (event.key === "Home") next = 0;
      else if (event.key === "End") next = tabs.length - 1;
      else return;
      event.preventDefault();
      select(tabs[next]);
      tabs[next].focus();
    });
  });

  function selectFromHash() {
    const tab = tabs.find(candidate => `#${candidate.getAttribute("aria-controls")}` === location.hash);
    if (tab) select(tab, false);
  }

  document.querySelectorAll('a[href="#research"], a[href="#engineering"]').forEach(link => {
    link.addEventListener("click", event => {
      event.preventDefault();
      const tab = tabs.find(candidate => `#${candidate.getAttribute("aria-controls")}` === link.getAttribute("href"));
      select(tab);
      tabList.scrollIntoView({ block: "start" });
    });
  });

  window.addEventListener("hashchange", selectFromHash);
  select(tabs[0], false);
  selectFromHash();
  document.body.classList.add("tabs-enabled");
  tabList.hidden = false;
})();
