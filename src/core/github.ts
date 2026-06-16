import type { PrRef } from '../types'

export interface PrFile {
  filename: string
  status: string
  additions: number
  deletions: number
  patch?: string
}

export interface PrData {
  title: string
  body: string
  additions: number
  deletions: number
  files: PrFile[]
}

export async function fetchPrData(pr: PrRef, token?: string): Promise<PrData> {
  const base = `https://api.github.com/repos/${pr.owner}/${pr.repo}/pulls/${pr.number}`
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
  if (token) headers.Authorization = `Bearer ${token}`

  const metaRes = await fetch(base, { headers })
  if (!metaRes.ok) {
    throw new Error(githubError('PR', metaRes.status))
  }
  const meta = await metaRes.json()

  const files: PrFile[] = []
  for (let page = 1; page <= 3; page++) {
    const res = await fetch(`${base}/files?per_page=100&page=${page}`, {
      headers,
    })
    if (!res.ok) throw new Error(githubError('files', res.status))
    const batch = (await res.json()) as PrFile[]
    for (const f of batch) {
      files.push({
        filename: f.filename,
        status: f.status,
        additions: f.additions,
        deletions: f.deletions,
        patch: f.patch,
      })
    }
    if (batch.length < 100) break
  }

  return {
    title: meta.title ?? '',
    body: meta.body ?? '',
    additions: meta.additions ?? 0,
    deletions: meta.deletions ?? 0,
    files,
  }
}

function githubError(what: string, status: number): string {
  if (status === 401) return `GitHub 인증 실패 (${what}). 옵션에서 PAT를 확인하세요.`
  if (status === 403) return `GitHub rate limit 또는 접근 거부 (${what}). PAT를 등록하면 완화됩니다.`
  if (status === 404) return `PR을 찾을 수 없습니다 (${what}). 비공개 저장소라면 PAT가 필요합니다.`
  return `GitHub API 오류 ${status} (${what})`
}
