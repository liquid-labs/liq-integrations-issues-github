import { getGitHubQAFileLinks } from '@liquid-labs/liq-qa-lib'

const getQALinkFileIndex = async({ org, projectPath, reporter }) => {
  const gitHubOrg = org.requireSetting('github.ORG_NAME')

  return await getGitHubQAFileLinks({ gitHubOrg, projectPath, reporter })
}

export { getQALinkFileIndex }
