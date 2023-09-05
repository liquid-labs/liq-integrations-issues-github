import { createOrUpdatePullRequest } from './create-or-update-pull-request'
import { getCurrentIntegrationUser } from './get-current-integration-user'
import { getIssueURL } from './get-issue-url'
import { getProjectURL } from './get-project-url'
import { getPullRequestURLsByHead } from './get-pull-request-urls-by-head'
import { getQALinkFileIndex } from './get-qa-link-file-index'
import { usesGitHubIssues } from './uses-github-issues'

const name = 'issues/github'

const registerIntegrationPlugins = ({ app }) => {
  app.ext.integrations.register({
    hooks : {
      getCurrentIntegrationUser,
      getIssueURL,
      getProjectURL
    },
    name,
    npmName      : '@liquid-labs/liq-integrations-issues-github',
    providerFor  : 'tickets',
    providerTest : usesGitHubIssues
  })

  app.ext.integrations.register({
    hooks : {
      createOrUpdatePullRequest,
      getCurrentIntegrationUser,
      getPullRequestURLsByHead,
      getQALinkFileIndex
    },
    name         : 'pull-requests/github',
    npmName      : '@liquid-labs/liq-integrations-issues-github',
    providerFor  : 'pull request',
    providerTest : usesGitHubIssues
  })
}

const summary = 'Plugin hooks for GitHub provider issues and pull requests'

export { name, registerIntegrationPlugins, summary }
