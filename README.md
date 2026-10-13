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
├── data/
│   ├── projects.json       # ★ 작업물 목록
│   └── site.json           # ★ 이름 · 연락처 · 소개 문구 · 기술 목록
├── .pages.yml              # 관리 화면(Pages CMS) 설정
├── common/css/reset.css    # 공통 리셋 CSS
├── projects/
│   ├── _template/          # 새 작업물 시작용 템플릿 (복사해서 사용)
│   └── <project-name>/     # 개별 작업물 결과물
└── .github/workflows/pages.yml  # GitHub Pages 자동 배포
```

## 관리 화면 (Pages CMS)

작업물과 사이트 정보는 [Pages CMS](https://pagescms.org) 관리 화면에서 코드 없이 수정할 수 있습니다.

1. https://app.pagescms.org 에 접속해 **GitHub 계정으로 로그인**합니다.
2. 처음 한 번은 Pages CMS GitHub App 설치 화면이 나오면 이 저장소(`publishing-portfolio`)를 선택해 허용합니다.
3. 저장소 목록에서 `publishing-portfolio` 를 열고, GitHub Pages 에 연결한 브랜치를 선택합니다.
4. 왼쪽 메뉴에서 수정합니다.
   - **작업물**: 작업물 추가 · 수정 · 삭제 · 순서 변경, 썸네일 이미지 업로드 (권장 비율 16:10)
   - **사이트 정보**: 이름, 직무, 이메일, GitHub 주소, 소개 문구, 기술 목록
5. **Save** 를 누르면 저장소에 바로 반영되고, 1~2분 뒤 사이트에도 반영됩니다.

> 관리 화면 메뉴 구성은 `.pages.yml` 에서 바꿀 수 있습니다. 업로드한 이미지는 `assets/images/` 에 저장됩니다.

### 직접 수정할 때

관리 화면 없이 `data/projects.json`, `data/site.json` 을 직접 수정해도 됩니다. (JSON 형식을 지켜야 합니다)

```json
[
  {
    "title": "프로젝트 이름",
    "desc": "한 줄 설명",
    "category": "반응형",
    "tags": ["HTML", "CSS", "JavaScript"],
    "thumbnail": "assets/images/project-name.jpg",
    "period": "2026.09",
    "contribution": "퍼블리싱 100%",
    "demo": "projects/project-name/",
    "code": "https://github.com/Binwoojin/publishing-portfolio/tree/main/projects/project-name"
  }
]
```

결과물 페이지는 `projects/_template` 폴더를 복사해 `projects/<project-name>` 으로 만들어 작업하고, `demo` 에 그 경로를 적으면 됩니다.

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
- **폰트**: 페이퍼로지(Paperlogy) — `assets/fonts/` 에 포함 (400 · 500 · 600 · 700 · 800)
- **UX**: 클릭 영역 44px 이상, 키보드 포커스 표시, 모션 감소 설정 시 애니메이션 끔

## 로컬에서 보기

별도 빌드 과정은 없습니다. 데이터를 JSON 파일에서 불러오므로 `index.html` 을 더블클릭해 열면 내용이 보이지 않고, 아래처럼 로컬 서버를 띄워 확인해야 합니다.

```bash
npx serve .
# 또는
python3 -m http.server 8000
```
