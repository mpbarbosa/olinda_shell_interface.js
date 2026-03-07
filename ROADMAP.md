# Roadmap

This document outlines the planned evolution of `olinda_shell_interface.js` from its current stable state toward a v1.0 production milestone. Each phase builds on the previous one without breaking existing public APIs.

Current stable release: **v0.5.2** — executor, system detection, semver, jq wrapper, file operations.

---

## Phase 1 — v0.6.x · Process Control & Resilience

Focus: extend the executor layer with process lifecycle management and fault-tolerance primitives.

### Planned

- **Process management** (`src/core/process_manager.ts`)
    - `listProcesses(filter?)` — list running processes by name or PID
    - `killProcess(pid, signal?)` — send a signal to a process
    - `waitForProcess(pid, options?)` — poll until a process exits or times out
    - `ProcessInfo` interface (`pid`, `name`, `cpu`, `memory`, `status`)
    - `ProcessError extends ShellError`

- **Retry / back-off for `execute()`**
    - `ExecuteOptions.retries?: number` — number of retry attempts on non-zero exit
    - `ExecuteOptions.retryDelay?: number` — base delay in ms (exponential back-off)
    - Retry counter exposed in `ExecutionError`

- **stdin support**
    - `ExecuteOptions.stdin?: string | Buffer` — pipe data into the command

- **Environment helpers** (`src/utils/env.ts`)
    - `getEnv(key, defaultValue?)` — typed environment variable reader
    - `requireEnv(key)` — throws `ShellError` if variable is absent
    - `expandEnvVars(template)` — interpolates `$VAR` references in a string

- **Coverage uplift** — raise threshold to 85 % lines / 80 % branches

---

## Phase 2 — v0.7.x · Pipeline & Parallel Execution

Focus: higher-level composition of shell commands; concurrent execution patterns.

### Planned

- **Pipeline builder** (`src/core/pipeline.ts`)
    - Chainable API: `pipeline().pipe('cmd1').pipe('cmd2').run()`
    - Streaming output from each stage to the next via Node.js streams
    - `PipelineError extends ShellError` with per-stage context

- **Parallel executor** (`src/core/executor.ts` extension)
    - `executeAll(commands[], options?)` — run commands concurrently; resolve when all finish
    - `executeRace(commands[], options?)` — resolve on first success
    - Configurable concurrency limit

- **Heredoc / multi-line script support**
    - `executeScript(script, options?)` — write script to a temp file, execute, then clean up
    - Preserves line-by-line streaming output

- **Shell detection**
    - `detectShell()` — identify the active shell (bash, zsh, fish, ksh, PowerShell)
    - Exposed in `getSystemInfo()`

---

## Phase 3 — v0.8.x · Extended Platform Support

Focus: broader OS/package-manager coverage and optional systemd integration.

### Planned

- **Additional package managers**
    - Linuxbrew (`/home/linuxbrew/.linuxbrew`)
    - Snap (`snap`)
    - Flatpak (`flatpak`)
    - Windows: Scoop (`scoop`), VCPKG (`vcpkg`)
    - Update `detectPackageManager()` to return an array when multiple managers are present

- **systemd helpers** (`src/core/systemd.ts`) *(Linux only)*
    - `serviceStatus(name)` — `active | inactive | failed | unknown`
    - `startService(name)` / `stopService(name)` / `restartService(name)`
    - `isServiceEnabled(name)` — boolean check
    - `SystemdError extends ShellError`

- **SSH / remote execution** (`src/core/remote.ts`) *(optional module)*
    - `executeRemote(host, command, options?)` — wraps `ssh`
    - `RemoteOptions`: `user`, `port`, `identity`, `timeout`
    - `RemoteError extends ShellError`

- **macOS-specific utilities** (`src/core/macos.ts`) *(macOS only)*
    - `launchctlLoad(plist)` / `launchctlUnload(plist)`
    - `openApplication(name)`

---

## Phase 4 — v0.9.x · Developer Experience & Observability

Focus: tooling improvements, richer diagnostics, and API hardening before the v1.0 freeze.

### Planned

- **Structured command logging**
    - Opt-in `debug` flag on `ExecuteOptions` that emits command, duration, exit code, and stdout/stderr sizes via the `Logger` from `olinda_utils.js`
    - No-op when `debug` is `false` (zero overhead)

- **Dry-run mode on executor**
    - `ExecuteOptions.dryRun?: boolean` — logs the command that would run; returns a synthetic `ExecuteResult` with exit code 0 (mirrors `FileOperations.dryRun`)

- **Performance benchmarks published**
    - Automate `npm run bench` in CI and publish results as a GitHub Actions artifact
    - Track throughput of `execute()` and `executeStream()` per Node.js version

- **API stability review**
    - Deprecate any symbols marked `@experimental` with `@deprecated` JSDoc
    - Lock public interfaces; any breaking change requires a major bump

- **Coverage uplift** — raise threshold to 90 % lines / 85 % branches

---

## Phase 5 — v1.0.0 · Production Milestone

The v1.0 release signals a stable, fully supported public API.

### Goals

- All Phase 1–4 features shipped and stabilised
- Zero known P1/P2 bugs
- 90 %+ test coverage enforced in CI
- TypeDoc site auto-published to GitHub Pages on every tag
- Explicit Node.js LTS support matrix documented (18, 20, 22, 24)
- `MIGRATION.md` guide from v0.x to v1.0
- Semantic versioning commitment: no breaking changes without a major bump

---

## Ongoing / Evergreen

These items span all releases and are continuously maintained:

| Area | Activity |
|------|----------|
| **Security** | Weekly Dependabot updates; secret-detection pre-commit hook |
| **Dependencies** | Keep `olinda_utils.js` peer in sync; no additional runtime deps unless strictly necessary |
| **Documentation** | Update `docs/` and JSDoc on every feature addition |
| **Compatibility** | Test against each new Node.js LTS shortly after release |
| **CDN delivery** | Verify jsDelivr availability after every tagged release |
| **Linting** | Maintain cyclomatic complexity ≤ 10; zero ESLint warnings in CI |

---

## Version Summary

| Version | Theme |
|---------|-------|
| **0.5.2** | ✅ Current — executor, system, semver, jq wrapper, file operations |
| **0.6.x** | Process control, retry/back-off, stdin, env helpers |
| **0.7.x** | Pipelines, parallel execution, heredoc scripts, shell detection |
| **0.8.x** | Extended platform support, systemd, SSH, macOS utilities |
| **0.9.x** | DX improvements, dry-run executor, benchmarks, API freeze |
| **1.0.0** | 🎯 Production milestone — stable public API, full coverage |
