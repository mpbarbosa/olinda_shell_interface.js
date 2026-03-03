/**
 * olinda_shell_interface.js — public API
 * @module index
 */
export { execute, executeStream, executeSudo } from './core/executor.js';
export type { ExecuteOptions, StreamOptions, ExecuteResult } from './core/executor.js';
export { OS, PackageManager, detectOS, detectPackageManager, commandExists, getSystemInfo } from './core/system.js';
export type { OsValue, PackageManagerValue, SystemInfo } from './core/system.js';
export { ShellError, ExecutionError, SystemError } from './utils/errors.js';
