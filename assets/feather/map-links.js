(() => {
  "use strict";
  // Keep the map inside Feather. Only the read-only map page uses HTTP,
  // matching BlueMap; the rest of the site stays on HTTPS.
  if (location.protocol !== "https:" || window.FEATHER_CONFIG?.mapProxyUrl)
    return;
  let map;
  try {
    map = new URL(window.FEATHER_CONFIG?.mapEmbedUrl);
    if (
      !["http:", "https:"].includes(map.protocol) ||
      map.username ||
      map.password
    )
      return;
  } catch {
    return;
  }
  document.querySelectorAll("a[href]").forEach((link) => {
    const url = new URL(link.href, location.href);
    if (
      url.origin !== location.origin ||
      !/\/map(?:\.html|\/)?$/.test(url.pathname)
    )
      return;
    link.href = map.href;
    link.removeAttribute("target");
    link.removeAttribute("rel");
    link.dataset.featherMap = "";
    link.title = "Открыть карту внутри сайта";
  });
})();
