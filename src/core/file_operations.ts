/**
 * File Operations Module - Pure Functions + Async Wrapper
 * @module core/file_operations
 * @description File system operations with safe path validation and referential transparency.
 *
 * Architecture: Pure functions + async wrapper class
 * - Pure functions: path validation, file filtering, metadata building
 * - Async wrapper class: FileOperations for real file I/O
 * @since 0.5.1
 */

import fs from 'fs/promises';
import { minimatch } from 'minimatch';
import path from 'path';
import { logger } from 'olinda_utils.js';
import { FileSystemError } from '../utils/errors.js';

// Directories never traversed by default (override with options.allowAll)
const NEVER_TRAVERSE_DIRS = new Set([
	'node_modules',
	'.git',
	'.svn',
	'.hg',
	'__pycache__',
	'.pytest_cache',
	'.tox',
	'.mypy_cache',
]);

// ============================================================================
// INTERFACES
// ============================================================================

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

// ============================================================================
// PURE FUNCTIONS
// ============================================================================

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
export function validatePath(filePath: unknown): PathValidation {
	if (!filePath || typeof filePath !== 'string') {
		return { valid: false, error: 'Path must be a non-empty string' };
	}

	if (!path.isAbsolute(filePath)) {
		return { valid: false, error: 'Only absolute paths are allowed' };
	}

	const normalized = path.normalize(filePath);
	if (filePath.includes('..') || normalized.includes('..')) {
		return { valid: false, error: 'Directory traversal not allowed' };
	}

	return { valid: true };
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
export function filterByExtension(files: unknown, extensions: unknown): string[] {
	if (!Array.isArray(files) || !Array.isArray(extensions)) {
		return [];
	}

	const normalizedExts = (extensions as string[]).map((ext) =>
		ext.startsWith('.') ? ext : `.${ext}`,
	);

	return (files as string[]).filter((file) => normalizedExts.includes(path.extname(file)));
}

/**
 * Filter a list of file paths by regex or string pattern.
 * @pure
 * @param files   - File paths to filter.
 * @param pattern - RegExp or string pattern.
 * @returns Filtered file paths.
 * @example
 * filterByPattern(['/test_a.js', '/main.js'], /test_/)  // ['/test_a.js']
 */
export function filterByPattern(files: unknown, pattern: RegExp | string): string[] {
	if (!Array.isArray(files)) {
		return [];
	}

	const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern);
	return (files as string[]).filter((file) => regex.test(file));
}

/**
 * Sort file entries by modification time.
 * @pure
 * @param files     - File entries with `path` and `mtime`.
 * @param ascending - `true` = oldest first (default). `false` = newest first.
 * @returns New sorted array (original is not mutated).
 */
export function sortByModificationTime(files: unknown, ascending = true): FileEntry[] {
	if (!Array.isArray(files)) {
		return [];
	}

	const sorted = [...(files as FileEntry[])].sort((a, b) => {
		const timeA = a.mtime instanceof Date ? a.mtime.getTime() : 0;
		const timeB = b.mtime instanceof Date ? b.mtime.getTime() : 0;
		return ascending ? timeA - timeB : timeB - timeA;
	});

	return sorted;
}

/**
 * Build a {@link FileMetadata} object from a path and stat result.
 * @pure
 * @param filePath - File or directory path.
 * @param stats    - Stat-like object (e.g. from `fs.stat()`).
 * @returns Structured metadata.
 */
export function buildFileMetadata(filePath: string, stats: StatLike): FileMetadata {
	return {
		path: filePath,
		size: stats.size,
		isFile: stats.isFile(),
		isDirectory: stats.isDirectory(),
		isSymbolicLink: stats.isSymbolicLink(),
		created: stats.birthtime,
		modified: stats.mtime,
		accessed: stats.atime,
	};
}

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
export function calculateRelativePath(from: string, to: string): string {
	return path.relative(from, to);
}

// ============================================================================
// ASYNC WRAPPER CLASS
// ============================================================================

/**
 * Async file system operations with path validation and optional dry-run mode.
 *
 * Uses {@link validatePath} on every call before touching the file system.
 * Dry-run mode logs intended operations without performing them.
 * @since 0.5.1
 * @example
 * const ops = new FileOperations({ dryRun: false, verbose: true });
 * const content = await ops.readFile('/tmp/data.txt');
 */
