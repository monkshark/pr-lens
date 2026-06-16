import type { PrReviewState, PrSummary, Settings } from '../types'

const stateKey = (prKey: string) => `pr:${prKey}`
const SETTINGS_KEY = 'settings'

export async function getState(prKey: string): Promise<PrReviewState> {
  const k = stateKey(prKey)
  const got = await chrome.storage.local.get(k)
  return (got[k] as PrReviewState | undefined) ?? { prKey, seenFiles: {} }
}

export async function setSeen(
  prKey: string,
  path: string,
  seen: boolean,
  at: number,
): Promise<PrReviewState> {
  const state = await getState(prKey)
  if (seen) state.seenFiles[path] = { seen: true, at }
  else delete state.seenFiles[path]
  await chrome.storage.local.set({ [stateKey(prKey)]: state })
  return state
}

export async function saveSummary(
  prKey: string,
  summary: PrSummary,
): Promise<void> {
  const state = await getState(prKey)
  state.summary = summary
  await chrome.storage.local.set({ [stateKey(prKey)]: state })
}

export async function getSettings(): Promise<Settings> {
  const got = await chrome.storage.local.get(SETTINGS_KEY)
  return (got[SETTINGS_KEY] as Settings | undefined) ?? {}
}

export async function setSettings(patch: Settings): Promise<Settings> {
  const current = await getSettings()
  const next = { ...current, ...patch }
  await chrome.storage.local.set({ [SETTINGS_KEY]: next })
  return next
}
