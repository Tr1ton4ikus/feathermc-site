/* Public settings only. Never put tokens or credentials in this file. */
window.FEATHER_CONFIG = Object.freeze({
  serverAddress: "play.mcfeather.com",
  // Set the numeric ID from Yandex Metrica when the counter is ready.
  // With 0, analytics makes no requests and sets no analytics cookies.
  metrikaCounterId: 0,
  // BlueMap over HTTPS (nginx + Let's Encrypt on the game server); embedded directly in map.html.
  mapDirectUrl: "https://map.mcfeather.com/#world:207:0:820:506:0:0:0:1:flat",
  // Legacy HTTP embed page; not needed now that the map is served over HTTPS.
  mapEmbedUrl: "",
  // Optional HTTPS proxy, ending in /. Leave empty for the embedded HTTP page.
  mapProxyUrl: "",
});
