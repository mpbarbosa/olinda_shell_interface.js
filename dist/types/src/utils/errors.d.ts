/**
 * Custom Error Classes
 * @module utils/errors
 * @description Custom error types for the olinda_shell_interface.js library.
 */
/**
 * Base error class for all olinda errors.
 * @since 0.1.0
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
/**
 * Thrown when a shell command exits with a non-zero status.
 * @since 0.1.0
 * @example
 * throw new ExecutionError('ExecutionError: command failed', 1, '', 'permission denied');
 */
export declare class ExecutionError extends ShellError {
    readonly exitCode: number;
    readonly stdout: string;
    readonly stderr: string;
    /** @readonly */
    name: string;
    /**
     * @param message  - Human-readable description.
     * @param exitCode - Process exit code.
     * @param stdout   - Captured standard output.
     * @param stderr   - Captured standard error.
     */
    constructor(message: string, exitCode?: number, stdout?: string, stderr?: string);
}
