import { describe, it, expect } from 'vitest'
import { parsePrUrl, isFilesPage } from '../src/core/prKey'

describe('parsePrUrl', () => {
  it('parses owner/repo/number from a PR files path', () => {
    expect(parsePrUrl('/facebook/react/pull/12345/files')).toEqual({
      owner: 'facebook',
      repo: 'react',
      number: 12345,
      prKey: 'facebook/react#12345',
    })
  })

  it('parses the PR conversation path too', () => {
    expect(parsePrUrl('/a/b/pull/7')).toEqual({
      owner: 'a',
      repo: 'b',
      number: 7,
      prKey: 'a/b#7',
    })
  })

  it('returns null for non-PR paths', () => {
    expect(parsePrUrl('/facebook/react/issues/1')).toBeNull()
    expect(parsePrUrl('/facebook/react')).toBeNull()
    expect(parsePrUrl('/')).toBeNull()
  })
})

describe('isFilesPage', () => {
  it('is true on the files and changes tabs', () => {
    expect(isFilesPage('/a/b/pull/1/files')).toBe(true)
    expect(isFilesPage('/a/b/pull/1/files#diff-x')).toBe(true)
    expect(isFilesPage('/a/b/pull/1/changes')).toBe(true)
    expect(isFilesPage('/a/b/pull/1')).toBe(false)
    expect(isFilesPage('/a/b/pull/1/commits')).toBe(false)
  })
})
