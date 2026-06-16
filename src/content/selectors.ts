export const SEL = {
  fileContainer: [
    'div.file.js-file',
    'div.file[data-tagsearch-path]',
    '[data-testid="file-diff"]',
    '[class*="diffTargetable"]',
  ].join(','),
  fileHeader:
    '.file-header, [class*="DiffFileHeader"], [class*="file-header"]',
  headerActions: '.file-actions, [class*="fileActions"]',
  issueTitle: '.js-issue-title, bdi.js-issue-title, h1 bdi',
}

function clean(s: string | null | undefined): string {
  return (s ?? '').replace(/[​-‏‪-‮⁦-⁩]/g, '').trim()
}

export function getFilePath(file: Element): string | null {
  const direct =
    file.getAttribute('data-tagsearch-path') ||
    file.getAttribute('data-path') ||
    file.getAttribute('data-file-path')
  if (direct) return direct

  const id = file.id
  const anchor =
    (id && file.querySelector(`a[href="#${id}"]`)) ||
    file.querySelector('a[href^="#diff-"]')
  const aTxt = clean(anchor?.textContent)
  if (aTxt) return aTxt

  const table = file.querySelector('table[aria-label^="Diff for:"]')
  const al = table?.getAttribute('aria-label')
  if (al) return clean(al.replace(/^Diff for:\s*/, ''))

  const attrEl = file.querySelector(
    '[data-tagsearch-path],[data-path],[data-file-path]',
  )
  const attr =
    attrEl?.getAttribute('data-tagsearch-path') ||
    attrEl?.getAttribute('data-path') ||
    attrEl?.getAttribute('data-file-path')
  if (attr) return attr

  const link = file.querySelector('.file-info a[title]')
  return clean(link?.getAttribute('title')) || null
}

export function getFileStat(file: Element): {
  additions: number
  deletions: number
} {
  const candidates = [
    ...file.querySelectorAll('.sr-only,[aria-label]'),
  ]
  for (const el of candidates) {
    const text = `${el.getAttribute('aria-label') ?? ''} ${
      el.textContent ?? ''
    }`
    if (!/addition|deletion/i.test(text)) continue
    const a = text.match(/(\d+)\s+addition/i)
    const d = text.match(/(\d+)\s+deletion/i)
    if (a || d) {
      return {
        additions: a ? Number(a[1]) : 0,
        deletions: d ? Number(d[1]) : 0,
      }
    }
  }

  const add = file.querySelector('.fgColor-success')
  const del = file.querySelector('.fgColor-danger')
  const aTxt = clean(add?.textContent).match(/(\d+)/)
  const dTxt = clean(del?.textContent).match(/(\d+)/)
  if (aTxt || dTxt) {
    return {
      additions: aTxt ? Number(aTxt[1]) : 0,
      deletions: dTxt ? Number(dTxt[1]) : 0,
    }
  }

  const legacy = file.querySelector('.diffstat')
  const txt = legacy?.getAttribute('aria-label') ?? legacy?.textContent ?? ''
  const la = txt.match(/(\d+)\s+addition/)
  const ld = txt.match(/(\d+)\s+deletion/)
  return {
    additions: la ? Number(la[1]) : 0,
    deletions: ld ? Number(ld[1]) : 0,
  }
}

export function getFileAnchorId(file: Element): string | null {
  if (file.id && file.id.startsWith('diff-')) return file.id
  const inner = file.querySelector('[id^="diff-"]')
  return inner?.id ?? file.id ?? null
}
