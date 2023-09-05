import { GH_BASE_URL } from './constants'

const getProjectURL = ({ org, project }) => {
  const gitHubOrg = org.requireSetting('github.ORG_NAME')

  return `${GH_BASE_URL}/${gitHubOrg}/${project}`
}

export { getProjectURL }
