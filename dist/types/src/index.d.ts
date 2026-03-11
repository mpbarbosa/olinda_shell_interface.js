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
export { camelCase, kebabCase, snakeCase, pascalCase, capitalize, truncate, sanitize, cleanWhitespace, escapeRegex, dedupe, chunk, flatten, groupBy, sortBy, intersection, difference, partition, deepClone, deepMerge, pick, omit, getProperty, setProperty, hasProperty, deepEqual, isEmpty, } from 'olinda_utils.js';
export { parseVersion, compareVersions, isGreaterThan, isLessThan, isEqual, getLatestVersion, } from './core/version.js';
export type { ParsedVersion } from './core/version.js';
export { JqExecutionError, validateJson, sanitizeArgjsonValue, parseJqArguments, validateArgjsonPairs, buildJqCommand, JqWrapper, } from './core/jq_wrapper.js';
export type { ArgjsonPair, ParsedJqArguments, ArgjsonValidationResult, JqWrapperOptions, JqExecuteOptions, } from './core/jq_wrapper.js';
export { FileSystemError } from './utils/errors.js';
export type { FileSystemErrorDetails } from './utils/errors.js';
export { validatePath, filterByExtension, filterByPattern, sortByModificationTime, buildFileMetadata, calculateRelativePath, FileOperations, } from './core/file_operations.js';
export type { PathValidation, FileMetadata, StatLike, FileEntry, ListOptions, GlobOptions, FileOperationsOptions, } from './core/file_operations.js';
