// Render logo-flip.html to assets/video/fulki-logo-flip.mp4 (1080×1080, 60 fps, with flip sounds).
// Run: node tools/logo-video/build.mjs   (needs Playwright with Chromium, ffmpeg, python3 + numpy)
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const FPS = 60;
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../..");
const out = path.join(root, "assets/video/fulki-logo-flip.mp4");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "fulki-video-"));

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1080 } });
await page.goto(pathToFileURL(path.join(here, "logo-flip.html")).href);
await page.evaluate(() => document.fonts.load("700 40px Outfit"));
const { duration, events } = await page.evaluate(() => ({ duration: window.DUR, events: window.EVENTS }));
const frames = Math.round(duration * FPS);
for (let f = 0; f < frames; f++) {
  await page.evaluate((t) => window.render(t), f / FPS);
  await page.locator("#stage").screenshot({ path: path.join(tmp, `f${String(f).padStart(4, "0")}.png`) });
}
await browser.close();

fs.writeFileSync(path.join(tmp, "events.json"), JSON.stringify({ duration, events }));
execFileSync("python3", [path.join(here, "flip_sound.py"), path.join(tmp, "events.json"), path.join(tmp, "sound.wav")], { stdio: "inherit" });

fs.mkdirSync(path.dirname(out), { recursive: true });
execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-framerate", String(FPS), "-i", path.join(tmp, "f%04d.png"),
  "-i", path.join(tmp, "sound.wav"), "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p",
  "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", "-shortest", out], { stdio: "inherit" });
fs.rmSync(tmp, { recursive: true });
console.log(`wrote ${path.relative(root, out)} (${frames} frames)`);
