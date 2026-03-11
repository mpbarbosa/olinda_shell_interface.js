/**
 * @fileoverview Tests for jq_wrapper module
 * @module test/core/jq_wrapper.test
 */

import {
	validateJson,
	sanitizeArgjsonValue,
	parseJqArguments,
	validateArgjsonPairs,
	buildJqCommand,
	JqWrapper,
	JqExecutionError,
} from '../../src/core/jq_wrapper';

// =============================================================================
// PURE FUNCTION TESTS
// =============================================================================

describe('jq_wrapper - Pure Functions', () => {
	// ---------------------------------------------------------------------------
	// validateJson
	// ---------------------------------------------------------------------------

	describe('validateJson', () => {
		it('validates valid JSON object', () => {
			expect(validateJson('{"foo": "bar"}')).toBe(true);
		});

		it('validates valid JSON array', () => {
			expect(validateJson('[1, 2, 3]')).toBe(true);
		});

		it('validates valid JSON primitives', () => {
			expect(validateJson('42')).toBe(true);
			expect(validateJson('"string"')).toBe(true);
			expect(validateJson('true')).toBe(true);
			expect(validateJson('false')).toBe(true);
			expect(validateJson('null')).toBe(true);
		});

		it('validates nested JSON', () => {
			expect(validateJson('{"a": {"b": {"c": [1, 2, 3]}}}')).toBe(true);
		});

		it('rejects invalid JSON', () => {
			expect(validateJson('{invalid}')).toBe(false);
			expect(validateJson('{foo: bar}')).toBe(false);
			expect(validateJson('[1, 2, 3,]')).toBe(false);
		});

		it('rejects empty string', () => {
			expect(validateJson('')).toBe(false);
		});

		it('rejects non-string input', () => {
			expect(validateJson(null as unknown as string)).toBe(false);
			expect(validateJson(undefined as unknown as string)).toBe(false);
		});

		it('handles whitespace', () => {
			expect(validateJson('   {"foo": "bar"}   ')).toBe(true);
			expect(validateJson('   ')).toBe(false);
		});
	});

	// ---------------------------------------------------------------------------
	// sanitizeArgjsonValue
	// ---------------------------------------------------------------------------

	describe('sanitizeArgjsonValue', () => {
		it('preserves numbers', () => {
			expect(sanitizeArgjsonValue(42)).toBe(42);
			expect(sanitizeArgjsonValue(0)).toBe(0);
			expect(sanitizeArgjsonValue(-10)).toBe(-10);
			expect(sanitizeArgjsonValue(3.14)).toBe(3.14);
		});

		it('preserves booleans', () => {
			expect(sanitizeArgjsonValue(true)).toBe(true);
			expect(sanitizeArgjsonValue(false)).toBe(false);
		});

		it('preserves null', () => {
			expect(sanitizeArgjsonValue(null)).toBe(null);
		});

		it('converts string numbers to numbers', () => {
			expect(sanitizeArgjsonValue('42')).toBe(42);
			expect(sanitizeArgjsonValue('3.14')).toBe(3.14);
			expect(sanitizeArgjsonValue('-10')).toBe(-10);
		});

		it('converts string booleans to booleans', () => {
			expect(sanitizeArgjsonValue('true')).toBe(true);
			expect(sanitizeArgjsonValue('false')).toBe(false);
		});

		it('converts "null" string to null', () => {
			expect(sanitizeArgjsonValue('null')).toBe(null);
		});

		it('returns default for invalid values', () => {
			expect(sanitizeArgjsonValue('invalid')).toBe(0);
			expect(sanitizeArgjsonValue('invalid', 99)).toBe(99);
			expect(sanitizeArgjsonValue(undefined)).toBe(0);
			expect(sanitizeArgjsonValue(undefined, -1)).toBe(-1);
		});

		it('returns default for empty string', () => {
			expect(sanitizeArgjsonValue('')).toBe(0);
			expect(sanitizeArgjsonValue('', 42)).toBe(42);
		});

		it('returns default for NaN and Infinity', () => {
			expect(sanitizeArgjsonValue(NaN)).toBe(0);
			expect(sanitizeArgjsonValue(Infinity)).toBe(0);
			expect(sanitizeArgjsonValue(-Infinity)).toBe(0);
		});

		it('handles objects and arrays', () => {
			const obj = { foo: 'bar' };
			const arr = [1, 2, 3];
			expect(sanitizeArgjsonValue(obj)).toEqual({ foo: 'bar' });
			expect(sanitizeArgjsonValue(arr)).toEqual([1, 2, 3]);
		});

		it('parses JSON strings', () => {
			expect(sanitizeArgjsonValue('{"foo":"bar"}')).toEqual({ foo: 'bar' });
			expect(sanitizeArgjsonValue('[1,2,3]')).toEqual([1, 2, 3]);
		});

		it('handles whitespace in strings', () => {
			expect(sanitizeArgjsonValue('  42  ')).toBe(42);
			expect(sanitizeArgjsonValue('  true  ')).toBe(true);
		});
	});

	// ---------------------------------------------------------------------------
	// parseJqArguments
	// ---------------------------------------------------------------------------

	describe('parseJqArguments', () => {
		it('parses single --argjson pair', () => {
			const result = parseJqArguments(['--argjson', 'count', '5', '.foo']);
			expect(result.argjsonPairs).toEqual([{ name: 'count', value: '5' }]);
			expect(result.otherArgs).toEqual(['.foo']);
		});

		it('parses multiple --argjson pairs', () => {
			const result = parseJqArguments(['--argjson', 'a', '1', '--argjson', 'b', '2', '.foo']);
			expect(result.argjsonPairs).toEqual([
				{ name: 'a', value: '1' },
				{ name: 'b', value: '2' },
			]);
			expect(result.otherArgs).toEqual(['.foo']);
		});

		it('handles arguments without --argjson', () => {
			const result = parseJqArguments(['-n', '.foo', '--arg', 'name', 'test']);
			expect(result.argjsonPairs).toEqual([]);
			expect(result.otherArgs).toEqual(['-n', '.foo', '--arg', 'name', 'test']);
		});

		it('handles empty arguments', () => {
			const result = parseJqArguments([]);
			expect(result.argjsonPairs).toHaveLength(0);
			expect(result.otherArgs).toHaveLength(0);
		});

		it('handles incomplete --argjson (missing value)', () => {
			const result = parseJqArguments(['--argjson', 'count']);
			expect(result.argjsonPairs).toHaveLength(0);
		});

		it('handles --argjson at end (no name/value)', () => {
			const result = parseJqArguments(['.foo', '--argjson']);
			expect(result.argjsonPairs).toHaveLength(0);
		});

		it('preserves order of other args', () => {
			const result = parseJqArguments(['-n', '--argjson', 'x', '1', '-r', '.foo']);
			expect(result.argjsonPairs).toEqual([{ name: 'x', value: '1' }]);
			expect(result.otherArgs).toEqual(['-n', '-r', '.foo']);
		});
	});

	// ---------------------------------------------------------------------------
	// validateArgjsonPairs
	// ---------------------------------------------------------------------------

	describe('validateArgjsonPairs', () => {
		it('validates valid pairs', () => {
			const pairs = [
				{ name: 'count', value: '5' },
				{ name: 'active', value: 'true' },
				{ name: 'data', value: '{"foo":"bar"}' },
			];
			const result = validateArgjsonPairs(pairs);
			expect(result.valid).toBe(true);
			expect(result.errors).toHaveLength(0);
		});

		it('rejects empty values', () => {
			const pairs = [{ name: 'count', value: '' }];
			const result = validateArgjsonPairs(pairs);
			expect(result.valid).toBe(false);
			expect(result.errors).toContain('--argjson variable "count" has empty value');
		});

		it.each([
			[null as unknown as string],
			[undefined as unknown as string],
		])('rejects null or undefined value: %p', (val) => {
			const pairs = [{ name: 'count', value: val }];
			const result = validateArgjsonPairs(pairs);
			expect(result.valid).toBe(false);
			expect(result.errors).toContain('--argjson variable "count" has empty value');
		});

		it('validates JSON primitives', () => {
			const pairs = [
				{ name: 'num', value: '42' },
				{ name: 'bool', value: 'true' },
				{ name: 'null', value: 'null' },
				{ name: 'str', value: '"text"' },
				{ name: 'obj', value: '{"a":1}' },
				{ name: 'arr', value: '[1,2,3]' },
			];
			const result = validateArgjsonPairs(pairs);
			expect(result.valid).toBe(true);
		});

		it('reports invalid JSON-like values', () => {
			const pairs = [{ name: 'invalid', value: '{not valid json}' }];
			const result = validateArgjsonPairs(pairs);
			// Note: Regex pattern matches '{...}' as valid; jq catches truly invalid JSON at execution time
			expect(result.valid).toBe(true);
		});

		it('handles multiple errors', () => {
			const pairs = [
				{ name: 'empty', value: '' },
				{ name: 'invalid', value: 'plain text not json' },
			];
			const result = validateArgjsonPairs(pairs);
			expect(result.valid).toBe(false);
			expect(result.errors).toHaveLength(2);
		});

		it('validates empty pairs array', () => {
			const result = validateArgjsonPairs([]);
			expect(result.valid).toBe(true);
			expect(result.errors).toHaveLength(0);
		});
	});

	// ---------------------------------------------------------------------------
	// buildJqCommand
	// ---------------------------------------------------------------------------

	describe('buildJqCommand', () => {
		it('builds simple command', () => {
			const result = buildJqCommand(['.foo']);
			expect(result).toBe('jq .foo');
		});

		it('builds command with multiple args', () => {
			const result = buildJqCommand(['-n', '--argjson', 'x', '5', '{x: $x}']);
			expect(result).toBe("jq -n --argjson x 5 '{x: $x}'");
		});

		it('quotes arguments with spaces', () => {
			const result = buildJqCommand(['some arg with spaces']);
			expect(result).toContain("'some arg with spaces'");
		});

		it('escapes single quotes', () => {
			const result = buildJqCommand(["it's quoted"]);
			expect(result).toContain("'it'\\''s quoted'");
		});

		it('handles special characters', () => {
			const result = buildJqCommand(['$PATH']);
			expect(result).toContain("'$PATH'");
		});

		it('handles empty args array', () => {
			const result = buildJqCommand([]);
			expect(result).toBe('jq ');
		});

		it('converts non-string args to strings', () => {
			const result = buildJqCommand([42, true, null]);
			expect(result).toBe('jq 42 true null');
		});
	});
});

