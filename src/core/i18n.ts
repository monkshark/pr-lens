import { DEFAULT_LANG, type Lang } from '../types'

const en = {
  optTitle: 'PR Lens settings',
  optSubtitle: 'All values are stored locally in this browser only.',

  langCardTitle: 'Language',
  langCardDesc: 'Display language for PR Lens.',
  langEnglish: 'English',
  langKorean: '한국어',

  engineCardTitle: 'AI summary engine',
  engineCardDesc: 'Which model produces the PR summary.',

  builtinTitle: 'Chrome built-in AI',
  builtinMeta: 'no key',
  builtinDesc: "Uses Chrome's on-device model. Nothing leaves your machine.",
  webllmTitle: 'WebLLM',
  webllmMeta: 'no key · unlimited · local',
  webllmDesc:
    'Runs a model fully in your browser. First use downloads weights.',
  webgpuSupported: 'WebGPU: supported',
  webgpuUnsupported: 'WebGPU: unsupported',
  geminiTitle: 'Google Gemini',
  geminiMeta: 'no GPU · free key',
  geminiDesc:
    'Reliable free cloud summaries. Needs a free Google AI Studio key (no GPU required). Your PR diff is sent to Google.',
  claudeTitle: 'Claude API',
  claudeMeta: 'paid · key required',
  claudeDesc: 'Highest-quality summaries using your own Anthropic key.',

  webllmCardTitle: 'WebLLM model',
  webllmCardDesc:
    'Downloaded once and cached in this browser. Then summaries run offline with no key.',
  btnDownloading: 'Downloading…',
  btnRedownload: 'Re-download',
  btnDownloadModel: 'Download model',
  progStarting: 'Starting…',
  progDone: 'Done',
  progFailed: (msg: string) => `Failed: ${msg}`,
  webgpuUnavailableHere: 'WebGPU unsupported — WebLLM unavailable here',
  statusReady: 'Status: downloaded (ready)',
  statusNotDownloaded: 'Status: not downloaded',

  ghTokenLabel: 'GitHub Personal Access Token',
  optional: 'optional',
  ghTokenHint:
    'Lets PR Lens read diffs from private repos. Not needed for public PRs.',
  geminiKeyLabel: 'Gemini API key',
  geminiKeyHint:
    'Stored locally; only sent to Google when the Gemini engine runs.',
  geminiModelLabel: 'Gemini model',
  geminiModelHint:
    'Pick a model, or load the live list from Google with your key.',
  claudeKeyLabel: 'Claude API key',
  claudeKeyHint:
    'Stored locally; only sent to Anthropic when the Claude engine runs.',
  claudeModelLabel: 'Claude model',
  claudeModelHint:
    'Pick a model, or load the live list from Anthropic with your key.',

  modelCustom: 'Custom… (type a model id)',
  modelLoadingBtn: 'Loading…',
  modelLoadBtn: '↻ Load available models',
  modelEnterKeyFirst: 'Enter an API key first.',
  modelLoadingMsg: 'Loading available models…',
  modelLoadedMsg: (n: number) => `${n} models loaded from the API.`,
  modelLoadFailMsg: (msg: string) => `Could not load models: ${msg}`,

  saveGeminiKeyRequired:
    'Enter a Gemini API key to use the Google Gemini engine, or pick a different engine.',
  btnSave: 'Save',
  saved: 'Saved',

  keyGuideTitle: 'How to get a free key',
  keyEntered: 'Key entered',
  openAiStudio: 'Open Google AI Studio',
  geminiSteps: [
    'Open Google AI Studio below and sign in with your Google account.',
    'Click the blue "Create API key" button (top-right of the page).',
    'In the dialog, pick an existing Google Cloud project — or click "Create API key in new project" if you have none (this makes a project for you automatically).',
    'Wait a few seconds, then copy the generated key — it starts with "AIza…".',
    'Paste it in the box above and click Save.',
  ],

  availChecking: 'Checking…',
  availAvailable: 'Available',
  availDownloadable: 'Available (downloads on first use)',
  availDownloading: 'Downloading…',
  availUnavailable: 'Unavailable',

  settings: 'Settings',
  close: 'Close',
  emptyPre: 'Open a GitHub PR “Files changed” page and click the ',
  emptyEmph: 'AI summary',
  emptyPost: ' button to see a summary here.',
  noteFetching: 'Fetching PR changes from GitHub…',
  noteGemini: 'Summarizing with Gemini (free tier)…',
  notePreparingWebllm: (pct: number, t: string) =>
    `Preparing WebLLM… ${pct}% ${t}`,
  noteWebllm: 'Summarizing with WebLLM (free · local)…',
  noteBuiltin: 'Summarizing with Chrome built-in AI (free · on-device)…',
  noteBuiltinDownloading: (pct: number) =>
    `Downloading built-in model… ${pct}%`,
  noteClaude: 'Summarizing with Claude…',
  summaryReady: 'Summary ready',
  summaryFailed: 'Summary failed',
  modelLabel: (m: string) => `Model: ${m}`,
  modelNone: 'Model: —',
  summarizing: 'Summarizing…',
  reSummarize: 'Re-summarize',

  errNoGeminiKey: 'No Gemini API key set.',
  errNoGeminiKeySettings: 'No Gemini API key set. Add one in Settings.',
  errNoClaudeKey: 'No Claude API key set.',
  errNoClaudeKeySettings: 'No Claude API key set. Add one in Settings.',
  errNoWebgpu:
    'This browser/device has no WebGPU support, so WebLLM cannot run. Pick a different engine in Settings.',
  errBuiltinUnavailable:
    'Chrome built-in AI is unavailable. Download a WebLLM model in Settings, or add a Claude API key.',
  errWebgpuSummarize:
    'This browser/device does not support WebGPU. Chrome/Edge 113+ or a WebGPU-capable browser is required.',
  errBuiltinUnsupported:
    'This browser does not support the built-in AI (Prompt API).',
  errGeminiServer: (status: number, detail: string) =>
    `Gemini server error ${status}${detail}. Check that the key is correct, or pick a different engine.`,
  errGeminiModelList: (status: number) =>
    `Gemini model list error ${status}. Check your key.`,

  aiSummary: 'AI summary',
  aiSummaryTitle: 'Open AI summary',
  collapse: 'Collapse',
  seenToday: (n: number, total: number) => `Seen ${n}/${total} today`,
  seenCheckbox: 'Seen',
  seenCheckboxTitle: 'Mark as reviewed (PR Lens, stored locally)',
  noFilesTitle: 'No changed files detected.',
  noFilesHint: 'Open the “Files changed” tab and scroll so the diff loads.',
}

