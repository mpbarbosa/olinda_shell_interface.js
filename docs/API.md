# API Reference — olinda_shell_interface.js

Public API for `olinda_shell_interface.js` v0.4.4.

CDN entry point:

```text
https://cdn.jsdelivr.net/gh/mpbarbosa/olinda_shell_interface.js@0.4.4/dist/src/index.js
```

---

## Modules

| Module | Description |
|--------|-------------|
| [executor](#executor) | Shell command execution |
| [system](#system) | OS and package manager detection |
| [version](#version) | Semantic version parsing and comparison |
| [errors](#errors) | Custom error hierarchy |
| [colors](#colors) | ANSI color codes and terminal support (via `olinda_utils.js`) |
| [logger](#logger) | Colored logging with file output (via `olinda_utils.js`) |

---

## Executor

### `execute(command, options?)`

Execute a shell command and return captured output.

```typescript
execute(command: string, options?: ExecuteOptions): Promise<ExecuteResult>
```

**Parameters**

| Name | Type | Default | Description |
|---|---|---|---|
| `command` | `string` | — | Shell command to run |
| `options.cwd` | `string` | `process.cwd()` | Working directory |
| `options.env` | `object` | `process.env` | Environment variables |
| `options.timeout` | `number` | `300000` | Timeout in milliseconds (5 min) |
| `options.shell` | `string` | `'/bin/sh'` | Shell binary path |

**Returns** `Promise<ExecuteResult>` — `{ stdout, stderr, exitCode }`

**Throws** `ExecutionError` when the command exits with a non-zero code.

**Example**

```typescript
import { execute } from 'olinda_shell_interface.js';

const { stdout } = await execute('ls -la');
console.log(stdout);
```

---

### `executeStream(command, options?)`

Execute a command and stream output line by line via callbacks.

```typescript
executeStream(command: string, options?: StreamOptions): Promise<number>
```

**Parameters**

| Name | Type | Description |
|---|---|---|
| `command` | `string` | Shell command to run |
| `options.cwd` | `string` | Working directory |
| `options.env` | `object` | Environment variables |
| `options.onStdout` | `(chunk: string) => void` | Called with each stdout chunk |
| `options.onStderr` | `(chunk: string) => void` | Called with each stderr chunk |

**Returns** `Promise<number>` — resolves with exit code `0` on success.

**Throws** `ExecutionError` on non-zero exit or spawn failure.

**Example**

```typescript
import { executeStream } from 'olinda_shell_interface.js';

await executeStream('ping -c 3 localhost', {
    onStdout: (line) => console.log(line),
});
```

---

### `executeSudo(command, options?)`

Execute a command, prepending `sudo` when not already running as root.

```typescript
executeSudo(command: string, options?: ExecuteOptions): Promise<ExecuteResult>
```

Identical signature to `execute`. On non-root Linux systems, prepends `sudo`
to the command before delegating to `execute`.

**Example**

```typescript
import { executeSudo } from 'olinda_shell_interface.js';

const result = await executeSudo('systemctl restart nginx');
```

---

## System

### `detectOS()`

Detect the current operating system.

```typescript
detectOS(): OsValue
```

**Returns** one of `OS.LINUX`, `OS.MACOS`, `OS.WINDOWS`, `OS.UNKNOWN`.

**Example**

```typescript
import { detectOS, OS } from 'olinda_shell_interface.js';

if (detectOS() === OS.LINUX) console.log('Running on Linux');
```

---

### `detectPackageManager()`

Detect the system package manager.

```typescript
detectPackageManager(): PackageManagerValue
```

**Returns** one of `PackageManager.APT`, `.PACMAN`, `.DNF`, `.ZYPPER`, `.BREW`, `.CHOCOLATEY`, `.WINGET`, `.UNKNOWN`.

**Throws** `SystemError` if detection fails unexpectedly.

---

### `commandExists(command)`

Check if a command is available on `PATH`.

```typescript
commandExists(command: string): boolean
```

**Example**

```typescript
import { commandExists } from 'olinda_shell_interface.js';

if (commandExists('git')) console.log('git is available');
```

---

### `getSystemInfo()`

Get comprehensive system information.

```typescript
getSystemInfo(): SystemInfo
```

**Returns** `{ platform, os, arch, release, hostname, cpus, memory: { total, free }, packageManager }`

---

### Constants: `OS` and `PackageManager`

```typescript
const OS = { LINUX: 'linux', MACOS: 'darwin', WINDOWS: 'win32', UNKNOWN: 'unknown' };
const PackageManager = { APT: 'apt', PACMAN: 'pacman', DNF: 'dnf', ZYPPER: 'zypper',
                         BREW: 'brew', CHOCOLATEY: 'choco', WINGET: 'winget', UNKNOWN: 'unknown' };
```

---

## Version

### `parseVersion(version)`

Parse a version string into its components.

```typescript
parseVersion(version: string): ParsedVersion
```

**Returns** `{ major, minor, patch, prerelease, build }`

**Throws** `Error` when the string does not match the semver pattern.

---

### `compareVersions(version1, version2)`

Numerically compare two version strings.

```typescript
compareVersions(v1: string, v2: string): number
```

**Returns** negative when `v1 < v2`, `0` when equal, positive when `v1 > v2`.

---

### `isGreaterThan(v1, v2)` / `isLessThan(v1, v2)` / `isEqual(v1, v2)`

Boolean version predicates.

---

### `getLatestVersion(versions)`

Return the highest version from an array.

```typescript
getLatestVersion(versions: string[]): string | null
```

---

## Errors

### `ShellError`

Base error class for all library errors. Extends `Error`.

```typescript
class ShellError extends Error {
    name: 'ShellError';
    constructor(message: string);
}
```

### `ExecutionError`

Thrown when a shell command exits with a non-zero status. Extends `ShellError`.

```typescript
class ExecutionError extends ShellError {
    name: 'ExecutionError';
    exitCode: number;
    stdout: string;
    stderr: string;
    constructor(message: string, exitCode?: number, stdout?: string, stderr?: string);
}
```

**Example**

```typescript
import { execute, ExecutionError } from 'olinda_shell_interface.js';

try {
    await execute('false');
} catch (err) {
    if (err instanceof ExecutionError) {
        console.error(`Exit ${err.exitCode}: ${err.stderr}`);
    }
}
```

### `SystemError`

Thrown when a system-level operation fails (e.g. package manager detection). Extends `ShellError`.

```typescript
class SystemError extends ShellError {
    name: 'SystemError';
    constructor(message: string);
}
```

---

## Colors

Re-exported from [`olinda_utils.js`](https://github.com/mpbarbosa/olinda_utils.js).

### `colors`

ANSI color/style escape code constants.

```typescript
import { colors } from 'olinda_shell_interface.js';

console.log(`${colors.green}Success${colors.reset}`);
```

### `supportsColor()`

Returns `true` when stdout is a TTY, `TERM` is not `'dumb'`, and `NO_COLOR` is unset.

### `colorize(text, color)`

Wrap text in an ANSI escape code + reset. Falls back to plain text when colors are unsupported.

```typescript
import { colorize, colors } from 'olinda_shell_interface.js';

console.log(colorize('Hello', colors.cyan));
```

---

## Logger

Re-exported from [`olinda_utils.js`](https://github.com/mpbarbosa/olinda_utils.js).
See [`docs/logger.md`](./logger.md) for the full API reference.

### `Logger` class

```typescript
import { Logger } from 'olinda_shell_interface.js';

const log = new Logger({ prefix: '[App]', verbose: true });
log.info('Starting...');
log.success('Done');
```

### `logger` (default instance)

Pre-configured logger with no prefix, quiet `false`, verbose `false`.

```typescript
import { logger } from 'olinda_shell_interface.js';

logger.warn('Something may be wrong');
```

### `LogLevel`

```typescript
const LogLevel = { DEBUG: 'debug', INFO: 'info', SUCCESS: 'success', WARN: 'warn', ERROR: 'error' };
```

### `stripAnsi(str)`

Remove ANSI escape codes from a string (useful for plain-text log files).

---

## CDN Usage

**Script tag (CJS):**

```html
<script src="https://cdn.jsdelivr.net/gh/mpbarbosa/olinda_shell_interface.js@0.4.4/dist/src/index.js"></script>
```

**ES Module:**

```html
<script type="module">
    import { execute, ExecutionError } from
        'https://cdn.jsdelivr.net/gh/mpbarbosa/olinda_shell_interface.js@0.4.4/dist/src/index.js';
</script>
```
