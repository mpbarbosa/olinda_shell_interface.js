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
	 */
	constructor(
		message: string,
		public readonly exitCode: number = 1,
		public readonly stdout: string = '',
		public readonly stderr: string = '',
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
