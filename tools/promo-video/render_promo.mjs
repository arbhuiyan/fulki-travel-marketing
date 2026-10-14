// Render tools/promo-video/promo.html to assets/video/fulki-promo-<lang>.mp4 (1080×1920, 30 fps, 15 s).
// Run: node tools/promo-video/render_promo.mjs [--sound alaap|mawwal|callresponse|raga|airport|none|uzunhava|hijaz|bayati] [en|it ...]
//      (needs Playwright with Chromium, ffmpeg, python3 + numpy; the soundtrack variants are described in make_audio.py)
//      node tools/promo-video/render_promo.mjs --stills en 1.5 4 8   (writes PNG stills to /tmp for checking a frame)
import { chromium } from "playwright";
import { spawn, execFileSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { mkdirSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../..");
const FPS = 30, W = 1080, H = 1920;

const args = process.argv.slice(2);
const soundAt = args.indexOf("--sound");
const sound = soundAt >= 0 ? args.splice(soundAt, 2)[1] : "airport";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H } });

async function open(lang) {
  await page.goto(pathToFileURL(path.join(here, "promo.html")).href + "?lang=" + lang);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => [...document.images].every(i => i.complete));
}

if (args[0] === "--stills") {
  const [, lang, ...times] = args;
  await open(lang);
  for (const t of times) {
    await page.evaluate(t => render(t), Number(t));
    const out = path.join(tmpdir(), `fulki-promo-${lang}-${t}.png`);
    await page.screenshot({ path: out });
    console.log("wrote", out);
  }
  await browser.close();
  process.exit(0);
}

const langs = args.length ? args : ["en", "it"];
mkdirSync(path.join(root, "assets/video"), { recursive: true });
for (const lang of langs) {
  await open(lang);
  const work = mkdtempSync(path.join(tmpdir(), "fulki-promo-"));
  const video = path.join(work, "video.mp4");
  const ff = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(FPS), "-i", "-",
    "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p", video], { stdio: ["pipe", "inherit", "inherit"] });
  const done = new Promise((ok, fail) => ff.on("close", c => c ? fail(new Error("ffmpeg exited " + c)) : ok()));

  // per-frame count of flapping cells drives the clicks in the soundtrack
  const flaps = [];
  const seconds = await page.evaluate(() => TIMELINE.end);
  for (let f = 0; f < FPS * seconds; f++) {
    flaps.push(await page.evaluate(t => render(t), f / FPS));
    const png = await page.screenshot({ type: "png" });
    if (!ff.stdin.write(png)) await new Promise(r => ff.stdin.once("drain", r));
  }
  ff.stdin.end();
  await done;

  const cues = path.join(work, "cues.json"), audio = path.join(work, "audio.wav");
  writeFileSync(cues, JSON.stringify({ fps: FPS, seconds, flaps, cuts: await page.evaluate(() => TIMELINE.cuts), land: await page.evaluate(() => LANDED),
    logoFlips: await page.evaluate(() => LOGO_FLAPS.flatMap(f => f.seq.slice(1).map(([at]) => at))) }));
  execFileSync("python3", [path.join(here, "make_audio.py"), cues, audio, sound], { stdio: "inherit" });

  const out = path.join(root, `assets/video/fulki-promo-${lang}.mp4`);
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", video, "-i", audio, "-c:v", "copy", "-c:a", "aac", "-b:a", "160k",
    "-shortest", "-movflags", "+faststart", out], { stdio: "inherit" });
  rmSync(work, { recursive: true });
  console.log("wrote", path.relative(root, out));
}
await browser.close();
