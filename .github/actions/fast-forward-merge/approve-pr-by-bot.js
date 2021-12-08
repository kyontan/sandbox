// called from https://github.com/actions/github-script
module.exports = async ({ github, context }) => {
  return octokit.pulls.createReview({
    ...context.repo,
    pull_number: context.issue.number,
    event: "APPROVE"
  });
}
