import { camelCase } from 'olinda_utils.js';
import { capitalize } from 'olinda_utils.js';
import { chunk } from 'olinda_utils.js';
import { cleanWhitespace } from 'olinda_utils.js';
import { colorize } from 'olinda_utils.js';
import { ColorName } from 'olinda_utils.js';
import { colors } from 'olinda_utils.js';
import { dedupe } from 'olinda_utils.js';
import { deepClone } from 'olinda_utils.js';
import { deepEqual } from 'olinda_utils.js';
import { deepMerge } from 'olinda_utils.js';
import { difference } from 'olinda_utils.js';
import { escapeRegex } from 'olinda_utils.js';
import { flatten } from 'olinda_utils.js';
import fs from 'fs/promises';
import { getProperty } from 'olinda_utils.js';
import { groupBy } from 'olinda_utils.js';
import { hasProperty } from 'olinda_utils.js';
import { intersection } from 'olinda_utils.js';
import { isEmpty } from 'olinda_utils.js';
import { kebabCase } from 'olinda_utils.js';
import { Logger } from 'olinda_utils.js';
import { logger } from 'olinda_utils.js';
import { LoggerOptions } from 'olinda_utils.js';
import { LogLevel } from 'olinda_utils.js';
import { LogLevelValue } from 'olinda_utils.js';
import { omit } from 'olinda_utils.js';
import { partition } from 'olinda_utils.js';
import { pascalCase } from 'olinda_utils.js';
import { pick } from 'olinda_utils.js';
import { sanitize } from 'olinda_utils.js';
import { setProperty } from 'olinda_utils.js';
import { snakeCase } from 'olinda_utils.js';
import { sortBy } from 'olinda_utils.js';
import { stripAnsi } from 'olinda_utils.js';
import { supportsColor } from 'olinda_utils.js';
import { truncate } from 'olinda_utils.js';

/**
 * Append text to the end of content (PURE).
 *
 * @param text          - Original text.
 * @param content       - Content to append.
 * @param ensureNewline - Ensure a newline separator before appended content (default `true`).
 * @returns Text with the content appended.
 *
 * @example
 * appendText('hello', 'world') // 'hello\nworld'
 */
export declare function appendText(text: string, content: string, ensureNewline?: boolean): string;

/** A parsed `--argjson` name/value pair. */
export declare interface ArgjsonPair {
    name: string;
    value: string;
}

/** Result of {@link validateArgjsonPairs}. */
export declare interface ArgjsonValidationResult {
    valid: boolean;
    errors: string[];
}

/**
 * Build a {@link FileMetadata} object from a path and stat result.
 * @pure
 * @param filePath - File or directory path.
 * @param stats    - Stat-like object (e.g. from `fs.stat()`).
 * @returns Structured metadata.
 */
export declare function buildFileMetadata(filePath: string, stats: StatLike): FileMetadata;

/**
 * Build a jq command string from arguments, quoting where necessary.
 * @pure
 * @param args - jq command arguments.
 * @returns Shell command string ready for execution.
 * @example
 * buildJqCommand(['-n', '--arg', 'name', 'test', '{name: $name}'])
 * // "jq -n --arg name test '{name: $name}'"
 */
export declare function buildJqCommand(args: unknown[]): string;

/**
 * Calculate the relative path from one location to another.
 * @pure
 * @param from - Base path.
 * @param to   - Target path.
 * @returns Relative path string.
 * @example
 * calculateRelativePath('/home/user/project', '/home/user/project/src/index.js')
 * // 'src/index.js'
 */
export declare function calculateRelativePath(from: string, to: string): string;

export { camelCase }

export { capitalize }

export { chunk }

export { cleanWhitespace }

export { colorize }

export { ColorName }

export { colors }

/**
 * Check if a command exists on PATH.
 * @param command - Command name to check.
 * @returns `true` if the command is found on PATH.
 * @since 0.3.1
 * @example
 * if (commandExists('git')) console.log('git is available');
 */
export declare function commandExists(command: string): boolean;

/**
 * Numerically compare two version strings.
 *
 * Versions with a pre-release label sort *before* the equivalent release
 * (e.g. `"1.0.0-alpha" < "1.0.0"`), matching the semver specification.
 *
 * @param version1 - First version string.
 * @param version2 - Second version string.
 * @returns Negative when `version1 < version2`, `0` when equal, positive when `version1 > version2`.
 */
export declare function compareVersions(version1: string, version2: string): number;

export { dedupe }

export { deepClone }

export { deepEqual }

export { deepMerge }

/**
 * Delete lines matching a pattern (PURE).
 *
 * @param text    - Original text.
 * @param pattern - Pattern to match (RegExp or string).
 * @returns Text with matching lines removed.
 *
 * @example
 * deleteLines('keep\nremove me\nkeep', /remove/) // 'keep\nkeep'
 */
export declare function deleteLines(text: string, pattern: RegExp | string): string;

/** Result returned by {@link EditOperations.deleteLines}. */
export declare interface DeleteResult {
    deletedLines: number;
}

