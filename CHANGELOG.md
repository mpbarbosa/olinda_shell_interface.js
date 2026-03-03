# Changelog

All notable changes to `olinda_shell_interface.js` are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versioning follows [Semantic Versioning](https://semver.org/).

---

## [Unreleased]

---

## [0.4.4] — 2026-03-03

### Added

- `src/core/version.ts` — semantic version parsing and comparison module
    - `parseVersion(version)` — parses a version string into `{ major, minor, patch, prerelease, build }`
    - `compareVersions(v1, v2)` — returns negative/zero/positive (like `Array.sort` comparator)
    - `isGreaterThan / isLessThan / isEqual` — boolean version predicates
    - `getLatestVersion(versions)` — returns the highest version from an array
    - `ParsedVersion` TypeScript interface
- `src/index.ts` — re-exports `Logger`, `logger`, `LogLevel`, `stripAnsi`, `LoggerOptions`, `LogLevelValue` from `olinda_utils.js`
- `test/index.test.ts` — smoke tests for system, version, Logger, and error exports

---

## [0.3.1] — 2026-03-03

### Added

- `src/core/system.ts` — OS detection and system information module
    - `detectOS()` — detect current OS, returns `OsValue`
    - `detectPackageManager()` — detect system package manager, returns `PackageManagerValue`
    - `commandExists(command)` — check if a command is on `PATH`
    - `getSystemInfo()` — returns platform, os, arch, release, hostname, cpus, memory, packageManager
    - `OS`, `PackageManager` constants
    - `OsValue`, `PackageManagerValue`, `SystemInfo` TypeScript types
- `src/utils/errors.ts` — added `SystemError` class (extends `ShellError`)
- `docs/system.md` — system module API reference

---

## [0.2.0] — 2026-03-03

### Added

- `src/core/executor.ts` — shell command execution module
    - `execute(command, options)` — runs a shell command, returns `{ stdout, stderr, exitCode }`
    - `executeStream(command, options)` — streams stdout/stderr via callbacks
    - `executeSudo(command, options)` — prepends `sudo` when not running as root
    - `ExecuteOptions`, `StreamOptions`, `ExecuteResult` TypeScript interfaces
- `src/utils/errors.ts` — custom error hierarchy
    - `ShellError` — base error class for all library errors
    - `ExecutionError` — thrown on non-zero exit codes, carries `exitCode`, `stdout`, `stderr`
- `src/index.ts` — public barrel export
- `package.json` — v0.2.0, build/test/lint/cdn scripts, `engines: node>=18, npm>=9`
- `tsconfig.json` — CJS build → `dist/`
- `tsconfig.esm.json` — ESM build → `dist/esm/`
- `jest.config.js` — ts-jest, 80% coverage thresholds
- `eslint.config.js` — `@typescript-eslint` rules, complexity gate ≤ 10
- `cdn-delivery.sh` — generates jsDelivr CDN URLs → `cdn-urls.txt`
- `scripts/deploy.sh` — build → commit artifacts → tag → push → CDN URLs
- `scripts/colors.sh` — ANSI colour helpers for shell scripts
- `dist/src/` — compiled CJS output (tracked for jsDelivr CDN delivery)
- `test/index.test.ts` — 16 passing smoke tests covering all exports
- `.npmrc` — `engine-strict=true`
- `.workflow-config.yaml` — ai_workflow.js project configuration
- `docs/API.md` — public API reference
- `docs/ARCHITECTURE.md` — project structure and conventions
