(() => {
  "use strict";
  const frame = document.getElementById("liveMap");
  const status = document.getElementById("mapStatus");
  const retry = document.getElementById("mapRetry");
  const configured = window.FEATHER_CONFIG?.mapProxyUrl;
  if (!configured) return;
  let proxy;
  try {
    proxy = new URL(configured);
    if (proxy.protocol !== "https:" || proxy.username || proxy.password) return;
  } catch {
    return;
  }
  const initialView = "#world:207:0:820:506:0:0:0:1:flat";
  const validView = (hash) => /^#[\w:.,-]{1,300}$/.test(hash);
  let timer;
  const load = () => {
    clearTimeout(timer);
    status.querySelector("h1").textContent = "Открываем мир Feather…";
    status.querySelector("p").textContent =
      "Загружаем постройки, местность и игроков.";
    status.hidden = false;
    frame.hidden = true;
    retry.hidden = true;
    frame.src =
      proxy.href.split("#")[0] +
      (validView(location.hash) ? location.hash : initialView);
    timer = setTimeout(() => {
      status.querySelector("h1").textContent = "Не удалось загрузить карту";
      status.querySelector("p").textContent = "Попробуй ещё раз через минуту.";
      retry.hidden = false;
    }, 20000);
  };
  // The proxy reports readiness and coordinates; cross-origin frame access is avoided.
  window.addEventListener("message", (event) => {
    if (event.origin !== proxy.origin || event.source !== frame.contentWindow)
      return;
    if (event.data?.type !== "feather-map-view") return;
    clearTimeout(timer);
    status.hidden = true;
    frame.hidden = false;
    if (validView(event.data.hash))
      history.replaceState(
        null,
        "",
        location.pathname + location.search + event.data.hash,
      );
  });
  retry.addEventListener("click", load);
  window.addEventListener("hashchange", () => {
    if (validView(location.hash))
      frame.src = proxy.href.split("#")[0] + location.hash;
  });
  window.addEventListener("pagehide", () => clearTimeout(timer), {
    once: true,
  });
  load();
})();
