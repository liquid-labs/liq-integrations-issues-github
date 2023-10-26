import { getGitHubOrgAndProjectBasename } from '@liquid-labs/github-toolkit'
import { getGitHubQAFileLinks } from '@liquid-labs/liq-qa-lib'

const getQALinkFileIndex = async({ app, pkgJSON, projectPath, reporter }) => {
  console.log('getQALinkFileIndex pkgJSON:', pkgJSON) // DEBUG
  const { org: gitHubOrg } = getGitHubOrgAndProjectBasename({ packageJSON: pkgJSON })

  return await getGitHubQAFileLinks({ gitHubOrg, projectPath, reporter })
}

export { getQALinkFileIndex }
