"""사이트 글꼴(Paperlogy) 경량화 — 실제로 쓰인 글자만 담은 작은 글꼴 만들기

    pip install fonttools brotli
    python3 tools/fonts/subset.py

- 사이트 글자(HTML · data/*.json · JS)에 쓰인 한글과 기본 문자(영문 · 숫자 · 문장 부호)만 담은
  assets/fonts/subset/Paperlogy-<굵기>-site.woff2 를 굵기마다 만든다 (원본 약 157KB → 약 40KB).
- assets/css/style.css 의 글꼴 블록(아래 표시 사이)을 다시 쓴다.
  · 원본 글꼴(전체 글자)을 먼저, 작은 글꼴(unicode-range)을 나중에 선언한다.
  · 원본 글꼴의 unicode-range 는 U+0020 부터라, 글꼴에 없는 줄바꿈(U+000A) 같은 제어 문자 때문에 원본을 내려받지 않는다.
  · 브라우저는 나중에 선언한 글꼴부터 쓰므로 평소에는 작은 글꼴만 내려받고,
    작은 글꼴에 없는 글자(관리 화면에서 새로 쓴 글자 등)가 있을 때만 원본을 내려받아 같은 글꼴로 보여 준다.
- 배포(.github/workflows/pages.yml) 때마다 다시 실행하므로 관리 화면에서 고친 글자도 반영된다.
"""
import glob
import os
import re
import sys

from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
FONTS = os.path.join(ROOT, 'assets', 'fonts')
OUT = os.path.join(FONTS, 'subset')
CSS = os.path.join(ROOT, 'assets', 'css', 'style.css')
WEIGHTS = {'4Regular': 400, '5Medium': 500, '6SemiBold': 600, '7Bold': 700, '8ExtraBold': 800}
# 기본 문자: 영문 · 숫자 · 라틴 기호, 문장 부호(– — … · 등), 화살표, 수학 기호(− ≤ ≥ ×), 한글 자모, 전각 문자
BASIC = [(0x20, 0x7E), (0xA0, 0xFF), (0x2010, 0x2027), (0x2030, 0x203A), (0x2190, 0x2193),
         (0x2212, 0x2212), (0x2264, 0x2265), (0x3000, 0x303F), (0x3131, 0x318E), (0xFF01, 0xFF5E)]
SOURCES = ['index.html', 'project.html', '404.html', 'data/**/*.json', 'assets/js/*.js', 'work/*/index.html']
START = '/* ===== 글꼴: tools/fonts/subset.py 가 만듦 — 직접 고치지 말고 스크립트를 다시 실행하세요 ===== */'
END = '/* ===== 글꼴 끝 ===== */'


def site_text():
    text = ''
    for pattern in SOURCES:
        for path in glob.glob(os.path.join(ROOT, pattern), recursive=True):
            with open(path, encoding='utf-8') as f:
                text += f.read()
    return text


def ranges(codepoints):
    cps = sorted(set(codepoints))
    out, start, prev = [], cps[0], cps[0]
    for c in cps[1:]:
        if c == prev + 1:
            prev = c
            continue
        out.append((start, prev))
        start = prev = c
    out.append((start, prev))
    return ', '.join(f'U+{a:X}' if a == b else f'U+{a:X}-{b:X}' for a, b in out)


def main():
    text = site_text()
    wanted = {ord(c) for c in text if 0xAC00 <= ord(c) <= 0xD7A3}
    for a, b in BASIC:
        wanted.update(range(a, b + 1))
    os.makedirs(OUT, exist_ok=True)
    blocks = [START]
    for name, weight in WEIGHTS.items():
        src = os.path.join(FONTS, f'Paperlogy-{name}.woff2')
        dst = os.path.join(OUT, f'Paperlogy-{name}-site.woff2')
        have = set(TTFont(src).getBestCmap())
        keep = sorted(wanted & have)
        opts = subset.Options()
        opts.flavor = 'woff2'
        opts.layout_features = ['*']
        font = subset.load_font(src, opts)
        sub = subset.Subsetter(opts)
        sub.populate(unicodes=keep)
        sub.subset(font)
        subset.save_font(font, dst, opts)
        blocks.append(f'@font-face {{ font-family: "Paperlogy"; src: url("../fonts/Paperlogy-{name}.woff2") format("woff2"); '
                      f'font-weight: {weight}; font-style: normal; font-display: swap; unicode-range: U+0020-10FFFF; }}')
        blocks.append(f'@font-face {{ font-family: "Paperlogy"; src: url("../fonts/subset/Paperlogy-{name}-site.woff2") format("woff2"); '
                      f'font-weight: {weight}; font-style: normal; font-display: swap; unicode-range: {ranges(keep)}; }}')
        print(f'{name}: {os.path.getsize(src) // 1024}KB → {os.path.getsize(dst) // 1024}KB ({len(keep)}자)')
    blocks.append(END)

    with open(CSS, encoding='utf-8') as f:
        css = f.read()
    block = '\n'.join(blocks)
    if START in css:
        css = re.sub(re.escape(START) + r'[\s\S]*?' + re.escape(END), lambda _: block, css)
    else:
        # 처음 한 번: 기존 @font-face 블록을 지우고 그 자리에 넣는다
        first = re.search(r'@font-face\s*\{', css)
        at = first.start() if first else 0
        css = re.sub(r'@font-face\s*\{[^}]*\}\s*', '', css)
        css = css[:at] + block + '\n\n' + css[at:]
    with open(CSS, 'w', encoding='utf-8') as f:
        f.write(css)
    hangul = len([c for c in wanted if 0xAC00 <= c <= 0xD7A3])
    print(f'사이트 한글 {hangul}자 · style.css 글꼴 블록 갱신')


if __name__ == '__main__':
    sys.exit(main())
