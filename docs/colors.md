# colors — ANSI Color Module

**Module:** `core/colors`  
**Version:** 0.4.1  
**Package:** `olinda_shell_interface.js`

## Overview

Provides ANSI escape codes for terminal color output and utilities for detecting color support and colorizing strings.

---

## Exports

### `colors` Object

All ANSI escape sequences, exported as a `const` object.

**Type:** `Readonly<Record<ColorName, string>>`

| Key             | Code       | Effect              |
| --------------- | ---------- | ------------------- |
| `reset`         | `\x1b[0m`  | Reset all styles    |
| `bold`          | `\x1b[1m`  | Bold text           |
| `dim`           | `\x1b[2m`  | Dim/faint text      |
| `black`         | `\x1b[30m` | Black foreground    |
| `red`           | `\x1b[31m` | Red foreground      |
| `green`         | `\x1b[32m` | Green foreground    |
| `yellow`        | `\x1b[33m` | Yellow foreground   |
| `blue`          | `\x1b[34m` | Blue foreground     |
| `magenta`       | `\x1b[35m` | Magenta foreground  |
| `cyan`          | `\x1b[36m` | Cyan foreground     |
| `white`         | `\x1b[37m` | White foreground    |
| `brightRed`     | `\x1b[91m` | Bright red          |
| `brightGreen`   | `\x1b[92m` | Bright green        |
| `brightYellow`  | `\x1b[93m` | Bright yellow       |
| `brightBlue`    | `\x1b[94m` | Bright blue         |
| `brightMagenta` | `\x1b[95m` | Bright magenta      |
| `brightCyan`    | `\x1b[96m` | Bright cyan         |
| `brightWhite`   | `\x1b[97m` | Bright white        |

---

### `supportsColor()`

Checks whether the current terminal supports ANSI colors.

```typescript
supportsColor(): boolean
```

**Returns** `true` when all conditions are met:
- `process.stdout.isTTY === true`
- `process.env.TERM !== 'dumb'`
- `process.env.NO_COLOR` is unset

**Example:**

```typescript
import { supportsColor } from 'olinda_shell_interface.js';

if (supportsColor()) {
  console.log('Terminal supports colors');
}
```

---

### `colorize(text, color)`

Wrap a string in an ANSI color code with automatic reset.

```typescript
colorize(text: string, color: string): string
```

**Parameters:**

| Name    | Type     | Description                                    |
| ------- | -------- | ---------------------------------------------- |
| `text`  | `string` | The text to colorize                           |
| `color` | `string` | An ANSI escape sequence (e.g. `colors.red`)    |

**Returns** The colorized string, or `text` unchanged when `supportsColor()` is `false`.

**Example:**

```typescript
import { colors, colorize } from 'olinda_shell_interface.js';

const message = colorize('Success!', colors.green);
console.log(message); // Green "Success!" in supported terminals
```

---

## Usage Examples

### Basic colorization

```typescript
import { colors, colorize } from 'olinda_shell_interface.js';

console.log(colorize('Error occurred', colors.red));
console.log(colorize('All good', colors.green));
console.log(colorize('Warning', colors.yellow));
```

### Checking support before colorizing

```typescript
import { colors, supportsColor } from 'olinda_shell_interface.js';

const label = supportsColor()
  ? `${colors.cyan}INFO${colors.reset}`
  : 'INFO';

console.log(`${label}: Processing...`);
```

### Combining styles

```typescript
import { colors } from 'olinda_shell_interface.js';

// Bold + color (combine escape codes manually)
const boldRed = `${colors.bold}${colors.red}`;
console.log(`${boldRed}CRITICAL${colors.reset}`);
```

---

## Environment Variables

| Variable   | Effect                                      |
| ---------- | ------------------------------------------- |
| `NO_COLOR` | Set to any value to disable color output    |
| `TERM=dumb`| Terminals that don't support escape codes   |

---

**Last Updated:** 2026-03-03  
**Part of:** olinda_shell_interface.js v0.4.1
