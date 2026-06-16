interface LanguageModelMonitor {
  addEventListener(
    type: 'downloadprogress',
    listener: (event: { loaded: number }) => void,
  ): void
}

interface LanguageModelPrompt {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface LanguageModelCreateOptions {
  initialPrompts?: LanguageModelPrompt[]
  temperature?: number
  topK?: number
  signal?: AbortSignal
  monitor?: (monitor: LanguageModelMonitor) => void
}

interface LanguageModelSession {
  prompt(input: string, options?: { signal?: AbortSignal }): Promise<string>
  promptStreaming(
    input: string,
    options?: { signal?: AbortSignal },
  ): ReadableStream<string>
  destroy(): void
  inputUsage: number
  inputQuota: number
}

type LanguageModelAvailability =
  | 'unavailable'
  | 'downloadable'
  | 'downloading'
  | 'available'

declare const LanguageModel:
  | {
      availability(): Promise<LanguageModelAvailability>
      create(options?: LanguageModelCreateOptions): Promise<LanguageModelSession>
      params(): Promise<{
        defaultTemperature: number
        maxTemperature: number
        defaultTopK: number
        maxTopK: number
      }>
    }
  | undefined