type Strings = typeof en

const ko: Strings = {
  optTitle: 'PR Lens 설정',
  optSubtitle: '모든 값은 이 브라우저에만 로컬로 저장됩니다.',

  langCardTitle: '언어',
  langCardDesc: 'PR Lens 화면에 표시할 언어입니다.',
  langEnglish: 'English',
  langKorean: '한국어',

  engineCardTitle: 'AI 요약 엔진',
  engineCardDesc: 'PR 요약을 생성할 모델을 선택합니다.',

  builtinTitle: 'Chrome 내장 AI',
  builtinMeta: '키 불필요',
  builtinDesc:
    'Chrome의 온디바이스 모델을 사용합니다. 데이터가 기기를 벗어나지 않습니다.',
  webllmTitle: 'WebLLM',
  webllmMeta: '키 불필요 · 무제한 · 로컬',
  webllmDesc:
    '브라우저 안에서 모델을 완전히 실행합니다. 처음 사용 시 가중치를 내려받습니다.',
  webgpuSupported: 'WebGPU: 지원됨',
  webgpuUnsupported: 'WebGPU: 미지원',
  geminiTitle: 'Google Gemini',
  geminiMeta: 'GPU 불필요 · 무료 키',
  geminiDesc:
    '안정적인 무료 클라우드 요약입니다. 무료 Google AI Studio 키가 필요합니다(GPU 불필요). PR diff가 Google로 전송됩니다.',
  claudeTitle: 'Claude API',
  claudeMeta: '유료 · 키 필요',
  claudeDesc: '직접 발급한 Anthropic 키로 최고 품질의 요약을 생성합니다.',

  webllmCardTitle: 'WebLLM 모델',
  webllmCardDesc:
    '한 번 내려받아 이 브라우저에 캐시됩니다. 이후에는 키 없이 오프라인으로 요약합니다.',
  btnDownloading: '내려받는 중…',
  btnRedownload: '다시 내려받기',
  btnDownloadModel: '모델 내려받기',
  progStarting: '시작하는 중…',
  progDone: '완료',
  progFailed: (msg: string) => `실패: ${msg}`,
  webgpuUnavailableHere: 'WebGPU 미지원 — 여기서는 WebLLM을 사용할 수 없습니다',
  statusReady: '상태: 내려받음(준비됨)',
  statusNotDownloaded: '상태: 내려받지 않음',

  ghTokenLabel: 'GitHub Personal Access Token',
  optional: '선택',
  ghTokenHint:
    '비공개 저장소의 diff를 읽을 수 있게 합니다. 공개 PR에는 필요 없습니다.',
  geminiKeyLabel: 'Gemini API 키',
  geminiKeyHint:
    '로컬에 저장되며, Gemini 엔진을 실행할 때만 Google로 전송됩니다.',
  geminiModelLabel: 'Gemini 모델',
  geminiModelHint:
    '모델을 선택하거나, 키로 Google에서 실시간 목록을 불러오세요.',
  claudeKeyLabel: 'Claude API 키',
  claudeKeyHint:
    '로컬에 저장되며, Claude 엔진을 실행할 때만 Anthropic으로 전송됩니다.',
  claudeModelLabel: 'Claude 모델',
  claudeModelHint:
    '모델을 선택하거나, 키로 Anthropic에서 실시간 목록을 불러오세요.',

  modelCustom: '직접 입력… (모델 ID 입력)',
  modelLoadingBtn: '불러오는 중…',
  modelLoadBtn: '↻ 사용 가능한 모델 불러오기',
  modelEnterKeyFirst: '먼저 API 키를 입력하세요.',
  modelLoadingMsg: '사용 가능한 모델을 불러오는 중…',
  modelLoadedMsg: (n: number) => `API에서 모델 ${n}개를 불러왔습니다.`,
  modelLoadFailMsg: (msg: string) => `모델을 불러오지 못했습니다: ${msg}`,

  saveGeminiKeyRequired:
    'Google Gemini 엔진을 사용하려면 Gemini API 키를 입력하거나 다른 엔진을 선택하세요.',
  btnSave: '저장',
  saved: '저장됨',

  keyGuideTitle: '무료 키 발급 방법',
  keyEntered: '키 입력됨',
  openAiStudio: 'Google AI Studio 열기',
  geminiSteps: [
    '아래에서 Google AI Studio를 열고 Google 계정으로 로그인하세요.',
    '페이지 오른쪽 위의 파란색 "Create API key" 버튼을 클릭하세요.',
    '대화 상자에서 기존 Google Cloud 프로젝트를 선택하거나, 없으면 "Create API key in new project"를 클릭하세요(프로젝트가 자동으로 생성됩니다).',
    '몇 초 기다린 뒤 생성된 키를 복사하세요. "AIza…"로 시작합니다.',
    '위 입력란에 붙여넣고 저장을 누르세요.',
  ],

  availChecking: '확인 중…',
  availAvailable: '사용 가능',
  availDownloadable: '사용 가능(처음 사용 시 내려받음)',
  availDownloading: '내려받는 중…',
  availUnavailable: '사용 불가',

  settings: '설정',
  close: '닫기',
  emptyPre: 'GitHub PR의 “Files changed” 페이지를 열고 ',
  emptyEmph: 'AI 요약',
  emptyPost: ' 버튼을 누르면 여기에 요약이 표시됩니다.',
  noteFetching: 'GitHub에서 PR 변경 사항을 가져오는 중…',
  noteGemini: 'Gemini로 요약하는 중(무료 등급)…',
  notePreparingWebllm: (pct: number, t: string) =>
    `WebLLM 준비 중… ${pct}% ${t}`,
  noteWebllm: 'WebLLM으로 요약하는 중(무료 · 로컬)…',
  noteBuiltin: 'Chrome 내장 AI로 요약하는 중(무료 · 온디바이스)…',
  noteBuiltinDownloading: (pct: number) => `내장 모델 내려받는 중… ${pct}%`,
  noteClaude: 'Claude로 요약하는 중…',
  summaryReady: '요약 완료',
  summaryFailed: '요약 실패',
  modelLabel: (m: string) => `모델: ${m}`,
  modelNone: '모델: —',
  summarizing: '요약하는 중…',
  reSummarize: '다시 요약',

  errNoGeminiKey: 'Gemini API 키가 설정되지 않았습니다.',
  errNoGeminiKeySettings:
    'Gemini API 키가 설정되지 않았습니다. 설정에서 추가하세요.',
  errNoClaudeKey: 'Claude API 키가 설정되지 않았습니다.',
  errNoClaudeKeySettings:
    'Claude API 키가 설정되지 않았습니다. 설정에서 추가하세요.',
  errNoWebgpu:
    '이 브라우저/기기는 WebGPU를 지원하지 않아 WebLLM을 실행할 수 없습니다. 설정에서 다른 엔진을 선택하세요.',
  errBuiltinUnavailable:
    'Chrome 내장 AI를 사용할 수 없습니다. 설정에서 WebLLM 모델을 내려받거나 Claude API 키를 추가하세요.',
  errWebgpuSummarize:
    '이 브라우저/기기는 WebGPU를 지원하지 않습니다. Chrome/Edge 113+ 또는 WebGPU 지원 브라우저가 필요합니다.',
  errBuiltinUnsupported: '이 브라우저는 내장 AI(Prompt API)를 지원하지 않습니다.',
  errGeminiServer: (status: number, detail: string) =>
    `Gemini 서버 오류 ${status}${detail}. 키가 올바른지 확인하거나 다른 엔진을 선택하세요.`,
  errGeminiModelList: (status: number) =>
    `Gemini 모델 목록 오류 ${status}. 키를 확인하세요.`,

  aiSummary: 'AI 요약',
  aiSummaryTitle: 'AI 요약 열기',
  collapse: '접기',
  seenToday: (n: number, total: number) => `오늘 ${n}/${total} 봄`,
  seenCheckbox: '봤음',
  seenCheckboxTitle: '검토 완료 표시 (PR Lens, 로컬 저장)',
  noFilesTitle: '변경된 파일을 찾지 못했습니다.',
  noFilesHint: '“Files changed” 탭을 열고 스크롤하여 diff를 불러오세요.',
}

const TABLE: Record<Lang, Strings> = { en, ko }

export function dict(lang: Lang | undefined): Strings {
  return TABLE[lang ?? DEFAULT_LANG] ?? en
}

export function availabilityLabel(t: Strings, code: string): string {
  switch (code) {
    case 'available':
      return t.availAvailable
    case 'downloadable':
      return t.availDownloadable
    case 'downloading':
      return t.availDownloading
    case 'unavailable':
      return t.availUnavailable
    default:
      return code
  }
}
