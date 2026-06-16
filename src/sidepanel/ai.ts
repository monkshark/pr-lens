import Anthropic from '@anthropic-ai/sdk'
import { DEFAULT_LANG, type Lang } from '../types'
import { dict } from '../core/i18n'

export function builtinSupported(): boolean {
  return typeof LanguageModel !== 'undefined'
}

export function webgpuSupported(): boolean {
  return typeof navigator !== 'undefined' && 'gpu' in navigator
}

type WebllmEngine = Awaited<
  ReturnType<typeof import('@mlc-ai/web-llm').CreateMLCEngine>
>

let enginePromise: Promise<WebllmEngine> | null = null
let engineModel = ''

async function getEngine(
  model: string,
  onProgress?: (progress: number, text: string) => void,
): Promise<WebllmEngine> {
  if (enginePromise && engineModel === model) return enginePromise
  const { CreateMLCEngine } = await import('@mlc-ai/web-llm')
  engineModel = model
  enginePromise = CreateMLCEngine(model, {
    initProgressCallback: (report) =>
      onProgress?.(report.progress, report.text),
  })
  return enginePromise
}

export async function summarizeWebllm(
  model: string,
  system: string,
  user: string,
  onChunk: (text: string) => void,
  onProgress?: (progress: number, text: string) => void,
  lang: Lang = DEFAULT_LANG,
): Promise<void> {
  if (!webgpuSupported()) {
    throw new Error(dict(lang).errWebgpuSummarize)
  }
  const engine = await getEngine(model, onProgress)
  const stream = await engine.chat.completions.create({
    stream: true,
    temperature: 0.3,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
  })
  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content
    if (delta) onChunk(delta)
  }
}

export async function isWebllmCached(model: string): Promise<boolean> {
  try {
    const { hasModelInCache } = await import('@mlc-ai/web-llm')
    return await hasModelInCache(model)
  } catch {
    return false
  }
}

export async function prefetchWebllm(
  model: string,
  onProgress?: (progress: number, text: string) => void,
): Promise<void> {
  await getEngine(model, onProgress)
}

export async function builtinAvailability(): Promise<LanguageModelAvailability> {
  if (typeof LanguageModel === 'undefined') return 'unavailable'
  return LanguageModel.availability()
}

export async function summarizeBuiltin(
  system: string,
  user: string,
  onChunk: (text: string) => void,
  onProgress?: (loaded: number) => void,
  lang: Lang = DEFAULT_LANG,
): Promise<void> {
  if (typeof LanguageModel === 'undefined') {
    throw new Error(dict(lang).errBuiltinUnsupported)
  }
  const session = await LanguageModel.create({
    initialPrompts: [{ role: 'system', content: system }],
    monitor(m) {
      m.addEventListener('downloadprogress', (e) => onProgress?.(e.loaded))
    },
  })
  try {
    const stream = session.promptStreaming(user)
    const reader = stream.getReader()
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      if (value) onChunk(value)
    }
  } finally {
    session.destroy()
  }
}

export async function summarizeGemini(
  apiKey: string,
  model: string,
  system: string,
  user: string,
  onChunk: (text: string) => void,
  lang: Lang = DEFAULT_LANG,
): Promise<void> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model,
  )}:streamGenerateContent?alt=sse`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: 'user', parts: [{ text: user }] }],
      generationConfig: { temperature: 0.3 },
    }),
  })
  if (!res.ok || !res.body) {
    let detail = ''
    try {
      const err = await res.json()
      detail = err?.error?.message ? ` (${err.error.message})` : ''
    } catch {
      detail = ''
    }
    throw new Error(dict(lang).errGeminiServer(res.status, detail))
  }
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed.startsWith('data:')) continue
      const payload = trimmed.slice(5).trim()
      if (!payload || payload === '[DONE]') continue
      try {
        const json = JSON.parse(payload)
        const parts = json.candidates?.[0]?.content?.parts
        if (Array.isArray(parts)) {
          for (const p of parts) {
            if (typeof p.text === 'string' && p.text) onChunk(p.text)
          }
        }
      } catch {
        continue
      }
    }
  }
}

export async function listGeminiModels(
  apiKey: string,
  lang: Lang = DEFAULT_LANG,
): Promise<{ id: string; label: string }[]> {
  const res = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models?pageSize=200',
    { headers: { 'x-goog-api-key': apiKey } },
  )
  if (!res.ok) {
    throw new Error(dict(lang).errGeminiModelList(res.status))
  }
  const json = await res.json()
  const models = Array.isArray(json.models) ? json.models : []
  return models
    .filter((m: { supportedGenerationMethods?: string[] }) =>
      (m.supportedGenerationMethods ?? []).includes('generateContent'),
    )
    .map((m: { name: string; displayName?: string }) => {
      const id = String(m.name).replace(/^models\//, '')
      return { id, label: m.displayName ? `${m.displayName} · ${id}` : id }
    })
}

export async function listClaudeModels(
  apiKey: string,
): Promise<{ id: string; label: string }[]> {
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })
  const res = await client.models.list({ limit: 100 })
  return res.data.map((m) => ({
    id: m.id,
    label: m.display_name ? `${m.display_name} · ${m.id}` : m.id,
  }))
}

export async function summarizeClaude(
  apiKey: string,
  model: string,
  system: string,
  user: string,
  onChunk: (text: string) => void,
): Promise<void> {
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })
  const stream = client.messages.stream({
    model,
    max_tokens: 16000,
    thinking: { type: 'adaptive' },
    system,
    messages: [{ role: 'user', content: user }],
  })
  for await (const event of stream) {
    if (
      event.type === 'content_block_delta' &&
      event.delta.type === 'text_delta'
    ) {
      onChunk(event.delta.text)
    }
  }
}
