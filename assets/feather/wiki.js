(() => {
  "use strict";
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const mobile = matchMedia("(max-width: 760px)");
  const sidebar = document.getElementById("wikiSidebar");
  const toggle = document.querySelector(".wiki-sidebar-toggle");
  const layout = document.querySelector(".wiki-layout");
  const main = document.getElementById("mainContent");
  let animation;
  const setOpen = (open, focus = false) => {
    animation?.cancel();
    sidebar.hidden = !open;
    sidebar.inert = !open;
    main.inert = open && mobile.matches;
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute(
      "aria-label",
      open ? "Закрыть список статей" : "Открыть список статей",
    );
    layout.classList.toggle("sidebar-collapsed", !open);
    document.body.classList.toggle("sidebar-open", open && mobile.matches);
    if (open && !reduced.matches && sidebar.animate)
      animation = sidebar.animate(
        [
          { transform: "translateX(-12px)" },
          { transform: "translateX(0)" },
        ],
        { duration: 180, easing: "ease-out" },
      );
    if (focus)
      (open ? document.getElementById("wikiNavSearch") : toggle).focus();
  };
  setOpen(!mobile.matches);
  toggle.addEventListener("click", () => setOpen(sidebar.hidden, true));
  mobile.addEventListener("change", () => setOpen(!mobile.matches));
  reduced.addEventListener("change", () => {
    if (reduced.matches) animation?.cancel();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !sidebar.hidden) {
      setOpen(false, true);
      return;
    }
    if (event.key !== "Tab" || sidebar.hidden || !mobile.matches) return;
    const focusable = [
      toggle,
      ...sidebar.querySelectorAll("a[href],button,input"),
    ].filter((e) => !e.hidden && e.getClientRects().length);
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
