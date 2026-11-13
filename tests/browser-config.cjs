const fs = require('node:fs');
let chromium;
try { ({ chromium } = require('playwright')); }
catch { ({ chromium } = require('../.qa/node_modules/playwright')); }
const edge = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const executablePath = process.env.BROWSER_PATH || (fs.existsSync(edge) ? edge : undefined);
module.exports = { chromium, launchOptions: { headless: true, ...(executablePath ? { executablePath } : {}) } };
