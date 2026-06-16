import { vi } from 'vitest'

type Store = Record<string, unknown>

function makeArea() {
  let data: Store = {}
  return {
    get: vi.fn(async (keys?: string | string[] | null) => {
      if (keys == null) return { ...data }
      if (typeof keys === 'string') return { [keys]: data[keys] }
      const out: Store = {}
      for (const k of keys) out[k] = data[k]
      return out
    }),
    set: vi.fn(async (items: Store) => {
      Object.assign(data, items)
    }),
    remove: vi.fn(async (key: string) => {
      delete data[key]
    }),
    clear: vi.fn(async () => {
      data = {}
    }),
    _reset() {
      data = {}
    },
  }
}

export const chromeMock = {
  storage: {
    local: makeArea(),
    session: makeArea(),
    onChanged: { addListener: vi.fn(), removeListener: vi.fn() },
  },
  runtime: {
    sendMessage: vi.fn(),
    connect: vi.fn(),
    openOptionsPage: vi.fn(),
    onMessage: { addListener: vi.fn() },
    onConnect: { addListener: vi.fn() },
  },
}

export function resetChromeMock() {
  chromeMock.storage.local._reset()
  chromeMock.storage.session._reset()
}
