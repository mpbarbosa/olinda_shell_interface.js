/**
 * ANSI Color Codes Module
 * @module core/colors
 * @description ANSI color codes for terminal output with color support detection.
 * @since 0.4.1
 */
/** ANSI color/style escape codes for terminal output. */
export declare const colors: {
    readonly reset: "\u001B[0m";
    readonly bold: "\u001B[1m";
    readonly dim: "\u001B[2m";
    readonly black: "\u001B[30m";
    readonly red: "\u001B[31m";
    readonly green: "\u001B[32m";
    readonly yellow: "\u001B[33m";
    readonly blue: "\u001B[34m";
    readonly magenta: "\u001B[35m";
    readonly cyan: "\u001B[36m";
    readonly white: "\u001B[37m";
    readonly brightRed: "\u001B[91m";
    readonly brightGreen: "\u001B[92m";
    readonly brightYellow: "\u001B[93m";
    readonly brightBlue: "\u001B[94m";
    readonly brightMagenta: "\u001B[95m";
    readonly brightCyan: "\u001B[96m";
    readonly brightWhite: "\u001B[97m";
};
export type ColorName = keyof typeof colors;
/**
 * Check if the current terminal supports ANSI color output.
 * @returns `true` when stdout is a TTY, `TERM` is not `'dumb'`, and `NO_COLOR` is unset.
 */
export declare function supportsColor(): boolean;
/**
 * Wrap `text` in the given ANSI escape code, then reset.
 * Falls back to plain text when the terminal does not support colors.
 * @param text  - The string to colorize.
 * @param color - An ANSI escape sequence (e.g. `colors.red`).
 * @returns The colorized string, or `text` unchanged when colors are unsupported.
 */
export declare function colorize(text: string, color: string): string;
export default colors;
