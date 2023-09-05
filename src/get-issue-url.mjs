import { GH_BASE_URL } from './constants'

const getIssueURL = ({ org, project, ref }) => {
  const gitHubOrg = org.requireSetting('github.ORG_NAME')

  return `${GH_BASE_URL}/${gitHubOrg}/${project}/issues/${ref}`
}

export { getIssueURL }