export class FileOperations {
	private readonly dryRun: boolean;
	private readonly verbose: boolean;

	constructor(options: FileOperationsOptions = {}) {
		this.dryRun = options.dryRun ?? false;
		this.verbose = options.verbose ?? false;
	}

	/**
	 * Read file contents.
	 * @param filePath - Absolute path to the file.
	 * @param encoding - Text encoding. Default: `'utf8'`.
	 * @returns File contents as a string.
	 * @throws {@link FileSystemError} on invalid path or read failure.
	 */
	async readFile(filePath: string, encoding: BufferEncoding = 'utf8'): Promise<string> {
		const validation = validatePath(filePath);
		if (!validation.valid) {
			throw new FileSystemError(validation.error!, { path: filePath });
		}

		try {
			if (this.verbose) logger.debug(`Reading file: ${filePath}`);
			return await fs.readFile(filePath, encoding);
		} catch (error) {
			const msg = error instanceof Error ? error.message : String(error);
			throw new FileSystemError(`Failed to read file: ${msg}`, {
				path: filePath,
				originalError: error instanceof Error ? error : undefined,
			});
		}
	}

	/**
	 * Write content to a file, creating parent directories as needed.
	 * @param filePath - Absolute path to the file.
	 * @param content  - Content to write.
	 * @param options  - Options forwarded to `fs.writeFile`.
	 * @throws {@link FileSystemError} on invalid path or write failure.
	 */
	async writeFile(
		filePath: string,
		content: string,
		options: Parameters<typeof fs.writeFile>[2] = {},
	): Promise<void> {
		const validation = validatePath(filePath);
		if (!validation.valid) {
			throw new FileSystemError(validation.error!, { path: filePath });
		}

		if (this.dryRun) {
			logger.info(`[DRY RUN] Would write to file: ${filePath} (${content.length} bytes)`);
			return;
		}

		try {
			if (this.verbose) logger.debug(`Writing file: ${filePath}`);
			await fs.mkdir(path.dirname(filePath), { recursive: true });
			await fs.writeFile(filePath, content, options);
			if (this.verbose) logger.success(`File written: ${filePath}`);
		} catch (error) {
			const msg = error instanceof Error ? error.message : String(error);
			throw new FileSystemError(`Failed to write file: ${msg}`, {
				path: filePath,
				originalError: error instanceof Error ? error : undefined,
			});
		}
	}

	/**
	 * Check whether a path exists.
	 * @param filePath - Absolute path.
	 * @returns `true` if the path exists, `false` otherwise.
	 */
	async exists(filePath: string): Promise<boolean> {
		if (!validatePath(filePath).valid) return false;

		try {
			await fs.access(filePath);
			return true;
		} catch {
			return false;
		}
	}

	/**
	 * Get file or directory metadata.
	 * @param filePath - Absolute path.
	 * @returns {@link FileMetadata} object.
	 * @throws {@link FileSystemError} on invalid path or stat failure.
	 */
	async stat(filePath: string): Promise<FileMetadata> {
		const validation = validatePath(filePath);
		if (!validation.valid) {
			throw new FileSystemError(validation.error!, { path: filePath });
		}

		try {
			const stats = await fs.stat(filePath);
			return buildFileMetadata(filePath, stats);
		} catch (error) {
			const msg = error instanceof Error ? error.message : String(error);
			throw new FileSystemError(`Failed to get file stats: ${msg}`, {
				path: filePath,
				originalError: error instanceof Error ? error : undefined,
			});
		}
	}

	/**
	 * List directory contents (non-recursive).
	 * @param dirPath - Absolute path to directory.
	 * @param options - Filter options.
	 * @returns Absolute paths of directory entries.
	 * @throws {@link FileSystemError} on invalid path or read failure.
	 */
	async listDirectory(dirPath: string, options: ListOptions = {}): Promise<string[]> {
		const validation = validatePath(dirPath);
		if (!validation.valid) {
			throw new FileSystemError(validation.error!, { path: dirPath });
		}

		try {
			if (this.verbose) logger.debug(`Listing directory: ${dirPath}`);

			let entries = (await fs.readdir(dirPath)).map((entry) => path.join(dirPath, entry));

			if (options.extensions) entries = filterByExtension(entries, options.extensions);
			if (options.pattern) entries = filterByPattern(entries, options.pattern);

			return entries;
		} catch (error) {
			const msg = error instanceof Error ? error.message : String(error);
			throw new FileSystemError(`Failed to list directory: ${msg}`, {
				path: dirPath,
				originalError: error instanceof Error ? error : undefined,
			});
		}
	}

