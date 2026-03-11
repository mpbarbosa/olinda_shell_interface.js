# olinda_shell_interface.js

Public JavaScript library to interface Linux shell commands, delivered via
**jsDelivr CDN from GitHub**.

## Prerequisites

- **Node.js** ≥ 18 (tested on 18, 20, 22; use `.nvmrc` with `nvm use`)
- **npm** ≥ 9

Dependency updates are automated via Dependabot (weekly, Monday). Run
`npm audit` and `npm outdated` periodically to check for security issues.

## Scripts

### `cdn-delivery.sh`

Generates all jsDelivr CDN URL variants for the current package version and
saves them to `cdn-urls.txt`. Also tests CDN availability with `curl`.

Run via npm (builds first):

```bash
npm run cdn   # npm run build && bash cdn-delivery.sh
```

Or directly (requires a prior build):

```bash
bash cdn-delivery.sh
```

**Shell:** `#!/usr/bin/env bash` — requires Bash.

**Prerequisites:** Node.js (reads `package.json`), Git (reads HEAD commit and branch).

**Output:** Prints URL variants to stdout and writes `cdn-urls.txt`.

**Exit codes:** `0` success; `1` if the package version cannot be read from
`package.json` or Git metadata cannot be determined.

---

### `scripts/deploy.sh`

Full deployment pipeline: build TypeScript → commit `dist/` artifacts → create
version tag → push to GitHub → generate CDN URLs.

```bash
bash scripts/deploy.sh
```

**Steps executed:**

1. `npm run build` — compile TypeScript
2. `git add dist/ cdn-delivery.sh` — stage compiled output
3. `git commit` — commit artifacts
4. `git tag v{version}` — version tag (skipped if tag already exists)
5. `git push --tags` — push to GitHub (jsDelivr picks up the tag)
6. `npm run cdn` — generate `cdn-urls.txt`

**Prerequisites:** Node.js, Git, write access to the remote repository.

**Exit codes:** `0` success; non-zero on build failure, git error, or missing version.

---

### `scripts/colors.sh`

Shared ANSI colour definitions sourced by other shell scripts. Not intended to
be executed directly.

**Usage in other scripts:**

```bash
source "$(dirname "${BASH_SOURCE[0]}")/colors.sh"
echo -e "${GREEN}Success${NC}"
```

**Shell:** `#!/usr/bin/env bash` — requires Bash.

**Exported variables:** `RED`, `GREEN`, `YELLOW`, `BLUE`, `NC` (reset).

**Note:** Because this file is sourced rather than executed, exit codes do not
apply. Sourcing always succeeds as long as the file is readable.

---

## CI/CD Integration

To automate deployment from a GitHub Actions workflow, call `scripts/deploy.sh`
as part of your release job:

```yaml
- name: Deploy to CDN
  run: bash scripts/deploy.sh
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

Ensure the workflow has write access to repository contents and tags:

```yaml
permissions:
  contents: write
```

Run `npm run cdn` in CI to regenerate `cdn-urls.txt` without triggering a full
deployment (useful in preview or staging pipelines).

---

## Troubleshooting

### `npm run build` fails

- Check for TypeScript errors with `npm run validate` (type-check only, no emit).
- Ensure you are using Node.js ≥ 18 (`node --version`) and npm ≥ 9
  (`npm --version`).

### `git push` is rejected

- Verify you have write access to the remote repository.
- Pull the latest changes first: `git pull --rebase origin main`.
- If the tag already exists locally and remotely, delete and re-create it:
  `git tag -d v{version} && git push origin :refs/tags/v{version}`.

### jsDelivr does not serve the updated file

- jsDelivr caches by tag. Make sure the tag is pushed to GitHub before
  requesting the URL.
- Use the package info API to check which files are indexed:
  `https://data.jsdelivr.com/v1/package/gh/mpbarbosa/olinda_shell_interface.js`
- CDN propagation can take a few minutes after the tag is pushed.

### `cdn-delivery.sh` exits with an error

- `Error: could not determine package version from package.json` — run a build
  first (`npm run build`) or verify that `package.json` contains a `"version"`
  field.
- `Error: could not determine current git commit/branch` — ensure you are inside
  a valid Git repository with at least one commit.

---

## Error Handling

All library errors extend a common base class. The hierarchy is:

```
Error
└── ShellError          ← base for all library errors
    ├── ExecutionError  ← non-zero exit code; carries exitCode, stdout, stderr
    └── SystemError     ← system-level failure (e.g. package manager detection)
```

Error messages follow the format `"ClassName: human-readable description"`.
All custom classes call `Object.setPrototypeOf(this, new.target.prototype)` so
`instanceof` checks work correctly across compilation boundaries.

See [`docs/errors.md`](docs/errors.md) for the full API reference.
