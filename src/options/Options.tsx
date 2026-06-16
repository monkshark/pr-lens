import { useEffect, useState, type ReactNode } from 'react'
import {
  DEFAULT_GEMINI_MODEL,
  DEFAULT_LANG,
  DEFAULT_WEBLLM_MODEL,
  type AiProvider,
  type Lang,
  type Settings,
} from '../types'
import { getSettings, setSettings } from '../core/storage'
import { availabilityLabel, dict } from '../core/i18n'
import {
  builtinAvailability,
  isWebllmCached,
  listClaudeModels,
  listGeminiModels,
  prefetchWebllm,
  webgpuSupported,
} from '../sidepanel/ai'

const ACCENT = '#7c6cf5'

const CLAUDE_MODELS: { id: string; label: string }[] = [
  { id: 'claude-opus-4-8', label: 'Claude Opus 4.8 — most capable' },
  { id: 'claude-opus-4-7', label: 'Claude Opus 4.7' },
  { id: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6 — faster · cheaper' },
  { id: 'claude-haiku-4-5', label: 'Claude Haiku 4.5 — cheapest' },
  { id: 'claude-fable-5', label: 'Claude Fable 5 — highest tier' },
]

const GEMINI_MODELS: { id: string; label: string }[] = [
  { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash — recommended (free tier)' },
  { id: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash-Lite — fastest' },
  { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro — highest quality' },
  { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
]

const WEBLLM_MODELS: { id: string; label: string }[] = [
  { id: 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC', label: 'Qwen2.5 1.5B — light · ~1.1 GB' },
  { id: 'Qwen2.5-3B-Instruct-q4f16_1-MLC', label: 'Qwen2.5 3B — balanced · ~2 GB · recommended' },
  { id: 'Llama-3.2-3B-Instruct-q4f16_1-MLC', label: 'Llama 3.2 3B · ~2 GB' },
  { id: 'Qwen2.5-7B-Instruct-q4f16_1-MLC', label: 'Qwen2.5 7B — high quality · ~4.5 GB' },
]

export function Options() {
  const [lang, setLang] = useState<Lang>(DEFAULT_LANG)
  const [provider, setProvider] = useState<AiProvider>('builtin')
  const [githubToken, setGithubToken] = useState('')
  const [anthropicKey, setAnthropicKey] = useState('')
  const [summaryModel, setSummaryModel] = useState('claude-opus-4-8')
  const [geminiKey, setGeminiKey] = useState('')
  const [geminiModel, setGeminiModel] = useState(DEFAULT_GEMINI_MODEL)
  const [webllmModel, setWebllmModel] = useState(DEFAULT_WEBLLM_MODEL)
  const [builtinAvail, setBuiltinAvail] = useState('')
  const [webgpu] = useState(webgpuSupported())
  const [cached, setCached] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [progress, setProgress] = useState('')
  const [pct, setPct] = useState(0)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [geminiModels, setGeminiModels] = useState(GEMINI_MODELS)
  const [claudeModels, setClaudeModels] = useState(CLAUDE_MODELS)
  const [modelLoading, setModelLoading] = useState(false)
  const [modelMsg, setModelMsg] = useState('')

  useEffect(() => {
    void getSettings().then((s: Settings) => {
      const known: AiProvider[] = ['builtin', 'webllm', 'gemini', 'claude']
      setLang(s.lang ?? DEFAULT_LANG)
      setProvider(
        s.aiProvider && known.includes(s.aiProvider) ? s.aiProvider : 'builtin',
      )
      setGithubToken(s.githubToken ?? '')
      setAnthropicKey(s.anthropicKey ?? '')
      setSummaryModel(s.summaryModel || 'claude-opus-4-8')
      setGeminiKey(s.geminiKey ?? '')
      setGeminiModel(s.geminiModel || DEFAULT_GEMINI_MODEL)
      setWebllmModel(s.webllmModel || DEFAULT_WEBLLM_MODEL)
    })
    void builtinAvailability().then(setBuiltinAvail)
  }, [])

  const t = dict(lang)

  const changeLang = (next: Lang) => {
    setLang(next)
    void setSettings({ lang: next })
  }

  useEffect(() => {
    void isWebllmCached(webllmModel).then(setCached)
  }, [webllmModel])

  useEffect(() => {
    setSaveError('')
    setModelMsg('')
  }, [provider, geminiKey])

  const save = async () => {
    if (provider === 'gemini' && !geminiKey.trim()) {
      setSaveError(t.saveGeminiKeyRequired)
      return
    }
    setSaveError('')
    await setSettings({
      lang,
      aiProvider: provider,
      githubToken: githubToken.trim(),
      anthropicKey: anthropicKey.trim(),
      summaryModel: summaryModel.trim() || 'claude-opus-4-8',
      geminiKey: geminiKey.trim(),
      geminiModel: geminiModel.trim() || DEFAULT_GEMINI_MODEL,
      webllmModel,
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2400)
  }

  const download = async () => {
    setDownloading(true)
    setProgress(t.progStarting)
    setPct(0)
    try {
      await prefetchWebllm(webllmModel, (p, text) => {
        setPct(Math.round(p * 100))
        setProgress(`${Math.round(p * 100)}% — ${text}`)
      })
      await setSettings({ webllmModel, aiProvider: 'webllm' })
      setProvider('webllm')
      setCached(true)
      setProgress(t.progDone)
      setPct(100)
    } catch (e) {
      setProgress(t.progFailed(e instanceof Error ? e.message : String(e)))
    } finally {
      setDownloading(false)
    }
  }

  const refreshModels = async () => {
    const key = provider === 'gemini' ? geminiKey.trim() : anthropicKey.trim()
    if (!key) {
      setModelMsg(t.modelEnterKeyFirst)
      return
    }
    setModelLoading(true)
    setModelMsg(t.modelLoadingMsg)
    try {
      if (provider === 'gemini') {
        const list = await listGeminiModels(key, lang)
        if (list.length) setGeminiModels(list)
        setModelMsg(t.modelLoadedMsg(list.length))
      } else {
        const list = await listClaudeModels(key)
        if (list.length) setClaudeModels(list)
        setModelMsg(t.modelLoadedMsg(list.length))
      }
    } catch (e) {
      setModelMsg(
        t.modelLoadFailMsg(e instanceof Error ? e.message : String(e)),
      )
    } finally {
      setModelLoading(false)
    }
  }

  const builtinOk = builtinAvail !== '' && builtinAvail !== 'unavailable'
  const builtinLabel =
    builtinAvail === '' ? t.availChecking : availabilityLabel(t, builtinAvail)

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-[#e6edf3]">
      <div className="mx-auto max-w-[760px] px-6 py-10 text-[13px]">
        <h1 className="m-0 text-[22px] font-semibold tracking-[-0.01em]">
          {t.optTitle}
        </h1>
        <p className="mt-[7px] text-[13.5px] text-[#8b949e]">
          {t.optSubtitle}
        </p>

        <Card title={t.langCardTitle} desc={t.langCardDesc}>
          <div className="flex gap-[8px]">
            <LangButton
              active={lang === 'en'}
              onClick={() => changeLang('en')}
            >
              {t.langEnglish}
            </LangButton>
            <LangButton
              active={lang === 'ko'}
              onClick={() => changeLang('ko')}
            >
              {t.langKorean}
            </LangButton>
          </div>
        </Card>

        <Card title={t.engineCardTitle} desc={t.engineCardDesc}>
          <div className="flex flex-col gap-[9px]">
            <Radio
              selected={provider === 'builtin'}
              onSelect={() => setProvider('builtin')}
              title={t.builtinTitle}
              meta={t.builtinMeta}
              pill={<Pill ok={builtinOk}>{builtinLabel}</Pill>}
            >
              <div className="mt-[3px] text-[12.5px] leading-[1.5] text-[#8b949e]">
                {t.builtinDesc}
              </div>
            </Radio>

            <Radio
              selected={provider === 'webllm'}
              onSelect={() => setProvider('webllm')}
              title={t.webllmTitle}
              meta={t.webllmMeta}
              pill={
                <Pill ok={webgpu}>
                  {webgpu ? t.webgpuSupported : t.webgpuUnsupported}
                </Pill>
              }
            >
              <div className="mt-[3px] text-[12.5px] leading-[1.5] text-[#8b949e]">
                {t.webllmDesc}
              </div>
            </Radio>

            <Radio
              selected={provider === 'gemini'}
              onSelect={() => setProvider('gemini')}
              title={t.geminiTitle}
              meta={t.geminiMeta}
            >
              <div className="mt-[3px] text-[12.5px] leading-[1.5] text-[#8b949e]">
                {t.geminiDesc}
              </div>
            </Radio>

            <Radio
              selected={provider === 'claude'}
              onSelect={() => setProvider('claude')}
              title={t.claudeTitle}
              meta={t.claudeMeta}
            >
              <div className="mt-[3px] text-[12.5px] leading-[1.5] text-[#8b949e]">
                {t.claudeDesc}
              </div>
            </Radio>
          </div>
        </Card>

        {provider === 'webllm' && (
        <Card title={t.webllmCardTitle} desc={t.webllmCardDesc}>
          <div className="flex items-center gap-[10px]">
            <div className="relative flex-1">
              <select
                className="dc-input w-full cursor-pointer appearance-none pr-8 font-mono"
                value={webllmModel}
                disabled={downloading}
                onChange={(e) => setWebllmModel(e.target.value)}
              >
                {WEBLLM_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-[11px] top-1/2 -translate-y-1/2 text-[10px] text-[#6e7681]">
                ▼
              </span>
            </div>
            <button
              className="whitespace-nowrap rounded-[8px] px-[15px] py-[9px] text-[13px] font-semibold text-white hover:brightness-110 disabled:cursor-default disabled:opacity-60"
              style={{ background: ACCENT }}
              disabled={downloading || !webgpu}
              onClick={() => void download()}
            >
              {downloading
                ? t.btnDownloading
                : cached
                  ? t.btnRedownload
                  : t.btnDownloadModel}
            </button>
          </div>

          {downloading && (
            <>
              <div className="mt-[14px] h-[7px] overflow-hidden rounded-full bg-[#21242c]">
                <div
                  className="h-full rounded-full transition-[width]"
                  style={{ width: `${pct}%`, background: ACCENT }}
                />
              </div>
              <div className="mt-[9px] text-[12px] text-[#8b949e]">{progress}</div>
            </>
          )}

          {!downloading && (
            <div className="mt-[11px] flex items-center gap-[7px] text-[12px] text-[#6e7681]">
              <span
                className="h-[7px] w-[7px] rounded-full"
                style={{ background: cached ? '#3fb950' : '#6e7681' }}
              />
              {!webgpu
                ? t.webgpuUnavailableHere
                : cached
                  ? t.statusReady
                  : progress || t.statusNotDownloaded}
            </div>
          )}
        </Card>
        )}

        <div className="mt-6 flex flex-col gap-[18px]">
          <Field
            label={t.ghTokenLabel}
            optional={t.optional}
            hint={t.ghTokenHint}
          >
            <input
              type="password"
              className="dc-input w-full font-mono"
              value={githubToken}
              placeholder="ghp_…"
              onChange={(e) => setGithubToken(e.target.value)}
            />
          </Field>

          {provider === 'gemini' && (
            <>
              <Field label={t.geminiKeyLabel} hint={t.geminiKeyHint}>
                <input
                  type="password"
                  className="dc-input w-full font-mono"
                  value={geminiKey}
                  placeholder="AIza…"
                  onChange={(e) => setGeminiKey(e.target.value)}
                />
                <GeminiKeyGuide hasKey={!!geminiKey.trim()} t={t} />
              </Field>

              <Field label={t.geminiModelLabel} hint={t.geminiModelHint}>
                <ModelSelect
                  models={geminiModels}
                  value={geminiModel}
                  onChange={setGeminiModel}
                  placeholder="gemini-…"
                  customLabel={t.modelCustom}
                />
                <ModelRefresh
                  onClick={() => void refreshModels()}
                  loading={modelLoading}
                  msg={modelMsg}
                  loadingLabel={t.modelLoadingBtn}
                  loadLabel={t.modelLoadBtn}
                />
              </Field>
            </>
          )}

          {provider === 'claude' && (
            <>
              <Field label={t.claudeKeyLabel} hint={t.claudeKeyHint}>
                <input
                  type="password"
                  className="dc-input w-full font-mono"
                  value={anthropicKey}
                  placeholder="sk-ant-…"
                  onChange={(e) => setAnthropicKey(e.target.value)}
                />
              </Field>

              <Field label={t.claudeModelLabel} hint={t.claudeModelHint}>
                <ModelSelect
                  models={claudeModels}
                  value={summaryModel}
                  onChange={setSummaryModel}
                  placeholder="claude-…"
                  customLabel={t.modelCustom}
                />
                <ModelRefresh
                  onClick={() => void refreshModels()}
                  loading={modelLoading}
                  msg={modelMsg}
                  loadingLabel={t.modelLoadingBtn}
                  loadLabel={t.modelLoadBtn}
                />
              </Field>
            </>
          )}
        </div>

        <div className="mt-[26px] flex items-center gap-[14px] border-t border-[#1a1e25] pt-5">
          <button
            className="rounded-[8px] px-5 py-[9px] text-[13.5px] font-semibold text-white hover:brightness-110"
            style={{ background: ACCENT }}
            onClick={() => void save()}
          >
            {t.btnSave}
          </button>
          {saved && (
            <span className="flex items-center gap-[6px] text-[13px] font-medium text-[#3fb950]">
              <span className="inline-flex h-[15px] w-[15px] items-center justify-center rounded-full bg-[#3fb950]">
                <svg width="9" height="9" viewBox="0 0 12 12">
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
              {t.saved}
            </span>
          )}
          {saveError && (
            <span className="flex items-center gap-[6px] text-[13px] font-medium text-[#f0a9a5]">
              <span className="inline-flex h-[15px] w-[15px] flex-shrink-0 items-center justify-center rounded-full bg-[#f85149] text-[11px] font-bold leading-none text-[#0c0e13]">
                !
              </span>
              {saveError}
            </span>
          )}
        </div>
      </div>

      <style>{`.dc-input{background:#0b0d12;border:1px solid #2b303a;border-radius:8px;padding:9px 11px;color:#e6edf3;font-size:13px;outline:none;transition:border-color .14s,box-shadow .14s}.dc-input:focus{border-color:${ACCENT};box-shadow:0 0 0 3px color-mix(in srgb,${ACCENT} 22%,transparent)}.dc-input option{background:#0b0d12}`}</style>
    </div>
  )
}

function Card({
  title,
  desc,
  children,
}: {
  title: string
  desc: string
  children: ReactNode
}) {
  return (
    <div className="mt-[18px] rounded-[12px] border border-[#20242b] bg-[#0c0e13] p-[18px] first-of-type:mt-6">
      <div className="m-0 text-[14px] font-semibold">{title}</div>
      <div className="mb-[14px] mt-[3px] text-[12.5px] text-[#8b949e]">{desc}</div>
      {children}
    </div>
  )
}

function Radio({
  selected,
  onSelect,
  title,
  meta,
  pill,
  children,
}: {
  selected: boolean
  onSelect: () => void
  title: string
  meta: string
  pill?: ReactNode
  children?: ReactNode
}) {
  return (
    <div
      className="flex cursor-pointer gap-[12px] rounded-[10px] p-[13px_14px] transition-all"
      style={{
        border: `1px solid ${selected ? ACCENT : '#23272f'}`,
        background: selected
          ? `color-mix(in srgb, ${ACCENT} 9%, transparent)`
          : 'transparent',
      }}
      onClick={onSelect}
    >
      <span
        className="mt-[1px] flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-full transition-all"
        style={{ border: `1.5px solid ${selected ? ACCENT : '#48505b'}` }}
      >
        <span
          className="h-[9px] w-[9px] rounded-full transition-opacity"
          style={{ background: ACCENT, opacity: selected ? 1 : 0 }}
        />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-[9px]">
          <span className="text-[13.5px] font-semibold text-[#e6edf3]">
            {title}
          </span>
          <span className="font-mono text-[11px] text-[#6e7681]">{meta}</span>
          {pill && (
            <>
              <div className="flex-1" />
              {pill}
            </>
          )}
        </div>
        {children}
      </div>
    </div>
  )
}

function Pill({ ok, children }: { ok: boolean; children: ReactNode }) {
  const color = ok ? '#3fb950' : '#f85149'
  return (
    <span
      className="whitespace-nowrap rounded-full px-[9px] py-[3px] text-[11px] font-semibold"
      style={{
        color: ok ? '#56d364' : '#f0a9a5',
        background: `color-mix(in srgb,${color} 16%,transparent)`,
        border: `1px solid color-mix(in srgb,${color} 30%,transparent)`,
      }}
    >
      {children}
    </span>
  )
}

function ModelSelect({
  models,
  value,
  onChange,
  placeholder,
  customLabel,
}: {
  models: { id: string; label: string }[]
  value: string
  onChange: (v: string) => void
  placeholder: string
  customLabel: string
}) {
  const inList = models.some((m) => m.id === value)
  const [custom, setCustom] = useState(!inList && value !== '')
  return (
    <>
      <div className="relative">
        <select
          className="dc-input w-full cursor-pointer appearance-none pr-8 font-mono"
          value={custom ? '__custom__' : value}
          onChange={(e) => {
            const v = e.target.value
            if (v === '__custom__') {
              setCustom(true)
              onChange('')
            } else {
              setCustom(false)
              onChange(v)
            }
          }}
        >
          {models.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
          <option value="__custom__">{customLabel}</option>
        </select>
        <span className="pointer-events-none absolute right-[11px] top-1/2 -translate-y-1/2 text-[10px] text-[#6e7681]">
          ▼
        </span>
      </div>
      {custom && (
        <input
          type="text"
          className="dc-input mt-2 w-full font-mono"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </>
  )
}

function ModelRefresh({
  onClick,
  loading,
  msg,
  loadingLabel,
  loadLabel,
}: {
  onClick: () => void
  loading: boolean
  msg: string
  loadingLabel: string
  loadLabel: string
}) {
  return (
    <div className="mt-[8px] flex items-center gap-[10px]">
      <button
        type="button"
        className="rounded-[7px] border border-[#2b303a] bg-[#11141a] px-[11px] py-[6px] text-[12px] font-medium text-[#c9d1d9] hover:border-[#3a4150] hover:text-white disabled:cursor-default disabled:opacity-60"
        disabled={loading}
        onClick={onClick}
      >
        {loading ? loadingLabel : loadLabel}
      </button>
      {msg && <span className="text-[11.5px] text-[#8b949e]">{msg}</span>}
    </div>
  )
}

function GeminiKeyGuide({
  hasKey,
  t,
}: {
  hasKey: boolean
  t: ReturnType<typeof dict>
}) {
  const steps = t.geminiSteps
  return (
    <div className="mt-[10px] rounded-[9px] border border-[#20242b] bg-[#0b0d12] p-[12px_13px]">
      <div className="mb-[9px] flex items-center justify-between gap-3">
        <span className="text-[12px] font-semibold text-[#c9d1d9]">
          {t.keyGuideTitle}
        </span>
        {hasKey && (
          <span className="flex items-center gap-[5px] text-[11.5px] font-medium text-[#3fb950]">
            <span className="inline-flex h-[13px] w-[13px] items-center justify-center rounded-full bg-[#3fb950]">
              <svg width="8" height="8" viewBox="0 0 12 12">
                <path
                  d="M2.5 6.3l2.4 2.4 4.6-5.4"
                  fill="none"
                  stroke="#0b0d12"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            {t.keyEntered}
          </span>
        )}
      </div>
      <ol className="m-0 flex flex-col gap-[6px] pl-0">
        {steps.map((s, i) => (
          <li key={i} className="flex gap-[9px] text-[12px] leading-[1.5]">
            <span
              className="flex h-[17px] w-[17px] flex-shrink-0 items-center justify-center rounded-full text-[10.5px] font-bold text-white"
              style={{ background: ACCENT }}
            >
              {i + 1}
            </span>
            <span className="text-[#a9b1bb]">{s}</span>
          </li>
        ))}
      </ol>
      <a
        href="https://aistudio.google.com/api-keys"
        target="_blank"
        rel="noreferrer"
        className="mt-[11px] inline-flex items-center gap-[7px] rounded-[8px] px-[14px] py-[8px] text-[12.5px] font-semibold text-white hover:brightness-110"
        style={{ background: ACCENT }}
      >
        {t.openAiStudio}
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
          <path
            d="M6 3h7v7M13 3 6 10M11 9v3.5A1.5 1.5 0 0 1 9.5 14h-6A1.5 1.5 0 0 1 2 12.5v-6A1.5 1.5 0 0 1 3.5 5H7"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </a>
    </div>
  )
}

function LangButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-[8px] px-[16px] py-[8px] text-[13px] font-semibold transition-colors"
      style={{
        border: `1px solid ${active ? ACCENT : '#23272f'}`,
        background: active
          ? `color-mix(in srgb, ${ACCENT} 12%, transparent)`
          : 'transparent',
        color: active ? '#e6edf3' : '#8b949e',
      }}
    >
      {children}
    </button>
  )
}

function Field({
  label,
  optional,
  hint,
  children,
}: {
  label: string
  optional?: string
  hint: string
  children: ReactNode
}) {
  return (
    <div>
      <label className="mb-[6px] block text-[13px] font-medium text-[#c9d1d9]">
        {label}{' '}
        {optional && (
          <span className="font-normal text-[#6e7681]">({optional})</span>
        )}
      </label>
      {children}
      <div className="mt-[6px] text-[12px] leading-[1.5] text-[#6e7681]">
        {hint}
      </div>
    </div>
  )
}
