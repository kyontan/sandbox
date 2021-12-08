// called from https://github.com/actions/github-script
module.exports = async ({ github, context }) => {
  const url = `${context.serverUrl}/${context.repo.owner}/${context.repo.repo}/actions/runs/${context.runId}`;

  const { data: pullInfo } = await github.rest.pulls.get({
    ...context.repo,
    pull_number: context.issue.number,
  })

  await github.rest.repos.createCommitStatus({
    ...context.repo,
    sha: pullInfo.head.sha,
    state: "success",
    context: "Restrict merge by user", // NOTE: This should match to the `prevent-merge-by-user` workflow.
    description: "Don't push merge button! Merging will be done by bot.",
    target_url: "https://example.com/doc-why-this-is-pending",
  })

  try {
    // actual merge process is done here
    await github.rest.git.updateRef({
      ...context.repo,
      ref: `heads/${pullInfo.base.ref}`,
      sha: pullInfo.head.sha,
    })
  } catch (err) {
    if (err.message) {
      await github.rest.issues.createComment({
        ...context.repo,
        issue_number: context.issue.number,
        body: `### :x: Merging failed\nMessage: ${err.message}`,
      })
    }
    // revert commit status
    await github.rest.repos.createCommitStatus({
      ...context.repo,
      sha: pullInfo.head.sha,
      state: "failure",
      context: "Restrict merge by user", // NOTE: This should match to the `prevent-merge-by-user` workflow.
      description: "Merging process failed for some reason. See details",
      target_url: url,
    })

    throw err;
  }
}