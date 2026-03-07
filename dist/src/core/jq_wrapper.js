"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.JqWrapper = exports.JqExecutionError = void 0;
exports.validateJson = validateJson;
exports.sanitizeArgjsonValue = sanitizeArgjsonValue;
exports.parseJqArguments = parseJqArguments;
exports.validateArgjsonPairs = validateArgjsonPairs;
exports.buildJqCommand = buildJqCommand;
const olinda_utils_js_1 = require("olinda_utils.js");
const errors_js_1 = require("../utils/errors.js");
const executor_js_1 = require("./executor.js");
// ============================================================================
// CUSTOM ERROR CLASS
// ============================================================================
/**
 * Thrown when jq validation or execution fails.
 * Extends {@link ShellError} with a machine-readable `code` and caller `context`.
 * @since 0.5.2
 * @example
 * throw new JqExecutionError('validation failed', 'JQ_VALIDATION_ERROR', 'my-script');
 */
class JqExecutionError extends errors_js_1.ShellError {
    /**
     * @param message - Human-readable description.
     * @param code    - Machine-readable error code.
     * @param context - Caller context identifier for debugging.
     */
    constructor(message, code, context) {
        super(message);
        this.code = code;
        this.context = context;
        this.name = 'JqExecutionError';
        Object.setPrototypeOf(this, new.target.prototype);
        this.name = 'JqExecutionError';
    }
}
exports.JqExecutionError = JqExecutionError;
// ============================================================================
// PURE FUNCTIONS - Exported for testing and reuse
// ============================================================================
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
function validateJson(jsonString) {
    if (typeof jsonString !== 'string' || jsonString.trim() === '') {
        return false;
    }
    try {
        JSON.parse(jsonString);
        return true;
    }
    catch {
        return false;
    }
}
/**
 * Sanitize a value for use with jq `--argjson` flag.
 * Ensures the value is a valid JSON primitive (number, boolean, null, or object/array).
 * @pure
 * @param value        - Value to sanitize.
 * @param defaultValue - Fallback value when sanitization fails (default: `0`).
 * @returns Sanitized JSON-safe value.
 * @example
 * sanitizeArgjsonValue(42)             // 42
 * sanitizeArgjsonValue('true')         // true
 * sanitizeArgjsonValue('invalid', 0)   // 0
 * sanitizeArgjsonValue({foo: 'bar'})   // {foo: 'bar'}
 */
