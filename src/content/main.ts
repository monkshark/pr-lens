import { parsePrUrl, isFilesPage } from '../core/prKey'
import { SEL } from './selectors'
import { PrLens } from './panel'

let lens: PrLens | null = null
let currentKey = ''
let lastHref = ''

function getTitle(): string | undefined {
  const el = document.querySelector(SEL.issueTitle)
  return el?.textContent?.trim() || undefined
}

async function sync() {
  lastHref = location.href
  const path = location.pathname
  const ref = parsePrUrl(path)
  if (ref && isFilesPage(path)) {
    if (lens && currentKey === ref.prKey) {
      lens.rescan()
      return
    }
    if (lens) lens.unmount()
    lens = new PrLens({ ...ref, title: getTitle() })
    currentKey = ref.prKey
    await lens.mount()
  } else if (lens) {
    lens.unmount()
    lens = null
    currentKey = ''
  }
}

function hookHistory() {
  const fire = () => window.dispatchEvent(new Event('gh-prh-loc'))
  for (const key of ['pushState', 'replaceState'] as const) {
    const original = history[key]
    history[key] = function (this: History, ...args: unknown[]) {
      const result = original.apply(this, args as Parameters<History[typeof key]>)
      fire()
      return result
    } as History[typeof key]
  }
  window.addEventListener('popstate', fire)
}

let navTimer: ReturnType<typeof setTimeout> | undefined
function scheduleSync() {
  if (navTimer) clearTimeout(navTimer)
  navTimer = setTimeout(() => void sync(), 300)
}

function isOwnMutation(records: MutationRecord[]): boolean {
  return records.every((r) => {
    const t = r.target as Element
    return !!(t.closest?.('#gh-prh-panel') || t.closest?.('.gh-prh-seen'))
  })
}

let scanTimer: ReturnType<typeof setTimeout> | undefined
function scheduleRescan() {
  if (!lens) return
  if (scanTimer) clearTimeout(scanTimer)
  scanTimer = setTimeout(() => {
    observer.disconnect()
    lens?.rescan()
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    })
  }, 300)
}

function onMutations(records: MutationRecord[]) {
  if (location.href !== lastHref) {
    lastHref = location.href
    scheduleSync()
    return
  }
  if (isOwnMutation(records)) return
  if (!lens) {
    if (parsePrUrl(location.pathname) && isFilesPage(location.pathname)) {
      scheduleSync()
    }
    return
  }
  scheduleRescan()
}

hookHistory()
window.addEventListener('gh-prh-loc', scheduleSync)

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local' || !changes.settings || !lens) return
  const before = (changes.settings.oldValue as { lang?: string } | undefined)
    ?.lang
  const after = (changes.settings.newValue as { lang?: string } | undefined)
    ?.lang
  if (before === after) return
  lens.unmount()
  lens = null
  currentKey = ''
  void sync()
})

const observer = new MutationObserver(onMutations)
observer.observe(document.documentElement, { childList: true, subtree: true })

void sync()
