/**
 * 퍼블리싱 작업물 검증 스크립트
 *
 * 사용법 (저장소 루트에서):
 *   cd tools/verify && npm install && npx playwright install chromium
 *   npm run verify                 # html-validate + axe-core
 *   npm run verify:lighthouse      # 위 두 가지 + Lighthouse (대표 화면)
 *   node verify.mjs --project growlog --chrome /path/to/chrome
 *   node verify.mjs --render       # 측정 없이 report.json → index.html 만 다시 만들기
 *
 * 결과: reports/<project>/report.json, reports/<project>/index.html
 * 측정일 · 도구 버전 · 검사 조건 · 화면별 결과를 함께 기록합니다.
 */
import { createServer } from 'node:http';
import { readFile, readdir, writeFile, mkdir, stat } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { extname, join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import os from 'node:os';

const require = createRequire(import.meta.url);
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2);
const arg = (name) => { const i = args.indexOf(name); return i === -1 ? null : args[i + 1]; };
const WITH_LIGHTHOUSE = args.includes('--lighthouse');
const CHROME = arg('--chrome') || process.env.CHROME_PATH || undefined;
const ONLY = arg('--project');

const PROJECTS = {
  growlog: { name: 'GrowLog 리디자인', dir: 'projects/growlog/publishing', lighthouse: ['index.html', 'dashboard.html'] },
  waylog: { name: 'WayLog 리디자인', dir: 'projects/waylog/publishing', lighthouse: ['index.html', 'destinations.html'] },
  // Aulo: 정적 브랜드 랜딩 + 해시 라우터 웹앱(빌드본). 웹앱은 화면 주소(#/...)마다 검사하고, 로그인이 필요한 화면은 데모 계정으로 로그인한 뒤 검사한다.
  aulo: {
    name: 'Aulo 공간 예약 · 주문', dir: 'projects/aulo',
    // 원본 배포 구조와 같게: publishing/ = 브랜드 랜딩, publishing/app/ = 웹앱 빌드
    files: ['publishing/index.html', 'publishing/app/index.html'],
    app: {
      entry: 'publishing/app/index.html',
      routes: [
        ['/'], ['/recommend'], ['/order'], ['/menu/americano'], ['/info'], ['/notice'], ['/login'], ['/signup'],
        ['/', true], ['/reserve', true], ['/reserve/focus', true], ['/my', true], ['/my/reservations', true], ['/my/orders', true], ['/my/coupons', true],
      ],
      login: async (page, appUrl) => {
        await page.goto(`${appUrl}#/login`, { waitUntil: 'load' });
        await page.getByRole('button', { name: '채우기' }).click();
        await page.locator('form').getByRole('button', { name: '로그인', exact: true }).click();
        await page.waitForTimeout(800);
      },
    },
    lighthouse: ['publishing/index.html'],
  },
};
const VIEWPORTS = [
  { id: 'desktop', label: '데스크톱 1280×800', width: 1280, height: 800 },
  { id: 'mobile', label: '모바일 375×812', width: 375, height: 812, isMobile: true, hasTouch: true },
];
const SCHEMES = ['light', 'dark'];
const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];

const version = (m) => require(`${m}/package.json`).version;

/* ---------- 정적 서버 ---------- */
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2', '.mp4': 'video/mp4', '.webm': 'video/webm', '.ico': 'image/x-icon' };
const startServer = () => new Promise((ok) => {
  const server = createServer(async (req, res) => {
    try {
      let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      let file = join(ROOT, path);
      if (!file.startsWith(ROOT)) throw new Error('outside');
      if ((await stat(file)).isDirectory()) file = join(file, 'index.html');
      res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream' });
      res.end(await readFile(file));
    } catch { res.writeHead(404); res.end('not found'); }
  });
  server.listen(0, '127.0.0.1', () => ok(server));
});

