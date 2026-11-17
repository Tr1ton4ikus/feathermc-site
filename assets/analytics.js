(() => {
  "use strict";
  const id = Number(window.FEATHER_CONFIG?.metrikaCounterId);
  if (!Number.isSafeInteger(id) || id <= 0) return;
  // Use the asynchronous loader recommended by Yandex Metrica.
  window.ym =
    window.ym ||
    function () {
      (window.ym.a = window.ym.a || []).push(arguments);
    };
  window.ym.l = Date.now();
  if (!document.querySelector("script[data-feather-metrika]")) {
    const script = document.createElement("script");
    script.async = true;
    script.src = "https://mc.yandex.ru/metrika/tag.js";
    script.dataset.featherMetrika = "";
    document.head.append(script);
  }
  window.ym(id, "init", {
    clickmap: true,
    trackLinks: true,
    accurateTrackBounce: true,
    webvisor: false,
  });
  // These goal identifiers can be added as JavaScript goals in the counter UI.
  document.addEventListener("feather:copied", () =>
    window.ym(id, "reachGoal", "copy_server"),
  );
  document.addEventListener("click", (event) => {
    const link = event.target.closest("a[href]");
    if (!link) return;
    const url = new URL(link.href, location.href);
    const goal = link.hasAttribute("data-feather-map")
      ? "open_map"
      : url.hostname === "discord.gg"
        ? "open_discord"
        : url.hostname === "feather.trademc.org"
          ? "open_shop"
          : url.origin === location.origin &&
              /\/map(?:\.html|\/)?$/.test(url.pathname)
            ? "open_map"
            : null;
    if (goal) window.ym(id, "reachGoal", goal);
  });
})();