/** @internal Coerce a trimmed string to a JSON-safe primitive. */
function sanitizeStringValue(trimmed, defaultValue) {
    if (trimmed === 'true')
        return true;
    if (trimmed === 'false')
        return false;
    if (trimmed === 'null')
        return null;
    if (trimmed === '')
        return defaultValue;
    const num = Number(trimmed);
    if (!isNaN(num) && isFinite(num))
        return num;
    try {
        return JSON.parse(trimmed);
    }
    catch {
        return defaultValue;
    }
}
function sanitizeArgjsonValue(value, defaultValue = 0) {
    if (value === null)
        return null;
    if (value === undefined)
        return defaultValue;
    if (typeof value === 'boolean')
        return value;
    if (typeof value === 'number') {
        return isNaN(value) || !isFinite(value) ? defaultValue : value;
    }
    if (typeof value === 'string') {
        return sanitizeStringValue(value.trim(), defaultValue);
    }
    // Handle objects/arrays - deep-clone and validate
    if (typeof value === 'object') {
        try {
            return JSON.parse(JSON.stringify(value));
        }
        catch {
            return defaultValue;
        }
    }
    return defaultValue;
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
function parseJqArguments(args) {
    const argjsonPairs = [];
    const otherArgs = [];
    let i = 0;
    while (i < args.length) {
        const arg = args[i];
        if (arg === '--argjson') {
            const name = args[i + 1];
            const value = args[i + 2];
            if (name !== undefined && value !== undefined) {
                argjsonPairs.push({ name, value });
                i += 3;
            }
            else {
                otherArgs.push(arg);
                i++;
            }
        }
        else {
            otherArgs.push(arg);
            i++;
        }
    }
    return { argjsonPairs, otherArgs };
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
function validateArgjsonPairs(argjsonPairs) {
    const errors = [];
    for (const { name, value } of argjsonPairs) {
        if (value === '' || value === null || value === undefined) {
            errors.push(`--argjson variable "${name}" has empty value`);
            continue;
        }
        const trimmedValue = String(value).trim();
        const jsonPrimitivePattern = /^(-?\d+\.?\d*|".*"|true|false|null|\{.*\}|\[.*\])$/;
        if (!jsonPrimitivePattern.test(trimmedValue)) {
            errors.push(`--argjson variable "${name}" value "${value}" may not be valid JSON`);
        }
    }
    return { valid: errors.length === 0, errors };
}
/**
 * Build a jq command string from arguments, quoting where necessary.
 * @pure
 * @param args - jq command arguments.
 * @returns Shell command string ready for execution.
 * @example
 * buildJqCommand(['-n', '--arg', 'name', 'test', '{name: $name}'])
 * // "jq -n --arg name test '{name: $name}'"
 */
function buildJqCommand(args) {
    const escapedArgs = args.map((arg) => {
        let s = typeof arg !== 'string' ? String(arg) : arg;
        if (/[\s'"$`\\]/.test(s)) {
            return `'${s.replace(/'/g, "'\\''")}'`;
        }
        return s;
    });
    return `jq ${escapedArgs.join(' ')}`;
}
/**
 * Safe jq command execution with validation and logging.
 *
 * Wraps jq with:
 * - `--argjson` argument validation (prevents empty values)
 * - Optional debug logging
 * - Clear error messages with caller context
 * @since 0.5.2
 * @example
 * const wrapper = new JqWrapper({ debug: true, callerContext: 'my-script' });
 * const result = await wrapper.execute(['-n', '--argjson', 'count', '5', '{count: $count}']);
 */
class JqWrapper {
    constructor(options = {}) {
        this.debug = options.debug ?? false;
        this.callerContext = options.callerContext ?? 'unknown';
    }
    /**
     * Execute a jq command with `--argjson` validation.
     * @param args           - jq command arguments.
     * @param options        - Execution options.
     * @returns jq stdout output.
     * @throws {@link JqExecutionError} on validation or execution failure (when `throwOnError` is `true`).
     * @example
     * const result = await wrapper.execute(['-n', '--argjson', 'count', '5', '{count: $count}']);
     */
    async execute(args, options = {}) {
        const throwOnError = options.throwOnError !== false;
        if (this.debug) {
            olinda_utils_js_1.logger.debug(`jq_safe called from: ${this.callerContext}`);
            olinda_utils_js_1.logger.debug(`Arguments: ${args.join(' ')}`);
        }
        // Validate --argjson arguments
        const { argjsonPairs } = parseJqArguments(args);
        const validation = validateArgjsonPairs(argjsonPairs);
        if (!validation.valid) {
            const errorMsg = `jq_safe validation failed in ${this.callerContext}:\n${validation.errors.map((e) => `  - ${e}`).join('\n')}`;
            olinda_utils_js_1.logger.error(errorMsg);
            if (throwOnError) {
                throw new JqExecutionError(errorMsg, 'JQ_VALIDATION_ERROR', this.callerContext);
            }
            return '';
        }
        // Build and execute command
        const command = buildJqCommand(args);
        try {
            const { stdout } = await (0, executor_js_1.execute)(command);
            if (this.debug) {
                olinda_utils_js_1.logger.debug(`jq_safe completed successfully in ${this.callerContext}`);
            }
            return stdout;
        }
        catch (err) {
            const errorMsg = `jq_safe failed in ${this.callerContext}: ${err instanceof Error ? err.message : String(err)}`;
            olinda_utils_js_1.logger.error(errorMsg);
            if (throwOnError) {
                throw new JqExecutionError(errorMsg, 'JQ_EXECUTION_ERROR', this.callerContext);
            }
            return '';
        }
    }
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
    async executeAndParse(args, options = {}) {
        const result = await this.execute(args, options);
        try {
            return JSON.parse(result);
        }
        catch (parseError) {
            const errorMsg = `Failed to parse jq output as JSON: ${parseError instanceof Error ? parseError.message : String(parseError)}`;
            olinda_utils_js_1.logger.error(errorMsg);
            throw new JqExecutionError(errorMsg, 'JQ_PARSE_ERROR', this.callerContext);
        }
    }
    /**
     * Validate a JSON string by piping it through jq.
     * @param jsonString - JSON string to validate.
     * @returns `true` if the string is valid JSON, `false` otherwise.
     * @example
     * await wrapper.validateJsonWithJq('{"foo": "bar"}') // true
     * await wrapper.validateJsonWithJq('{invalid}')      // false
     */
    async validateJsonWithJq(jsonString) {
        try {
            await (0, executor_js_1.execute)(`echo ${JSON.stringify(jsonString)} | jq -e . >/dev/null`);
            return true;
        }
        catch {
            return false;
        }
    }
}
exports.JqWrapper = JqWrapper;