/* ---------- html-validate ---------- */
const runHtmlValidate = async (files) => {
  const { HtmlValidate } = require('html-validate');
  const hv = new HtmlValidate({ extends: ['html-validate:recommended'] });
  const out = [];
  for (const f of files) {
    const report = await hv.validateFile(join(ROOT, f));
    const msgs = report.results.flatMap((r) => r.messages);
    out.push({
      file: f,
      errors: msgs.filter((m) => m.severity === 2).length,
      warnings: msgs.filter((m) => m.severity === 1).length,
      messages: msgs.map((m) => ({ rule: m.ruleId, severity: m.severity === 2 ? 'error' : 'warning', line: m.line, message: m.message })),
    });
  }
  return out;
};

/* ---------- axe-core ---------- */
// targets: [{ id, path, login? }] — path는 저장소 루트 기준 주소(해시 포함 가능)
const runAxe = async (base, targets, login) => {
  const { chromium } = require('playwright');
  const axeSource = await readFile(require.resolve('axe-core/axe.min.js'), 'utf8');
  const browser = await chromium.launch(CHROME ? { executablePath: CHROME } : {});
  const out = [];
  for (const t of targets) {
    for (const vp of VIEWPORTS) {
      for (const scheme of SCHEMES) {
        const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: !!vp.isMobile, hasTouch: !!vp.hasTouch, colorScheme: scheme });
        const page = await ctx.newPage();
        const consoleErrors = [];
        page.on('pageerror', (e) => consoleErrors.push(e.message));
        if (t.login) await login(page, `${base}/${t.path.split('#')[0]}`);
        await page.goto(`${base}/${t.path}`, { waitUntil: 'load' });
        await page.waitForTimeout(1500);
        // 스크롤 등장 효과가 끝난 상태로 검사 (페이지 끝까지 내렸다가 위로)
        await page.evaluate(async () => {
          for (let y = 0; y < document.documentElement.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); }
          window.scrollTo(0, 0);
        });
        await page.waitForTimeout(1200);
        await page.addScriptTag({ content: axeSource });
        const result = await page.evaluate(async (tags) => {
          const r = await window.axe.run(document, { runOnly: { type: 'tag', values: tags }, resultTypes: ['violations'] });
          return r.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.length, targets: v.nodes.slice(0, 5).map((n) => n.target.join(' ')) }));
        }, AXE_TAGS);
        const hscroll = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
        out.push({ file: t.id, viewport: vp.id, scheme, violations: result, horizontalScroll: hscroll, pageErrors: consoleErrors });
        await ctx.close();
      }
    }
  }
  await browser.close();
  return out;
};

