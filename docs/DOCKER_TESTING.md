# Docker Testing Guide

> This guide covers running the **olinda_shell_interface.js** test suite inside
> Docker for fully isolated, reproducible test runs.

---

## Table of Contents

1. [Why run tests in Docker?](#why-run-tests-in-docker)
2. [Prerequisites](#prerequisites)
3. [Project files overview](#project-files-overview)
4. [Dockerfile.test walkthrough](#dockerfiletest-walkthrough)
5. [.dockerignore walkthrough](#dockerignore-walkthrough)
6. [Shell script walkthrough](#shell-script-walkthrough)
7. [Running the tests](#running-the-tests)
8. [Extracting coverage reports](#extracting-coverage-reports)
9. [CI/CD integration (GitHub Actions)](#cicd-integration-github-actions)
10. [Troubleshooting](#troubleshooting)

---

## Why run tests in Docker?

| Benefit | Details |
|---|---|
| **Isolation** | Tests run in a clean OS every time — no leftover state, no host-machine differences |
| **Reproducibility** | Same image = same result on any machine or CI runner |
| **CI parity** | What passes locally in Docker will pass in CI |
| **Dependency pinning** | The exact Node.js version is locked to the image tag |
| **Safe multi-project setups** | Different projects can use conflicting Node versions without conflict |

---

## Prerequisites

### Docker

| Platform | Install |
|---|---|
| **macOS / Windows** | [Docker Desktop](https://docs.docker.com/desktop/) |
| **Linux** | [Docker Engine](https://docs.docker.com/engine/install/) |

Verify installation:

```bash
docker --version      # Docker version 26.x.x or later
docker info           # confirms the daemon is running
```

> **Linux note:** Your user must be in the `docker` group, or commands must be run
> with `sudo`. To add your user: `sudo usermod -aG docker $USER` (re-login to apply).

### Node.js (host only)

The host machine needs Node.js **only** for the `npm run test:docker` convenience
script. The actual tests run inside Docker.

```bash
node --version   # v18.0.0 or later
```

---

## Project files overview

The Docker test setup consists of three files:

```text
project-root/
├── Dockerfile.test               ← image definition for the test runner
├── .dockerignore                 ← files excluded from the build context
└── scripts/
    └── run-tests-docker.sh       ← orchestration script (build → run → report)
```

`package.json` also exposes a convenience script:

```json
"scripts": {
  "test:docker": "bash scripts/run-tests-docker.sh"
}
```

---

## Dockerfile.test walkthrough

```dockerfile
FROM node:22-alpine
```

- Uses the **official Node.js Alpine image** — roughly 60 MB vs 900 MB for the
  Debian image.
- Pinned to `node:22-alpine` for reproducible builds.
- Version matches the `engines.node` field (`>=18`) and the highest CI Node version.

---

```dockerfile
RUN apk add --no-cache git bash jq
```

Three system packages must be installed because the test suite actively uses them:

- **`git`** — `npm ci` clones the `olinda_utils.js` production dependency from
  GitHub via `git+https://`. Without `git`, the install fails immediately.
- **`bash`** — `executor.test.ts` explicitly invokes `/bin/bash`
  (`shell: '/bin/bash'`) and runs `bash -c "…"` commands. Alpine ships with `ash`
  (as `/bin/sh`) but not `bash`. Without it, several executor tests fail.
- **`jq`** — `jq_wrapper.test.ts` calls the real `jq` CLI binary to verify
  integration between the wrapper and the `jq` tool itself. Without `jq` installed,
  these tests fail with `command not found`.

---

```dockerfile
WORKDIR /app
COPY package.json package-lock.json ./
```

Sets `/app` as the working directory and copies **only the dependency manifests**
first. Docker caches each layer; if neither file changed since the last build, the
`npm ci` layer below is also cached — saving time on subsequent rebuilds.

---

```dockerfile
ENV NODE_ENV=test
RUN npm ci
```

- `ENV NODE_ENV=test` — the `node:22-alpine` base image (like all official Node
  images) ships with `NODE_ENV=production`, which causes `npm ci` to silently skip
  `devDependencies`. Overriding it ensures the full dependency tree is installed —
  including Jest, ts-jest, and TypeScript.
- `npm ci` does a clean install from `package-lock.json`. Faster and stricter than
  `npm install`, and never modifies `package-lock.json`.
- **`--ignore-scripts` is intentionally NOT used.** The `olinda_utils.js`
  production dependency has a `prepare` script that compiles its TypeScript source
  to `dist/`. Skipping it leaves the package without its built output, causing
  import failures in several test suites.

---

```dockerfile
COPY . .
CMD ["npm", "test"]
```

Copies the remaining project files **after** `npm ci` so source-code changes do
not invalidate the dependency cache layer. The default command runs the full Jest
suite.

---

## .dockerignore walkthrough

```dockerignore
node_modules/    # npm ci installs these fresh inside the container
dist/            # ts-jest compiles source on the fly; pre-built output not needed
coverage/        # tests produce their own coverage inside the container
.jest-cache/     # stale host cache must not bleed into the clean container environment
.git/            # version history not needed at runtime
*.log            # logs and OS/editor artefacts
.ai_workflow/    # workflow artefacts not needed for tests
```

**Key rules:**

- Always exclude `node_modules/` — copying it in would override the clean `npm ci`
  install and dramatically bloat the build context.
- Exclude `dist/` — tests run against TypeScript source through ts-jest.
- Exclude `.jest-cache/` — stale host cache should not contaminate the container.

---

## Shell script walkthrough

`scripts/run-tests-docker.sh` is a convenience wrapper with three steps.

### Step 1 — Build the image

```bash
docker build \
  --build-arg BUILDKIT_INLINE_CACHE=1 \
  -t olinda_shell_interface-test \
  -f Dockerfile.test \
  "${PROJECT_ROOT}"
```

- `-f Dockerfile.test` — uses the dedicated test Dockerfile.
- `-t olinda_shell_interface-test` — tags the image for easy reference.
- `--build-arg BUILDKIT_INLINE_CACHE=1` — embeds cache metadata in image layers
  (useful for registry-based caching in CI).

### Step 2 — Run the container

```bash
docker run \
  --rm \
  --name olinda_shell_interface-test-run \
  -e CI=true \
  olinda_shell_interface-test \
  npm test -- --runInBand "$@"
```

- `--rm` — removes the container automatically after it exits.
- `-e CI=true` — signals to Jest that the run is non-interactive; disables watch
  mode and colour animations.
- `--runInBand` — always passed inside Docker. Running tests serially in a single
  process prevents a VM-teardown race that can occur when parallel Jest workers
  are shut down in a resource-constrained container.
- The exit code of `docker run` mirrors the exit code of the test process.

### Step 3 — Report

The script captures the container's exit code and prints a pass/fail summary, then
exits with the same code. This makes it compatible with CI pipelines that check `$?`.

### Passing extra Jest arguments

Extra arguments after `--` are forwarded to Jest:

```bash
bash scripts/run-tests-docker.sh -- --coverage
bash scripts/run-tests-docker.sh -- --testPathPattern=executor
bash scripts/run-tests-docker.sh -- --verbose --detectOpenHandles
```

---

## Running the tests

### Basic run

```bash
npm run test:docker
# or directly:
bash scripts/run-tests-docker.sh
```

### With a specific test file pattern

```bash
bash scripts/run-tests-docker.sh -- --testPathPattern=jq_wrapper
```

### With verbose output

```bash
bash scripts/run-tests-docker.sh -- --verbose
```

### With coverage threshold enforcement

```bash
bash scripts/run-tests-docker.sh -- --coverage
```

### One-liner without the script

```bash
docker build -f Dockerfile.test -t olinda_shell_interface-test . && \
docker run --rm -e CI=true olinda_shell_interface-test
```

---

## Extracting coverage reports

By default, coverage output stays inside the container and is lost when `--rm`
removes it. Mount the `coverage/` directory as a volume to persist it on the host:

```bash
docker run --rm \
  -e CI=true \
  -v "$(pwd)/coverage:/app/coverage" \
  olinda_shell_interface-test \
  npm test -- --runInBand --coverage
```

After the run, `./coverage/` on the host contains the full HTML and LCOV reports.

```bash
# open the HTML report in a browser (Linux)
xdg-open coverage/lcov-report/index.html
```

---

## CI/CD integration (GitHub Actions)

The workflow at `.github/workflows/test-docker.yml` builds the image, runs the
tests, and uploads the coverage report as an artifact.

```yaml
name: Docker Tests

on:
  push:
    branches: ['**']
  pull_request:
    branches: ['**']

jobs:
  test-docker:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Build test image
        run: |
          docker build \
            --cache-from type=gha \
            --cache-to type=gha,mode=max \
            -t olinda_shell_interface-test \
            -f Dockerfile.test \
            .

      - name: Run tests inside Docker
        run: |
          docker run --rm \
            -e CI=true \
            -v "${{ github.workspace }}/coverage:/app/coverage" \
            olinda_shell_interface-test \
            npm test -- --runInBand --coverage

      - name: Upload coverage report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: docker-coverage-report
          path: coverage/
          retention-days: 14
```

**Key points:**

- `--cache-from / --cache-to type=gha` — uses GitHub Actions cache for Docker
  layers, dramatically reducing build time after the first run.
- `-v "${{ github.workspace }}/coverage:/app/coverage"` — extracts coverage from
  the container into the runner's workspace for the upload step.
- `if: always()` on the upload step — uploads the report even when tests fail,
  which is when you need it most.

---

## Troubleshooting

### `Cannot find module 'jest'` (or other devDependency) inside Docker

**Cause:** The `node:22-alpine` base image sets `NODE_ENV=production`. When
`NODE_ENV=production`, `npm ci` silently skips `devDependencies` — so Jest,
ts-jest, and TypeScript are never installed.

**Diagnosis:**

```bash
docker run --rm olinda_shell_interface-test node -e "require('jest')"
# If this throws, devDeps were not installed.
```

**Fix:** `Dockerfile.test` already sets `ENV NODE_ENV=test` before `RUN npm ci`.
Verify the `ENV` line is present and comes **before** the `RUN npm ci` line.

---

### `bash: not found` or executor tests fail

**Cause:** `executor.test.ts` requires `/bin/bash` to be installed. Alpine only
ships with `ash` by default.

**Fix:** `Dockerfile.test` already includes `bash` in the `apk add` step. If you
see this error, verify the line `RUN apk add --no-cache git bash jq` is present.

---

### `jq: not found` or jq_wrapper tests fail

**Cause:** `jq_wrapper.test.ts` calls the real `jq` binary. Alpine does not
include it by default.

**Fix:** `Dockerfile.test` already includes `jq` in the `apk add` step. Verify
`jq` is listed alongside `git` and `bash`.

---

### `git dep preparation failed` during `npm ci`

**Cause:** The `olinda_utils.js` dependency is fetched from GitHub via
`git+https://`. npm runs a nested install inside the dependency to execute its
`prepare` script (TypeScript compilation). If the dependency's own `package-lock.json`
references a yanked registry tarball, the nested install fails.

**Fix:** Bump `olinda_utils.js` to the latest release in `package.json`:

```bash
# Update to latest tag and regenerate the lockfile
npm install git+https://github.com/mpbarbosa/olinda_utils.js.git#<latest-tag>
```

Then patch the SSH URL in `package-lock.json` (see below) and rebuild.

---

### `package-lock.json` uses `git+ssh://` URL for `olinda_utils.js`

**Cause:** npm's internal `hosted-git-info` package always generates
`git+ssh://git@github.com/` as the `resolved` URL in the lockfile for GitHub
repositories — even when `package.json` specifies `git+https://`. Docker containers
do not have SSH keys, so `npm ci` fails.

**Diagnosis:**

```bash
grep '"resolved".*olinda_utils' package-lock.json
# Should show git+https://, not git+ssh://
```

**Fix:** Run the following after every `npm install`:

```bash
python3 -c "
import json
lock = json.load(open('package-lock.json'))
pkg = lock['packages']['node_modules/olinda_utils.js']
pkg['resolved'] = pkg['resolved'].replace(
    'git+ssh://git@github.com/',
    'git+https://github.com/'
)
open('package-lock.json', 'w').write(json.dumps(lock, indent=2) + '\n')
print('Patched:', pkg['resolved'])
"
```

This is a one-time fix after each `npm install`. `npm ci` (used in Docker and CI)
reads the lockfile without modifying it, so the patched URL persists until the next
`npm install`.

---

### Tests pass locally but fail inside Docker

**Likely cause:** The host `node_modules/` is bleeding into the build context
despite `.dockerignore`. Verify `.dockerignore` is present at the project root and
contains `node_modules/`.

```bash
# Confirm the build context does NOT include node_modules
docker build --no-cache -f Dockerfile.test -t olinda_shell_interface-test . 2>&1 \
  | grep -i "node_modules"
```

---

### `permission denied` running docker commands

**Cause:** Your user is not in the `docker` group.

**Fix (permanent):**

```bash
sudo usermod -aG docker $USER
# Log out and back in, then verify:
groups   # should include 'docker'
```

**Fix (temporary):** prefix commands with `sudo`:

```bash
sudo bash scripts/run-tests-docker.sh
```