	/**
	 * List directory contents recursively.
	 * @param dirPath - Absolute path to directory.
	 * @param options - Traversal and filter options.
	 * @returns Absolute paths of all matching files (and optionally directories).
	 * @throws {@link FileSystemError} on invalid path or traversal failure.
	 */
	async listDirectoryRecursive(dirPath: string, options: ListOptions = {}): Promise<string[]> {
		const validation = validatePath(dirPath);
		if (!validation.valid) {
			throw new FileSystemError(validation.error!, { path: dirPath });
		}

		const results: string[] = [];
		const callerExcludeSet = new Set(options.exclude ?? []);
		const excludeSet = options.allowAll
			? callerExcludeSet
			: new Set([...NEVER_TRAVERSE_DIRS, ...callerExcludeSet]);

		async function traverse(currentPath: string): Promise<void> {
			const entries = await fs.readdir(currentPath, { withFileTypes: true });

			for (const entry of entries) {
				const fullPath = path.join(currentPath, entry.name);

				if (entry.isDirectory()) {
					if (excludeSet.has(entry.name)) continue;
					if (options.includeDirectories) results.push(fullPath);
					await traverse(fullPath);
				} else if (entry.isFile()) {
					results.push(fullPath);
				}
			}
		}

		try {
			await traverse(dirPath);

			let filtered = results;
			if (options.extensions) filtered = filterByExtension(filtered, options.extensions);
			if (options.pattern) filtered = filterByPattern(filtered, options.pattern);

			return filtered;
		} catch (error) {
			const msg = error instanceof Error ? error.message : String(error);
			throw new FileSystemError(
				`Failed to list directory recursively: ${msg}`,
				{ path: dirPath, originalError: error instanceof Error ? error : undefined },
			);
		}
	}

	/**
	 * Copy a file to a new location, creating destination directories as needed.
	 * @param sourcePath - Absolute source path.
	 * @param destPath   - Absolute destination path.
	 * @throws {@link FileSystemError} on invalid path or copy failure.
	 */
	async copyFile(sourcePath: string, destPath: string): Promise<void> {
		const sv = validatePath(sourcePath);
		const dv = validatePath(destPath);
		if (!sv.valid) throw new FileSystemError(sv.error!, { path: sourcePath });
		if (!dv.valid) throw new FileSystemError(dv.error!, { path: destPath });

		if (this.dryRun) {
			logger.info(`[DRY RUN] Would copy file: ${sourcePath} → ${destPath}`);
			return;
		}

		try {
			if (this.verbose) logger.debug(`Copying file: ${sourcePath} → ${destPath}`);
			await fs.mkdir(path.dirname(destPath), { recursive: true });
			await fs.copyFile(sourcePath, destPath);
			if (this.verbose) logger.success(`File copied: ${destPath}`);
		} catch (error) {
			const msg = error instanceof Error ? error.message : String(error);
			throw new FileSystemError(`Failed to copy file: ${msg}`, {
				path: sourcePath,
				destination: destPath,
				originalError: error instanceof Error ? error : undefined,
			});
		}
	}

	/**
	 * Move (rename) a file, creating destination directories as needed.
	 * @param sourcePath - Absolute source path.
	 * @param destPath   - Absolute destination path.
	 * @throws {@link FileSystemError} on invalid path or move failure.
	 */
	async moveFile(sourcePath: string, destPath: string): Promise<void> {
		const sv = validatePath(sourcePath);
		const dv = validatePath(destPath);
		if (!sv.valid) throw new FileSystemError(sv.error!, { path: sourcePath });
		if (!dv.valid) throw new FileSystemError(dv.error!, { path: destPath });

		if (this.dryRun) {
			logger.info(`[DRY RUN] Would move file: ${sourcePath} → ${destPath}`);
			return;
		}

		try {
			if (this.verbose) logger.debug(`Moving file: ${sourcePath} → ${destPath}`);
			await fs.mkdir(path.dirname(destPath), { recursive: true });
			await fs.rename(sourcePath, destPath);
			if (this.verbose) logger.success(`File moved: ${destPath}`);
		} catch (error) {
			const msg = error instanceof Error ? error.message : String(error);
			throw new FileSystemError(`Failed to move file: ${msg}`, {
				path: sourcePath,
				destination: destPath,
				originalError: error instanceof Error ? error : undefined,
			});
		}
	}

