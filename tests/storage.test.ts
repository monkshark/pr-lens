import { describe, it, expect } from 'vitest'
import {
  getState,
  setSeen,
  saveSummary,
  getSettings,
  setSettings,
} from '../src/core/storage'

const KEY = 'owner/repo#1'

describe('review state storage', () => {
  it('returns an empty state for an unknown PR', async () => {
    const state = await getState(KEY)
    expect(state).toEqual({ prKey: KEY, seenFiles: {} })
  })

  it('marks and unmarks a file as seen', async () => {
    await setSeen(KEY, 'src/a.ts', true, 1000)
    let state = await getState(KEY)
    expect(state.seenFiles['src/a.ts']).toEqual({ seen: true, at: 1000 })

    await setSeen(KEY, 'src/a.ts', false, 2000)
    state = await getState(KEY)
    expect(state.seenFiles['src/a.ts']).toBeUndefined()
  })

  it('persists a summary without dropping seen files', async () => {
    await setSeen(KEY, 'src/b.ts', true, 1000)
    await saveSummary(KEY, { text: 'hi', model: 'chrome-builtin', generatedAt: 5 })
    const state = await getState(KEY)
    expect(state.summary?.text).toBe('hi')
    expect(state.seenFiles['src/b.ts']?.seen).toBe(true)
  })
})

describe('settings storage', () => {
  it('defaults to an empty object', async () => {
    expect(await getSettings()).toEqual({})
  })

  it('merges patches instead of replacing', async () => {
    await setSettings({ aiProvider: 'builtin', githubToken: 'g' })
    await setSettings({ anthropicKey: 'k' })
    expect(await getSettings()).toEqual({
      aiProvider: 'builtin',
      githubToken: 'g',
      anthropicKey: 'k',
    })
  })
})