/* ---------- Lighthouse (선택) ---------- */
const runLighthouse = async (base, files) => {
  const lighthouse = (await import('lighthouse')).default;
  const chromeLauncher = await import('chrome-launcher');
  const chromePath = CHROME || require('playwright').chromium.executablePath();
  const out = [];
  for (const f of files) {
    for (const formFactor of ['mobile', 'desktop']) {
      const chrome = await chromeLauncher.launch({ chromePath, chromeFlags: ['--headless=new', '--no-sandbox'] });
      const config = formFactor === 'desktop' ? (await import('lighthouse/core/config/desktop-config.js')).default : undefined;
      const r = await lighthouse(`${base}/${f}`, { port: chrome.port, output: 'json', logLevel: 'error', onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'] }, config);
      const c = r.lhr.categories; const a = r.lhr.audits;
      out.push({
        file: f, formFactor,
        scores: Object.fromEntries(Object.entries(c).map(([k, v]) => [k, Math.round(v.score * 100)])),
        lcp: a['largest-contentful-paint']?.displayValue, cls: a['cumulative-layout-shift']?.displayValue, tbt: a['total-blocking-time']?.displayValue,
        throttling: r.lhr.configSettings.throttlingMethod,
      });
      await chrome.kill();
    }
  }
  return out;
};

/* ---------- 보고서 ---------- */
const kst = (iso) => new Date(iso).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }) + ' (KST)';
const esc = (s = '') => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const htmlReport = (r) => `<!DOCTYPE html>
<html lang="ko"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(r.project)} 검증 보고서</title>
<style>
body{font-family:system-ui,-apple-system,"Apple SD Gothic Neo","Malgun Gothic",sans-serif;max-width:960px;margin:0 auto;padding:32px 16px;color:#17181c;line-height:1.6}
h1{font-size:1.75rem}h2{margin-top:2rem;font-size:1.25rem;border-top:2px solid #17181c;padding-top:.75rem}
table{width:100%;border-collapse:collapse;font-size:.875rem;margin-top:.5rem}th,td{border-bottom:1px solid #ddd;padding:6px 8px;text-align:left;vertical-align:top}
th{background:#f4f4f5}.ok{color:#15803d;font-weight:700}.bad{color:#b91c1c;font-weight:700}code{font-size:.85em}
dl{display:grid;grid-template-columns:max-content 1fr;gap:4px 16px}dt{font-weight:700}
@media (prefers-color-scheme:dark){body{background:#111;color:#eee}th{background:#222}th,td{border-color:#333}.ok{color:#4ade80}.bad{color:#f87171}h2{border-color:#eee}}
</style></head><body>
<h1>${esc(r.project)} 검증 보고서</h1>
<dl>
<dt>측정일</dt><dd><time datetime="${esc(r.measuredAt)}">${esc(kst(r.measuredAt))}</time></dd>
<dt>도구</dt><dd>${Object.entries(r.tools).map(([k, v]) => `${esc(k)} ${esc(v)}`).join(' · ')}</dd>
<dt>환경</dt><dd>${esc(r.environment)}</dd>
<dt>대상</dt><dd>${r.pages.length}개 화면 (<code>${esc(r.dir)}</code>)</dd>
<dt>조건</dt><dd>${r.conditions.map(esc).join('<br>')}</dd>
</dl>
<h2>요약</h2>
<table><tr><th>검사</th><th>결과</th></tr>
<tr><td>html-validate (권장 규칙)</td><td class="${r.summary.htmlErrors ? 'bad' : 'ok'}">오류 ${r.summary.htmlErrors} · 경고 ${r.summary.htmlWarnings}</td></tr>
<tr><td>axe-core (${AXE_TAGS.join(', ')})</td><td class="${r.summary.axeViolations ? 'bad' : 'ok'}">위반 ${r.summary.axeViolations}건 / ${r.summary.axeRuns}회 검사</td></tr>
<tr><td>가로 스크롤</td><td class="${r.summary.horizontalScroll ? 'bad' : 'ok'}">${r.summary.horizontalScroll}회 발생</td></tr>
${r.lighthouse ? r.lighthouse.map((l) => `<tr><td>Lighthouse ${esc(l.formFactor)} · ${esc(l.file)}</td><td>성능 ${l.scores.performance} · 접근성 ${l.scores.accessibility} · 권장사항 ${l.scores['best-practices']} · SEO ${l.scores.seo} (LCP ${esc(l.lcp)}, CLS ${esc(l.cls)})</td></tr>`).join('') : '<tr><td>Lighthouse</td><td>이번 실행에서는 측정하지 않음 (<code>npm run verify:lighthouse</code>)</td></tr>'}
</table>
<h2>html-validate</h2>
<table><tr><th>파일</th><th>오류</th><th>경고</th><th>내용</th></tr>
${r.htmlValidate.map((h) => `<tr><td>${esc(h.file.split('/').pop())}</td><td>${h.errors}</td><td>${h.warnings}</td><td>${h.messages.map((m) => `${esc(m.rule)} (L${m.line}) ${esc(m.message)}`).join('<br>')}</td></tr>`).join('')}
</table>
<h2>axe-core</h2>
<table><tr><th>파일</th><th>화면</th><th>테마</th><th>위반</th><th>가로 스크롤</th></tr>
${r.axe.map((a) => `<tr><td>${esc(a.file.includes('#') ? a.file : a.file.split('/').pop())}</td><td>${esc(a.viewport)}</td><td>${esc(a.scheme)}</td><td class="${a.violations.length ? 'bad' : 'ok'}">${a.violations.length ? a.violations.map((v) => `${esc(v.id)} (${esc(v.impact)}, ${v.nodes}곳) ${esc(v.targets.join(', '))}`).join('<br>') : '0'}</td><td>${a.horizontalScroll ? '<span class="bad">있음</span>' : '없음'}</td></tr>`).join('')}
</table>
</body></html>`;

