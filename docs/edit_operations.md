# edit_operations

File content editing utilities: pure text-manipulation helpers and the async `EditOperations` class.

## Quick start

```ts
import { EditOperations, findMatches, generateDiff } from 'olinda_shell_interface.js';
// or from the sub-path export:
import { EditOperations } from 'olinda_shell_interface.js/core/edit_operations';

const editor = new EditOperations({ dryRun: false, verbose: true });

await editor.replaceInFile('/abs/path/file.txt', /foo/g, 'bar');
await editor.appendToFile('/abs/path/log.txt', 'new entry');

const preview = await editor.previewChanges('/abs/path/file.txt', (c) => c.toUpperCase());
console.log(preview.formatted);
```

## Pure functions

These functions are deterministic and side-effect-free.

### `findMatches(text, pattern)`

Returns an array of `Match` objects, one per regex hit per line.

```ts
findMatches('Hello World\nHello Again', /Hello/g)
// [
//   { match: 'Hello', index: 0, line: 1, lineContent: 'Hello World' },
//   { match: 'Hello', index: 0, line: 2, lineContent: 'Hello Again' },
// ]
findMatches(null, /test/)  // []
```

### `replaceAll(text, pattern, replacement)`

Replaces every occurrence of `pattern` in `text`.

```ts
replaceAll('foo bar foo', /foo/g, 'baz')     // 'baz bar baz'
replaceAll('test 1 test 2', /test/g, () => 'TEST')  // 'TEST 1 TEST 2'
replaceAll(null, /x/, 'y')                   // ''
```

### `replaceFirst(text, pattern, replacement)`

Replaces only the first occurrence of `pattern`.

```ts
replaceFirst('foo foo', /foo/g, 'bar')  // 'bar foo'
```

### `insertAtLine(text, lineNumber, content, position?)`

Inserts `content` before or after the given 1-based line number.

- `position` defaults to `'after'`.

```ts
insertAtLine('a\nb\nc', 2, 'X')           // 'a\nb\nX\nc'
insertAtLine('a\nb\nc', 2, 'X', 'before') // 'a\nX\nb\nc'
```

### `appendText(text, content, ensureNewline?)`

Appends `content` to the end of `text`. `ensureNewline` defaults to `true`.

```ts
appendText('hello', 'world')       // 'hello\nworld'
appendText('hello', 'world', false) // 'helloworld'
```

### `prependText(text, content, ensureNewline?)`

Prepends `content` to the beginning of `text`. `ensureNewline` defaults to `true`.

```ts
prependText('world', 'hello')       // 'hello\nworld'
prependText('world', 'hello\n')     // 'hello\nworld'
```

### `deleteLines(text, pattern)`

Removes every line that matches `pattern`.

```ts
deleteLines('keep\nremove me\nkeep', /remove/)  // 'keep\nkeep'
```

### `extractLines(text, pattern)`

Returns an array of lines that match `pattern`.

```ts
extractLines('foo\nbar\nfoo', /foo/)  // ['foo', 'foo']
```

### `getLineRange(text, startLine, endLine)`

Returns lines `startLine` through `endLine` (both 1-based, inclusive). Pass `-1` for `endLine` to get all remaining lines.

```ts
getLineRange('a\nb\nc\nd', 2, 3)   // 'b\nc'
getLineRange('a\nb\nc', 2, -1)    // 'b\nc'
```

### `replaceLineRange(text, startLine, endLine, replacement)`

Replaces lines `startLine`–`endLine` with `replacement` (which may contain newlines).

```ts
replaceLineRange('a\nb\nc', 2, 2, 'X')  // 'a\nX\nc'
```

### `generateDiff(oldText, newText)`

Computes a line-by-line diff between two strings.

```ts
generateDiff('a\nb', 'a\nc')
// {
//   totalChanges: 1, linesAdded: 0, linesDeleted: 0, linesModified: 1,
//   changes: [{ line: 2, type: 'modified', oldContent: 'b', newContent: 'c' }]
// }
```

### `formatDiff(diff)`

Formats a `Diff` object as a human-readable string.

```ts
formatDiff(generateDiff('a', 'b'))
// 'Total changes: 1\n  +0 lines added\n  -0 lines deleted\n  ~1 lines modified\n...'
formatDiff({ totalChanges: 0, changes: [] })  // 'No changes detected.'
```

## `EditOperations` class

Async wrapper that applies pure edit functions to real files. All paths must be absolute.

### Constructor

```ts
new EditOperations(options?: EditOperationsOptions)
```

| Option | Type | Default | Description |
|---|---|---|---|
| `fileOps` | `FileOperations` | `new FileOperations(options)` | Injected file-ops instance |
| `dryRun` | `boolean` | `false` | Skip writes; log what would change |
| `verbose` | `boolean` | `false` | Log each operation's outcome |

### Methods

#### `findInFile(filePath, pattern)`

Returns all `Match` objects found in the file.

```ts
const matches = await editor.findInFile('/abs/file.txt', /TODO/g);
```

#### `replaceInFile(filePath, pattern, replacement)`

Replaces all occurrences of `pattern` in the file. Returns `ReplaceResult`.

```ts
const { changed, diff } = await editor.replaceInFile('/abs/file.txt', /v1/g, 'v2');
```

#### `insertAtLine(filePath, lineNumber, content, position?)`

Inserts `content` before or after line `lineNumber` (default `'after'`).

```ts
await editor.insertAtLine('/abs/file.txt', 5, '// new comment', 'before');
```

#### `appendToFile(filePath, content)`

Appends `content` to the end of the file (with automatic newline).

```ts
await editor.appendToFile('/abs/log.txt', 'Done.');
```

#### `prependToFile(filePath, content)`

Prepends `content` to the beginning of the file.

```ts
await editor.prependToFile('/abs/file.txt', '// generated');
```

#### `deleteLines(filePath, pattern)`

Removes all lines matching `pattern`. Returns `DeleteResult`.

```ts
const { deletedLines } = await editor.deleteLines('/abs/file.txt', /^\s*\/\//);
```

#### `replaceLineRange(filePath, startLine, endLine, replacement)`

Replaces lines `startLine`–`endLine` with `replacement`.

```ts
await editor.replaceLineRange('/abs/file.txt', 10, 15, '// removed');
```

#### `previewChanges(filePath, transformFn)`

Returns a `PreviewResult` showing what `transformFn` would change — **does not write to disk**.

```ts
const { hasChanges, formatted } = await editor.previewChanges('/abs/file.txt', (c) =>
  c.replace(/old/g, 'new'),
);
```

#### `applyTransform(filePath, transformFn)`

Applies `transformFn` to the file and writes the result. Returns `TransformResult`.

```ts
const { applied, diff } = await editor.applyTransform('/abs/file.txt', (c) =>
  c.toUpperCase(),
);
```

## TypeScript types

```ts
import type {
  Match,
  DiffChange,
  Diff,
  ReplaceResult,
  DeleteResult,
  PreviewResult,
  TransformResult,
  EditOperationsOptions,
} from 'olinda_shell_interface.js/core/edit_operations';
```
