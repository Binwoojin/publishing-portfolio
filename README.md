# Publishing Portfolio

웹 퍼블리싱 작업물을 모아두는 포트폴리오 저장소입니다.
HTML · CSS · JavaScript 기반의 마크업, 반응형 레이아웃, 웹 접근성, 인터랙션 작업을 정리합니다.

## 폴더 구조

```
publishing-portfolio/
├── index.html              # 포트폴리오 사이트 (About · Skills · Projects · Contact)
├── assets/
│   ├── css/style.css       # 사이트 스타일 (라이트/다크 모드, 반응형)
│   ├── js/main.js          # 모바일 메뉴, 작업물 목록 렌더링 · 필터
│   └── images/             # 작업물 썸네일 이미지
├── data/projects.js        # ★ 작업물 목록 데이터
├── common/css/reset.css    # 공통 리셋 CSS
├── projects/
│   ├── _template/          # 새 작업물 시작용 템플릿 (복사해서 사용)
│   └── <project-name>/     # 개별 작업물 결과물
└── .github/workflows/pages.yml  # GitHub Pages 자동 배포
```

## 사이트 정보 수정하기

`index.html` 에서 `OOO`(이름), `your@email.com`(이메일), 소개 문구, Skills 항목을 본인 정보로 바꿔 주세요.

## 새 작업물 추가하기

1. `projects/_template` 폴더를 복사해 `projects/<project-name>` 으로 만들고 작업합니다. (영문 소문자, 하이픈 사용)
2. 썸네일 이미지(권장 비율 16:10)를 `assets/images/` 에 넣습니다.
3. `data/projects.js` 의 배열에 작업물 정보를 추가합니다. 사이트에 카드가 자동으로 생기고, `category` 값으로 필터 버튼도 자동 생성됩니다.

```js
window.PROJECTS = [
  {
    title: '프로젝트 이름',
    desc: '한 줄 설명',
    category: '반응형',
    tags: ['HTML', 'CSS', 'JavaScript'],
    thumbnail: 'assets/images/project-name.jpg',
    period: '2026.09',
    contribution: '퍼블리싱 100%',
    demo: 'projects/project-name/',
    code: 'https://github.com/Binwoojin/publishing-portfolio/tree/main/projects/project-name'
  }
];
```

## 배포 (GitHub Pages)

`main` 브랜치에 push 하면 `.github/workflows/pages.yml` 이 사이트를 자동 배포합니다.

1. 저장소 **Settings → Pages → Build and deployment → Source** 를 **GitHub Actions** 로 설정합니다. (최초 1회)
2. `main` 브랜치에 push 하면 `https://binwoojin.github.io/publishing-portfolio/` 에 배포됩니다.

## 작업 원칙

- **시맨틱 마크업**: 의미에 맞는 HTML 요소 사용
- **반응형**: 모바일 · 태블릿 · 데스크톱 대응
- **웹 접근성**: KWCAG / WCAG 2.1 기준 준수 (대체 텍스트, 키보드 접근, 명도 대비 등)
- **크로스 브라우징**: 최신 Chrome · Edge · Safari · Firefox 확인

## 디자인 스킬 (UI UX Pro Max)

`.claude/skills/ui-ux-pro-max/` 에 [UI UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) (MIT) 스킬이 설치되어 있어,
Claude Code로 UI 작업을 요청하면 스타일 · 컬러 · 폰트 · UX 가이드라인 데이터를 참고해 작업합니다.

현재 사이트 디자인은 이 스킬의 추천을 바탕으로 합니다.

- **레이아웃**: Portfolio Grid — Hero → Projects → About → Skills → Contact
- **스타일**: Minimalism & Swiss Style — 12단 그리드, 얇은 구분선, 큰 타이포그래피
- **컬러**: Monochrome + Blue accent (`#18181B` / `#FAFAFA` / `#2563EB`), 다크 모드 지원
- **폰트**: Archivo (영문 제목) + Pretendard (한글 · 본문)
- **UX**: 클릭 영역 44px 이상, 키보드 포커스 표시, 모션 감소 설정 시 애니메이션 끔

## 로컬에서 보기

별도 빌드 과정은 없습니다. 로컬 서버를 띄워 확인합니다.

```bash
npx serve .
# 또는
python3 -m http.server 8000
```
