import { jest } from '@jest/globals';
import { colors, supportsColor, colorize } from '../../src/core/colors';

// ─── colors object ───────────────────────────────────────────────────────────

describe('colors', () => {
	it('has reset code', () => expect(colors.reset).toBe('\x1b[0m'));
	it('has bold code', () => expect(colors.bold).toBe('\x1b[1m'));
	it('has dim code', () => expect(colors.dim).toBe('\x1b[2m'));
	it('has red code', () => expect(colors.red).toBe('\x1b[31m'));
	it('has green code', () => expect(colors.green).toBe('\x1b[32m'));
	it('has yellow code', () => expect(colors.yellow).toBe('\x1b[33m'));
	it('has blue code', () => expect(colors.blue).toBe('\x1b[34m'));
	it('has cyan code', () => expect(colors.cyan).toBe('\x1b[36m'));
	it('has white code', () => expect(colors.white).toBe('\x1b[37m'));
	it('has brightRed code', () => expect(colors.brightRed).toBe('\x1b[91m'));
	it('has brightGreen code', () => expect(colors.brightGreen).toBe('\x1b[92m'));
	it('has brightYellow code', () => expect(colors.brightYellow).toBe('\x1b[93m'));
	it('has brightBlue code', () => expect(colors.brightBlue).toBe('\x1b[94m'));
	it('has brightMagenta code', () => expect(colors.brightMagenta).toBe('\x1b[95m'));
	it('has brightCyan code', () => expect(colors.brightCyan).toBe('\x1b[96m'));
	it('has brightWhite code', () => expect(colors.brightWhite).toBe('\x1b[97m'));
});

// ─── supportsColor ───────────────────────────────────────────────────────────

describe('supportsColor', () => {
	const originalIsTTY = process.stdout.isTTY;
	const originalTERM = process.env['TERM'];
	const originalNO_COLOR = process.env['NO_COLOR'];

	afterEach(() => {
		Object.defineProperty(process.stdout, 'isTTY', { value: originalIsTTY, configurable: true });
		if (originalTERM === undefined) {
			delete process.env['TERM'];
		} else {
			process.env['TERM'] = originalTERM;
		}
		if (originalNO_COLOR === undefined) {
			delete process.env['NO_COLOR'];
		} else {
			process.env['NO_COLOR'] = originalNO_COLOR;
		}
	});

	it('returns true when isTTY and no restrictions', () => {
		Object.defineProperty(process.stdout, 'isTTY', { value: true, configurable: true });
		delete process.env['TERM'];
		delete process.env['NO_COLOR'];
		expect(supportsColor()).toBe(true);
	});

	it('returns false when isTTY is false', () => {
		Object.defineProperty(process.stdout, 'isTTY', { value: false, configurable: true });
		delete process.env['NO_COLOR'];
		expect(supportsColor()).toBe(false);
	});

	it('returns false when TERM=dumb', () => {
		Object.defineProperty(process.stdout, 'isTTY', { value: true, configurable: true });
		process.env['TERM'] = 'dumb';
		delete process.env['NO_COLOR'];
		expect(supportsColor()).toBe(false);
	});

	it('returns false when NO_COLOR is set', () => {
		Object.defineProperty(process.stdout, 'isTTY', { value: true, configurable: true });
		delete process.env['TERM'];
		process.env['NO_COLOR'] = '1';
		expect(supportsColor()).toBe(false);
	});
});

// ─── colorize ────────────────────────────────────────────────────────────────

describe('colorize', () => {
	beforeEach(() => {
		Object.defineProperty(process.stdout, 'isTTY', { value: true, configurable: true });
		delete process.env['TERM'];
		delete process.env['NO_COLOR'];
	});

	afterEach(() => {
		Object.defineProperty(process.stdout, 'isTTY', { value: undefined, configurable: true });
	});

	it('wraps text with color code and reset when colors supported', () => {
		const result = colorize('hello', colors.red);
		expect(result).toBe(`${colors.red}hello${colors.reset}`);
	});

	it('returns plain text when colors not supported', () => {
		Object.defineProperty(process.stdout, 'isTTY', { value: false, configurable: true });
		expect(colorize('hello', colors.red)).toBe('hello');
	});

	it('works with any ANSI code string', () => {
		const result = colorize('world', colors.green);
		expect(result).toBe(`\x1b[32mworld\x1b[0m`);
	});
});
