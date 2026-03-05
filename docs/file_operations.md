# file_operations

File system operations module: pure path-validation helpers and the async `FileOperations` class.

## Quick start

```ts
import { FileOperations, validatePath, FileSystemError } from 'olinda_shell_interface.js';
// or from the sub-path export:
import { FileOperations } from 'olinda_shell_interface.js/core/file_operations';

const ops = new FileOperations({ dryRun: false, verbose: true });

const content = await ops.readFile('/absolute/path/to/file.txt');
await ops.writeFile('/absolute/path/to/output.txt', 'Hello!');
```

## Pure functions

These functions are deterministic and side-effect-free.

### `validatePath(filePath)`

Returns `{ valid: true }` or `{ valid: false, error: string }`.

- Rejects non-string, empty, relative, or directory-traversal paths.

```ts
validatePath('/tmp/file.txt')          // { valid: true }
validatePath('relative.txt')           // { valid: false, error: 'Only absolute paths are allowed' }
validatePath('/etc/../passwd')         // { valid: false, error: 'Directory traversal not allowed' }
```

### `filterByExtension(files, extensions)`

Filters an array of paths by file extension.

```ts
filterByExtension(['/a.js', '/b.txt'], ['.js'])  // ['/a.js']
filterByExtension(['/a.js', '/b.txt'], ['js'])   // ['/a.js']  — dot is optional
```

### `filterByPattern(files, pattern)`

Filters an array of paths by regex or string pattern.

```ts
filterByPattern(['/test_a.js', '/main.js'], /test_/)  // ['/test_a.js']
filterByPattern(['/test_a.js', '/main.js'], 'main')   // ['/main.js']
```

### `sortByModificationTime(files, ascending?)`

Sorts `FileEntry[]` objects by `mtime`. Returns a new array; never mutates the original.

```ts
const sorted = sortByModificationTime(entries, false); // newest first
```

### `buildFileMetadata(filePath, stats)`

Builds a `FileMetadata` object from a path and a stat result.

```ts
const stats = await fsPromises.stat('/tmp/file.txt');
const meta = buildFileMetadata('/tmp/file.txt', stats);
```

### `calculateRelativePath(from, to)`

Wraps `path.relative()`.

```ts
calculateRelativePath('/project', '/project/src/index.ts')  // 'src/index.ts'
```

## `FileOperations` class

Async wrapper that validates every path before performing I/O. Supports dry-run and verbose modes.

```ts
new FileOperations(options?: FileOperationsOptions)
```

| Option    | Type    | Default | Description |
|-----------|---------|---------|-------------|
| `dryRun`  | boolean | `false` | Log intended writes/deletes without performing them |
| `verbose` | boolean | `false` | Log each file operation |

### Methods

#### `readFile(filePath, encoding?)`

```ts
const text = await ops.readFile('/etc/hostname');
```

#### `writeFile(filePath, content, options?)`

Creates parent directories automatically.

```ts
await ops.writeFile('/tmp/output/nested/file.txt', 'content');
```

#### `exists(filePath)`

```ts
if (await ops.exists('/tmp/config.yaml')) { /* ... */ }
```

#### `stat(filePath)`

Returns `FileMetadata`.

```ts
const meta = await ops.stat('/tmp/file.txt');
console.log(meta.size, meta.modified);
```

#### `listDirectory(dirPath, options?)`

Non-recursive listing. Supports `extensions` and `pattern` filters.

```ts
const jsFiles = await ops.listDirectory('/src', { extensions: ['.ts'] });
```

#### `listDirectoryRecursive(dirPath, options?)`

Recursive listing. By default skips `node_modules`, `.git`, `__pycache__`, and similar.

```ts
const files = await ops.listDirectoryRecursive('/project', {
  extensions: ['.ts'],
  exclude: ['dist'],
  includeDirectories: false,
  allowAll: false,   // set true to bypass default exclusions
});
```

#### `copyFile(sourcePath, destPath)`

Creates the destination directory tree if needed.

```ts
await ops.copyFile('/src/a.txt', '/dest/sub/a.txt');
```

#### `moveFile(sourcePath, destPath)`

Renames across directories; creates the destination directory tree if needed.

```ts
await ops.moveFile('/old/location.txt', '/new/location.txt');
```

#### `deleteFile(filePath)`

```ts
await ops.deleteFile('/tmp/stale.log');
```

#### `createDirectory(dirPath, options?)`

Recursive by default; silently ignores `EEXIST`.

```ts
await ops.createDirectory('/tmp/my/nested/dir');
```

#### `deleteDirectory(dirPath)`

Recursively removes the directory and all contents (`rm -rf`).

```ts
await ops.deleteDirectory('/tmp/build');
```

#### `glob(pattern, options?)`

Finds files matching a glob pattern using `minimatch`.

```ts
const mdFiles = await ops.glob('**/*.md', {
  cwd: '/project',
  ignore: ['**/node_modules/**', '**/dist/**'],
  absolute: false,
});
```

| Option     | Type     | Default        | Description |
|------------|----------|----------------|-------------|
| `cwd`      | string   | `process.cwd()` | Search root |
| `ignore`   | string[] | `[]`           | Glob patterns to exclude |
| `absolute` | boolean  | `false`        | Return absolute paths |

## `FileSystemError`

Thrown by all `FileOperations` methods on failure.

```ts
import { FileSystemError } from 'olinda_shell_interface.js';

try {
  await ops.readFile('/missing.txt');
} catch (err) {
  if (err instanceof FileSystemError) {
    console.error(err.message, err.path, err.originalError);
  }
}
```

| Field           | Type            | Description |
|-----------------|-----------------|-------------|
| `path`          | `string \| null` | File/directory path |
| `destination`   | `string \| null` | Destination path (copy/move) |
| `originalError` | `Error \| null`  | Underlying Node.js error |

## Interfaces

```ts
interface FileMetadata {
  path: string;
  size: number;
  isFile: boolean;
  isDirectory: boolean;
  isSymbolicLink: boolean;
  created: Date;
  modified: Date;
  accessed: Date;
}

interface ListOptions {
  extensions?: string[];
  pattern?: RegExp | string;
  exclude?: string[];
  allowAll?: boolean;
  includeDirectories?: boolean;
}

interface GlobOptions {
  cwd?: string;
  ignore?: string[];
  absolute?: boolean;
}
```