	/**
	 * Delete a file.
	 * @param filePath - Absolute path to file.
	 * @throws {@link FileSystemError} on invalid path or deletion failure.
	 */
	async deleteFile(filePath: string): Promise<void> {
		const validation = validatePath(filePath);
		if (!validation.valid) {
			throw new FileSystemError(validation.error!, { path: filePath });
		}

		if (this.dryRun) {
			logger.info(`[DRY RUN] Would delete file: ${filePath}`);
			return;
		}

		try {
			if (this.verbose) logger.debug(`Deleting file: ${filePath}`);
			await fs.unlink(filePath);
			if (this.verbose) logger.success(`File deleted: ${filePath}`);
		} catch (error) {
			const msg = error instanceof Error ? error.message : String(error);
			throw new FileSystemError(`Failed to delete file: ${msg}`, {
				path: filePath,
				originalError: error instanceof Error ? error : undefined,
			});
		}
	}

	/**
	 * Create a directory (recursive by default).
	 * @param dirPath - Absolute path to directory.
	 * @param options - Options forwarded to `fs.mkdir`. Default: `{ recursive: true }`.
	 * @throws {@link FileSystemError} on invalid path or creation failure (EEXIST is silently ignored).
	 */
	async createDirectory(
		dirPath: string,
		options: Parameters<typeof fs.mkdir>[1] = { recursive: true },
	): Promise<void> {
		const validation = validatePath(dirPath);
		if (!validation.valid) {
			throw new FileSystemError(validation.error!, { path: dirPath });
		}

		if (this.dryRun) {
			logger.info(`[DRY RUN] Would create directory: ${dirPath}`);
			return;
		}

		try {
			if (this.verbose) logger.debug(`Creating directory: ${dirPath}`);
			await fs.mkdir(dirPath, options);
			if (this.verbose) logger.success(`Directory created: ${dirPath}`);
		} catch (error) {
			if (!(error instanceof Error) || ('code' in error && (error as NodeJS.ErrnoException).code === 'EEXIST')) return;
			throw new FileSystemError(`Failed to create directory: ${error.message}`, {
				path: dirPath,
				originalError: error,
			});
		}
	}

	/**
	 * Delete a directory and all its contents recursively.
	 * @param dirPath - Absolute path to directory.
	 * @throws {@link FileSystemError} on invalid path or deletion failure.
	 */
	async deleteDirectory(dirPath: string): Promise<void> {
		const validation = validatePath(dirPath);
		if (!validation.valid) {
			throw new FileSystemError(validation.error!, { path: dirPath });
		}

		if (this.dryRun) {
			logger.info(`[DRY RUN] Would delete directory: ${dirPath}`);
			return;
		}

		try {
			if (this.verbose) logger.debug(`Deleting directory: ${dirPath}`);
			await fs.rm(dirPath, { recursive: true, force: true });
			if (this.verbose) logger.success(`Directory deleted: ${dirPath}`);
		} catch (error) {
			const msg = error instanceof Error ? error.message : String(error);
			throw new FileSystemError(`Failed to delete directory: ${msg}`, {
				path: dirPath,
				originalError: error instanceof Error ? error : undefined,
			});
		}
	}

	/**
	 * Find files matching a glob pattern using {@link listDirectoryRecursive} + minimatch.
	 * @param pattern - Glob pattern (e.g. `'**\/*.ts'`).
	 * @param options - Glob options.
	 * @returns Matching file paths (relative or absolute depending on `options.absolute`).
	 */
	async glob(pattern: string, options: GlobOptions = {}): Promise<string[]> {
		const { cwd = process.cwd(), ignore = [], absolute = false } = options;

		const allFiles = await this.listDirectoryRecursive(cwd, { allowAll: true });

		return allFiles
			.map((f) => path.relative(cwd, f))
			.filter((rel) => minimatch(rel, pattern, { dot: true }))
			.filter((rel) => !ignore.some((ig) => minimatch(rel, ig, { dot: true })))
			.map((rel) => (absolute ? path.join(cwd, rel) : rel));
	}
}