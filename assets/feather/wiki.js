(() => {
  "use strict";
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const mobile = matchMedia("(max-width: 760px)");
  const sidebar = document.getElementById("wikiSidebar");
  const toggle = document.querySelector(".wiki-sidebar-toggle");
  const layout = document.querySelector(".wiki-layout");
  const main = document.getElementById("mainContent");
  let isOpen = !mobile.matches;
  let animation;
  let contentAnimation;
  let revision = 0;
  const setOpen = (open, focus = false, immediate = false) => {
    // Read the current visual position before cancelling, so rapid reversals
    // continue from the frame already on screen instead of jumping to an edge.
    const closedTransform = `translateX(calc(-100% - ${mobile.matches ? 0 : Math.max(0, (innerWidth - 1800) / 2)}px))`;
    const sidebarTransform = sidebar.hidden
      ? closedTransform
      : getComputedStyle(sidebar).transform;
    const contentLeft = main.getBoundingClientRect().left;
    animation?.cancel();
    contentAnimation?.cancel();
    const ownRevision = ++revision;
    isOpen = open;
    sidebar.hidden = false;
    sidebar.inert = !open;
    main.inert = open && mobile.matches;
    toggle.setAttribute("aria-expanded", String(open));
    const label = open ? "Закрыть список статей" : "Открыть список статей";
    toggle.setAttribute("aria-label", label);
    toggle.title = label;
    layout.classList.toggle("sidebar-collapsed", !open);
    document.body.classList.toggle("sidebar-open", open && mobile.matches);
    if (focus || (!open && sidebar.contains(document.activeElement)))
      (open ? document.getElementById("wikiNavSearch") : toggle).focus({
        preventScroll: true,
      });
    const finish = () => {
      if (revision !== ownRevision) return;
      sidebar.hidden = !isOpen;
      animation?.cancel();
      contentAnimation?.cancel();
      animation = contentAnimation = undefined;
    };
    if (immediate || reduced.matches || !sidebar.animate) {
      finish();
      return;
    }
    const timing = {
      duration: 280,
      easing: "cubic-bezier(.22,1,.36,1)",
      fill: "both",
    };
    animation = sidebar.animate(
      [
        { transform: sidebarTransform },
        { transform: open ? "translateX(0)" : closedTransform },
      ],
      timing,
    );
    // FLIP the article's position with transform; no width/layout tween.
    if (!mobile.matches) {
      const offset = contentLeft - main.getBoundingClientRect().left;
      contentAnimation = main.animate(
        [
          { transform: `translateX(${offset}px)` },
          { transform: "translateX(0)" },
        ],
        timing,
      );
    }
    animation.finished.then(finish).catch(() => {});
  };
  setOpen(isOpen, false, true);
  toggle.addEventListener("click", () => setOpen(!isOpen, true));
  mobile.addEventListener("change", () =>
    setOpen(!mobile.matches, false, true),
  );
  // Reflow changes during a transition should settle, not leave stale offsets.
  window.addEventListener("resize", () => {
    if (animation || contentAnimation) setOpen(isOpen, false, true);
  });
  reduced.addEventListener("change", () => setOpen(isOpen, false, true));
  window.addEventListener("pagehide", () => {
    animation?.cancel();
    contentAnimation?.cancel();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && isOpen) {
      setOpen(false, true);
      return;
    }
    if (event.key !== "Tab" || !isOpen || !mobile.matches) return;
    const focusable = [
      toggle,
      ...sidebar.querySelectorAll("a[href],button,input"),
    ].filter((element) => !element.hidden && element.getClientRects().length);
    const first = focusable[0],
      last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
  const normalize = (value) =>
    value
      .toLocaleLowerCase("ru")
      .replace(/ё/g, "е")
      .replace(/\s+/g, " ")
      .trim();
  const cards = [...document.querySelectorAll("#wikiGrid .card")];
  const sideCards = [...sidebar.querySelectorAll(".card")];
  const corpus = new Map(
    sideCards.map((card) => [card.dataset.id, normalize(card.textContent)]),
  );
  const search = document.getElementById("search");
  const navSearch = document.getElementById("wikiNavSearch");
  const topics = [...document.querySelectorAll(".topic")];
  let category = "";
  const matches = (card, query) =>
    query
      .split(" ")
      .filter(Boolean)
      .every((word) => corpus.get(card.dataset.id)?.includes(word));
  const update = () => {
    let count = 0;
    cards.forEach((card) => {
      card.hidden =
        !matches(card, normalize(search?.value || "")) ||
        (category && card.dataset.category !== category);
      if (!card.hidden) count++;
    });
    if (search) {
      document.getElementById("searchStatus").textContent =
        `Найдено статей: ${count}`;
      document.getElementById("searchEmpty").hidden = count !== 0;
    }
    let navCount = 0;
    sideCards.forEach((card) => {
      card.hidden = !matches(card, normalize(navSearch.value));
      if (!card.hidden) navCount++;
    });
    document.getElementById("wikiNavEmpty").hidden = navCount !== 0;
  };
  search?.addEventListener("input", update);
  navSearch.addEventListener("input", update);
  topics.forEach((button) =>
    button.addEventListener("click", () => {
      category = button.dataset.category;
      topics.forEach((topic) => {
        topic.setAttribute("aria-pressed", String(topic === button));
        topic.classList.toggle("active", topic === button);
      });
      update();
    }),
  );
  document.getElementById("resetSearch")?.addEventListener("click", () => {
    search.value = "";
    topics[0].click();
    search.focus();
  });
  const assetRoot = new URL(
    "../",
    document.querySelector('script[src$="assets/feather/wiki.js"]').src,
  );
  fetch(new URL("wiki-catalog.json", assetRoot))
    .then((response) => {
      if (!response.ok) throw new Error("catalog");
      return response.json();
    })
    .then((docs) => {
      docs.forEach((doc) => {
        const text = new DOMParser().parseFromString(doc.html, "text/html").body
          .textContent;
        corpus.set(
          doc.id,
          normalize(`${doc.title} ${doc.desc} ${doc.cat} ${text}`),
        );
      });
      update();
    })
    .catch(() => {
      /* Title search and static pages remain available. */
    });
  const toc = document.getElementById("articleToc");
  if (toc) {
    document
      .querySelectorAll(".article-content h2,.article-content h3")
      .forEach((heading, index) => {
        if (!heading.id) heading.id = `section-${index + 1}`;
        const li = document.createElement("li");
        const link = document.createElement("a");
        link.href = `#${heading.id}`;
        link.textContent = heading.textContent;
        li.append(link);
        toc.append(li);
      });
    if (!toc.children.length) toc.closest("details").hidden = true;
  }
})();
