(() => {
  "use strict";
  // An HTTP BlueMap cannot be framed by an HTTPS Pages document. Link to its
  // full page instead; regular navigation opens it without mixed-content errors.
  if (location.protocol !== "https:" || window.FEATHER_CONFIG?.mapProxyUrl)
    return;
  let map;
  try {
    map = new URL(window.FEATHER_CONFIG?.mapDirectUrl);
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
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.dataset.featherMap = "";
    link.title = "Открыть живую карту в новой вкладке";
  });
})();
