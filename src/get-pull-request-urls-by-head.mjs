import { GH_BASE_URL } from './constants'

const getPullRequestURLsByHead = ({ org, project, head }) => {
  const gitHubOrg = org.requireSetting('github.ORG_NAME')

  return `${GH_BASE_URL}/${gitHubOrg}/${project}/pulls?q=head%3A${encodeURIComponent(head)}`
}

export { getPullRequestURLsByHead }
