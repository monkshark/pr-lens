export interface PrRef {
  owner: string
  repo: string
  number: number
  prKey: string
  title?: string
}

export interface SeenFile {
  seen: boolean
  at: number
}

export interface PrSummary {
  text: string
  model: string
  generatedAt: number
}

export interface PrReviewState {
  prKey: string
  seenFiles: Record<string, SeenFile>
  summary?: PrSummary
}

export type AiProvider = 'webllm' | 'builtin' | 'gemini' | 'claude'

export type Lang = 'en' | 'ko'

export interface Settings {
  lang?: Lang
  aiProvider?: AiProvider
  githubToken?: string
  anthropicKey?: string
  summaryModel?: string
  webllmModel?: string
  geminiKey?: string
  geminiModel?: string
}

export const DEFAULT_WEBLLM_MODEL = 'Qwen2.5-3B-Instruct-q4f16_1-MLC'
export const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash'
export const DEFAULT_LANG: Lang = 'en'
