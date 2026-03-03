# system - System Information Module

**Module:** `core/system`
**Version:** 0.3.1
**Type:** Pure Functions

## Overview

Provides operating system detection, package manager identification, and system information utilities. Useful for writing cross-platform shell automation scripts.

---

## Exports

### `OS` — OS constants

| Constant     | Value       |
|--------------|-------------|
| `OS.LINUX`   | `'linux'`   |
| `OS.MACOS`   | `'darwin'`  |
| `OS.WINDOWS` | `'win32'`   |
| `OS.UNKNOWN` | `'unknown'` |

### `PackageManager` — package manager constants

| Constant                    | Value      | OS      |
|-----------------------------|------------|---------|
| `PackageManager.APT`        | `'apt'`    | Linux   |
| `PackageManager.PACMAN`     | `'pacman'` | Linux   |
| `PackageManager.DNF`        | `'dnf'`    | Linux   |
| `PackageManager.ZYPPER`     | `'zypper'` | Linux   |
| `PackageManager.BREW`       | `'brew'`   | macOS   |
| `PackageManager.CHOCOLATEY` | `'choco'`  | Windows |
| `PackageManager.WINGET`     | `'winget'` | Windows |
| `PackageManager.UNKNOWN`    | `'unknown'`| Any     |

---

## Functions

### `detectOS()`

Detect the current operating system.

**Returns:** `string` — one of the `OS` constants.

```javascript
import { detectOS, OS } from 'olinda_shell_interface.js/core/system';

if (detectOS() === OS.LINUX) console.log('Running on Linux');
```

### `commandExists(command)`

Check if a command is available on PATH.

**Parameters:** `command` (string)

**Returns:** `boolean`

```javascript
import { commandExists } from 'olinda_shell_interface.js/core/system';

if (commandExists('git')) console.log('git is available');
```

### `detectPackageManager()`

Detect the system package manager.

**Returns:** `string` — one of the `PackageManager` constants.

**Throws:** `SystemError` if detection fails unexpectedly.

### `getSystemInfo()`

Get comprehensive system information.

**Returns:**

```typescript
{
  platform: string;        // Node.js platform string
  os: OsValue;             // OS constant
  arch: string;            // CPU architecture
  release: string;         // OS version string
  hostname: string;        // Machine hostname
  cpus: number;            // Number of CPU cores
  memory: {
    total: number;         // Total RAM in bytes
    free: number;          // Free RAM in bytes
  };
  packageManager: PackageManagerValue;
}
```

---

## Error Types

### `SystemError`

Thrown when a system-level operation fails. Extends `ShellError` → `Error`.

```javascript
import { SystemError } from 'olinda_shell_interface.js/utils/errors';

try {
  detectPackageManager();
} catch (e) {
  if (e instanceof SystemError) console.error(e.message);
}
```

---

**Source:** [`src/core/system.ts`](../src/core/system.ts)
**Since:** 0.3.1
