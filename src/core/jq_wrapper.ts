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

import { logger } from 'olinda_utils.js';
import { ShellError } from '../utils/errors.js';
import { execute } from './executor.js';

// ============================================================================
// CUSTOM ERROR CLASS
// ============================================================================

/**
 * Thrown when jq validation or execution fails.
 * Extends {@link ShellError} with a machine-readable `code` and caller `context`.
 * @since 0.5.3
 * @example
 * throw new JqExecutionError('validation failed', 'JQ_VALIDATION_ERROR', 'my-script');
 */
export class JqExecutionError extends ShellError {
	readonly name = 'JqExecutionError';

	/**
	 * @param message - Human-readable description.
	 * @param code    - Machine-readable error code.
	 * @param context - Caller context identifier for debugging.
	 */
	constructor(
		message: string,
		public readonly code: string,
		public readonly context: string,
	) {
		super(message);
		Object.setPrototypeOf(this, new.target.prototype);
		this.name = 'JqExecutionError';
	}
}

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
export function validateJson(jsonString: string): boolean {
	if (typeof jsonString !== 'string' || jsonString.trim() === '') {
		return false;
	}

	try {
		JSON.parse(jsonString);
		return true;
	} catch {
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
function sanitizeStringValue(trimmed: string, defaultValue: unknown): unknown {
	if (trimmed === 'true') return true;
	if (trimmed === 'false') return false;
	if (trimmed === 'null') return null;
	if (trimmed === '') return defaultValue;

	const num = Number(trimmed);
	if (!isNaN(num) && isFinite(num)) return num;

	try {
		return JSON.parse(trimmed);
	} catch {
		return defaultValue;
	}
}

export function sanitizeArgjsonValue(value: unknown, defaultValue: unknown = 0): unknown {
	if (value === null) return null;
	if (value === undefined) return defaultValue;
	if (typeof value === 'boolean') return value;

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
		} catch {
			return defaultValue;
		}
	}

	return defaultValue;
}

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
export function parseJqArguments(args: string[]): ParsedJqArguments {
	const argjsonPairs: ArgjsonPair[] = [];
	const otherArgs: string[] = [];
	let i = 0;

	while (i < args.length) {
		const arg = args[i];

		if (arg === '--argjson') {
			const name = args[i + 1];
			const value = args[i + 2];

			if (name !== undefined && value !== undefined) {
				argjsonPairs.push({ name, value });
				i += 3;
			} else {
				otherArgs.push(arg);
				i++;
			}
		} else {
			otherArgs.push(arg);
			i++;
		}
	}

	return { argjsonPairs, otherArgs };
}

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
export function validateArgjsonPairs(argjsonPairs: ArgjsonPair[]): ArgjsonValidationResult {
	const errors: string[] = [];

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
export function buildJqCommand(args: unknown[]): string {
	const escapedArgs = args.map((arg) => {
		let s = typeof arg !== 'string' ? String(arg) : arg;

		if (/[\s'"$`\\]/.test(s)) {
			return `'${s.replace(/'/g, "'\\''")}'`;
		}
		return s;
	});

	return `jq ${escapedArgs.join(' ')}`;
}

// ============================================================================
// ASYNC WRAPPER CLASS - Side effects isolated here
// ============================================================================

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
 * @since 0.5.3
 * @example
 * const wrapper = new JqWrapper({ debug: true, callerContext: 'my-script' });
 * const result = await wrapper.execute(['-n', '--argjson', 'count', '5', '{count: $count}']);
 */
export class JqWrapper {
	private readonly debug: boolean;
	private readonly callerContext: string;

	constructor(options: JqWrapperOptions = {}) {
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
	async execute(args: string[], options: JqExecuteOptions = {}): Promise<string> {
		const throwOnError = options.throwOnError !== false;

		if (this.debug) {
			logger.debug(`jq_safe called from: ${this.callerContext}`);
			logger.debug(`Arguments: ${args.join(' ')}`);
		}

		// Validate --argjson arguments
		const { argjsonPairs } = parseJqArguments(args);
		const validation = validateArgjsonPairs(argjsonPairs);

		if (!validation.valid) {
			const errorMsg = `jq_safe validation failed in ${this.callerContext}:\n${validation.errors.map((e) => `  - ${e}`).join('\n')}`;
			logger.error(errorMsg);

			if (throwOnError) {
				throw new JqExecutionError(errorMsg, 'JQ_VALIDATION_ERROR', this.callerContext);
			}

			return '';
		}

		// Build and execute command
		const command = buildJqCommand(args);

		try {
			const { stdout } = await execute(command);

			if (this.debug) {
				logger.debug(`jq_safe completed successfully in ${this.callerContext}`);
			}

			return stdout;
		} catch (err) {
			const errorMsg = `jq_safe failed in ${this.callerContext}: ${err instanceof Error ? err.message : String(err)}`;
			logger.error(errorMsg);

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
	async executeAndParse<T = unknown>(args: string[], options: JqExecuteOptions = {}): Promise<T> {
		const result = await this.execute(args, options);

		try {
			return JSON.parse(result) as T;
		} catch (parseError) {
			const errorMsg = `Failed to parse jq output as JSON: ${parseError instanceof Error ? parseError.message : String(parseError)}`;
			logger.error(errorMsg);
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
	async validateJsonWithJq(jsonString: string): Promise<boolean> {
		try {
			await execute(`echo ${JSON.stringify(jsonString)} | jq -e . >/dev/null`);
			return true;
		} catch {
			return false;
		}
	}
}
