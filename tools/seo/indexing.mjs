/**
 * 검색 엔진 등록 스위치 (의존성 없음, Node 18 이상)
 *
 *   node tools/seo/indexing.mjs
 *
 * data/site.json 의 searchIndexing 이 true 가 아니면(기본: 등록 안 함),
 * 배포 결과물의 모든 HTML 페이지 <head> 에 <meta name="robots" content="noindex, nofollow"> 를 넣는다.
 * 공유 미리보기 · 구조화 데이터 · sitemap.xml 은 그대로 두므로, 링크로 제출 · 공유는 그대로 된다.
 * 배포(.github/workflows/pages.yml)에서 템플릿 · 원본 소스를 뺀 뒤에 실행한다. 저장소 파일에 직접 쓰는 용도가 아니다.
 */
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join, resolve, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const site = JSON.parse(await readFile(join(ROOT, 'data/site.json'), 'utf8'));

if (site.searchIndexing === true) {
  console.log('searchIndexing: true — 검색 엔진 등록 허용 (noindex 를 넣지 않음)');
  process.exit(0);
}

const SKIP = new Set(['.git', 'node_modules', 'tools']);
const htmlFiles = async (dir) => {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    if (SKIP.has(e.name)) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...await htmlFiles(p));
    else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
};

const META = '<meta name="robots" content="noindex, nofollow">';
let changed = 0;
for (const file of await htmlFiles(ROOT)) {
  let html = await readFile(file, 'utf8');
  if (/<meta\s+name="robots"[^>]*>/i.test(html)) html = html.replace(/<meta\s+name="robots"[^>]*>/gi, META);
  else if (/<head[^>]*>/i.test(html)) html = html.replace(/<head[^>]*>/i, (m) => `${m}\n  ${META}`);
  else { console.warn(`  <head> 없음, 건너뜀: ${relative(ROOT, file)}`); continue; }
  await writeFile(file, html);
  changed += 1;
}
console.log(`searchIndexing: false — HTML ${changed}개에 noindex, nofollow`);
