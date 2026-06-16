import type { PrRef } from '../types'
import type { PrData } from './github'

export const SUMMARY_SYSTEM =
  '당신은 꼼꼼한 시니어 코드 리뷰어입니다. GitHub Pull Request를 한국어로 간결하게 요약합니다.'

export function buildSummaryPrompt(
  pr: PrRef,
  data: PrData,
  maxDiffChars: number,
): string {
  let diff = ''
  let truncated = false
  for (const f of data.files) {
    const head = `\n### ${f.filename} (${f.status}, +${f.additions} -${f.deletions})\n`
    const patch = f.patch ? '```diff\n' + f.patch + '\n```\n' : '(diff 없음)\n'
    if (diff.length + head.length + patch.length > maxDiffChars) {
      truncated = true
      break
    }
    diff += head + patch
  }
  if (truncated) diff += '\n(이후 파일 diff는 길이 제한으로 생략됨)\n'

  return [
    `다음 GitHub Pull Request를 리뷰어 관점에서 요약하세요.`,
    ``,
    `PR: ${pr.owner}/${pr.repo}#${pr.number}`,
    `제목: ${data.title}`,
    `규모: 파일 ${data.files.length}개, +${data.additions} -${data.deletions}`,
    ``,
    `설명:`,
    data.body.trim() || '(설명 없음)',
    ``,
    `변경 내용:`,
    diff,
    ``,
    `아래 형식의 한국어 마크다운으로만 답하세요.`,
    ``,
    `## 한 줄 요약`,
    `(이 PR이 무엇을 하는지 한 문장)`,
    ``,
    `## 핵심 변경점`,
    `- (모듈/파일 단위로 무엇이 왜 바뀌었는지 3~6개 불릿)`,
    ``,
    `## 리뷰 포인트`,
    `- (잠재 버그·호환성·누락된 테스트 등 주의할 점 2~4개)`,
  ].join('\n')
}
