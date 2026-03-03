# Copilot Instructions

## Project

`olinda_shell_interface.js` is a public TypeScript-authored JavaScript library for interfacing with Linux shell commands, delivered via **jsDelivr CDN from GitHub**.

This project follows the same conventions as [`paraty_geocore.js`](https://github.com/mpbarbosa/paraty_geocore.js) — use it as the canonical reference.

## Stack

- **Language**: TypeScript (`src/**/*.ts`) — never submit plain `.js` under `src/`
- **Runtime / engines**: Node.js ≥ 18, npm ≥ 9 (enforce with `engine-strict=true` in `.npmrc`)
- **Build**: `tsc` → `dist/` (CJS via `tsconfig.json`); ESM via `tsconfig.esm.json` → `dist/esm/`
- **Tests**: Jest + ts-jest (`test/`)
- **Lint**: ESLint with `@typescript-eslint`, markdownlint for docs
- **Pre-commit**: `pre-commit` hooks (EditorConfig, secret detection, markdownlint)
- **CDN**: jsDelivr from GitHub — entry point served from `dist/src/index.js`

## CDN Delivery

Library is distributed via **jsDelivr** — no npm publish required.

```
https://cdn.jsdelivr.net/gh/mpbarbosa/olinda_shell_interface.js@{version}/dist/src/index.js
```

The `cdn-delivery.sh` script (modelled on `paraty_geocore.js`) generates all URL variants and saves them to `cdn-urls.txt`. Run via:

```bash
npm run cdn   # npm run build && bash cdn-delivery.sh
```

HTML usage:

```html
<script src="https://cdn.jsdelivr.net/gh/mpbarbosa/olinda_shell_interface.js@{version}/dist/src/index.js"></script>
```

ES Module import:

```html
<script type="module">
  import { ... } from 'https://cdn.jsdelivr.net/gh/mpbarbosa/olinda_shell_interface.js@{version}/dist/src/index.js';
</script>
```

Always pin a specific version tag (`@x.y.z`) in production. Tags must be pushed to GitHub before jsDelivr can serve them.

## Architecture

```
src/
  core/         # Core classes and custom errors
  utils/        # Pure utility functions
  index.ts      # Public entry point — barrel re-exports only
test/
  core/         # Unit tests for src/core/
  utils/        # Unit tests for src/utils/
  integration/  # Integration tests
  benchmarks/   # Performance benchmarks (excluded from coverage run)
  helpers/      # Shared test fixtures and constants
  index.test.ts # Smoke tests for the public export surface
docs/           # Hand-authored API reference and specs
dist/           # Compiled output (gitignored, built by tsc)
scripts/        # Helper shell scripts (e.g. colors.sh)
cdn-delivery.sh # Generates jsDelivr URLs and writes cdn-urls.txt
cdn-urls.txt    # Generated — do not hand-edit
```

## Commands

```bash
npm run build         # tsc (CJS) → dist/
npm run build:esm     # tsc (ESM) → dist/esm/
npm test              # Jest: unit + integration + utils
npm run test:core     # Jest: src/core/ tests only
npm run test:utils    # Jest: src/utils/ tests only
npm run test:integration
npm run test:watch    # watch mode
npm run test:coverage # with coverage report (80% threshold enforced)
npm run bench         # performance benchmarks
npm run validate      # tsc --noEmit (type-check only)
npm run lint          # ESLint on src/**/*.ts
npm run lint:fix
npm run lint:md       # markdownlint on **/*.md
npm run cdn           # build + generate CDN URLs
```

Run a single test file:

```bash
npx jest test/core/MyClass.test.ts
```

## Code Conventions

- **Pure functions**: same inputs → same output, no side effects, no logging, no global state
- **Immutable by default**: use `Object.freeze()` for class instances
- **Style**: 1-tab indent, single quotes, trailing commas in multi-line lists
- **JSDoc required** on all exported symbols (`@param`, `@returns`, `@since`, `@example`)
- **Complexity gate**: cyclomatic complexity warn above 10

## Error Handling

- Throw a custom `*Error` subclass (extending `Error`) for invalid constructor arguments
- Call `Object.setPrototypeOf(this, new.target.prototype)` in custom error constructors
- Set `this.name` to the class name
- Error message format: `"ClassName: human-readable description"`
- Pure utility functions **never throw** — enforce contracts via JSDoc; return `NaN`/`undefined` for invalid input
- Every error path needs a test asserting: correct class (`instanceof`), message pattern, and prototype chain (`instanceof Error`)

## Commit Messages

```
feat: add shell command execution wrapper
fix: handle stderr in async runner
docs: update API reference for run()
test: add edge cases for timeout handling
```

Prefixes: `feat`, `fix`, `docs`, `test`, `refactor`, `chore`

## Pre-commit Setup

```bash
pip install pre-commit
pre-commit install
pre-commit run --all-files   # run manually
```
