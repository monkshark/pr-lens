import type { PrRef } from '../types'

export function parsePrUrl(pathname: string): Omit<PrRef, 'title'> | null {
  const m = pathname.match(/^\/([^/]+)\/([^/]+)\/pull\/(\d+)/)
  if (!m) return null
  const [, owner, repo, num] = m
  return {
    owner,
    repo,
    number: Number(num),
    prKey: `${owner}/${repo}#${num}`,
  }
}

export function isFilesPage(pathname: string): boolean {
  return /^\/[^/]+\/[^/]+\/pull\/\d+\/(files|changes)/.test(pathname)
}
