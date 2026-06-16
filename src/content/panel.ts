import type { PrRef } from '../types'
import { getSettings, getState, setSeen } from '../core/storage'
import { dict } from '../core/i18n'
import { CSS } from './styles'
import {
  SEL,
  getFilePath,
  getFileStat,
  getFileAnchorId,
} from './selectors'

interface FileEntry {
  path: string
  el: HTMLElement
  anchorId: string | null
  additions: number
  deletions: number
}

const STYLE_ID = 'gh-prh-style'

export class PrLens {
  private pr: PrRef
  private root: HTMLElement | null = null
  private listEl: HTMLElement | null = null
  private barEl: HTMLElement | null = null
  private textEl: HTMLElement | null = null
  private pctEl: HTMLElement | null = null
  private files: FileEntry[] = []
  private seen: Record<string, { seen: boolean; at: number }> = {}
  private collapsed = false
  private listSig = ''
  private itemEls = new Map<string, HTMLElement>()
  private t = dict(undefined)

  constructor(pr: PrRef) {
    this.pr = pr
  }

  async mount() {
    const settings = await getSettings()
    this.t = dict(settings.lang)
    this.injectStyles()
    this.buildPanel()
    const state = await getState(this.pr.prKey)
    this.seen = state.seenFiles
    this.scan()
    this.render()
  }

  rescan() {
    if (!this.root || !document.body.contains(this.root)) {
      this.injectStyles()
      this.buildPanel()
    }
    this.scan()
    this.render()
  }

  unmount() {
    this.root?.remove()
    this.root = null
    document
      .querySelectorAll('.gh-prh-seen')
      .forEach((el) => el.remove())
    document
      .querySelectorAll('.gh-prh-file-seen')
      .forEach((el) => el.classList.remove('gh-prh-file-seen'))
  }

  private injectStyles() {
    if (document.getElementById(STYLE_ID)) return
    const style = document.createElement('style')
    style.id = STYLE_ID
    style.textContent = CSS
    document.head.appendChild(style)
  }

  private buildPanel() {
    const root = document.createElement('div')
    root.id = 'gh-prh-panel'
    root.innerHTML = `
      <div class="gh-prh-head">
        <span class="gh-prh-logo"><i></i></span>
        <span class="gh-prh-title">PR Lens</span>
        <button class="gh-prh-ai" data-act="ai" title="${this.t.aiSummaryTitle}"><i></i>${this.t.aiSummary}</button>
        <button class="gh-prh-collapse" data-act="collapse" title="${this.t.collapse}">
          <svg width="14" height="14" viewBox="0 0 16 16"><path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"></path></svg>
        </button>
      </div>
      <div class="gh-prh-progress">
        <div class="gh-prh-progress-text"><span data-el="text">${this.t.seenToday(0, 0)}</span><span class="gh-prh-pct" data-el="pct">0%</span></div>
        <div class="gh-prh-bar"><i data-el="bar"></i></div>
      </div>
      <div class="gh-prh-list" data-el="list"></div>`
    document.body.appendChild(root)
    this.root = root
    this.listEl = root.querySelector('[data-el="list"]')
    this.barEl = root.querySelector('[data-el="bar"]')
    this.textEl = root.querySelector('[data-el="text"]')
    this.pctEl = root.querySelector('[data-el="pct"]')

    root
      .querySelector('[data-act="collapse"]')
      ?.addEventListener('click', () => this.toggleCollapse())
    root
      .querySelector('[data-act="ai"]')
      ?.addEventListener('click', () => this.requestSummary())
  }

  private toggleCollapse() {
    this.collapsed = !this.collapsed
    this.root?.classList.toggle('gh-prh-collapsed', this.collapsed)
  }

  private requestSummary() {
    chrome.runtime.sendMessage({ type: 'OPEN_SUMMARY', pr: this.pr })
  }

  private scan() {
    const seenPaths = new Set<string>()
    const entries: FileEntry[] = []
    document.querySelectorAll<HTMLElement>(SEL.fileContainer).forEach((el) => {
      const path = getFilePath(el)
      if (!path || seenPaths.has(path)) return
      seenPaths.add(path)
      const stat = getFileStat(el)
      entries.push({
        path,
        el,
        anchorId: getFileAnchorId(el),
        additions: stat.additions,
        deletions: stat.deletions,
      })
      this.injectCheckbox(el, path)
    })
    this.files = entries
  }

