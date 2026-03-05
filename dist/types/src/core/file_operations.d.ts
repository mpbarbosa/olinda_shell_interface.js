/**
 * File Operations Module - Pure Functions + Async Wrapper
 * @module core/file_operations
 * @description File system operations with safe path validation and referential transparency.
 *
 * Architecture: Pure functions + async wrapper class
 * - Pure functions: path validation, file filtering, metadata building
 * - Async wrapper class: FileOperations for real file I/O
 * @since 0.5.0
 */
import fs from 'fs/promises';
/** Result of {@link validatePath}. */
export interface PathValidation {
    valid: boolean;
    error?: string;
}
/** File metadata returned by {@link FileOperations.stat}. */
export interface FileMetadata {
    path: string;
    size: number;
    isFile: boolean;
    isDirectory: boolean;
    isSymbolicLink: boolean;
    created: Date;
    modified: Date;
    accessed: Date;
}
/** A stat-like object accepted by {@link buildFileMetadata}. */
export interface StatLike {
    size: number;
    isFile(): boolean;
    isDirectory(): boolean;
    isSymbolicLink(): boolean;
    birthtime: Date;
    mtime: Date;
    atime: Date;
}
/** A file entry with modification time, used by {@link sortByModificationTime}. */
export interface FileEntry {
    path: string;
    mtime: Date | null | undefined;
}
/** Options for {@link FileOperations.listDirectory} and {@link FileOperations.listDirectoryRecursive}. */
export interface ListOptions {
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
/** Options for {@link FileOperations.glob}. */
export interface GlobOptions {
    /** Working directory for glob resolution. Default: `process.cwd()`. */
    cwd?: string;
    /** Glob patterns to exclude. */
    ignore?: string[];
    /** Return absolute paths. Default: `false`. */
    absolute?: boolean;
}
/** Options for the {@link FileOperations} constructor. */
export interface FileOperationsOptions {
    /** Simulate writes/deletes without performing them. Default: `false`. */
    dryRun?: boolean;
    /** Log each file operation. Default: `false`. */
    verbose?: boolean;
}
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
 * Sort file entries by modification time.
 * @pure
 * @param files     - File entries with `path` and `mtime`.
 * @param ascending - `true` = oldest first (default). `false` = newest first.
 * @returns New sorted array (original is not mutated).
 */
export declare function sortByModificationTime(files: unknown, ascending?: boolean): FileEntry[];
/**
 * Build a {@link FileMetadata} object from a path and stat result.
 * @pure
 * @param filePath - File or directory path.
 * @param stats    - Stat-like object (e.g. from `fs.stat()`).
 * @returns Structured metadata.
 */
export declare function buildFileMetadata(filePath: string, stats: StatLike): FileMetadata;
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
/**
 * Async file system operations with path validation and optional dry-run mode.
 *
 * Uses {@link validatePath} on every call before touching the file system.
 * Dry-run mode logs intended operations without performing them.
 * @since 0.5.0
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
