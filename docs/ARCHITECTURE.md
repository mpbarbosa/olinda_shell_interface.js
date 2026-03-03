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
│   │   └── executor.ts       # execute / executeStream / executeSudo
│   ├── utils/
│   │   └── errors.ts         # ShellError, ExecutionError
│   └── index.ts              # Public barrel export
├── test/
│   ├── core/                 # Unit tests for src/core/
│   ├── utils/                # Unit tests for src/utils/
│   ├── integration/          # Integration tests
│   ├── benchmarks/           # Performance benchmarks (excluded from coverage)
│   ├── helpers/              # Shared fixtures and constants
│   └── index.test.ts         # Smoke tests for the public export surface
├── docs/
│   ├── API.md                # Public API reference
│   └── ARCHITECTURE.md       # This file
├── dist/
│   ├── src/                  # CJS compiled output (tracked for CDN)
│   └── types/                # TypeScript declaration files
├── scripts/
│   ├── colors.sh             # ANSI colour helpers
│   └── deploy.sh             # Build → tag → push → CDN URL generation
├── .ai_workflow/             # ai_workflow.js runtime artifacts
├── cdn-delivery.sh           # Generates cdn-urls.txt
├── .workflow-config.yaml     # ai_workflow.js project configuration
├── package.json
├── tsconfig.json             # CJS build
└── tsconfig.esm.json         # ESM build
```

---

## Module Responsibilities

### `src/core/executor.ts`

Wraps Node.js `child_process` (`exec`, `spawn`) to provide three execution modes:

- **`execute`** — buffered: awaits command completion, returns full stdout/stderr.
- **`executeStream`** — streaming: pipes output to callbacks in real time.
- **`executeSudo`** — like `execute`, but prepends `sudo` on non-root Linux systems.

All functions are `async` / Promise-based. On non-zero exit, `execute` and
`executeSudo` throw `ExecutionError`. `executeStream` rejects with `ExecutionError`.

### `src/utils/errors.ts`

Custom error hierarchy:

```
Error
└── ShellError          ← base for all library errors
    └── ExecutionError  ← non-zero exit code; carries exitCode, stdout, stderr
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

## Code Conventions

- **1-tab indent**, single quotes, trailing commas in multi-line structures
- **JSDoc required** on all exported symbols (`@param`, `@returns`, `@since`, `@example`)
- **Pure functions** preferred: same inputs → same output, no side effects
- **Cyclomatic complexity** ≤ 10 (ESLint gate)
- **Error message format**: `"ClassName: human-readable description"`
