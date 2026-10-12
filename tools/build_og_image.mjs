// Render tools/og-image.html to assets/og-image.png (1200×630), the picture shown in link previews.
// Run: node tools/build_og_image.mjs   (needs Playwright with Chromium)
import { chromium } from "playwright";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.goto(pathToFileURL(path.join(root, "tools/og-image.html")).href);
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: path.join(root, "assets/og-image.png") });
await browser.close();
console.log("wrote assets/og-image.png");