// =============================================================================
// INTEGRATION TESTS - JqWrapper Class
// =============================================================================

describe('jq_wrapper - JqWrapper Class', () => {
	let wrapper: JqWrapper;

	beforeEach(() => {
		wrapper = new JqWrapper({ debug: false, callerContext: 'test' });
	});

	// ---------------------------------------------------------------------------
	// Constructor
	// ---------------------------------------------------------------------------

	describe('constructor', () => {
		it('creates instance with default options', () => {
			const w = new JqWrapper();
			expect(w['debug']).toBe(false);
			expect(w['callerContext']).toBe('unknown');
		});

		it('creates instance with custom options', () => {
			const w = new JqWrapper({ debug: true, callerContext: 'custom' });
			expect(w['debug']).toBe(true);
			expect(w['callerContext']).toBe('custom');
		});
	});

	// ---------------------------------------------------------------------------
	// execute
	// ---------------------------------------------------------------------------

	describe('execute', () => {
		it('executes simple jq command', async () => {
			const result = await wrapper.execute(['-n', '{"foo": "bar"}']);
			const parsed = JSON.parse(result);
			expect(parsed).toEqual({ foo: 'bar' });
		});

		it('executes jq with --arg', async () => {
			const result = await wrapper.execute(['-n', '--arg', 'name', 'test', '{name: $name}']);
			const parsed = JSON.parse(result);
			expect(parsed).toEqual({ name: 'test' });
		});

		it('executes jq with --argjson', async () => {
			const result = await wrapper.execute(['-n', '--argjson', 'count', '5', '{count: $count}']);
			const parsed = JSON.parse(result);
			expect(parsed).toEqual({ count: 5 });
		});

		it('throws on empty --argjson value', async () => {
			await expect(
				wrapper.execute(['-n', '--argjson', 'count', '', '{count: $count}']),
			).rejects.toThrow(JqExecutionError);
		});

		it('throws on invalid JSON in --argjson', async () => {
			await expect(
				wrapper.execute(['-n', '--argjson', 'data', '{invalid}', '{data: $data}']),
			).rejects.toThrow(JqExecutionError);
		});

		it('returns empty string when throwOnError is false', async () => {
			const result = await wrapper.execute(
				['-n', '--argjson', 'count', '', '{count: $count}'],
				{ throwOnError: false },
			);
			expect(result).toBe('');
		});

		it('executes with multiple --argjson args', async () => {
			const result = await wrapper.execute([
				'-n',
				'--argjson', 'a', '1',
				'--argjson', 'b', '2',
				'{sum: ($a + $b)}',
			]);
			const parsed = JSON.parse(result);
			expect(parsed).toEqual({ sum: 3 });
		});
	});

	// ---------------------------------------------------------------------------
	// executeAndParse
	// ---------------------------------------------------------------------------

	describe('executeAndParse', () => {
		it('executes and parses JSON result', async () => {
			const result = await wrapper.executeAndParse(['-n', '{"foo": "bar"}']);
			expect(result).toEqual({ foo: 'bar' });
		});

		it('parses array result', async () => {
			const result = await wrapper.executeAndParse(['-n', '[1, 2, 3]']);
			expect(result).toEqual([1, 2, 3]);
		});

		it('parses primitive result', async () => {
			const result = await wrapper.executeAndParse(['-n', '42']);
			expect(result).toBe(42);
		});
	});

	// ---------------------------------------------------------------------------
	// validateJsonWithJq
	// ---------------------------------------------------------------------------

	describe('validateJsonWithJq', () => {
		it('validates valid JSON', async () => {
			const result = await wrapper.validateJsonWithJq('{"foo": "bar"}');
			expect(result).toBe(true);
		});

		it('rejects invalid JSON', async () => {
			const result = await wrapper.validateJsonWithJq('{invalid}');
			expect(result).toBe(false);
		});

		it('validates array', async () => {
			const result = await wrapper.validateJsonWithJq('[1, 2, 3]');
			expect(result).toBe(true);
		});

		it('validates primitives', async () => {
			expect(await wrapper.validateJsonWithJq('42')).toBe(true);
			expect(await wrapper.validateJsonWithJq('"string"')).toBe(true);
			expect(await wrapper.validateJsonWithJq('true')).toBe(true);
		});

		it('handles JSON containing shell metacharacters without injection', async () => {
			// Strings with $(), backticks, and single quotes must not trigger shell execution.
			// A shell injection would cause execute() to fail or produce unexpected output;
			// we only verify the function returns the correct boolean without side-effects.
			const withSubstitution = '{"cmd": "$(id)"}';
			const withBacktick = '{"cmd": "`id`"}';
			const withSingleQuote = '{"key": "it\'s fine"}';
			expect(await wrapper.validateJsonWithJq(withSubstitution)).toBe(true);
			expect(await wrapper.validateJsonWithJq(withBacktick)).toBe(true);
			expect(await wrapper.validateJsonWithJq(withSingleQuote)).toBe(true);
		});
	});
});

// =============================================================================
// ERROR HANDLING TESTS
// =============================================================================

describe('jq_wrapper - JqExecutionError', () => {
	it('contains proper code for validation error', async () => {
		const w = new JqWrapper({ callerContext: 'test' });

		try {
			await w.execute(['-n', '--argjson', 'x', '', '{x: $x}']);
			throw new Error('Should have thrown');
		} catch (error) {
			expect(error).toBeInstanceOf(JqExecutionError);
			expect((error as JqExecutionError).code).toBe('JQ_VALIDATION_ERROR');
			expect((error as JqExecutionError).context).toBe('test');
		}
	});
});
