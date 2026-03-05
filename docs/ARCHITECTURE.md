# Architecture — olinda_shell_interface.js

## Overview

`olinda_shell_interface.js` is a TypeScript-authored, CDN-delivered JavaScript library that
wraps Linux shell command execution. It is distributed via **jsDelivr from GitHub** — no npm
publish required.

---

## Directory Structure

```
olinda_shell_interface.js/
├── src/
│   ├── core/
│   │   ├── executor.ts       # execute / executeStream / executeSudo
│   │   ├── system.ts         # OS detection, package manager detection
│   │   └── version.ts        # Semantic version parsing and comparison
│   ├── utils/
│   │   └── errors.ts         # ShellError, ExecutionError
│   └── index.ts              # Public barrel export
├── test/
│   ├── core/                 # Unit tests for src/core/
│   │   ├── executor.test.ts
│   │   ├── system.test.ts
│   │   └── version.test.ts
│   ├── utils/                # Unit tests for src/utils/
│   ├── integration/          # Integration tests
│   ├── benchmarks/           # Performance benchmarks (excluded from coverage)
│   ├── helpers/              # Shared fixtures and constants
│   └── index.test.ts         # Smoke tests for the public export surface
├── docs/
│   ├── API.md                # Public API reference
│   ├── ARCHITECTURE.md       # This file
│   ├── errors.md             # Error hierarchy reference
│   ├── executor.md           # Executor module reference
│   ├── file_operations.md    # File operations reference
│   ├── jq_wrapper.md         # jq wrapper reference
│   ├── logger.md             # Logger module usage guide (colors/logging patterns)
│   └── system.md             # System module reference
├── dist/
│   ├── src/                  # CJS compiled output (tracked for CDN)
│   └── types/                # TypeScript declaration files
├── scripts/
│   ├── colors.sh             # ANSI colour helpers
│   └── deploy.sh             # Build → tag → push → CDN URL generation
├── .github/
│   ├── workflows/
│   │   └── ci.yml            # GitHub Actions CI (lint, build, test on every push/PR)
│   ├── copilot-instructions.md  # Copilot coding-agent project instructions
│   └── dependabot.yml        # Dependabot: weekly npm and Actions updates
├── .ai_workflow/             # ai_workflow.js runtime artifacts
├── cdn-delivery.sh           # Generates cdn-urls.txt
├── .workflow-config.yaml     # ai_workflow.js project configuration
├── package.json
├── tsconfig.json             # CJS build
└── tsconfig.esm.json         # ESM build
```

---

## Module Responsibilities

### `olinda_utils.js` — `colors` and `logger` modules

ANSI color codes, color support detection, and structured logging are provided by the
[`olinda_utils.js`](https://github.com/mpbarbosa/olinda_utils.js) dependency and
re-exported from this package's public API:

**Colors:**

- **`colors`** — `const` object of all ANSI escape sequences (styles, foreground, bright foreground).
- **`supportsColor()`** — returns `true` when stdout is a TTY, `TERM` is not `'dumb'`, and `NO_COLOR` is unset.
- **`colorize(text, color)`** — wraps text in an ANSI code + reset; falls back to plain text when unsupported.

**Logger:**

- **`Logger`** — class with configurable `quiet`, `verbose`, `prefix` options and methods: `debug`, `info`, `success`, `warn`, `error`, `step`, `setLogFile`, `closeLogFile`, `openStepLogFile`, `closeStepLogFile`, `reopenLogFiles`.
- **`logger`** — default singleton `Logger` instance.
- **`LogLevel`** — constants: `DEBUG`, `INFO`, `SUCCESS`, `WARN`, `ERROR`.
- **`stripAnsi(str)`** — remove ANSI escape codes from a string.

### `src/core/executor.ts`

Wraps Node.js `child_process` (`exec`, `spawn`) to provide three execution modes:

- **`execute`** — buffered: awaits command completion, returns full stdout/stderr.
- **`executeStream`** — streaming: pipes output to callbacks in real time.
- **`executeSudo`** — like `execute`, but prepends `sudo` on non-root Linux systems.

All functions are `async` / Promise-based. On non-zero exit, `execute` and
`executeSudo` throw `ExecutionError`. `executeStream` rejects with `ExecutionError`.

### `src/core/version.ts`

Semantic version parsing and comparison (semver-compatible):

- **`parseVersion(version)`** — parses a version string into `{ major, minor, patch, prerelease, build }`.
- **`compareVersions(v1, v2)`** — returns negative/zero/positive (like `Array.sort` comparator).
- **`isGreaterThan / isLessThan / isEqual`** — boolean predicates.
- **`getLatestVersion(versions)`** — returns the highest version from an array.

### `src/utils/errors.ts`

Custom error hierarchy:

```
Error
└── ShellError          ← base for all library errors
    ├── ExecutionError  ← non-zero exit code; carries exitCode, stdout, stderr
    └── SystemError     ← system-level failure (e.g. package manager detection)
```

Both classes call `Object.setPrototypeOf(this, new.target.prototype)` so
`instanceof` checks work correctly across compilation boundaries.

### `src/index.ts`

Barrel re-export. Consumers import exclusively from here:

```typescript
import { execute, ExecutionError } from 'olinda_shell_interface.js';
```

---

## Build System

| Command | Output | Purpose |
|---|---|---|
| `npm run build` | `dist/` (CJS) | CDN delivery, Jest/Node |
| `npm run build:esm` | `dist/esm/` | Tree-shaking bundlers |
| `npm run validate` | — | Type-check only (no emit) |

`dist/` is committed to git so jsDelivr can serve it directly from GitHub.

---

## Testing

- **Framework**: Jest + ts-jest (TypeScript natively, no pre-compilation)
- **Coverage threshold**: 80% lines, statements, functions; 75% branches
- **Pattern**: `test/(core|integration|utils|index)/**/*.test.ts`

```bash
npm test            # full suite + coverage
npm run test:core   # core + index only
npm run bench       # performance benchmarks (excluded from coverage)
```

---

## CDN Delivery

Library entry point served from `dist/src/index.js` via jsDelivr:

```
https://cdn.jsdelivr.net/gh/mpbarbosa/olinda_shell_interface.js@{version}/dist/src/index.js
```

Deployment flow (automated by `scripts/deploy.sh` / `ai-workflow deploy`):

1. `npm run build` — compile TypeScript
2. `git add dist/` — stage compiled output
3. `git commit` — commit artifacts
4. `git tag v{version}` — version tag
5. `git push --tags` — push to GitHub (jsDelivr picks up the tag)
6. `npm run cdn` — generate `cdn-urls.txt`

---

## GitHub Automation (`.github/`)

| Path | Purpose |
|---|---|
| `.github/workflows/ci.yml` | GitHub Actions CI pipeline — runs on every push and pull request to any branch. Executes lint, TypeScript build, and the full Jest test suite. |
| `.github/copilot-instructions.md` | Project-specific instructions for the GitHub Copilot coding agent (stack, conventions, commands). |
| `.github/dependabot.yml` | Dependabot configuration — opens weekly PRs for outdated npm packages and GitHub Actions. |

---

## Code Conventions

- **1-tab indent**, single quotes, trailing commas in multi-line structures
- **JSDoc required** on all exported symbols (`@param`, `@returns`, `@since`, `@example`)
- **Pure functions** preferred: same inputs → same output, no side effects
- **Cyclomatic complexity** ≤ 10 (ESLint gate)
- **Error message format**: `"ClassName: human-readable description"`
