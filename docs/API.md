# API Reference — olinda_shell_interface.js

Public API for `olinda_shell_interface.js` v0.2.0.

CDN entry point:

```text
https://cdn.jsdelivr.net/gh/mpbarbosa/olinda_shell_interface.js@0.2.0/dist/src/index.js
```

---

## Functions

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

## Interfaces

### `ExecuteOptions`

```typescript
interface ExecuteOptions {
    cwd?: string;
    env?: NodeJS.ProcessEnv;
    timeout?: number;
    shell?: string;
}
```

### `StreamOptions`

```typescript
interface StreamOptions {
    cwd?: string;
    env?: NodeJS.ProcessEnv;
    onStdout?: (chunk: string) => void;
    onStderr?: (chunk: string) => void;
}
```

### `ExecuteResult`

```typescript
interface ExecuteResult {
    stdout: string;
    stderr: string;
    exitCode: number;
}
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

---

## CDN Usage

**Script tag (CJS):**

```html
<script src="https://cdn.jsdelivr.net/gh/mpbarbosa/olinda_shell_interface.js@0.2.0/dist/src/index.js"></script>
```

**ES Module:**

```html
<script type="module">
    import { execute, ExecutionError } from
        'https://cdn.jsdelivr.net/gh/mpbarbosa/olinda_shell_interface.js@0.2.0/dist/src/index.js';
</script>
```
