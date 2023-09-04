const usesGitHubIssues = ({ model, projectFQN }) => {
  const { packageJSON } = model.playground.projects.get(projectFQN) || {}
  const bugsURL = packageJSON?.bugs?.url || ''

  console.log('bugsURL:', bugsURL)

  return !!bugsURL.match(/^https:\/\/(www\.)?github.com\//)
}

export { usesGitHubIssues }