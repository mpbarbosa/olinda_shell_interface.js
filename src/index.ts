/**
 * olinda_shell_interface.js — public API
 * @module index
 */

export { execute, executeStream, executeSudo } from './core/executor.js';
export type { ExecuteOptions, StreamOptions, ExecuteResult } from './core/executor.js';

export { ShellError, ExecutionError } from './utils/errors.js';
