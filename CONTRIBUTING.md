# Contributing to olinda_shell_interface.js

## Prerequisites

- Node.js ≥ 18
- npm ≥ 9
- Python (for `pre-commit` hooks)

## Setup

```bash
git clone https://github.com/mpbarbosa/olinda_shell_interface.js.git
cd olinda_shell_interface.js
npm install
pip install pre-commit
pre-commit install
```

## Development Commands

```bash
npm run build         # Compile TypeScript (CJS)
npm run build:esm     # Compile TypeScript (ESM)
npm run validate      # Type-check only (no emit)
npm run lint          # ESLint on src/**/*.ts
npm run lint:fix      # ESLint with auto-fix
npm run lint:md       # markdownlint on **/*.md
npm test              # Unit + integration tests with coverage
npm run test:core     # Core + index tests only
npm run test:watch    # Watch mode
npm run bench         # Performance benchmarks
```

## Code Conventions

- **Language**: TypeScript only — never commit plain `.js` under `src/`
- **Indent**: 1 tab, single quotes, trailing commas in multi-line structures
- **JSDoc required** on all exported symbols (`@param`, `@returns`, `@since`, `@example`)
- **Pure functions** preferred: same inputs → same output, no side effects
- **Cyclomatic complexity** ≤ 10 (ESLint gate)
- **Error format**: `"ClassName: human-readable description"`

## Submitting Changes

1. Create a feature branch from `main`
2. Write tests for new behaviour — coverage threshold is 80% lines/statements/functions, 75% branches
3. Run `npm test` and `npm run lint` before pushing
4. Pre-commit hooks run `validate`, `eslint`, and `test:core` automatically
5. Open a pull request against `main`

## Commit Messages

Use a single-word prefix followed by a colon:

```
feat: add shell command execution wrapper
fix: handle stderr in async runner
docs: update API reference for execute()
test: add edge cases for timeout handling
refactor: extract command builder helper
chore: bump typescript to 5.x
```

## Dependency Management

### Adding dependencies

- **Production**: only add if strictly required by library consumers
- **Dev-only**: add with `npm install --save-dev`

### Updating dependencies

```bash
npm outdated            # check for updates
npm update              # update within semver ranges
npm audit               # check for vulnerabilities
npm audit fix           # auto-fix vulnerabilities where possible
npm prune               # remove unused packages
npm dedupe              # reduce duplicate packages in tree
```

Dependabot opens PRs automatically each Monday for outdated npm packages
and GitHub Actions. Review the changelog before merging major-version bumps.

### Security policy

Run `npm audit --audit-level=high` before releasing. All `high` and `critical`
vulnerabilities must be resolved. CI enforces this gate on every push.

## Shell Scripts

Three automation scripts live at the repo root and under `scripts/`. All use `#!/usr/bin/env bash` and are already executable.

### `cdn-delivery.sh`

Generates jsDelivr CDN URL variants and writes `cdn-urls.txt`.

```bash
npm run cdn           # recommended (builds first)
bash cdn-delivery.sh  # direct (requires a prior build)
```

**Prerequisites:** Node.js, Git. **Exit codes:** `0` success; non-zero on failure.

**Contributing:** If you change `package.json` version or the CDN URL scheme, update the URL templates inside this script accordingly. Verify output with `bash cdn-delivery.sh` and inspect `cdn-urls.txt`.

### `scripts/deploy.sh`

Full deployment pipeline: build → commit → tag → push → CDN URLs.

```bash
bash scripts/deploy.sh
```

**Prerequisites:** Node.js, Git with push access. **Exit codes:** `0` success; non-zero on any step failure.

**Contributing:** Keep the step order (build → commit → tag → push → cdn) intact. Add new steps at the end. Document any new exit conditions in the script header and in `docs/API.md`.

### `scripts/colors.sh`

Shared ANSI colour definitions. Sourced by other scripts — do not execute directly.

```bash
source "$(dirname "${BASH_SOURCE[0]}")/colors.sh"
echo -e "${GREEN}Success${NC}"
```

**Contributing:** Add new colour variables here if needed. Keep the variable names uppercase. Update the "Exported variables" lists in `README.md` and `docs/API.md`.

### Shell script coding standards

- Shebang must be `#!/usr/bin/env bash`
- Scripts must be executable: `chmod +x <script>`
- Use `set -euo pipefail` at the top for safety
- Source `scripts/colors.sh` for coloured output instead of hardcoding ANSI codes
- Document all exit codes in the script header comment

## Testing Strategy

- **Unit tests** in `test/core/` and `test/utils/` — fast, no I/O
- **Integration tests** in `test/integration/` — may spawn subprocesses
- **Benchmarks** in `test/benchmarks/` — excluded from coverage runs
- Run `npm run test:coverage` to see the full coverage report

## License

By contributing, you agree your changes will be licensed under the project's
existing [MIT License](LICENSE).
