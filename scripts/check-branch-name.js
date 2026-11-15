import { execSync } from 'node:child_process';

// BRANCH_NAME lets CI check the PR branch (CI checkouts are detached).
const branch =
  process.env.BRANCH_NAME || execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
const allowed =
  /^(main|develop|dependabot\/.+|(feat|fix|hotfix|refactor|perf|docs|style|test|chore|ci|build)\/[a-z0-9]+(-[a-z0-9]+)*)$/;

if (branch !== 'HEAD' && !allowed.test(branch)) {
  console.error(`\n✖ Invalid branch name: "${branch}"\n`);
  console.error('Use: <type>/<short-kebab-description>');
  console.error('Types: feat, fix, hotfix, refactor, perf, docs, style, test, chore, ci, build');
  console.error('Example: feat/match-list, fix/header-overflow\n');
  console.error('Rename with: git branch -m <new-name>\n');
  process.exit(1);
}
