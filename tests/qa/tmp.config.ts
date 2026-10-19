import base from "./playwright.config";
export default { ...base, use: { ...base.use, launchOptions: { executablePath: "/usr/bin/chromium", args: ["--no-sandbox"] } } };
