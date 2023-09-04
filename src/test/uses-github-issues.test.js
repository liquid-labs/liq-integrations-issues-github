/* global describe expect test */
import { usesGitHubIssues } from '../uses-github-issues'

describe('usesGitHubIssues', () => {
  test('is true with github issues URL', () => {
    const model = 
      { playground: { projects: { get: () => ({ packageJSON: { bugs: { url: 'https://github.com/foo/bar/issues' }}})}}}

    expect(usesGitHubIssues({ model, projectFQN: 'foo/bar' })).toBe(true)
  })

  test('is false with github issues URL', () => {
    const model = 
      { playground: { projects: { get: () => ({ packageJSON: { bugs: { url: 'https://jira.com/foo/bar/issues' }}})}}}

    expect(usesGitHubIssues({ model, projectFQN: 'foo/bar' })).toBe(false)
  })
})