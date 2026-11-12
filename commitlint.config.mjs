/**
 * Conventional Commits, checked by the `commit-msg` hook.
 * Scope in kebab-case: the bounded context or the area (`feat(tasks): ...`, `chore(deps): ...`).
 */
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-case': [2, 'always', 'kebab-case'],
    'subject-case': [0],
    'header-max-length': [2, 'always', 120],
    'body-max-line-length': [2, 'always', 200],
  },
}
