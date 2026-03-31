# Branch protection recommendation

Set this required status check for pull requests before merge:

- Network Enforcement Smoke Test / network-enforcement

Recommended GitHub settings:

1. Go to Settings -> Branches -> Add branch protection rule.
2. Branch name pattern: main (repeat for admin if needed).
3. Enable Require a pull request before merging.
4. Enable Require status checks to pass before merging.
5. Add required status check: Network Enforcement Smoke Test / network-enforcement.
6. Enable Require branches to be up to date before merging.

Note:
If the check name appears slightly different in your repository UI, use the exact displayed check run name from a recent PR run of .github/workflows/network-enforcement.yml.
