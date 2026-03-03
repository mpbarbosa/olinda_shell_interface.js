# errors - Custom Error Classes

**Module:** `utils/errors`
**Version:** 0.2.0
**Type:** Classes

## Overview

Custom error types for the `olinda_shell_interface.js` library. All errors extend the base `ShellError` class and follow the pattern `"ClassName: human-readable description"`.

---

## Class Hierarchy

```
Error
└── ShellError
    ├── ExecutionError
    └── SystemError
```

---

## Classes

### `ShellError`

Base error class for all olinda errors.

**Since:** 0.2.0

**Constructor:**

```javascript
new ShellError(message)
```

| Parameter | Type     | Description                     |
|-----------|----------|---------------------------------|
| `message` | `string` | Human-readable error description |

**Properties:**

| Property | Type     | Value         |
|----------|----------|---------------|
| `name`   | `string` | `'ShellError'` |

**Example:**

```javascript
import { ShellError } from 'olinda_shell_interface.js';

throw new ShellError('ShellError: something went wrong');
```

**Prototype chain check:**

```javascript
const err = new ShellError('ShellError: test');
console.log(err instanceof ShellError); // true
console.log(err instanceof Error);      // true
```

---

### `ExecutionError`

Thrown when a shell command exits with a non-zero status code.

**Since:** 0.2.0

**Constructor:**

```javascript
new ExecutionError(message, exitCode?, stdout?, stderr?)
```

| Parameter  | Type     | Default | Description                    |
|------------|----------|---------|--------------------------------|
| `message`  | `string` | —       | Human-readable description     |
| `exitCode` | `number` | `1`     | Process exit code              |
| `stdout`   | `string` | `''`    | Captured standard output       |
| `stderr`   | `string` | `''`    | Captured standard error        |

**Properties:**

| Property   | Type     | Value              |
|------------|----------|--------------------|
| `name`     | `string` | `'ExecutionError'` |
| `exitCode` | `number` | Process exit code  |
| `stdout`   | `string` | Captured stdout    |
| `stderr`   | `string` | Captured stderr    |

**Example:**

```javascript
import { run, ExecutionError } from 'olinda_shell_interface.js';

try {
  await run('ls /nonexistent');
} catch (err) {
  if (err instanceof ExecutionError) {
    console.error(`Command failed (exit ${err.exitCode}): ${err.stderr}`);
  }
}
```

---

### `SystemError`

Thrown when a system-level operation fails (e.g. package manager detection).

**Since:** 0.3.1

**Constructor:**

```javascript
new SystemError(message)
```

| Parameter | Type     | Description                     |
|-----------|----------|---------------------------------|
| `message` | `string` | Human-readable error description |

**Properties:**

| Property | Type     | Value          |
|----------|----------|----------------|
| `name`   | `string` | `'SystemError'` |

**Example:**

```javascript
import { SystemError } from 'olinda_shell_interface.js';

throw new SystemError('SystemError: failed to detect package manager — EPERM');
```

---

## Error Message Format

All error messages follow the pattern:

```
"ClassName: human-readable description"
```

Examples:
- `"ShellError: unexpected input"`
- `"ExecutionError: command failed with exit code 127"`
- `"SystemError: failed to detect package manager — EPERM"`

---

## Related Modules

- **[executor](./executor.md)** - Throws `ExecutionError` on command failure
- **[system](./system.md)** - Throws `SystemError` on system detection failure
- **[logger](./logger.md)** - Use `logger.error()` to log caught errors
