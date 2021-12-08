// called from https://github.com/actions/github-script
module.exports = async ({ github, context }) => {
  const { data: pullInfo } = await github.rest.pulls.get({
    ...context.repo,
    pull_number: context.issue.number,
  })

  const { data: reviewInfo } = await github.rest.pulls.listReviews({
    ...context.repo,
    pull_number: context.issue.number,
  })

  const reviewStates = reviewInfo.map(x => x.state)

  const howToAutomerge = "\n\nIf you **really** ignore this and want to merge, use `/force-merge`.";
  let failedReason = null;

  if (pullInfo.merged) {
    failedReason = "This PR is already merged"
  } else if (reviewStates.indexOf("APPROVED") == -1) {
    failedReason = "This PR is not approved by anyone";
  } else if (reviewStates.indexOf("REQUEST_CHANGES") != -1) {
    failedReason = "Someone requests changes";
  }

  if (failedReason != null) {
    await github.rest.issues.createComment({
      ...context.repo,
      issue_number: context.issue.number,
      body: `### :x: Merging failed\nReason:\n- ${failedReason}${howToAutomerge}`,
    })

    throw new Error(failedReason);
  }
}
