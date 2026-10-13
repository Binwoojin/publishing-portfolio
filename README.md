# Publishing Portfolio

웹 퍼블리싱 작업물을 모아두는 포트폴리오 저장소입니다.
HTML · CSS · JavaScript 기반의 마크업, 반응형 레이아웃, 웹 접근성, 인터랙션 작업을 정리합니다.

## 폴더 구조

```
publishing-portfolio/
├── index.html            # 전체 작업물 목록 (포트폴리오 메인)
├── common/               # 여러 프로젝트에서 공유하는 리소스
│   └── css/reset.css
└── projects/
    ├── _template/        # 새 프로젝트 시작용 템플릿 (복사해서 사용)
    │   ├── index.html
    │   ├── css/style.css
    │   ├── js/script.js
    │   └── images/
    └── <project-name>/   # 개별 작업물
```

## 새 작업물 추가하기

1. `projects/_template` 폴더를 복사해 `projects/<project-name>` 으로 이름을 바꿉니다. (영문 소문자, 하이픈 사용)
2. 작업물을 완성한 뒤 루트 `index.html` 의 목록에 카드를 추가합니다.
3. 아래 작업물 목록 표에도 한 줄 추가합니다.

## 작업물 목록

| 프로젝트 | 설명 | 주요 기술 | 작업 범위 |
| --- | --- | --- | --- |
| _(준비 중)_ | | | |

## 작업 원칙

- **시맨틱 마크업**: 의미에 맞는 HTML 요소 사용
- **반응형**: 모바일 · 태블릿 · 데스크톱 대응
- **웹 접근성**: KWCAG / WCAG 2.1 기준 준수 (대체 텍스트, 키보드 접근, 명도 대비 등)
- **크로스 브라우징**: 최신 Chrome · Edge · Safari · Firefox 확인

## 로컬에서 보기

별도 빌드 없이 `index.html` 을 브라우저로 열거나, 간단한 로컬 서버를 띄웁니다.

```bash
npx serve .
# 또는
python3 -m http.server 8000
```
