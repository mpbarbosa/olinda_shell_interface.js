"use strict";
/**
 * Custom Error Classes
 * @module utils/errors
 * @description Custom error types for the olinda_shell_interface.js library.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExecutionError = exports.ShellError = void 0;
/**
 * Base error class for all olinda errors.
 * @since 0.1.0
 * @example
 * throw new ShellError('ShellError: something went wrong');
 */
class ShellError extends Error {
    /**
     * @param message - Human-readable error description.
     */
    constructor(message) {
        super(message);
        /** @readonly */
        this.name = 'ShellError';
        Object.setPrototypeOf(this, new.target.prototype);
        this.name = 'ShellError';
    }
}
exports.ShellError = ShellError;
/**
 * Thrown when a shell command exits with a non-zero status.
 * @since 0.1.0
 * @example
 * throw new ExecutionError('ExecutionError: command failed', 1, '', 'permission denied');
 */
class ExecutionError extends ShellError {
    /**
     * @param message  - Human-readable description.
     * @param exitCode - Process exit code.
     * @param stdout   - Captured standard output.
     * @param stderr   - Captured standard error.
     */
    constructor(message, exitCode = 1, stdout = '', stderr = '') {
        super(message);
        this.exitCode = exitCode;
        this.stdout = stdout;
        this.stderr = stderr;
        /** @readonly */
        this.name = 'ExecutionError';
        Object.setPrototypeOf(this, new.target.prototype);
        this.name = 'ExecutionError';
    }
}
exports.ExecutionError = ExecutionError;
