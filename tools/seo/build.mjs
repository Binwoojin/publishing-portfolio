/**
 * 검색 · 공유용 정적 파일 만들기 (의존성 없음, Node 18 이상)
 *
 *   node tools/seo/build.mjs
 *
 * - work/<아이디>/index.html : project.html 을 바탕으로 작업물마다 제목 · 설명 · 대표 주소(canonical) ·
 *   공유 미리보기(Open Graph · Twitter) · 구조화 데이터 · JS 없이도 보이는 요약을 넣은 페이지
 * - sitemap.xml · robots.txt
 *
 * 배포(.github/workflows/pages.yml) 때마다 다시 만들므로, 관리 화면에서 고친 작업물 내용도 반영됩니다.
 * 사이트 주소가 바뀌면 SITE_URL 환경 변수나 아래 기본값을 고치세요.
 */
import { readFile, writeFile, readdir, mkdir, rm } from 'node:fs/promises';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const SITE = (process.env.SITE_URL || 'https://binwoojin.github.io/publishing-portfolio/').replace(/\/?$/, '/');

const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const abs = (path) => (/^https?:\/\//.test(path) ? path : SITE + String(path).replace(/^\.?\//, ''));
const json = async (path) => JSON.parse(await readFile(join(ROOT, path), 'utf8'));
// JSON-LD 안에 </script> 가 끼지 않도록
const ld = (obj) => JSON.stringify(obj, null, 2).replace(/</g, '\\u003c');

const site = await json('data/site.json');
const projects = await json('data/projects.json').catch(() => []);
const siteName = site.name || 'Portfolio';
const person = { '@type': 'Person', '@id': `${SITE}#person`, name: site.realName || siteName };

const template = await readFile(join(ROOT, 'project.html'), 'utf8');
const ids = (await readdir(join(ROOT, 'data/cases'))).filter((f) => /^[a-z0-9-]+\.json$/.test(f)).map((f) => f.slice(0, -5)).sort();

// 예전에 만든 페이지 중 데이터가 없어진 것은 지운다
const existing = await readdir(join(ROOT, 'work')).catch(() => []);
for (const old of existing) if (!ids.includes(old)) await rm(join(ROOT, 'work', old), { recursive: true, force: true });

const pages = [];
for (const id of ids) {
  const d = await json(`data/cases/${id}.json`);
  const card = (Array.isArray(projects) ? projects : []).find((p) => p && p.caseStudy === id) || {};
  const url = `${SITE}work/${id}/`;
  const title = `${d.title || id} | ${siteName}`;
  const desc = d.summary || card.desc || '';
  const image = card.thumbnail || d.cover || '';
  const demo = d.demo || card.demo || '';

  let html = template
    // 예전 주소용 noindex 는 이 페이지에는 쓰지 않는다
    .replace(/\n\s*<!-- 예전 주소[\s\S]*?-->/, '')
    .replace(/\n\s*<meta name="robots"[^>]*>/, '')
    .replace('<html lang="ko">', `<html lang="ko" data-root="../../" data-case="${esc(id)}">`)
    // JS가 켜져 있으면 첫 화면부터 정적 요약을 숨겨, 상세 내용으로 바뀔 때 레이아웃이 밀리지 않게 한다(CLS)
    .replace('<meta charset="UTF-8">', '<meta charset="UTF-8">\n  <script>document.documentElement.classList.add(\'js\')</script>')
    // 상대 경로를 사이트 루트 기준으로 (# · 절대 주소 · 프로토콜은 그대로)
    .replace(/\b(href|src)="(?![a-z][a-z0-9+.-]*:|\/|#)([^"]*)"/gi, '$1="../../$2"')
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`)
    .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(desc)}">
  <link rel="canonical" href="${esc(url)}">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="${esc(siteName)}">
  <meta property="og:locale" content="ko_KR">
  <meta property="og:url" content="${esc(url)}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(desc)}">${image ? `
  <meta property="og:image" content="${esc(abs(image))}">` : ''}
  <meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(desc)}">${image ? `
  <meta name="twitter:image" content="${esc(abs(image))}">` : ''}
  <script type="application/ld+json">
${ld({
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'CreativeWork', '@id': `${url}#work`, name: d.title || id, headline: d.title || id, description: desc, url,
      inLanguage: 'ko', author: person, ...(image ? { image: abs(image) } : {}),
      ...(Array.isArray(d.tools) && d.tools.length ? { keywords: d.tools.join(', ') } : {}),
      ...(demo ? { workExample: { '@type': 'WebPage', url: abs(demo) } } : {}),
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: siteName, item: SITE },
        { '@type': 'ListItem', position: 2, name: d.title || id, item: url },
      ],
    },
  ],
})}
  </script>`)
    // JS 없이도 보이는 요약 (JS가 돌면 상세 내용으로 바뀐다)
    .replace(/<p class="inner case__status">작업물을 불러오는 중입니다\.<\/p>/, `<div class="inner case__status case__static">
        <h1>${esc(d.title || id)}</h1>
        ${desc ? `<p>${esc(desc)}</p>` : ''}
        <p>${demo ? `<a href="${esc(/^https?:/.test(demo) ? demo : `../../${demo}`)}">Live Demo 보기</a> · ` : ''}<a href="../../#projects">전체 작업물</a></p>
      </div>`);

  if (/name="robots"/.test(html)) throw new Error(`work/${id}: project.html 의 noindex 가 남았습니다`);
  await mkdir(join(ROOT, 'work', id), { recursive: true });
  await writeFile(join(ROOT, 'work', id, 'index.html'), html);
  pages.push(url);
}

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[SITE, ...pages].map((u) => `  <url><loc>${esc(u)}</loc></url>`).join('\n')}
</urlset>
`;
await writeFile(join(ROOT, 'sitemap.xml'), sitemap);

// robots.txt 는 도메인 맨 위(https://binwoojin.github.io/robots.txt)에 있어야 검색 엔진이 읽는다.
// 이 저장소는 /publishing-portfolio/ 아래라 참고용으로 두고, sitemap.xml 은 Search Console 에 직접 제출한다.
// site.json 의 searchIndexing 이 true 일 때만 검색을 허용한다 (페이지별 noindex 는 tools/seo/indexing.mjs)
await writeFile(join(ROOT, 'robots.txt'), site.searchIndexing === true
  ? `User-agent: *\nAllow: /\nSitemap: ${SITE}sitemap.xml\n`
  : `# 검색 엔진 등록 보류 중 (data/site.json searchIndexing: false)\nUser-agent: *\nDisallow: /\n`);

console.log(`work/ ${ids.length}개 (${ids.join(', ')}), sitemap.xml ${pages.length + 1}개 주소, robots.txt — ${SITE}`);
