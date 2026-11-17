(() => {
  "use strict";
  const frame = document.getElementById("liveMap");
  const status = document.getElementById("mapStatus");
  const retry = document.getElementById("mapRetry");
  const directLink = document.getElementById("mapDirect");
  const config = window.FEATHER_CONFIG || {};
  const validView = (hash) => /^#[\w:.,-]{1,300}$/.test(hash);
  const initialView = "#world:207:0:820:506:0:0:0:1:flat";
  let direct, proxy;
  try {
    if (config.mapDirectUrl) {
      direct = new URL(config.mapDirectUrl);
      if (
        !["http:", "https:"].includes(direct.protocol) ||
        direct.username ||
        direct.password
      )
        direct = null;
    }
    if (config.mapProxyUrl) {
      proxy = new URL(config.mapProxyUrl);
      if (proxy.protocol !== "https:" || proxy.username || proxy.password)
        proxy = null;
    }
  } catch {
    return;
  }
  const view = () =>
    validView(location.hash) ? location.hash : direct?.hash || initialView;
  const syncDirect = () => {
    if (!direct) return;
    const url = new URL(direct);
    url.hash = view();
    directLink.href = url.href;
  };
  syncDirect();
  window.addEventListener("hashchange", syncDirect);
  const source = proxy || direct;
  if (!source) return;
  if (location.protocol === "https:" && source.protocol === "http:") {
    // A separate HTTP page on the same public website can frame this HTTP map.
    // A marker prevents loops when a visitor enforces HTTPS-only navigation.
    if (
      config.mapEmbedUrl &&
      !new URL(location.href).searchParams.has("embed")
    ) {
      const embedded = new URL(config.mapEmbedUrl);
      if (
        embedded.protocol === "http:" &&
        ["mcfeather.com", "www.mcfeather.com"].includes(embedded.hostname)
      ) {
        embedded.hash = view();
        location.replace(embedded.href);
      }
    } else {
      status.querySelector("p").textContent =
        "Браузер не разрешил встроенную карту. Можно открыть её напрямую.";
    }
    return;
  }
  if (
    location.protocol === "http:" &&
    ["mcfeather.com", "www.mcfeather.com"].includes(location.hostname)
  ) {
    // Return from the read-only HTTP map to the encrypted main site.
    document.querySelectorAll("a[href]").forEach((link) => {
      const url = new URL(link.href, location.href);
      if (
        url.origin === location.origin &&
        !/\/map(?:\.html|\/)?$/.test(url.pathname)
      ) {
        url.protocol = "https:";
        link.href = url.href;
      }
    });
  }
  let timer;
  const failed = () => {
    clearTimeout(timer);
    frame.hidden = true;
    frame.inert = true;
    status.hidden = false;
    status.querySelector("h1").textContent = "Не удалось загрузить карту";
    status.querySelector("p").textContent =
      "Попробуй ещё раз или открой карту в отдельной вкладке.";
    retry.hidden = false;
  };
  const ready = () => {
    clearTimeout(timer);
    status.hidden = true;
    frame.hidden = false;
    frame.style.visibility = "visible";
    frame.inert = false;
  };
  const load = () => {
    clearTimeout(timer);
    status.querySelector("h1").textContent = "Открываем мир Feather…";
    status.querySelector("p").textContent =
      "Загружаем постройки, местность и игроков.";
    status.hidden = false;
    retry.hidden = true;
    // Keep viewport dimensions for BlueMap/WebGL initialization.
    frame.hidden = false;
    frame.style.visibility = "hidden";
    frame.inert = true;
    frame.src = source.href.split("#")[0] + view();
    timer = setTimeout(failed, 20000);
  };
  if (proxy)
    window.addEventListener("message", (event) => {
      if (event.origin !== proxy.origin || event.source !== frame.contentWindow)
        return;
      if (event.data?.type === "feather-map-error") {
        failed();
        return;
      }
      if (event.data?.type !== "feather-map-view") return;
      ready();
      if (validView(event.data.hash)) {
        history.replaceState(
          null,
          "",
          location.pathname + location.search + event.data.hash,
        );
        syncDirect();
      }
    });
  else frame.addEventListener("load", ready);
  frame.addEventListener("error", failed);
  retry.addEventListener("click", load);
  window.addEventListener("hashchange", () => {
    if (validView(location.hash))
      frame.src = source.href.split("#")[0] + location.hash;
  });
  window.addEventListener("pagehide", () => clearTimeout(timer), {
    once: true,
  });
  load();
})();
