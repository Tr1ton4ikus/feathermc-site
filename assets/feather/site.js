(() => {
  "use strict";
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const animations = new Set();
  const animate = (element, frames, options) => {
    if (reduced.matches || !element.animate) return null;
    const animation = element.animate(frames, options);
    animations.add(animation);
    animation.finished
      .catch(() => {})
      .finally(() => animations.delete(animation));
    return animation;
  };
  reduced.addEventListener("change", () => {
    if (reduced.matches) animations.forEach((animation) => animation.cancel());
  });
  // Preserve URLs shared by the previous static site without shipping its SPA.
  const legacyRoute = () => {
    const hash = location.hash;
    if (hash === "#wiki") location.replace("wiki.html");
    else if (/^#wiki\/[a-z0-9-]+$/.test(hash)) {
      const article = hash.slice(6);
      // Resolve only known articles, never interpolate arbitrary path fragments.
      fetch("assets/wiki-catalog.json")
        .then((response) => {
          if (!response.ok) throw new Error("catalog");
          return response.json();
        })
        .then((docs) =>
          location.replace(
            docs.some((doc) => doc.id === article)
              ? `wiki/${article}.html`
              : "wiki.html",
          ),
        )
        .catch(() => location.replace("wiki.html"));
    } else if (hash === "#map") location.replace("map.html");
    else if (hash === "#join") location.replace("#start");
    else if (hash === "#gradient" || hash === "#top") window.scrollTo(0, 0);
  };
  legacyRoute();
  window.addEventListener("hashchange", legacyRoute);

  const menuButton = document.querySelector(".menu-button");
  const menu = document.querySelector("#mobile-navigation");
  const desktop = matchMedia("(min-width: 761px)");
  let menuAnimation;
  const setMenu = (open, returnFocus = false) => {
    menuAnimation?.cancel();
    menuButton.setAttribute("aria-expanded", String(open));
    menuButton.setAttribute(
      "aria-label",
      open ? "Закрыть меню" : "Открыть меню",
    );
    menuButton
      .querySelector("path")
      .setAttribute(
        "d",
        open ? "m6 6 12 12M6 18 18 6" : "M4 6h16M4 12h16M4 18h16",
      );
    menu.inert = !open;
    if (open) {
      menu.hidden = false;
      menuAnimation = animate(
        menu,
        [
          { opacity: 0, transform: "translateY(-8px)" },
          { opacity: 1, transform: "translateY(0)" },
        ],
        { duration: 180, easing: "ease-out" },
      );
    } else {
      // Hide immediately: a closed menu must not remain keyboard-focusable.
      menu.hidden = true;
      if (returnFocus) menuButton.focus();
    }
  };
  menuButton?.addEventListener("click", () =>
    setMenu(menuButton.getAttribute("aria-expanded") !== "true"),
  );
  menu?.addEventListener("click", (event) => {
    if (event.target.closest("a")) setMenu(false);
  });
  window.addEventListener("keydown", (event) => {
    if (
      event.key === "Escape" &&
      menuButton?.getAttribute("aria-expanded") === "true"
    )
      setMenu(false, true);
  });
  desktop.addEventListener("change", (event) => {
    if (event.matches && menuButton) setMenu(false);
  });

  // Legacy copy stays synchronous inside the tap for HTTP and older iOS.
  const legacyCopy = (address) => {
    const selection = window.getSelection();
    const ranges = selection
      ? Array.from({ length: selection.rangeCount }, (_, index) =>
          selection.getRangeAt(index).cloneRange(),
        )
      : [];
    const active = document.activeElement;
    const input = document.createElement("textarea");
    input.value = address;
    input.readOnly = true;
    input.tabIndex = -1;
    input.setAttribute("aria-label", "Адрес сервера");
    input.style.cssText =
      "position:fixed;top:0;left:0;width:1px;height:1px;padding:0;border:0;opacity:0;font-size:16px;";
    document.body.append(input);
    let copied = false;
    try {
      input.focus({ preventScroll: true });
      input.select();
      input.setSelectionRange(0, input.value.length);
      copied = document.execCommand("copy");
    } catch {
      /* A browser can deny both clipboard mechanisms. */
    } finally {
      input.remove();
      if (active instanceof HTMLElement) active.focus({ preventScroll: true });
      if (selection) {
        selection.removeAllRanges();
        ranges.forEach((range) => selection.addRange(range));
      }
    }
    return copied;
  };
  let copyDialog;
  const manualCopy = (address) => {
    if (!copyDialog) {
      copyDialog = document.createElement("dialog");
      copyDialog.className = "copy-dialog";
      copyDialog.setAttribute("aria-labelledby", "copy-dialog-title");
      copyDialog.innerHTML =
        '<form method="dialog"><h2 id="copy-dialog-title">Адрес сервера</h2><p>Зажми адрес и выбери «Скопировать».</p><label for="copy-manual-address">IP Feather</label><input id="copy-manual-address" type="text" readonly translate="no" spellcheck="false"><button class="button" type="submit">Готово</button></form>';
      document.body.append(copyDialog);
      copyDialog.addEventListener("click", (event) => {
        if (event.target === copyDialog) copyDialog.close();
      });
    }
    const input = copyDialog.querySelector("input");
    input.value = address;
    copyDialog.showModal();
    input.focus();
    input.select();
    input.setSelectionRange(0, address.length);
  };
  document.querySelectorAll(".copy-address").forEach((button) => {
    const value = button.querySelector(".copy-value");
    const original = value.innerHTML;
    const status = button.querySelector('[role="status"]');
    const address =
      window.FEATHER_CONFIG?.serverAddress || "play.mcfeather.com";
    let timer;
    button.addEventListener("click", async () => {
      clearTimeout(timer);
      let copied = false;
      // Run the fallback before yielding when the modern API is unavailable.
      if (!window.isSecureContext || !navigator.clipboard?.writeText)
        copied = legacyCopy(address);
      else {
        try {
          await navigator.clipboard.writeText(address);
          copied = true;
        } catch {
          copied = legacyCopy(address);
        }
      }
      if (copied) {
        value.replaceChildren(document.createTextNode("Скопировано!"));
        value.append(
          button.ownerDocument
            .createRange()
            .createContextualFragment(
              '<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>',
            ),
        );
        status.textContent = "Адрес скопирован в буфер обмена";
        document.dispatchEvent(new Event("feather:copied"));
        animate(
          button,
          [{ transform: "scale(.98)" }, { transform: "scale(1)" }],
          { duration: 150 },
        );
        timer = setTimeout(() => {
          value.innerHTML = original;
          status.textContent = "";
        }, 2500);
      } else {
        status.textContent = "Выдели адрес в открывшемся окне и скопируй его.";
        manualCopy(address);
      }
    });
  });

  const tabs = [...document.querySelectorAll('[role="tab"]')];
  const selectTab = (index, focus = false) => {
    tabs.forEach((tab, i) => {
      const active = i === index;
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
      const panel = document.getElementById(tab.getAttribute("aria-controls"));
      panel
        .getAnimations({ subtree: true })
        .forEach((animation) => animation.cancel());
      panel.hidden = !active;
      if (active)
        animate(
          panel.querySelector(".mode-panel-layout"),
          [{ opacity: 0.7 }, { opacity: 1 }],
          { duration: 200 },
        );
    });
    if (focus) tabs[index].focus();
  };
  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => selectTab(index));
    tab.addEventListener("keydown", (event) => {
      let next;
      if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
      else if (event.key === "ArrowLeft")
        next = (index - 1 + tabs.length) % tabs.length;
      else if (event.key === "Home") next = 0;
      else if (event.key === "End") next = tabs.length - 1;
      else return;
      event.preventDefault();
      selectTab(next, true);
    });
  });

  // Content is visible in HTML; an observer only adds a short entrance once.
  if ("IntersectionObserver" in window && !reduced.matches) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          animate(
            entry.target,
            [
              { opacity: 0.65, transform: "translateY(12px)" },
              { opacity: 1, transform: "translateY(0)" },
            ],
            { duration: 500, easing: "cubic-bezier(.22,1,.36,1)" },
          );
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.15 },
    );
    document
      .querySelectorAll(
        ".hero-copy,.hero-mascot,.hero-connect,.section-heading,.map-card,.world-copy,.start-intro,.join-step",
      )
      .forEach((element) => observer.observe(element));
    window.addEventListener(
      "pagehide",
      () => {
        observer.disconnect();
        animations.forEach((animation) => animation.cancel());
      },
      { once: true },
    );
  }
})();
