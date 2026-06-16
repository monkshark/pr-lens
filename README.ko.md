# PR Lens

![PR Lens — 큰 PR을 더 빠르게 리뷰: 파일 추적과 온디바이스 AI 요약](assets/banner.svg)

큰 GitHub Pull Request 리뷰를 쉽게 만들어 주는 Chromium(Manifest V3) 확장입니다. "Files changed" 페이지에 파일트리 리뷰 추적기를 주입하고, 어떤 파일을 이미 봤는지 새로고침·재방문 후에도 기억하며, 온디바이스 AI로 PR 요약을 만들어 줍니다 — 기본값은 무료, 무제한, 완전 로컬입니다.

영문 문서: [README.md](README.md)

## 기능

리뷰 추적:
- 파일트리 패널 — 변경된 모든 파일을 추가/삭제 라인수와 함께 띄우는 플로팅 목록, PR Files changed 페이지에 고정
- 본 표시 체크박스 — 각 파일 헤더와 패널에 "봤음" 체크박스. 상태는 PR 단위로 새로고침·재방문해도 유지
- 진척도 — "오늘 N/M 봄" + 진행 바로 어디까지 봤는지 항상 표시
- 점프 — 패널의 파일을 클릭하면 해당 diff로 바로 스크롤

AI 요약:
- 4가지 엔진 — 기기와 예산에 맞는 엔진을 설정에서 선택
- 기본은 온디바이스 — Chrome 내장 Prompt API(Gemini Nano): 키 없음, 비용 없음, 데이터가 기기를 벗어나지 않음
- 사이드패널 — 요약은 Chrome 사이드패널에 표시: 한 줄 요약 · 핵심 변경점 · 리뷰 포인트
- 캐시 — 생성한 요약은 PR 단위로 저장되어 다음 방문 시 즉시 다시 표시

인터페이스:
- 언어 토글 — 설정 맨 위에서 UI 전체를 영어/한국어로 전환. 선택은 패널·사이드패널에 즉시 적용
- 요약 내용 자체는 UI 언어와 무관하게 항상 한국어로 작성됩니다

## AI 엔진

설정 → AI 요약 엔진에서 하나를 선택합니다. 모든 키와 설정은 `chrome.storage.local`에만 저장됩니다.

- Chrome 내장 AI (기본 · 키 불필요) — Chrome의 온디바이스 모델을 실행합니다. 데이터가 기기를 벗어나지 않습니다. 내장 모델이 준비된 Chrome 138+ 필요.
- WebLLM (키 불필요 · 무제한 · 로컬) — WebGPU로 모델을 브라우저 안에서 완전히 실행합니다. 처음 사용 시 가중치를 한 번 내려받아 캐시하고, 이후에는 오프라인으로 동작합니다.
- Google Gemini (무료 키 · GPU 불필요) — 무료 Google AI Studio 키로 안정적인 무료 클라우드 요약. GPU가 필요 없으며 PR diff가 Google로 전송됩니다. 설정에 키 발급 단계별 안내가 있습니다.
- Claude API (유료 · 키 필요) — 직접 발급한 Anthropic 키로 최고 품질의 요약을 생성합니다.

Gemini와 Claude는 모델 ID를 직접 입력하거나, 키로 제공자에서 실시간 모델 목록을 불러올 수 있습니다.

## 동작 방식

콘텐츠 스크립트가 `github.com`에서 동작하며 PR Files-changed 페이지를 감지하고(history 후킹 + MutationObserver로 SPA 네비게이션까지), 스코프가 지정된 접두사 스타일로 추적기를 주입해 GitHub 자체 DOM과 충돌하지 않습니다. DOM 셀렉터는 단일 모듈에 모아 두어 graceful하게 비활성됩니다 — GitHub가 마크업을 바꾸면 페이지를 깨뜨리는 대신 "변경된 파일을 찾지 못함"을 표시합니다.

AI 요약은 사이드패널에서 실행됩니다. GitHub REST API로 PR 메타데이터와 변경 파일 diff를 가져오고(비공개 저장소·rate limit 완화를 위해 선택적으로 PAT 사용), 프롬프트를 만들어 선택한 엔진으로 결과를 스트리밍합니다 — 브라우저 내장 `LanguageModel`, 로컬 WebLLM 모델, Gemini(raw SSE), 또는 공식 SDK를 통한 Claude API. 리뷰 상태·설정·캐시된 요약은 `chrome.storage.local`에 보관되며, 사용자가 직접 트리거한 GitHub·(선택적) AI 호출 외에는 어디로도 전송되지 않습니다.

프로젝트 구조:
```
src/
  content/     PR 페이지 주입 (파일트리, 본 표시 체크박스, SPA 네비)
    selectors  GitHub DOM 셀렉터, 복원력을 위해 분리
  sidepanel/   React 사이드패널 + AI 오케스트레이션 (4개 엔진)
  options/     설정 (언어, AI 엔진, 키, 모델)
  background/  서비스 워커 (사이드패널 열기)
  core/        순수 로직 (prKey, storage, github, 요약 프롬프트, i18n)
```

## 권한

- `storage` — 리뷰 상태, 설정, 캐시된 요약 (로컬 전용)
- `sidePanel` — 요약 패널
- `github.com` · `api.github.com` 호스트 접근 — PR diff 읽기
- `generativelanguage.googleapis.com` 호스트 접근 — Gemini를 선택했을 때만 사용
- `api.anthropic.com` 호스트 접근 — Claude를 선택했을 때만 사용
- `huggingface.co` · `raw.githubusercontent.com` 호스트 접근 — WebLLM 모델 가중치 내려받기에만 사용

## 라이선스

MIT. 작성자: Huido Choo.
