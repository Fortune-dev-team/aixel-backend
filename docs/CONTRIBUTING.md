# Contributing Guide

## 1. Branch Strategy

  Branch                             Purpose
  ---------------------------------- -----------------------
  `main`                             Production
  `develop`                          Integration / staging
  `feature/<module>-<description>`   Feature work
  `fix/<description>`                Bug fix
  `hotfix/<description>`             Urgent production fix

Create feature branches from `develop`.

## 2. Workflow

1.  Pull the latest `develop`.
2.  Create a focused branch.
3.  Implement the change.
4.  Add or update tests.
5.  Run lint, tests, and build.
6.  Update relevant documentation.
7.  Open a Pull Request to `develop`.
8.  Request review.
9.  Resolve feedback and ensure CI passes.
10. Squash merge.

## 3. Commit Convention

Use Conventional Commits:

``` text
feat(auth): add refresh token rotation
fix(users): validate profile update
docs(api): describe user endpoints
test(goals): cover active goal limit
refactor(ai): isolate provider adapter
chore: update dependencies
```

Common types: `feat`, `fix`, `docs`, `test`, `refactor`, `perf`,
`build`, `ci`, and `chore`.

## 4. Pull Request Checklist

-   [ ] Scope and behavior are explained.
-   [ ] Tests are added or updated.
-   [ ] Lint and build pass.
-   [ ] Database migration is included when needed.
-   [ ] API documentation is updated when needed.
-   [ ] No secrets or local files are committed.
-   [ ] Breaking changes are documented.

## 5. Branch Protection

Recommended GitHub settings for `main` and `develop`: - Require Pull
Request. - Require CI status checks. - Require at least one approval. -
Dismiss stale approvals when new commits are pushed, if appropriate. -
Block force pushes. - Restrict direct pushes.

## 6. CODEOWNERS

Example:

``` text
* @<backend-lead>
/src/ai/ @<ai-maintainer>
```

Replace placeholders with actual GitHub handles.
