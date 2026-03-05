# jq_wrapper - Safe jq Command Wrapper

**Module:** `core/jq_wrapper`
**Version:** 0.5.0
**Type:** Pure Functions + Async Wrapper Class

## Overview

Safe wrapper for `jq` command execution with `--argjson` validation, logging, and error handling. Prevents common jq errors like empty `--argjson` values and provides clear error messages with caller context.

---

## Installation

```typescript
import { JqWrapper, validateJson, sanitizeArgjsonValue } from 'olinda_shell_interface.js/core/jq_wrapper';
```

---

## Error Class

### `JqExecutionError`

Thrown when jq validation or execution fails. Extends `ShellError` with machine-readable `code` and caller `context` fields.

**Constructor:**

```typescript
new JqExecutionError(message: string, code: string, context: string)
```

**Properties:**

- `code` (string) — machine-readable error code: `'JQ_VALIDATION_ERROR'`, `'JQ_EXECUTION_ERROR'`, or `'JQ_PARSE_ERROR'`
- `context` (string) — caller context identifier

---

## Pure Functions

### `validateJson(jsonString)`

Validate if a string is well-formed JSON.

**Returns:** `boolean`

```typescript
validateJson('{"foo": "bar"}')  // true
validateJson('{invalid}')        // false
validateJson('')                  // false
```

---

### `sanitizeArgjsonValue(value, defaultValue?)`

Sanitize a value for use with jq `--argjson`. Ensures the value is a valid JSON primitive.

**Returns:** sanitized JSON-safe value (default fallback: `0`)

```typescript
sanitizeArgjsonValue(42)             // 42
sanitizeArgjsonValue('true')         // true
sanitizeArgjsonValue('invalid', 0)   // 0
sanitizeArgjsonValue({foo: 'bar'})   // {foo: 'bar'}
sanitizeArgjsonValue(NaN, 99)        // 99
```

---

### `parseJqArguments(args)`

Parse jq command arguments to extract `--argjson` pairs.

**Returns:** `{ argjsonPairs: ArgjsonPair[], otherArgs: string[] }`

```typescript
parseJqArguments(['--argjson', 'count', '5', '.foo'])
// { argjsonPairs: [{name: 'count', value: '5'}], otherArgs: ['.foo'] }
```

---

### `validateArgjsonPairs(argjsonPairs)`

Validate `--argjson` argument pairs before execution.

**Returns:** `{ valid: boolean, errors: string[] }`

```typescript
validateArgjsonPairs([{name: 'count', value: '5'}])
// { valid: true, errors: [] }

validateArgjsonPairs([{name: 'count', value: ''}])
// { valid: false, errors: ['--argjson variable "count" has empty value'] }
```

---

### `buildJqCommand(args)`

Build a jq shell command string with proper argument escaping.

**Returns:** `string`

```typescript
buildJqCommand(['-n', '--arg', 'name', 'test', '{name: $name}'])
// "jq -n --arg name test '{name: $name}'"
```

---

## Wrapper Class

### `JqWrapper`

Async jq command execution with validation and logging.

**Constructor:**

```typescript
new JqWrapper(options?: {
  debug?: boolean;       // Enable debug logging. Default: false
  callerContext?: string; // Label for error messages. Default: 'unknown'
})
```

---

### Methods

#### `execute(args, options?)`

Execute a jq command with `--argjson` validation.

**Parameters:**

- `args` (string[]) — jq command arguments
- `options.throwOnError` (boolean) — throw on failure (default: `true`)

**Returns:** `Promise<string>` — jq stdout output

**Throws:** `JqExecutionError` on validation or execution failure

```typescript
const wrapper = new JqWrapper({ callerContext: 'my-script' });

const result = await wrapper.execute(['-n', '--argjson', 'count', '5', '{count: $count}']);
// '{\n  "count": 5\n}\n'

// Non-throwing mode
const safe = await wrapper.execute(['invalid'], { throwOnError: false });
// '' (empty string, error logged)
```

---

#### `executeAndParse<T>(args, options?)`

Execute a jq command and parse the result as JSON.

**Returns:** `Promise<T>` — parsed JSON result

**Throws:** `JqExecutionError` on execution or parse failure

```typescript
const obj = await wrapper.executeAndParse<{foo: string}>(['-n', '{foo: "bar"}']);
// { foo: 'bar' }

const arr = await wrapper.executeAndParse<number[]>(['-n', '[1, 2, 3]']);
// [1, 2, 3]
```

---

#### `validateJsonWithJq(jsonString)`

Validate a JSON string by piping it through jq.

**Returns:** `Promise<boolean>`

```typescript
await wrapper.validateJsonWithJq('{"foo": "bar"}')  // true
await wrapper.validateJsonWithJq('{invalid}')        // false
```

---

## Usage Examples

### Basic JSON processing

```typescript
import { JqWrapper } from 'olinda_shell_interface.js/core/jq_wrapper';

const wrapper = new JqWrapper({ debug: true });
const result = await wrapper.execute(['-n', '{name: "Alice", age: 30}']);
console.log(result);
// { "name": "Alice", "age": 30 }
```

---

### Safe --argjson with validation

```typescript
import { JqWrapper } from 'olinda_shell_interface.js/core/jq_wrapper';

const wrapper = new JqWrapper({ callerContext: 'user-processor' });
const result = await wrapper.executeAndParse([
  '-n',
  '--argjson', 'count', '5',
  '--argjson', 'active', 'true',
  '{count: $count, active: $active}'
]);
// { count: 5, active: true }
```

---

### Sanitizing values before passing to jq

```typescript
import { sanitizeArgjsonValue, JqWrapper } from 'olinda_shell_interface.js/core/jq_wrapper';

const count = sanitizeArgjsonValue(userInput, 0); // safe fallback

const wrapper = new JqWrapper();
const result = await wrapper.executeAndParse([
  '-n',
  '--argjson', 'count', String(count),
  '{count: $count}'
]);
// { count: 0 }
```

---

### Error handling with context

```typescript
import { JqWrapper, JqExecutionError } from 'olinda_shell_interface.js/core/jq_wrapper';

const wrapper = new JqWrapper({ callerContext: 'data-processor' });

try {
  await wrapper.execute(['-n', '--argjson', 'count', '', '{count: $count}']);
} catch (error) {
  if (error instanceof JqExecutionError) {
    console.error(`[${error.code}] in ${error.context}: ${error.message}`);
    // [JQ_VALIDATION_ERROR] in data-processor: jq_safe validation failed ...
  }
}
```

---

## Notes

### jq Availability

Requires the `jq` command-line tool:

```bash
# macOS
brew install jq

# Ubuntu/Debian
sudo apt-get install jq

# Alpine
apk add jq
```

### Common Pitfalls

1. **Empty `--argjson` values** — always sanitize with `sanitizeArgjsonValue` before passing
2. **Special characters** — use `buildJqCommand` for proper shell escaping
3. **Error context** — set `callerContext` in the constructor for actionable error messages

---

**Stability:** Stable
**Test Coverage:** 100%