  private injectCheckbox(file: HTMLElement, path: string) {
    const header = file.querySelector(SEL.fileHeader)
    if (!header || header.querySelector('.gh-prh-seen')) return
    const label = document.createElement('label')
    label.className = 'gh-prh-seen'
    label.title = this.t.seenCheckboxTitle
    const box = document.createElement('input')
    box.type = 'checkbox'
    box.checked = !!this.seen[path]?.seen
    box.addEventListener('change', () => this.toggle(path, box.checked))
    label.appendChild(box)
    label.appendChild(document.createTextNode(this.t.seenCheckbox))
    const actions = header.querySelector(SEL.headerActions) ?? header
    actions.appendChild(label)
    this.applyFileVisual(file, !!this.seen[path]?.seen)
  }

  private async toggle(path: string, checked: boolean) {
    const at = Date.now()
    if (checked) this.seen[path] = { seen: true, at }
    else delete this.seen[path]
    const entry = this.files.find((f) => f.path === path)
    if (entry) this.applyFileVisual(entry.el, checked)
    this.render()
    await setSeen(this.pr.prKey, path, checked, at)
  }

  private applyFileVisual(file: HTMLElement, seen: boolean) {
    file.classList.toggle('gh-prh-file-seen', seen)
  }

  private render() {
    const total = this.files.length
    const seenCount = this.files.filter((f) => this.seen[f.path]?.seen).length
    const pct = total ? Math.round((seenCount / total) * 100) : 0
    if (this.textEl) this.textEl.textContent = this.t.seenToday(seenCount, total)
    if (this.pctEl) this.pctEl.textContent = `${pct}%`
    if (this.barEl) this.barEl.style.width = `${pct}%`

    if (!this.listEl) return
    if (total === 0) {
      this.listSig = ''
      this.itemEls.clear()
      this.listEl.innerHTML = `<div class="gh-prh-empty"><span>${this.t.noFilesTitle}</span><span style="font-size:11.5px;color:#6e7681">${this.t.noFilesHint}</span></div>`
      return
    }

    const sig = this.files
      .map((f) => `${f.path}|${f.additions}|${f.deletions}`)
      .join('\n')
    if (sig === this.listSig) {
      for (const f of this.files) {
        const el = this.itemEls.get(f.path)
        if (el) el.classList.toggle('gh-prh-done', !!this.seen[f.path]?.seen)
      }
      return
    }
    this.listSig = sig
    this.itemEls.clear()
    this.listEl.replaceChildren(...this.files.map((f) => this.renderItem(f)))
  }

  private renderItem(f: FileEntry): HTMLElement {
    const done = !!this.seen[f.path]?.seen
    const item = document.createElement('div')
    item.className = 'gh-prh-item' + (done ? ' gh-prh-done' : '')
    item.title = f.path

    const box = document.createElement('span')
    box.className = 'gh-prh-box'
    box.innerHTML =
      '<svg width="9" height="9" viewBox="0 0 12 12"><path d="M2.5 6.3l2.4 2.4 4.6-5.4" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg>'

    const name = document.createElement('div')
    name.className = 'gh-prh-name'
    const slash = f.path.lastIndexOf('/')
    const dir = document.createElement('span')
    dir.className = 'gh-prh-dir'
    dir.textContent = slash >= 0 ? f.path.slice(0, slash + 1) : ''
    const base = document.createElement('span')
    base.className = 'gh-prh-base'
    base.textContent = f.path.slice(slash + 1)
    name.append(dir, base)
    name.addEventListener('click', (e) => {
      e.stopPropagation()
      this.jumpTo(f)
    })

    item.append(box, name)
    if (f.additions || f.deletions) {
      const stat = document.createElement('span')
      stat.className = 'gh-prh-stat'
      stat.innerHTML = `<span class="gh-prh-add">+${f.additions}</span> <span class="gh-prh-del">−${f.deletions}</span>`
      item.append(stat)
    }
    item.addEventListener('click', () => {
      const next = !this.seen[f.path]?.seen
      this.syncHeaderCheckbox(f.path, next)
      void this.toggle(f.path, next)
    })
    this.itemEls.set(f.path, item)
    return item
  }

  private syncHeaderCheckbox(path: string, checked: boolean) {
    const entry = this.files.find((f) => f.path === path)
    const box = entry?.el.querySelector<HTMLInputElement>(
      '.gh-prh-seen input',
    )
    if (box) box.checked = checked
  }

  private jumpTo(f: FileEntry) {
    const target = f.anchorId
      ? document.getElementById(f.anchorId)
      : f.el
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}
