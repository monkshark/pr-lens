import { beforeEach } from 'vitest'
import { chromeMock, resetChromeMock } from './helpers/chromeMock'

;(globalThis as unknown as { chrome: typeof chromeMock }).chrome = chromeMock

beforeEach(() => {
  resetChromeMock()
})
