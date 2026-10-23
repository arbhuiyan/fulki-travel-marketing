// Render reels (tools/reels/reel.html + reels/<name>.js) to assets/video/reels/fulki-<name>-<lang>.mp4
// (1080×1920, 30 fps, with a synthesized soundtrack from make_audio.py).
// Run: node tools/reels/render_reel.mjs <name|all> [en|it ...]      languages default to the reel's own
//      node tools/reels/render_reel.mjs <name> --stills en 1.5 6 12   PNG stills in /tmp, to check frames
// Needs Playwright with Chromium, ffmpeg and python3 + numpy.
import { chromium } from "playwright";
import { spawn, execFileSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { mkdirSync, writeFileSync, mkdtempSync, rmSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../..");
const FPS = 30, W = 1080, H = 1920;
const outDir = path.join(root, "assets/video/reels");

const [which, ...args] = process.argv.slice(2);
if (!which) { console.error("usage: render_reel.mjs <name|all> [langs] | <name> --stills <lang> <t...>"); process.exit(1); }
const names = which === "all" ? readdirSync(path.join(here, "reels")).filter(f => f.endsWith(".js")).map(f => f.slice(0, -3)) : [which];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H } });

async function open(name, lang) {
  await page.goto(pathToFileURL(path.join(here, "reel.html")).href + `?reel=${name}&lang=${lang}`);
  // load every face up front, so text that only appears late in the reel is never drawn in a fallback font
  await page.evaluate(() => Promise.all([...document.fonts].map(f => f.load().catch(() => {}))));
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => [...document.images].every(i => i.complete));
}

if (args[0] === "--stills") {
  const [, lang, ...times] = args;
  await open(names[0], lang);
  for (const t of times) {
    await page.evaluate(t => render(t), Number(t));
    const out = path.join(tmpdir(), `fulki-${names[0]}-${lang}-${t}.png`);
    await page.screenshot({ path: out });
    console.log("wrote", out);
  }
  await browser.close();
  process.exit(0);
}

mkdirSync(outDir, { recursive: true });
for (const name of names) {
  await open(name, "en");
  const langs = args.length ? args : await page.evaluate(() => TIMELINE.langs);
  for (const lang of langs) {
    await open(name, lang);
    const tl = await page.evaluate(() => TIMELINE);
    const work = mkdtempSync(path.join(tmpdir(), "fulki-reel-"));
    const video = path.join(work, "video.mp4");
    const ff = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(FPS), "-i", "-",
      "-c:v", "libx264", "-preset", "slow", "-crf", String(tl.crf), "-pix_fmt", "yuv420p", video], { stdio: ["pipe", "inherit", "inherit"] });
    const done = new Promise((ok, fail) => ff.on("close", c => c ? fail(new Error("ffmpeg exited " + c)) : ok()));
    for (let f = 0; f < FPS * tl.seconds; f++) {
      await page.evaluate(t => render(t), f / FPS);
      const png = await page.screenshot({ type: "png" });
      if (!ff.stdin.write(png)) await new Promise(r => ff.stdin.once("drain", r));
    }
    ff.stdin.end();
    await done;

    const cues = path.join(work, "cues.json"), audio = path.join(work, "audio.wav");
    writeFileSync(cues, JSON.stringify({ seconds: tl.seconds, music: tl.music, end: tl.end, cues: tl.cues }));
    execFileSync("python3", [path.join(here, "make_audio.py"), cues, audio], { stdio: "inherit" });

    const out = path.join(outDir, `fulki-${name}-${lang}.mp4`);
    execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", video, "-i", audio, "-c:v", "copy", "-c:a", "aac", "-b:a", "160k",
      "-shortest", "-movflags", "+faststart", out], { stdio: "inherit" });
    rmSync(work, { recursive: true });
    console.log("wrote", path.relative(root, out));
  }
}
await browser.close();
