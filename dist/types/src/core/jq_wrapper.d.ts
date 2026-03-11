/**
 * @fileoverview JQ Wrapper Module - Safe JSON operations with jq command
 * @module core/jq_wrapper
 * @description
 * Provides a safe wrapper for jq command execution with validation, logging,
 * and error handling. Prevents common jq errors like empty --argjson values.
 *
 * Architecture: Pure functions + async wrapper class
 * - Pure functions: JSON validation, sanitization, argument parsing
 * - Async wrapper class: JqWrapper for command execution and I/O
 */
import { ShellError } from "../utils/errors.js";
/**
 * Thrown when jq validation or execution fails.
 * Extends {@link ShellError} with a machine-readable `code` and caller `context`.
 * @since 0.5.4
 * @example
 * throw new JqExecutionError('validation failed', 'JQ_VALIDATION_ERROR', 'my-script');
 */
export declare class JqExecutionError extends ShellError {
    readonly code: string;
    readonly context: string;
    readonly name = "JqExecutionError";
    /**
     * @param message - Human-readable description.
     * @param code    - Machine-readable error code.
     * @param context - Caller context identifier for debugging.
     */
    constructor(message: string, code: string, context: string);
}
/**
 * Validate if a string is well-formed JSON.
 * @pure
 * @param jsonString - JSON string to validate.
 * @returns `true` if valid JSON, `false` otherwise.
 * @example
 * validateJson('{"foo": "bar"}') // true
 * validateJson('{invalid}')      // false
 * validateJson('')               // false
 */
export declare function validateJson(jsonString: string): boolean;
export declare function sanitizeArgjsonValue(value: unknown, defaultValue?: unknown): unknown;
/** A parsed `--argjson` name/value pair. */
export interface ArgjsonPair {
    name: string;
    value: string;
}
/** Result of {@link parseJqArguments}. */
export interface ParsedJqArguments {
    argjsonPairs: ArgjsonPair[];
    otherArgs: string[];
}
/**
 * Parse jq command arguments to extract `--argjson` pairs.
 * @pure
 * @param args - jq command arguments.
 * @returns Parsed `--argjson` pairs and remaining arguments.
 * @example
 * parseJqArguments(['--argjson', 'count', '5', '.foo'])
 * // { argjsonPairs: [{name: 'count', value: '5'}], otherArgs: ['.foo'] }
 */
export declare function parseJqArguments(args: string[]): ParsedJqArguments;
/** Result of {@link validateArgjsonPairs}. */
export interface ArgjsonValidationResult {
    valid: boolean;
    errors: string[];
}
/**
 * Validate `--argjson` argument pairs.
 * @pure
 * @param argjsonPairs - Parsed `--argjson` pairs from {@link parseJqArguments}.
 * @returns Validation result with `valid` flag and error messages.
 * @example
 * validateArgjsonPairs([{name: 'count', value: '5'}])
 * // { valid: true, errors: [] }
 *
 * validateArgjsonPairs([{name: 'count', value: ''}])
 * // { valid: false, errors: ['--argjson variable "count" has empty value'] }
 */
export declare function validateArgjsonPairs(argjsonPairs: ArgjsonPair[]): ArgjsonValidationResult;
/**
 * Build a jq command string from arguments, quoting where necessary.
 * @pure
 * @param args - jq command arguments.
 * @returns Shell command string ready for execution.
 * @example
 * buildJqCommand(['-n', '--arg', 'name', 'test', '{name: $name}'])
 * // "jq -n --arg name test '{name: $name}'"
 */
export declare function buildJqCommand(args: unknown[]): string;
/** Options for the {@link JqWrapper} constructor. */
export interface JqWrapperOptions {
    /** Enable debug logging. Default: `false`. */
    debug?: boolean;
    /** Caller context label used in error messages. Default: `'unknown'`. */
    callerContext?: string;
}
/** Options for {@link JqWrapper.execute} and {@link JqWrapper.executeAndParse}. */
export interface JqExecuteOptions {
    /** Throw {@link JqExecutionError} on validation/execution failure. Default: `true`. */
    throwOnError?: boolean;
}
/**
 * Safe jq command execution with validation and logging.
 *
 * Wraps jq with:
 * - `--argjson` argument validation (prevents empty values)
 * - Optional debug logging
 * - Clear error messages with caller context
 * @since 0.5.4
 * @example
 * const wrapper = new JqWrapper({ debug: true, callerContext: 'my-script' });
 * const result = await wrapper.execute(['-n', '--argjson', 'count', '5', '{count: $count}']);
 */
export declare class JqWrapper {
    private readonly debug;
    private readonly callerContext;
    constructor(options?: JqWrapperOptions);
    /**
     * Execute a jq command with `--argjson` validation.
     * @param args           - jq command arguments.
     * @param options        - Execution options.
     * @returns jq stdout output.
     * @throws {@link JqExecutionError} on validation or execution failure (when `throwOnError` is `true`).
     * @example
     * const result = await wrapper.execute(['-n', '--argjson', 'count', '5', '{count: $count}']);
     */
    execute(args: string[], options?: JqExecuteOptions): Promise<string>;
    /**
     * Execute a jq command and parse the result as JSON.
     * @param args    - jq command arguments.
     * @param options - Execution options.
     * @returns Parsed JSON result.
     * @throws {@link JqExecutionError} if execution or JSON parsing fails.
     * @example
     * const obj = await wrapper.executeAndParse(['-n', '{foo: "bar"}']);
     * // { foo: 'bar' }
     */
    executeAndParse<T = unknown>(args: string[], options?: JqExecuteOptions): Promise<T>;
    /**
     * Validate a JSON string by piping it through jq.
     * @param jsonString - JSON string to validate.
     * @returns `true` if the string is valid JSON, `false` otherwise.
     * @example
     * await wrapper.validateJsonWithJq('{"foo": "bar"}') // true
     * await wrapper.validateJsonWithJq('{invalid}')      // false
     */
    validateJsonWithJq(jsonString: string): Promise<boolean>;
}
