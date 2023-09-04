import { determineGitHubLogin } from '@liquid-labs/github-toolkit'

import { usesGitHubIssues } from 'uses-github-issues'

const name = 'issues/github'

const registerIntegrationPlugins = ({ app }) => {
  console.log('registering...') // DEBUG
  app.ext.integrations.register({
    hooks        : {
      'getCurrentIntegrationUser' : async ({ app }) => {
        const credDB = app.ext.credentialsDB
        const authToken = credDB.getToken('GITHUB_API')

        // determine assignee(s)
        return (await determineGitHubLogin({ authToken })).login
      }
    },
    name,
    npmName      : '@liquid-labs/liq-integrations-issues-github',
    providerFor  : 'pull request',
    providerTest : usesGitHubIssues
  })
}

const summary = 'Plugin hooks for GitHub provider issues and pull requests'

export { name, registerIntegrationPlugins, summary }