/**
 * Detect the current operating system.
 * @returns OS constant.
 * @since 0.3.1
 * @example
 * const currentOs = detectOS();
 * if (currentOs === OS.LINUX) console.log('Running on Linux');
 */
export declare function detectOS(): OsValue;

/**
 * Detect the system package manager.
 * @returns PackageManager constant.
 * @throws {@link SystemError} if detection fails unexpectedly.
     * @since 0.3.1
     * @example
     * const pm = detectPackageManager();
     * console.log(`Package manager: ${pm}`);
     */
 export declare function detectPackageManager(): PackageManagerValue;

 /** Diff result returned by {@link generateDiff}. */
 export declare interface Diff {
     totalChanges: number;
     linesAdded: number;
     linesDeleted: number;
     linesModified: number;
     changes: DiffChange[];
 }

 /** A single line-level change in a diff. */
 export declare interface DiffChange {
     /** Line number (1-based). */
     line: number;
     /** Change type. `"context"` lines are unchanged lines included for surrounding context. */
     type: "added" | "deleted" | "modified" | "context";
     /** Original line content (`null` for added lines). */
     oldContent: string | null;
     /** New line content (`null` for deleted lines). */
     newContent: string | null;
 }

 export { difference }

 /** Options for {@link generateDiff}. */
 export declare interface DiffOptions {
     /**
      * Number of surrounding unchanged lines to include as context around each change.
      * Context lines have `type: "context"` and are excluded from change counts.
      * Default: `0` (no context).
      * @example
      * generateDiff('a\nb\nc', 'a\nX\nc', { context: 1 })
      * // includes line 1 ("a") and line 3 ("c") as context around the change on line 2
      */
     context?: number;
 }

 /**
  * Async wrapper that applies edit operations to real files.
  *
  * All business logic is delegated to pure functions; this class handles I/O,
  * dry-run mode, and verbose logging.
  *
  * @example
  * const editor = new EditOperations({ dryRun: false, verbose: true });
  * await editor.replaceInFile('/abs/path/file.txt', /foo/g, 'bar');
  */
 export declare class EditOperations {
     private readonly fileOps;
     private readonly dryRun;
     private readonly verbose;
     constructor(options?: EditOperationsOptions);
     /**
      * Find all matches of a pattern in a file.
      *
      * @param filePath - Absolute path to the file.
      * @param pattern  - Pattern to search for.
      * @returns Array of matches with position information.
      */
     findInFile(filePath: string, pattern: RegExp | string): Promise<Match[]>;
     /**
      * Replace all occurrences of a pattern in a file.
      *
      * @param filePath    - Absolute path to the file.
      * @param pattern     - Pattern to find.
      * @param replacement - Replacement string or function.
      * @returns Object with `changed` flag and `diff`.
      */
     replaceInFile(filePath: string, pattern: RegExp | string, replacement: string | ((substring: string, ...args: unknown[]) => string)): Promise<ReplaceResult>;
     /**
      * Insert content at a specific line in a file.
      *
      * @param filePath   - Absolute path to the file.
      * @param lineNumber - Line number (1-based).
      * @param content    - Content to insert.
      * @param position   - `'before'` or `'after'` the target line (default `'after'`).
      */
     insertAtLine(filePath: string, lineNumber: number, content: string, position?: "before" | "after"): Promise<void>;
     /**
      * Append content to a file.
      *
      * @param filePath - Absolute path to the file.
      * @param content  - Content to append.
      */
     appendToFile(filePath: string, content: string): Promise<void>;
     /**
      * Prepend content to a file.
      *
      * @param filePath - Absolute path to the file.
      * @param content  - Content to prepend.
      */
     prependToFile(filePath: string, content: string): Promise<void>;
     /**
      * Delete lines matching a pattern from a file.
      *
      * @param filePath - Absolute path to the file.
      * @param pattern  - Pattern to match against each line.
      * @returns Object with `deletedLines` count.
      */
     deleteLines(filePath: string, pattern: RegExp | string): Promise<DeleteResult>;
     /**
      * Replace a range of lines in a file.
      *
      * @param filePath    - Absolute path to the file.
      * @param startLine   - Start line (1-based, inclusive).
      * @param endLine     - End line (1-based, inclusive).
      * @param replacement - Replacement text (may contain newlines).
      */
     replaceLineRange(filePath: string, startLine: number, endLine: number, replacement: string): Promise<void>;
     /**
      * Preview the changes a transform function would make, without writing to disk.
      *
      * @param filePath    - Absolute path to the file.
      * @param transformFn - Function that receives current content and returns new content.
      * @returns Diff, formatted diff string, and `hasChanges` flag.
      */
     previewChanges(filePath: string, transformFn: (content: string) => string): Promise<PreviewResult>;
     /**
      * Apply a transformation function to a file.
      *
      * @param filePath    - Absolute path to the file.
      * @param transformFn - Function that receives current content and returns new content.
      * @returns Object with `applied` flag and `diff`.
      */
     applyTransform(filePath: string, transformFn: (content: string) => string): Promise<TransformResult>;
 }

 /** Constructor options for {@link EditOperations}. */
 export declare interface EditOperationsOptions {
     /** Injected FileOperations instance (defaults to `new FileOperations(options)`). */
     fileOps?: FileOperations;
     /** When `true`, no files are written; operations are logged only. */
     dryRun?: boolean;
     /** When `true`, log detailed operation output. */
     verbose?: boolean;
 }

 export { escapeRegex }

 /**
  * Execute a shell command and return captured output.
  * @param command - The shell command to run.
  * @param options - Execution options.
  * @returns Resolved with stdout, stderr and exitCode on success.
  * @throws {@link ExecutionError} when the command exits with a non-zero code.
      * @since 0.2.0
      * @example
      * const { stdout } = await execute('ls -la');
      */
  export declare function execute(command: string, options?: ExecuteOptions): Promise<ExecuteResult>;

  /**
   * Shell Command Executor
   * @module core/executor
   * @description Execute Linux shell commands with output capture and streaming support.
   */
  /** Options shared by all executor functions. */
  export declare interface ExecuteOptions {
      /** Working directory for the command. Defaults to `process.cwd()`. */
      cwd?: string;
      /** Environment variables. Defaults to `process.env`. */
      env?: NodeJS.ProcessEnv;
      /** Timeout in milliseconds. Defaults to 300 000 (5 min). */
      timeout?: number;
      /** Run the command through the shell (`true` or a shell path e.g. `'/bin/bash'`). Defaults to `'/bin/sh'`. */
      shell?: boolean | string;
      /** Maximum bytes of combined stdout+stderr the buffer may hold. Defaults to 10 MB. */
      maxBuffer?: number;
  }

  /** Result returned by {@link execute} and {@link executeSudo}. */
  export declare interface ExecuteResult {
      stdout: string;
      stderr: string;
      exitCode: number;
  }

  /**
   * Execute a command and stream its output line by line.
   * @param command - The shell command to run.
   * @param options - Stream options including optional stdout/stderr callbacks.
   * @returns Resolves with the exit code when the process ends.
   * @throws {@link ExecutionError} when the process exits with a non-zero code or fails to spawn.
       * @since 0.2.0
       * @example
       * await executeStream('ping -c 3 localhost', { onStdout: console.log });
       */
   export declare function executeStream(command: string, options?: StreamOptions): Promise<number>;

   /**
    * Execute a command, prepending `sudo` when not already running as root.
    * @param command - The shell command to run.
    * @param options - Execution options.
    * @returns Resolved with stdout, stderr and exitCode on success.
    * @throws {@link ExecutionError} when the command exits with a non-zero code.
        * @since 0.2.0
        * @example
        * const result = await executeSudo('systemctl restart nginx');
        */
    export declare function executeSudo(command: string, options?: ExecuteOptions): Promise<ExecuteResult>;

    /**
     * Thrown when a shell command exits with a non-zero status.
     * @since 0.2.0
     * @example
     * throw new ExecutionError('ExecutionError: command failed', 1, '', 'permission denied');
     */
    export declare class ExecutionError extends ShellError {
        readonly exitCode: number;
        readonly stdout: string;
        readonly stderr: string;
        readonly signal: string | null;
        readonly killed: boolean;
        /** @readonly */
        name: string;
        /**
         * @param message  - Human-readable description.
         * @param exitCode - Process exit code.
         * @param stdout   - Captured standard output.
         * @param stderr   - Captured standard error.
         * @param signal   - OS signal that terminated the process (e.g. `'SIGTERM'`), or `null`.
         * @param killed   - Whether the process was killed by the timeout mechanism.
         */
        constructor(message: string, exitCode?: number, stdout?: string, stderr?: string, signal?: string | null, killed?: boolean);
    }

    /**
     * Extract lines matching a pattern (PURE).
     *
     * @param text    - Original text.
     * @param pattern - Pattern to match (RegExp or string).
     * @returns Array of matching lines.
     *
     * @example
     * extractLines('foo\nbar\nfoo', /foo/) // ['foo', 'foo']
     */
    export declare function extractLines(text: string, pattern: RegExp | string): string[];

    /** A file entry with modification time, used by {@link sortByModificationTime}. */
    export declare interface FileEntry {
        path: string;
        mtime: Date | null | undefined;
    }

    /** File metadata returned by {@link FileOperations.stat}. */
    export declare interface FileMetadata {
        path: string;
        size: number;
        isFile: boolean;
        isDirectory: boolean;
        isSymbolicLink: boolean;
        created: Date;
        modified: Date;
        accessed: Date;
    }

    /**
     * Async file system operations with path validation and optional dry-run mode.
     *
     * Uses {@link validatePath} on every call before touching the file system.
     * Dry-run mode logs intended operations without performing them.
     * @since 0.5.4
     * @example
     * const ops = new FileOperations({ dryRun: false, verbose: true });
     * const content = await ops.readFile('/tmp/data.txt');
     */
    export declare class FileOperations {
        private readonly dryRun;
        private readonly verbose;
        constructor(options?: FileOperationsOptions);
        /**
         * Read file contents.
         * @param filePath - Absolute path to the file.
         * @param encoding - Text encoding. Default: `'utf8'`.
         * @returns File contents as a string.
         * @throws {@link FileSystemError} on invalid path or read failure.
             */
         readFile(filePath: string, encoding?: BufferEncoding): Promise<string>;
         /**
          * Write content to a file, creating parent directories as needed.
          * @param filePath - Absolute path to the file.
          * @param content  - Content to write.
          * @param options  - Options forwarded to `fs.writeFile`.
          * @throws {@link FileSystemError} on invalid path or write failure.
              */
          writeFile(filePath: string, content: string, options?: Parameters<typeof fs.writeFile>[2]): Promise<void>;
          /**
           * Check whether a path exists.
           * @param filePath - Absolute path.
           * @returns `true` if the path exists, `false` otherwise.
           */
          exists(filePath: string): Promise<boolean>;
          /**
           * Get file or directory metadata.
           * @param filePath - Absolute path.
           * @returns {@link FileMetadata} object.
               * @throws {@link FileSystemError} on invalid path or stat failure.
                   */
               stat(filePath: string): Promise<FileMetadata>;
               /**
                * List directory contents (non-recursive).
                * @param dirPath - Absolute path to directory.
                * @param options - Filter options.
                * @returns Absolute paths of directory entries.
                * @throws {@link FileSystemError} on invalid path or read failure.
                    */
                listDirectory(dirPath: string, options?: ListOptions): Promise<string[]>;
                /**
                 * List directory contents recursively.
                 * @param dirPath - Absolute path to directory.
                 * @param options - Traversal and filter options.
                 * @returns Absolute paths of all matching files (and optionally directories).
                 * @throws {@link FileSystemError} on invalid path or traversal failure.
                     */
                 listDirectoryRecursive(dirPath: string, options?: ListOptions): Promise<string[]>;
                 /**
                  * Copy a file to a new location, creating destination directories as needed.
                  * @param sourcePath - Absolute source path.
                  * @param destPath   - Absolute destination path.
                  * @throws {@link FileSystemError} on invalid path or copy failure.
                      */
                  copyFile(sourcePath: string, destPath: string): Promise<void>;
                  /**
                   * Move (rename) a file, creating destination directories as needed.
                   * @param sourcePath - Absolute source path.
                   * @param destPath   - Absolute destination path.
                   * @throws {@link FileSystemError} on invalid path or move failure.
                       */
                   moveFile(sourcePath: string, destPath: string): Promise<void>;
                   /**
                    * Delete a file.
                    * @param filePath - Absolute path to file.
                    * @throws {@link FileSystemError} on invalid path or deletion failure.
                        */
                    deleteFile(filePath: string): Promise<void>;
                    /**
                     * Create a directory (recursive by default).
                     * @param dirPath - Absolute path to directory.
                     * @param options - Options forwarded to `fs.mkdir`. Default: `{ recursive: true }`.
                     * @throws {@link FileSystemError} on invalid path or creation failure (EEXIST is silently ignored).
                         */
                     createDirectory(dirPath: string, options?: Parameters<typeof fs.mkdir>[1]): Promise<void>;
                     /**
                      * Delete a directory and all its contents recursively.
                      * @param dirPath - Absolute path to directory.
                      * @throws {@link FileSystemError} on invalid path or deletion failure.
                          */
                      deleteDirectory(dirPath: string): Promise<void>;
                      /**
                       * Find files matching a glob pattern using {@link listDirectoryRecursive} + minimatch.
                       * @param pattern - Glob pattern (e.g. `'**\/*.ts'`).
                       * @param options - Glob options.
                       * @returns Matching file paths (relative or absolute depending on `options.absolute`).
                       */
                      glob(pattern: string, options?: GlobOptions): Promise<string[]>;
                     }

                     /** Options for the {@link FileOperations} constructor. */
                     export declare interface FileOperationsOptions {
                         /** Simulate writes/deletes without performing them. Default: `false`. */
                         dryRun?: boolean;
                         /** Log each file operation. Default: `false`. */
                         verbose?: boolean;
                     }

                     /**
                      * Thrown when a file system operation fails (read, write, copy, move, delete, etc.).
                      * @since 0.5.4
                      * @example
                      * throw new FileSystemError('Failed to read file: ENOENT', { path: '/tmp/missing.txt' });
                      */
                     export declare class FileSystemError extends ShellError {
                         /** @readonly */
                         name: string;
                         /** The file or directory path involved in the failure. */
                         readonly path: string | null;
                         /** Destination path for copy/move operations. */
                         readonly destination: string | null;
                         /** Underlying Node.js error, if any. */
                         readonly originalError: Error | null;
                         /**
                          * @param message - Human-readable description.
                          * @param details - Optional structured details about the failure.
                          */
                         constructor(message: string, details?: FileSystemErrorDetails);
                     }

                     /** Details supplied to {@link FileSystemError}. */
                     export declare interface FileSystemErrorDetails {
                         /** The file or directory path involved in the failure. */
                         path?: string;
                         /** Destination path (for copy/move operations). */
                         destination?: string;
                         /** Underlying Node.js error, if any. */
                         originalError?: Error;
                     }

                     /**
                      * Filter a list of file paths by extension.
                      * @pure
                      * @param files      - File paths to filter.
                      * @param extensions - Extensions to keep (e.g. `['.js', '.ts']` or `['js', 'ts']`).
                      * @returns Filtered file paths.
                      * @example
                      * filterByExtension(['/a.js', '/b.txt'], ['.js'])  // ['/a.js']
                      */
                     export declare function filterByExtension(files: unknown, extensions: unknown): string[];

                     /**
                      * Filter a list of file paths by regex or string pattern.
                      * @pure
                      * @param files   - File paths to filter.
                      * @param pattern - RegExp or string pattern.
                      * @returns Filtered file paths.
                      * @example
                      * filterByPattern(['/test_a.js', '/main.js'], /test_/)  // ['/test_a.js']
                      */
                     export declare function filterByPattern(files: unknown, pattern: RegExp | string): string[];

                     /**
                      * Find all matches of a pattern in text (PURE).
                      *
                      * @param text    - Text to search.
                      * @param pattern - Pattern to find (RegExp or string).
                      * @returns Array of matches with position and line information.
                      *
                      * @example
                      * findMatches('Hello\nWorld', /Hello/)
                      * // [{ match: 'Hello', index: 0, line: 1, lineContent: 'Hello' }]
                      */
                     export declare function findMatches(text: string, pattern: RegExp | string): Match[];

                     export { flatten }

                     /**
                      * Format a diff object for human-readable display (PURE).
                      *
                      * @param diff - Diff object returned by {@link generateDiff}.
                      * @returns Formatted multi-line string.
                      *
                      * @example
                      * formatDiff(generateDiff('a', 'b'))
                      * // 'Total changes: 1\n  +0 lines added\n  -0 lines deleted\n  ~1 lines modified\n...'
                      */
                     export declare function formatDiff(diff: Diff): string;

                     /**
                      * Generate a simple line-by-line diff between two texts (PURE).
                      *
                      * @param oldText - Original text.
                      * @param newText - Modified text.
                      * @param options - Options controlling diff output (e.g. context lines).
                      * @returns Structured diff with change counts and per-line details.
                      *
                      * @example
                      * generateDiff('a\nb', 'a\nc')
                      * // { totalChanges: 1, linesAdded: 0, linesDeleted: 0, linesModified: 1, changes: [...] }
                      *
                      * @example
                      * generateDiff('a\nb\nc', 'a\nX\nc', { context: 1 })
                      * // includes lines 1 and 3 as context around the modification on line 2
                      */
                     export declare function generateDiff(oldText: string, newText: string, options?: DiffOptions): Diff;

                     /**
                      * Return the highest version from an array of version strings.
                      * @param versions - Array of version strings (returns `null` for empty array).
                      * @returns The latest version string, or `null` when the array is empty.
                      */
                     export declare function getLatestVersion(versions: string[]): string | null;

                     /**
                      * Get a range of lines (PURE).
                      *
                      * @param text      - Original text.
                      * @param startLine - Start line number (1-based, inclusive).
                      * @param endLine   - End line number (1-based, inclusive). Pass `-1` for end of file.
                      * @returns Extracted lines joined as a string.
                      *
                      * @example
                      * getLineRange('a\nb\nc\nd', 2, 3) // 'b\nc'
                      */
                     export declare function getLineRange(text: string, startLine: number, endLine: number): string;

                     export { getProperty }

                     /**
                      * Get comprehensive system information.
                      * @returns Object containing platform, os, arch, release, hostname, cpus, memory, packageManager.
                      * @since 0.3.1
                      * @example
                      * const info = getSystemInfo();
                      * console.log(`OS: ${info.os}, CPUs: ${info.cpus}`);
                      */
                     export declare function getSystemInfo(): SystemInfo;

                     /** Options for {@link FileOperations.glob}. */
                     export declare interface GlobOptions {
                         /** Working directory for glob resolution. Default: `process.cwd()`. */
                         cwd?: string;
                         /** Glob patterns to exclude. */
                         ignore?: string[];
                         /** Return absolute paths. Default: `false`. */
                         absolute?: boolean;
                     }

                     export { groupBy }

                     export { hasProperty }

                     /**
                      * Insert text at a specific line number (PURE).
                      *
                      * @param text       - Original text.
                      * @param lineNumber - Line number (1-based).
                      * @param content    - Content to insert.
                      * @param position   - `'before'` or `'after'` the target line (default `'after'`).
                      * @returns Text with the insertion applied.
                      *
                      * @example
                      * insertAtLine('a\nb\nc', 2, 'X', 'before') // 'a\nX\nb\nc'
                      */
                     export declare function insertAtLine(text: string, lineNumber: number, content: string, position?: "before" | "after"): string;

                     export { intersection }

                     export { isEmpty }

                     /**
                      * Returns `true` when both versions are semantically equal.
                      * @param version1 - First version string.
                      * @param version2 - Second version string.
                      * @returns `true` when `version1 === version2` semantically.
                      * @since 0.4.9
                      * @example
                      * isEqual('v1.0.0', '1.0.0'); // true
                      */
                     export declare function isEqual(version1: string, version2: string): boolean;

                     /**
                      * Returns `true` when `version1` is strictly greater than `version2`.
                      * @param version1 - First version string.
                      * @param version2 - Second version string.
                      * @returns `true` when `version1 > version2`.
                      * @since 0.4.9
                      * @example
                      * isGreaterThan('2.0.0', '1.9.9'); // true
                      */
                     export declare function isGreaterThan(version1: string, version2: string): boolean;

                     /**
                      * Returns `true` when `version1` is strictly less than `version2`.
                      * @param version1 - First version string.
                      * @param version2 - Second version string.
                      * @returns `true` when `version1 < version2`.
                      * @since 0.4.9
                      * @example
                      * isLessThan('1.0.0', '2.0.0'); // true
                      */
                     export declare function isLessThan(version1: string, version2: string): boolean;

                     /** Options for {@link JqWrapper.execute} and {@link JqWrapper.executeAndParse}. */
                     export declare interface JqExecuteOptions {
                         /** Throw {@link JqExecutionError} on validation/execution failure. Default: `true`. */
                         throwOnError?: boolean;
                     }

                     /**
                      * Thrown when jq validation or execution fails.
                      * Extends {@link ShellError} with a machine-readable `code` and caller `context`.
                      * @since 0.5.4
                      * @example
                      * throw new JqExecutionError('validation failed', 'JQ_VALIDATION_ERROR', 'my-script');
                      */
                     export declare class JqExecutionError extends ShellError {
                         readonly code: string;
                         readonly context: string;
                         readonly name = "JqExecutionError";
                         /**
                          * @param message - Human-readable description.
                          * @param code    - Machine-readable error code.
                          * @param context - Caller context identifier for debugging.
                          */
                         constructor(message: string, code: string, context: string);
                     }

                     /**
                      * Safe jq command execution with validation and logging.
                      *
                      * Wraps jq with:
                      * - `--argjson` argument validation (prevents empty values)
                      * - Optional debug logging
                      * - Clear error messages with caller context
                      * @since 0.5.4
                      * @example
                      * const wrapper = new JqWrapper({ debug: true, callerContext: 'my-script' });
                      * const result = await wrapper.execute(['-n', '--argjson', 'count', '5', '{count: $count}']);
                      */
                     export declare class JqWrapper {
                         private readonly debug;
                         private readonly callerContext;
                         constructor(options?: JqWrapperOptions);
                         /**
                          * Execute a jq command with `--argjson` validation.
                          * @param args           - jq command arguments.
                          * @param options        - Execution options.
                          * @returns jq stdout output.
                          * @throws {@link JqExecutionError} on validation or execution failure (when `throwOnError` is `true`).
                              * @example
                              * const result = await wrapper.execute(['-n', '--argjson', 'count', '5', '{count: $count}']);
                              */
                          execute(args: string[], options?: JqExecuteOptions): Promise<string>;
                          /**
                           * Execute a jq command and parse the result as JSON.
                           * @param args    - jq command arguments.
                           * @param options - Execution options.
                           * @returns Parsed JSON result.
                           * @throws {@link JqExecutionError} if execution or JSON parsing fails.
                               * @example
                               * const obj = await wrapper.executeAndParse(['-n', '{foo: "bar"}']);
                               * // { foo: 'bar' }
                               */
                           executeAndParse<T = unknown>(args: string[], options?: JqExecuteOptions): Promise<T>;
                           /**
                            * Validate a JSON string by piping it through jq.
                            * @param jsonString - JSON string to validate.
                            * @returns `true` if the string is valid JSON, `false` otherwise.
                            * @example
                            * await wrapper.validateJsonWithJq('{"foo": "bar"}') // true
                            * await wrapper.validateJsonWithJq('{invalid}')      // false
                            */
                           validateJsonWithJq(jsonString: string): Promise<boolean>;
                          }

                          /** Options for the {@link JqWrapper} constructor. */
                          export declare interface JqWrapperOptions {
                              /** Enable debug logging. Default: `false`. */
                              debug?: boolean;
                              /** Caller context label used in error messages. Default: `'unknown'`. */
                              callerContext?: string;
                          }

                          export { kebabCase }

                          /** Options for {@link FileOperations.listDirectory} and {@link FileOperations.listDirectoryRecursive}. */
                          export declare interface ListOptions {
                              /** File extensions to include (e.g. `['.js', '.ts']`). */
                              extensions?: string[];
                              /** Regex or string pattern to match file paths. */
                              pattern?: RegExp | string;
                              /** Additional directory names to skip (recursive only). */
                              exclude?: string[];
                              /** Skip the default NEVER_TRAVERSE_DIRS exclusions (recursive only). */
                              allowAll?: boolean;
                              /** Include directory paths in results (recursive only). */
                              includeDirectories?: boolean;
                          }

                          export { Logger }

                          export { logger }

                          export { LoggerOptions }

                          export { LogLevel }

                          export { LogLevelValue }

                          /** A single pattern match returned by {@link findMatches}. */
                          export declare interface Match {
                              /** The matched text. */
                              match: string;
                              /** Character index within the line. */
                              index: number;
                              /** Line number (1-based). */
                              line: number;
                              /** Full content of the matched line. */
                              lineContent: string;
                          }

                          export { omit }

                          /** Operating system type constants. */
                          export declare const OS: {
                              readonly LINUX: "linux";
                              readonly MACOS: "darwin";
                              readonly WINDOWS: "win32";
                              readonly UNKNOWN: "unknown";
                          };

                          export declare type OsValue = (typeof OS)[keyof typeof OS];

                          /** Package manager type constants. */
                          export declare const PackageManager: {
                              readonly APT: "apt";
                              readonly PACMAN: "pacman";
                              readonly DNF: "dnf";
                              readonly ZYPPER: "zypper";
                              readonly BREW: "brew";
                              readonly CHOCOLATEY: "choco";
                              readonly WINGET: "winget";
                              readonly UNKNOWN: "unknown";
                          };

                          export declare type PackageManagerValue = (typeof PackageManager)[keyof typeof PackageManager];

                          /** Result of {@link parseJqArguments}. */
                          export declare interface ParsedJqArguments {
                              argjsonPairs: ArgjsonPair[];
                              otherArgs: string[];
                          }

                          /**
                           * Semantic Version Module
                           * @module core/version
                           * @description Semantic version parsing and comparison utilities (semver-compatible).
                           * @since 0.4.9
                           */
                          /** Parsed components of a semantic version string. */
                          export declare interface ParsedVersion {
                              major: number;
                              minor: number;
                              patch: number;
                              prerelease: string;
                              build: string;
                          }

                          /**
                           * Parse jq command arguments to extract `--argjson` pairs.
                           * @pure
                           * @param args - jq command arguments.
                           * @returns Parsed `--argjson` pairs and remaining arguments.
                           * @example
                           * parseJqArguments(['--argjson', 'count', '5', '.foo'])
                           * // { argjsonPairs: [{name: 'count', value: '5'}], otherArgs: ['.foo'] }
                           */
                          export declare function parseJqArguments(args: string[]): ParsedJqArguments;

                          /**
                           * Parse a version string into its numeric and label components.
                           *
                           * Accepts an optional leading `v` (e.g. `"v1.2.3-beta+001"`).
                           * Minor and patch components default to `0` when omitted.
                           *
                           * @param version - Version string to parse (e.g. `"1.2.3"`, `"v2.0.0-alpha"`).
                           * @returns Object with `major`, `minor`, `patch`, `prerelease`, and `build`.
                           * @throws {Error} When `version` does not match the semver pattern.
                           */
                          export declare function parseVersion(version: string): ParsedVersion;

                          export { partition }

                          export { pascalCase }

                          /** Result of {@link validatePath}. */
                          export declare interface PathValidation {
                              valid: boolean;
                              error?: string;
                          }

                          export { pick }

                          /**
                           * Prepend text to the beginning of content (PURE).
                           *
                           * @param text          - Original text.
                           * @param content       - Content to prepend.
                           * @param ensureNewline - Ensure a newline separator after prepended content (default `true`).
                           * @returns Text with the content prepended.
                           *
                           * @example
                           * prependText('world', 'hello') // 'hello\nworld'
                           */
                          export declare function prependText(text: string, content: string, ensureNewline?: boolean): string;

                          /** Result returned by {@link EditOperations.previewChanges}. */
                          export declare interface PreviewResult {
                              diff: Diff;
                              formatted: string;
                              hasChanges: boolean;
                          }

                          /**
                           * Replace all occurrences of a pattern in text (PURE).
                           *
                           * @param text        - Text to process.
                           * @param pattern     - Pattern to find (RegExp or string).
                           * @param replacement - Replacement string or function.
                           * @returns Text with all replacements applied.
                           *
                           * @example
                           * replaceAll('foo bar foo', /foo/g, 'baz') // 'baz bar baz'
                           */
                          export declare function replaceAll(text: string, pattern: RegExp | string, replacement: string | ((substring: string, ...args: unknown[]) => string)): string;

                          /**
                           * Replace only the first occurrence of a pattern (PURE).
                           *
                           * @param text        - Text to process.
                           * @param pattern     - Pattern to find (RegExp or string).
                           * @param replacement - Replacement string or function.
                           * @returns Text with the first replacement applied.
                           *
                           * @example
                           * replaceFirst('foo foo', /foo/g, 'bar') // 'bar foo'
                           */
                          export declare function replaceFirst(text: string, pattern: RegExp | string, replacement: string | ((substring: string, ...args: unknown[]) => string)): string;

                          /**
                           * Replace a range of lines (PURE).
                           *
                           * @param text        - Original text.
                           * @param startLine   - Start line number (1-based, inclusive).
                           * @param endLine     - End line number (1-based, inclusive).
                           * @param replacement - Replacement text (may contain newlines).
                           * @returns Text with the replaced range.
                           *
                           * @example
                           * replaceLineRange('a\nb\nc', 2, 2, 'X') // 'a\nX\nc'
                           */
                          export declare function replaceLineRange(text: string, startLine: number, endLine: number, replacement: string): string;

                          /** Result returned by {@link EditOperations.replaceInFile}. */
                          export declare interface ReplaceResult {
                              changed: boolean;
                              diff: Diff;
                          }

                          export { sanitize }

                          export declare function sanitizeArgjsonValue(value: unknown, defaultValue?: unknown): unknown;

                          export { setProperty }

                          /**
                           * Custom Error Classes
                           * @module utils/errors
                           * @description Custom error types for the olinda_shell_interface.js library.
                           */
                          /**
                           * Base error class for all olinda errors.
                           * @since 0.2.0
                           * @example
                           * throw new ShellError('ShellError: something went wrong');
                           */
                          export declare class ShellError extends Error {
                              /** @readonly */
                              name: string;
                              /**
                               * @param message - Human-readable error description.
                               */
                              constructor(message: string);
                          }

                          export { snakeCase }

                          export { sortBy }

                          /**
                           * Sort file entries by modification time.
                           * @pure
                           * @param files     - File entries with `path` and `mtime`.
                           * @param ascending - `true` = oldest first (default). `false` = newest first.
                           * @returns New sorted array (original is not mutated).
                           */
                          export declare function sortByModificationTime(files: unknown, ascending?: boolean): FileEntry[];

                          /** A stat-like object accepted by {@link buildFileMetadata}. */
                          export declare interface StatLike {
                              size: number;
                              isFile(): boolean;
                              isDirectory(): boolean;
                              isSymbolicLink(): boolean;
                              birthtime: Date;
                              mtime: Date;
                              atime: Date;
                          }

                          /** Options for {@link executeStream}. */
                          export declare interface StreamOptions extends Omit<ExecuteOptions, "timeout" | "shell"> {
                              /** Called with each chunk of stdout. If omitted, pipes to `process.stdout`. */
                              onStdout?: (chunk: string) => void;
                              /** Called with each chunk of stderr. If omitted, pipes to `process.stderr`. */
                              onStderr?: (chunk: string) => void;
                          }

                          export { stripAnsi }

                          export { supportsColor }

                          /**
                           * Thrown when a system-level operation fails (e.g. package manager detection).
                           * @since 0.3.1
                           * @example
                           * throw new SystemError('SystemError: failed to detect package manager — EPERM');
                           */
                          export declare class SystemError extends ShellError {
                              /** @readonly */
                              name: string;
                              /**
                               * @param message - Human-readable error description.
                               */
                              constructor(message: string);
                          }

                          /** Shape of the object returned by {@link getSystemInfo}. */
                          export declare interface SystemInfo {
                              platform: string;
                              os: OsValue;
                              arch: string;
                              release: string;
                              hostname: string;
                              cpus: number;
                              memory: {
                                  total: number;
                                  free: number;
                              };
                              packageManager: PackageManagerValue;
                          }

                          /** Result returned by {@link EditOperations.applyTransform}. */
                          export declare interface TransformResult {
                              applied: boolean;
                              diff: Diff;
                          }

                          export { truncate }

                          /**
                           * Validate `--argjson` argument pairs.
                           * @pure
                           * @param argjsonPairs - Parsed `--argjson` pairs from {@link parseJqArguments}.
                           * @returns Validation result with `valid` flag and error messages.
                           * @example
                           * validateArgjsonPairs([{name: 'count', value: '5'}])
                           * // { valid: true, errors: [] }
                           *
                           * validateArgjsonPairs([{name: 'count', value: ''}])
                           * // { valid: false, errors: ['--argjson variable "count" has empty value'] }
                           */
                          export declare function validateArgjsonPairs(argjsonPairs: ArgjsonPair[]): ArgjsonValidationResult;

                          /**
                           * Validate if a string is well-formed JSON.
                           * @pure
                           * @param jsonString - JSON string to validate.
                           * @returns `true` if valid JSON, `false` otherwise.
                           * @example
                           * validateJson('{"foo": "bar"}') // true
                           * validateJson('{invalid}')      // false
                           * validateJson('')               // false
                           */
                          export declare function validateJson(jsonString: string): boolean;

                          /**
                           * Validate if a path is safe (absolute only, no directory traversal).
                           * @pure
                           * @param filePath - Path to validate.
                           * @returns Validation result.
                           * @example
                           * validatePath('/home/user/file.txt')        // { valid: true }
                           * validatePath('relative/path.txt')          // { valid: false, error: 'Only absolute paths are allowed' }
                           * validatePath('/home/user/../etc/passwd')   // { valid: false, error: 'Directory traversal not allowed' }
                           */
                          export declare function validatePath(filePath: unknown): PathValidation;

                          export { }
