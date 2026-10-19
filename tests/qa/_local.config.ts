import base from "./playwright.config.ts";
export default { ...base, testDir: "/app/repo/tests/qa", use: { ...base.use, launchOptions: { executablePath: "/usr/bin/chromium" } } };
