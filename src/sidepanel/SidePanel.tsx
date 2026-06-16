import { useCallback, useEffect, useRef, useState } from 'react'
import {
  DEFAULT_GEMINI_MODEL,
  DEFAULT_LANG,
  DEFAULT_WEBLLM_MODEL,
  type AiProvider,
  type Lang,
  type PrRef,
  type Settings,
} from '../types'
import { fetchPrData } from '../core/github'
import { buildSummaryPrompt, SUMMARY_SYSTEM } from '../core/summaryPrompt'
import { getSettings, getState, saveSummary } from '../core/storage'
import { dict } from '../core/i18n'
import {
  builtinAvailability,
  summarizeBuiltin,
  summarizeClaude,
  summarizeGemini,
  summarizeWebllm,
  webgpuSupported,
} from './ai'

type Status = 'idle' | 'loading' | 'streaming' | 'done' | 'error'

const ACCENT = '#7c6cf5'
const SMALL_MAX_DIFF = 8000
const GEMINI_MAX_DIFF = 40000
const CLAUDE_MAX_DIFF = 60000

export function SidePanel() {
  const [pr, setPr] = useState<PrRef | null>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  const [note, setNote] = useState('')
  const [usedModel, setUsedModel] = useState('')
  const [lang, setLang] = useState<Lang>(DEFAULT_LANG)
  const running = useRef(false)
  const t = dict(lang)

  const run = useCallback(async (target: PrRef) => {
    if (running.current) return
    running.current = true
    setStatus('loading')
    setText('')
    setError('')
    setNote('')
    try {
      const settings: Settings = await getSettings()
      const tr = dict(settings.lang)
      setLang(settings.lang ?? DEFAULT_LANG)
      const provider = await resolveProvider(settings)

      setNote(tr.noteFetching)
      const data = await fetchPrData(target, settings.githubToken)

      const maxDiff =
        provider === 'claude'
          ? CLAUDE_MAX_DIFF
          : provider === 'gemini'
            ? GEMINI_MAX_DIFF
            : SMALL_MAX_DIFF
      const prompt = buildSummaryPrompt(target, data, maxDiff)

      setStatus('streaming')
      const onChunk = (chunk: string) => setText((prev) => prev + chunk)

      let model: string
      if (provider === 'gemini') {
        model = settings.geminiModel || DEFAULT_GEMINI_MODEL
        if (!settings.geminiKey) throw new Error(tr.errNoGeminiKey)
        setNote(tr.noteGemini)
        await summarizeGemini(
          settings.geminiKey,
          model,
          SUMMARY_SYSTEM,
          prompt,
          onChunk,
          settings.lang,
        )
      } else if (provider === 'webllm') {
        model = settings.webllmModel || DEFAULT_WEBLLM_MODEL
        setNote(tr.noteWebllm)
        await summarizeWebllm(
          model,
          SUMMARY_SYSTEM,
          prompt,
          onChunk,
          (progress, text) =>
            setNote(
              progress < 1
                ? tr.notePreparingWebllm(Math.round(progress * 100), text)
                : tr.noteWebllm,
            ),
          settings.lang,
        )
      } else if (provider === 'builtin') {
        model = 'chrome-builtin'
        setNote(tr.noteBuiltin)
        await summarizeBuiltin(
          SUMMARY_SYSTEM,
          prompt,
          onChunk,
          (loaded) =>
            setNote(tr.noteBuiltinDownloading(Math.round(loaded * 100))),
          settings.lang,
        )
      } else {
        model = settings.summaryModel || 'claude-opus-4-8'
        if (!settings.anthropicKey) throw new Error(tr.errNoClaudeKey)
        setNote(tr.noteClaude)
        await summarizeClaude(
          settings.anthropicKey,
          model,
          SUMMARY_SYSTEM,
          prompt,
          onChunk,
        )
      }

      setUsedModel(model)
      setNote('')
      setStatus('done')
      setText((finalText) => {
        void saveSummary(target.prKey, {
          text: finalText,
          model,
          generatedAt: Date.now(),
        })
        return finalText
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setStatus('error')
      setNote('')
    } finally {
      running.current = false
    }
  }, [])

  const loadCachedOrRun = useCallback(
    async (target: PrRef) => {
      const state = await getState(target.prKey)
      if (state.summary) {
        setText(state.summary.text)
        setUsedModel(state.summary.model)
        setStatus('done')
        setNote('')
        setError('')
        return
      }
      void run(target)
    },
    [run],
  )

  useEffect(() => {
    void getSettings().then((s) => setLang(s.lang ?? DEFAULT_LANG))
    const onSettings = (
      changes: Record<string, chrome.storage.StorageChange>,
      area: string,
    ) => {
      if (area !== 'local' || !changes.settings) return
      const next = changes.settings.newValue as Settings | undefined
      setLang(next?.lang ?? DEFAULT_LANG)
    }
    chrome.storage.onChanged.addListener(onSettings)
    return () => chrome.storage.onChanged.removeListener(onSettings)
  }, [])

  useEffect(() => {
    void chrome.storage.session.get('activePr').then((got) => {
      const target = got.activePr as PrRef | undefined
      if (target) {
        setPr(target)
        void loadCachedOrRun(target)
      }
    })
    const onChanged = (
      changes: Record<string, chrome.storage.StorageChange>,
      area: string,
    ) => {
      if (area !== 'session' || !changes.activePr) return
      const target = changes.activePr.newValue as PrRef | undefined
      if (target) {
        setPr(target)
        void loadCachedOrRun(target)
      }
    }
    chrome.storage.onChanged.addListener(onChanged)
    return () => chrome.storage.onChanged.removeListener(onChanged)
  }, [loadCachedOrRun])

  const busy = status === 'loading' || status === 'streaming'

  return (
    <div className="flex h-screen flex-col bg-[#0c0e13] text-[13px] text-[#e6edf3]">
      <header className="flex items-center gap-[9px] border-b border-[#191c22] px-4 py-[14px]">
        <Logo />
        <span className="text-[14px] font-semibold">PR Lens</span>
        <div className="flex-1" />
        <button
          className="cursor-pointer text-[12.5px] font-medium"
          style={{ color: pr ? ACCENT : '#6e7681' }}
          onClick={() => chrome.runtime.openOptionsPage()}
        >
          {t.settings}
        </button>
        <button
          className="flex h-[26px] w-[26px] items-center justify-center rounded-[6px] text-[#8b949e] hover:bg-[#1b1f27] hover:text-[#e6edf3]"
          title={t.close}
          onClick={() => window.close()}
        >
          <svg width="14" height="14" viewBox="0 0 16 16">
            <path
              d="M4 4l8 8M12 4l-8 8"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </header>

      {!pr && (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-[30px] text-center">
          <div className="flex h-[46px] w-[46px] items-center justify-center rounded-[13px] border border-[#23272f] bg-[#13151c]">
            <span className="block h-[18px] w-[18px] rounded-full border-[2.5px] border-[#5b626c]" />
          </div>
          <p className="m-0 max-w-[248px] text-[13px] leading-[1.6] text-[#8b949e]">
            {t.emptyPre}
            <span className="font-medium" style={{ color: ACCENT }}>
              {t.emptyEmph}
            </span>
            {t.emptyPost}
          </p>
        </div>
      )}

      {pr && (
        <>
          <div className="border-b border-[#15181e] px-4 py-[14px]">
            <div className="text-[14.5px] font-semibold leading-[1.35] text-[#e6edf3]">
              {pr.title || `${pr.owner}/${pr.repo}#${pr.number}`}
            </div>
            <div className="mt-1 font-mono text-[11.5px] text-[#8b949e]">
              {pr.owner}/{pr.repo}#{pr.number}
            </div>
          </div>

          {note && (
            <div className="flex items-center gap-2 px-4 pb-[2px] pt-[11px]">
              <Spinner />
              <span className="text-[12px] text-[#8b949e]">{note}</span>
            </div>
          )}

          {status === 'done' && text && (
            <div className="flex items-center gap-[7px] px-4 pb-[2px] pt-[11px]">
              <Check />
              <span className="text-[12px] text-[#8b949e]">{t.summaryReady}</span>
            </div>
          )}

          <div className="flex-1 overflow-y-auto px-4 pb-4 pt-[6px]">
            {error && (
              <div
                className="flex gap-[11px] rounded-[10px] p-[13px_14px]"
                style={{
                  border: '1px solid color-mix(in srgb,#f85149 45%,#21242c)',
                  background: 'color-mix(in srgb,#f85149 10%,transparent)',
                }}
              >
                <div className="flex h-[19px] w-[19px] flex-shrink-0 items-center justify-center rounded-full bg-[#f85149] text-[13px] font-bold leading-none text-[#0c0e13]">
                  !
                </div>
                <div>
                  <div className="text-[13px] font-semibold text-[#f0a9a5]">
                    {t.summaryFailed}
                  </div>
                  <div className="mt-1 text-[12.5px] leading-[1.55] text-[#c89b98]">
                    {error}
                  </div>
                </div>
              </div>
            )}

            {text && <Summary text={text} streaming={status === 'streaming'} />}
          </div>

          <div className="flex items-center justify-between border-t border-[#191c22] px-4 py-[11px]">
            <span className="font-mono text-[11px] text-[#6e7681]">
              {usedModel ? t.modelLabel(usedModel) : t.modelNone}
            </span>
            <button
              className="flex items-center gap-[7px] rounded-[8px] border border-[#2b303a] bg-[#1b1f27] px-[13px] py-[7px] text-[12.5px] font-medium text-[#c9d1d9] hover:border-[#3a4150] hover:text-white disabled:cursor-default disabled:opacity-85 disabled:hover:border-[#2b303a] disabled:hover:text-[#8b949e]"
              disabled={busy}
              onClick={() => void run(pr)}
            >
              {busy && <Spinner small />}
              {busy ? t.summarizing : t.reSummarize}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

async function resolveProvider(settings: Settings): Promise<AiProvider> {
  const t = dict(settings.lang)
  const preferred: AiProvider = settings.aiProvider ?? 'builtin'
  if (preferred === 'gemini') {
    if (settings.geminiKey) return 'gemini'
    throw new Error(t.errNoGeminiKeySettings)
  }
  if (preferred === 'webllm') {
    if (webgpuSupported()) return 'webllm'
    throw new Error(t.errNoWebgpu)
  }
  if (preferred === 'claude') {
    if (settings.anthropicKey) return 'claude'
    throw new Error(t.errNoClaudeKeySettings)
  }
  const availability = await builtinAvailability()
  if (availability !== 'unavailable') return 'builtin'
  throw new Error(t.errBuiltinUnavailable)
}

function Logo() {
  return (
    <div
      className="flex h-5 w-5 items-center justify-center rounded-[6px]"
      style={{ background: ACCENT }}
    >
      <div className="h-[9px] w-[9px] rounded-full border-2 border-white" />
    </div>
  )
}

function Spinner({ small }: { small?: boolean }) {
  const size = small ? 11 : 12
  return (
    <span
      className="inline-block animate-spin rounded-full"
      style={{
        width: size,
        height: size,
        border: `2px solid ${small ? '#3a3f49' : '#2b2f37'}`,
        borderTopColor: small ? '#8b949e' : ACCENT,
      }}
    />
  )
}

function Check() {
  return (
    <span className="inline-flex h-[13px] w-[13px] items-center justify-center rounded-full bg-[#3fb950]">
      <svg width="8" height="8" viewBox="0 0 12 12">
        <path
          d="M2.5 6.3l2.4 2.4 4.6-5.4"
          fill="none"
          stroke="#0c0e13"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  )
}

function Summary({ text, streaming }: { text: string; streaming: boolean }) {
  const lines = text.split('\n')
  const lastIdx = lines.length - 1
  return (
    <div>
      {lines.map((line, i) => {
        const caret =
          streaming && i === lastIdx ? (
            <span
              className="ml-[1px] inline-block h-[15px] w-[7px] animate-pulse rounded-[1px] align-[-2px]"
              style={{ background: ACCENT }}
            />
          ) : null

        const heading = line.match(/^#{1,2}\s+(.*)$/)
        if (heading)
          return (
            <div
              key={i}
              className="mt-[18px] mb-2 text-[11px] font-bold uppercase tracking-[0.08em] first:mt-[14px]"
              style={{ color: ACCENT }}
            >
              {heading[1]}
              {caret}
            </div>
          )

        const bullet = line.match(/^\s*[-*]\s+(.*)$/)
        if (bullet)
          return (
            <div
              key={i}
              className="mb-[6px] flex gap-2 text-[13px] leading-[1.55] text-[#c2c8d0]"
            >
              <span className="flex-shrink-0 text-[#5b626c]">–</span>
              <span>
                {bullet[1]}
                {caret}
              </span>
            </div>
          )

        if (!line.trim()) return <div key={i} className="h-2" />
        return (
          <p key={i} className="mb-[6px] text-[13px] leading-[1.55] text-[#c2c8d0]">
            {line}
            {caret}
          </p>
        )
      })}
    </div>
  )
}
