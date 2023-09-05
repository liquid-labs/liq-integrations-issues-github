import { determineOriginAndMain } from '@liquid-labs/git-toolkit'
import { determineGitHubLogin } from '@liquid-labs/github-toolkit'
import { determineCurrentMilestone } from '@liquid-labs/liq-projects-lib'
import { getGitHubQAFileLinks } from '@liquid-labs/liq-qa-lib'
import { Octocache } from '@liquid-labs/octocache'
import { tryExec } from '@liquid-labs/shell-toolkit'

import { GH_BASE_URL, WORKSPACE } from './constants'

const createOrUpdatePullRequest = async({
  app,
  assignees,
  cache,
  closes,
  closeTarget,
  isPrivate,
  org,
  project,
  qaFiles,
  prBody,
  projectFQN,
  projectPath,
  projects,
  reporter,
  workKey,
  workUnit
}) => {
  const gitHubOrg = org.requireSetting('github.ORG_NAME')

  const qaFileLinkIndex = await getGitHubQAFileLinks({ gitHubOrg, projectPath, reporter, qaFiles })

  const credDB = app.ext.credentialsDB
  const authToken = credDB.getToken('GITHUB_API')

  const octocache = new Octocache({ authToken })

  let head
  if (isPrivate === true) {
    head = workKey
  }
  else {
    const ghUser = await determineGitHubLogin({ authToken })
    head = `${ghUser.login}:${workKey}`
  }

  const prURLs = []
  const openPRs = await octocache.paginate(`GET /repos/${gitHubOrg}/${project}/pulls`, { head, state : 'open' })
  if (openPRs.length > 0) { // really, should (and I think can) only be one, but this is the better question anyway
    reporter.push(`Project <em>${projectFQN}<rst> branch <code>${workKey}<rst> PR <bold>extant and open<rst>; pushing updates...`)
    let remote
    if (isPrivate === true) { ([remote] = determineOriginAndMain({ projectPath, reporter })) }
    else { remote = WORKSPACE }
    tryExec(`cd '${projectPath}' && git push ${remote} ${workKey}`)

    for (const prData of openPRs) {
      prURLs.push(await updatePR({
        authToken,
        closeTarget,
        closes,
        gitHubOrg,
        octocache,
        org,
        prBody,
        prData,
        projectFQN,
        projects,
        reporter,
        qaFileLinkIndex,
        workKey
      }))
    }
  }
  else { // we create the PR
    if (assignees === undefined) {
      assignees = [(await determineGitHubLogin({ authToken })).login]
    }

    prURLs.push(await createPR({
      app,
      assignees,
      authToken,
      cache,
      closes,
      closeTarget,
      gitHubOrg,
      head,
      octocache,
      org,
      prBody,
      projectFQN,
      projects,
      reporter,
      qaFileLinkIndex,
      workKey,
      workUnit
    }))
  }

  return prURLs
}

// helper functions
/**
 * Creates a new PR and returns a promise resolving to the PR URL.
 */
const createPR = async({ // TODO: this siganure is redonk; we really want an async so we kick these off in parallel
  // and generate the URL while the specific project data is in scope; so this form an effective parralel closures
  // But we really should cleanup this redonk list...
  app,
  assignees,
  authToken,
  cache,
  closes,
  closeTarget,
  gitHubOrg,
  head,
  octocache,
  org,
  prBody,
  projectFQN,
  projects,
  reporter,
  qaFileLinkIndex,
  workKey,
  workUnit
}) => {
  reporter.push(`Creating PR for <em>${projectFQN}<rst> branch <code>${workKey}<rst>...`)
  // build up the PR body

  const [, project] = projectFQN.split('/')

  const milestonePromise = determineCurrentMilestone({ app, cache, gitHubOrg, project })

  const repoPromise = octocache.request(`GET /repos/${gitHubOrg}/${project}`)

  const [milestone, repoData] = await Promise.all([milestonePromise, repoPromise])

  const base = repoData.default_branch

  const prData = await octocache.request(
    'POST /repos/{owner}/{repo}/pulls',
    {
      owner : gitHubOrg,
      repo  : project,
      title : workUnit.description,
      body  : prBody,
      head,
      base
    })

  try {
    await octocache.request('PATCH /repos/{owner}/{repo}/issues/{issueNumber}',
      {
        owner       : gitHubOrg,
        repo        : project,
        issueNumber : prData.number,
        assignees,
        milestone
      })

    const collaboratorsData = await octocache.paginate('GET /repos/{owner}/{repo}/collaborators', {
      owner      : gitHubOrg,
      repo       : project,
      permission : 'triage'
    })

    const collaborators = collaboratorsData?.map((cd) => cd.login)

    const possibleReviewers = collaborators.filter((r) => !assignees.includes(r))

    const reviewSource = (possibleReviewers.length > 0 ? possibleReviewers : assignees)
      .filter((r) => r !== prData.user.login) // the PR author cann't review the PR
    if (reviewSource.length > 0) {
      const reviewers = [reviewSource[Math.floor(Math.random() * reviewSource.length)]]

      await octocache.request('POST /repos/{owner}/{repo}/pulls/{pull_number}/requested_reviewers', {
        owner       : gitHubOrg,
        repo        : project,
        pull_number : prData.number,
        reviewers
      })
    }
  }
  catch (e) { // we want to continue in the face of errors; as long as the PR was created, we will continue
    process.stderr.write(e.stack)
    reporter.push(`<warn>There were problems completing the PR ${gitHubOrg}/${project}/${prData.number}.<rst> Assignees, milestone, and/or reviewers may not be set.`)
  }

  return `${GH_BASE_URL}/${gitHubOrg}/${project}/pull/${prData.number}`
}

/**
 * Updates the PR body and returns a promise resolving to the PR URL.
 */
const updatePR = async({
  authToken,
  closes,
  closeTarget,
  gitHubOrg,
  octocache,
  org,
  prBody,
  prData,
  projectFQN,
  projects,
  reporter,
  qaFileLinkIndex,
  workKey
}) => {
  reporter.push(`Updating PR <code>${prData.number}<rst> for <em>${projectFQN}<rst> branch <code>${workKey}<rst>...`)
  // build up the PR body

  const [, project] = projectFQN.split('/')

  try {
    await octocache.request('PATCH /repos/{owner}/{repo}/issues/{issueNumber}',
      {
        owner       : gitHubOrg,
        repo        : project,
        issueNumber : prData.number,
        body        : prBody
      })
  }
  catch (e) { // we want to continue in the face of errors; as long as the PR was created, we will continue
    reporter.push(`<warn>There were problems updating the PR ${gitHubOrg}/${project}/${prData.number}.<rst> Try submitting again or update manually.`)
  }

  return `${GH_BASE_URL}/${gitHubOrg}/${project}/pull/${prData.number}`
}

export { createOrUpdatePullRequest }