/* --render: 측정 없이 reports/<project>/report.json 으로 index.html 만 다시 만듦 */
const renderOnly = async () => {
  for (const key of Object.keys(PROJECTS)) {
    if (ONLY && ONLY !== key) continue;
    const dir = join(ROOT, 'reports', key);
    const report = JSON.parse(await readFile(join(dir, 'report.json'), 'utf8'));
    await writeFile(join(dir, 'index.html'), htmlReport(report));
    console.log(`[${key}] index.html 다시 만듦`);
  }
};

const main = async () => {
  const server = await startServer();
  const base = `http://127.0.0.1:${server.address().port}`;
  const browserVersion = await (async () => { const { chromium } = require('playwright'); const b = await chromium.launch(CHROME ? { executablePath: CHROME } : {}); const v = b.version(); await b.close(); return v; })();
  for (const [key, p] of Object.entries(PROJECTS)) {
    if (ONLY && ONLY !== key) continue;
    const pages = (p.files || (await readdir(join(ROOT, p.dir))).filter((f) => f.endsWith('.html')).sort()).map((f) => `${p.dir}/${f}`);
    const targets = pages.filter((f) => !p.app || f !== `${p.dir}/${p.app.entry}`).map((f) => ({ id: f, path: f }));
    if (p.app) for (const [route, login] of p.app.routes) targets.push({ id: `${p.app.entry.replace(/index\.html$/, '')}#${route}${login ? ' (로그인)' : ''}`, path: `${p.dir}/${p.app.entry.replace(/index\.html$/, '')}#${route}`, login });
    console.log(`[${key}] ${targets.length}개 화면 검사`);
    const htmlValidate = await runHtmlValidate(pages);
    const axe = await runAxe(base, targets, p.app?.login);
    const lighthouse = WITH_LIGHTHOUSE ? await runLighthouse(base, p.lighthouse.map((f) => `${p.dir}/${f}`)) : null;
    const report = {
      project: p.name, dir: p.dir, pages: targets.map((t) => t.id),
      measuredAt: new Date().toISOString(),
      tools: { 'html-validate': version('html-validate'), 'axe-core': version('axe-core'), playwright: version('playwright'), Chromium: browserVersion, ...(lighthouse ? { lighthouse: version('lighthouse') } : {}) },
      environment: `${os.type()} ${os.release()} · Node ${process.version} · 로컬 정적 서버`,
      conditions: [
        `axe-core 규칙: ${AXE_TAGS.join(', ')}`,
        `화면: ${VIEWPORTS.map((v) => v.label).join(' / ')} × 라이트 · 다크`,
        '페이지를 끝까지 스크롤해 등장 효과를 모두 재생한 뒤 검사',
        '각 화면의 기본 상태만 검사 (로딩 · 빈 상태 · 오류 · 다이얼로그 상태는 포함하지 않음)',
        ...(p.app ? [`웹앱은 해시 주소별로 검사, '(로그인)' 화면은 데모 계정(기본 시작 상태 '예약 없음')으로 로그인한 뒤 검사. html-validate는 빌드된 ${p.app.entry} 파일만 검사`] : []),
      ],
      summary: {
        htmlErrors: htmlValidate.reduce((s, h) => s + h.errors, 0),
        htmlWarnings: htmlValidate.reduce((s, h) => s + h.warnings, 0),
        axeRuns: axe.length,
        axeViolations: axe.reduce((s, a) => s + a.violations.length, 0),
        horizontalScroll: axe.filter((a) => a.horizontalScroll).length,
      },
      htmlValidate, axe, lighthouse,
    };
    const dir = join(ROOT, 'reports', key);
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, 'report.json'), JSON.stringify(report, null, 2) + '\n');
    await writeFile(join(dir, 'index.html'), htmlReport(report));
    console.log(`[${key}] HTML 오류 ${report.summary.htmlErrors} · axe 위반 ${report.summary.axeViolations}/${report.summary.axeRuns} · 가로 스크롤 ${report.summary.horizontalScroll}`);
  }
  server.close();
};
(args.includes('--render') ? renderOnly() : main()).catch((e) => { console.error(e); process.exit(1); });
