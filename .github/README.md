# .github

GitHub-specific automation and project configuration files.

## Contents

| Path | Purpose |
|---|---|
| `workflows/ci.yml` | GitHub Actions CI pipeline — runs on every push and pull request to any branch. Executes security audit, TypeScript type-check, ESLint, the full Jest test suite with coverage, and markdownlint. Matrix: Node.js 18, 20, 22. |
| `copilot-instructions.md` | Project-specific instructions for the GitHub Copilot coding agent (stack, conventions, commands, architecture overview). |
| `dependabot.yml` | Dependabot configuration — opens weekly pull requests for outdated npm packages and GitHub Actions. |

## CI Workflow (`workflows/ci.yml`)

The CI pipeline runs on **every push and pull request** to any branch and enforces:

1. `npm audit --audit-level=high` — no high/critical vulnerabilities
2. `npm run validate` — TypeScript type-check (no emit)
3. `npm run lint` — ESLint on `src/**/*.ts`
4. `npm run test:coverage` — full Jest suite; 80% line/statement/function, 75% branch threshold
5. `npm run lint:md` — markdownlint on all `*.md` files

For full architectural context see [`docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md).
