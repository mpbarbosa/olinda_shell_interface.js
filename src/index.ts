/**
 * olinda_shell_interface.js — public API
 * @module index
 */

export { execute, executeStream, executeSudo } from './core/executor.js';
export type { ExecuteOptions, StreamOptions, ExecuteResult } from './core/executor.js';

export { OS, PackageManager, detectOS, detectPackageManager, commandExists, getSystemInfo } from './core/system.js';
export type { OsValue, PackageManagerValue, SystemInfo } from './core/system.js';

export { ShellError, ExecutionError, SystemError } from './utils/errors.js';

export { colors, supportsColor, colorize } from 'olinda_utils.js';
export type { ColorName } from 'olinda_utils.js';

export { Logger, logger, LogLevel, stripAnsi } from 'olinda_utils.js';
export type { LoggerOptions, LogLevelValue } from 'olinda_utils.js';

export {
	parseVersion,
	compareVersions,
	isGreaterThan,
	isLessThan,
	isEqual,
	getLatestVersion,
} from './core/version.js';
export type { ParsedVersion } from './core/version.js';
