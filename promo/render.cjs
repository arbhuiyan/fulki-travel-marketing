// Renders promo/index.html frame by frame and pipes it to ffmpeg.
//   node promo/render.cjs stills 1920 1080 outDir 1,5.5,13
//   node promo/render.cjs clicks 1920 1080 clicks.json
//   node promo/render.cjs video  1920 1080 out.mp4 audio.wav
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png' };
const FPS = 30, DUR = 60;

function serve() {
  return new Promise(res => {
    const srv = http.createServer((req, rsp) => {
      const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
      if (!p.startsWith(ROOT) || !fs.existsSync(p)) { rsp.writeHead(404); return rsp.end(); }
      rsp.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' });
      fs.createReadStream(p).pipe(rsp);
    }).listen(0, () => res(srv));
  });
}

(async () => {
  const [mode, w, h, out, extra] = process.argv.slice(2);
  const srv = await serve();
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: +w, height: +h } });
  page.on('pageerror', e => console.error('PAGE ERROR', e));
  await page.goto(`http://localhost:${srv.address().port}/promo/index.html?w=${w}&h=${h}`);
  await page.evaluate(() => window.ready);
  const frame = t => page.evaluate(t => { window.render(t); return document.getElementById('c').toDataURL('image/png'); }, t)
    .then(u => Buffer.from(u.slice(22), 'base64'));

  if (mode === 'stills') {
    fs.mkdirSync(out, { recursive: true });
    for (const t of extra.split(',').map(Number)) fs.writeFileSync(path.join(out, `t${String(t.toFixed(2)).padStart(5, '0')}.png`), await frame(t));
  } else if (mode === 'clicks') {
    fs.writeFileSync(out, JSON.stringify(await page.evaluate(() => window.getClicks())));
  } else if (mode === 'video') {
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
      '-i', extra, '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', String(FPS),
      '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
    const n = FPS * DUR, t0 = Date.now();
    for (let i = 0; i < n; i++) {
      const buf = await frame(i / FPS);
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
      if (i % 150 === 0) console.log(`${out}: frame ${i}/${n} (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
    }
    ff.stdin.end();
    await new Promise(r => ff.on('close', r));
    console.log('done', out);
  }
  await browser.close(); srv.close();
})().catch(e => { console.error(e); process.exit(1); });
