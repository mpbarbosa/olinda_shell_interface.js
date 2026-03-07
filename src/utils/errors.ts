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
export class ShellError extends Error {
	/** @readonly */
	name = 'ShellError';

	/**
	 * @param message - Human-readable error description.
	 */
	constructor(message: string) {
		super(message);
		Object.setPrototypeOf(this, new.target.prototype);
		this.name = 'ShellError';
	}
}

/**
 * Thrown when a shell command exits with a non-zero status.
 * @since 0.2.0
 * @example
 * throw new ExecutionError('ExecutionError: command failed', 1, '', 'permission denied');
 */
export class ExecutionError extends ShellError {
	/** @readonly */
	name = 'ExecutionError';

	/**
	 * @param message  - Human-readable description.
	 * @param exitCode - Process exit code.
	 * @param stdout   - Captured standard output.
	 * @param stderr   - Captured standard error.
	 * @param signal   - OS signal that terminated the process (e.g. `'SIGTERM'`), or `null`.
	 * @param killed   - Whether the process was killed by the timeout mechanism.
	 */
	constructor(
		message: string,
		public readonly exitCode: number = 1,
		public readonly stdout: string = '',
		public readonly stderr: string = '',
		public readonly signal: string | null = null,
		public readonly killed: boolean = false,
	) {
		super(message);
		Object.setPrototypeOf(this, new.target.prototype);
		this.name = 'ExecutionError';
	}
}

/**
 * Thrown when a system-level operation fails (e.g. package manager detection).
 * @since 0.3.1
 * @example
 * throw new SystemError('SystemError: failed to detect package manager — EPERM');
 */
export class SystemError extends ShellError {
	/** @readonly */
	name = 'SystemError';

	/**
	 * @param message - Human-readable error description.
	 */
	constructor(message: string) {
		super(message);
		Object.setPrototypeOf(this, new.target.prototype);
		this.name = 'SystemError';
	}
}

/** Details supplied to {@link FileSystemError}. */
export interface FileSystemErrorDetails {
/** The file or directory path involved in the failure. */
path?: string;
/** Destination path (for copy/move operations). */
destination?: string;
/** Underlying Node.js error, if any. */
originalError?: Error;
}

/**
 * Thrown when a file system operation fails (read, write, copy, move, delete, etc.).
 * @since 0.5.4
 * @example
 * throw new FileSystemError('Failed to read file: ENOENT', { path: '/tmp/missing.txt' });
 */
export class FileSystemError extends ShellError {
/** @readonly */
name = 'FileSystemError';

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
constructor(message: string, details: FileSystemErrorDetails = {}) {
super(message);
Object.setPrototypeOf(this, new.target.prototype);
this.name = 'FileSystemError';
this.path = details.path ?? null;
this.destination = details.destination ?? null;
this.originalError = details.originalError ?? null;
}
}
