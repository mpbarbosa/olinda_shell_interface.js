/**
 * ANSI Color Codes Module
 * @module core/colors
 * @description ANSI color codes for terminal output with color support detection.
 * @since 0.4.1
 */

/** ANSI color/style escape codes for terminal output. */
export const colors = {
	// Text styles
	reset: '\x1b[0m',
	bold: '\x1b[1m',
	dim: '\x1b[2m',

	// Foreground colors
	black: '\x1b[30m',
	red: '\x1b[31m',
	green: '\x1b[32m',
	yellow: '\x1b[33m',
	blue: '\x1b[34m',
	magenta: '\x1b[35m',
	cyan: '\x1b[36m',
	white: '\x1b[37m',

	// Bright foreground colors
	brightRed: '\x1b[91m',
	brightGreen: '\x1b[92m',
	brightYellow: '\x1b[93m',
	brightBlue: '\x1b[94m',
	brightMagenta: '\x1b[95m',
	brightCyan: '\x1b[96m',
	brightWhite: '\x1b[97m',
} as const;

export type ColorName = keyof typeof colors;

/**
 * Check if the current terminal supports ANSI color output.
 * @returns `true` when stdout is a TTY, `TERM` is not `'dumb'`, and `NO_COLOR` is unset.
 */
export function supportsColor(): boolean {
	return (
		process.stdout.isTTY === true &&
		process.env['TERM'] !== 'dumb' &&
		!process.env['NO_COLOR']
	);
}

/**
 * Wrap `text` in the given ANSI escape code, then reset.
 * Falls back to plain text when the terminal does not support colors.
 * @param text  - The string to colorize.
 * @param color - An ANSI escape sequence (e.g. `colors.red`).
 * @returns The colorized string, or `text` unchanged when colors are unsupported.
 */
export function colorize(text: string, color: string): string {
	if (!supportsColor()) {
		return text;
	}
	return `${color}${text}${colors.reset}`;
}

export default colors;
