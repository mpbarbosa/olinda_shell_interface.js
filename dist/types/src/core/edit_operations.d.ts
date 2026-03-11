/**
 * File Editing Operations Module (Pure Functions + Wrapper)
 * @module core/edit_operations
 * @description File content editing utilities with referential transparency.
 *
 * Architecture: Pure functions + async wrapper class
 * - Pure functions: text search, replace, line manipulation, diff generation
 * - Async wrapper class: EditOperations for real file I/O
 * @since 0.5.7
 */
import { FileOperations } from "./file_operations.js";
/** A single pattern match returned by {@link findMatches}. */
export interface Match {
    /** The matched text. */
    match: string;
    /** Character index within the line. */
    index: number;
    /** Line number (1-based). */
    line: number;
    /** Full content of the matched line. */
    lineContent: string;
}
/** A single line-level change in a diff. */
export interface DiffChange {
    /** Line number (1-based). */
    line: number;
    /** Change type. `"context"` lines are unchanged lines included for surrounding context. */
    type: "added" | "deleted" | "modified" | "context";
    /** Original line content (`null` for added lines). */
    oldContent: string | null;
    /** New line content (`null` for deleted lines). */
    newContent: string | null;
}
/** Options for {@link generateDiff}. */
export interface DiffOptions {
    /**
     * Number of surrounding unchanged lines to include as context around each change.
     * Context lines have `type: "context"` and are excluded from change counts.
     * Default: `0` (no context).
     * @example
     * generateDiff('a\nb\nc', 'a\nX\nc', { context: 1 })
     * // includes line 1 ("a") and line 3 ("c") as context around the change on line 2
     */
    context?: number;
}
/** Diff result returned by {@link generateDiff}. */
export interface Diff {
    totalChanges: number;
    linesAdded: number;
    linesDeleted: number;
    linesModified: number;
    changes: DiffChange[];
}
/** Result returned by {@link EditOperations.replaceInFile}. */
export interface ReplaceResult {
    changed: boolean;
    diff: Diff;
}
/** Result returned by {@link EditOperations.deleteLines}. */
export interface DeleteResult {
    deletedLines: number;
}
/** Result returned by {@link EditOperations.previewChanges}. */
export interface PreviewResult {
    diff: Diff;
    formatted: string;
    hasChanges: boolean;
}
/** Result returned by {@link EditOperations.applyTransform}. */
export interface TransformResult {
    applied: boolean;
    diff: Diff;
}
/** Constructor options for {@link EditOperations}. */
export interface EditOperationsOptions {
    /** Injected FileOperations instance (defaults to `new FileOperations(options)`). */
    fileOps?: FileOperations;
    /** When `true`, no files are written; operations are logged only. */
    dryRun?: boolean;
    /** When `true`, log detailed operation output. */
    verbose?: boolean;
}
/**
 * Find all matches of a pattern in text (PURE).
 *
 * @param text    - Text to search.
 * @param pattern - Pattern to find (RegExp or string).
 * @returns Array of matches with position and line information.
 *
 * @example
 * findMatches('Hello\nWorld', /Hello/)
 * // [{ match: 'Hello', index: 0, line: 1, lineContent: 'Hello' }]
 */
export declare function findMatches(text: string, pattern: RegExp | string): Match[];
/**
 * Replace all occurrences of a pattern in text (PURE).
 *
 * @param text        - Text to process.
 * @param pattern     - Pattern to find (RegExp or string).
 * @param replacement - Replacement string or function.
 * @returns Text with all replacements applied.
 *
 * @example
 * replaceAll('foo bar foo', /foo/g, 'baz') // 'baz bar baz'
 */
export declare function replaceAll(text: string, pattern: RegExp | string, replacement: string | ((substring: string, ...args: unknown[]) => string)): string;
/**
 * Replace only the first occurrence of a pattern (PURE).
 *
 * @param text        - Text to process.
 * @param pattern     - Pattern to find (RegExp or string).
 * @param replacement - Replacement string or function.
 * @returns Text with the first replacement applied.
 *
 * @example
 * replaceFirst('foo foo', /foo/g, 'bar') // 'bar foo'
 */
export declare function replaceFirst(text: string, pattern: RegExp | string, replacement: string | ((substring: string, ...args: unknown[]) => string)): string;
/**
 * Insert text at a specific line number (PURE).
 *
 * @param text       - Original text.
 * @param lineNumber - Line number (1-based).
 * @param content    - Content to insert.
 * @param position   - `'before'` or `'after'` the target line (default `'after'`).
 * @returns Text with the insertion applied.
 *
 * @example
 * insertAtLine('a\nb\nc', 2, 'X', 'before') // 'a\nX\nb\nc'
 */
export declare function insertAtLine(text: string, lineNumber: number, content: string, position?: "before" | "after"): string;
/**
 * Append text to the end of content (PURE).
 *
 * @param text          - Original text.
 * @param content       - Content to append.
 * @param ensureNewline - Ensure a newline separator before appended content (default `true`).
 * @returns Text with the content appended.
 *
 * @example
 * appendText('hello', 'world') // 'hello\nworld'
 */
export declare function appendText(text: string, content: string, ensureNewline?: boolean): string;
/**
 * Prepend text to the beginning of content (PURE).
 *
 * @param text          - Original text.
 * @param content       - Content to prepend.
 * @param ensureNewline - Ensure a newline separator after prepended content (default `true`).
 * @returns Text with the content prepended.
 *
 * @example
 * prependText('world', 'hello') // 'hello\nworld'
 */
export declare function prependText(text: string, content: string, ensureNewline?: boolean): string;
/**
 * Delete lines matching a pattern (PURE).
 *
 * @param text    - Original text.
 * @param pattern - Pattern to match (RegExp or string).
 * @returns Text with matching lines removed.
 *
 * @example
 * deleteLines('keep\nremove me\nkeep', /remove/) // 'keep\nkeep'
 */
export declare function deleteLines(text: string, pattern: RegExp | string): string;
/**
 * Extract lines matching a pattern (PURE).
 *
 * @param text    - Original text.
 * @param pattern - Pattern to match (RegExp or string).
 * @returns Array of matching lines.
 *
 * @example
 * extractLines('foo\nbar\nfoo', /foo/) // ['foo', 'foo']
 */
export declare function extractLines(text: string, pattern: RegExp | string): string[];
/**
 * Get a range of lines (PURE).
 *
 * @param text      - Original text.
 * @param startLine - Start line number (1-based, inclusive).
 * @param endLine   - End line number (1-based, inclusive). Pass `-1` for end of file.
 * @returns Extracted lines joined as a string.
 *
 * @example
 * getLineRange('a\nb\nc\nd', 2, 3) // 'b\nc'
 */
export declare function getLineRange(text: string, startLine: number, endLine: number): string;
/**
 * Replace a range of lines (PURE).
 *
 * @param text        - Original text.
 * @param startLine   - Start line number (1-based, inclusive).
 * @param endLine     - End line number (1-based, inclusive).
 * @param replacement - Replacement text (may contain newlines).
 * @returns Text with the replaced range.
 *
 * @example
 * replaceLineRange('a\nb\nc', 2, 2, 'X') // 'a\nX\nc'
 */
export declare function replaceLineRange(text: string, startLine: number, endLine: number, replacement: string): string;
/**
 * Generate a simple line-by-line diff between two texts (PURE).
 *
 * @param oldText - Original text.
 * @param newText - Modified text.
 * @param options - Options controlling diff output (e.g. context lines).
 * @returns Structured diff with change counts and per-line details.
 *
 * @example
 * generateDiff('a\nb', 'a\nc')
 * // { totalChanges: 1, linesAdded: 0, linesDeleted: 0, linesModified: 1, changes: [...] }
 *
 * @example
 * generateDiff('a\nb\nc', 'a\nX\nc', { context: 1 })
 * // includes lines 1 and 3 as context around the modification on line 2
 */
export declare function generateDiff(oldText: string, newText: string, options?: DiffOptions): Diff;
/**
 * Format a diff object for human-readable display (PURE).
 *
 * @param diff - Diff object returned by {@link generateDiff}.
 * @returns Formatted multi-line string.
 *
 * @example
 * formatDiff(generateDiff('a', 'b'))
 * // 'Total changes: 1\n  +0 lines added\n  -0 lines deleted\n  ~1 lines modified\n...'
 */
export declare function formatDiff(diff: Diff): string;
/**
 * Async wrapper that applies edit operations to real files.
 *
 * All business logic is delegated to pure functions; this class handles I/O,
 * dry-run mode, and verbose logging.
 *
 * @example
 * const editor = new EditOperations({ dryRun: false, verbose: true });
 * await editor.replaceInFile('/abs/path/file.txt', /foo/g, 'bar');
 */
export declare class EditOperations {
    private readonly fileOps;
    private readonly dryRun;
    private readonly verbose;
    constructor(options?: EditOperationsOptions);
    /**
     * Find all matches of a pattern in a file.
     *
     * @param filePath - Absolute path to the file.
     * @param pattern  - Pattern to search for.
     * @returns Array of matches with position information.
     */
    findInFile(filePath: string, pattern: RegExp | string): Promise<Match[]>;
    /**
     * Replace all occurrences of a pattern in a file.
     *
     * @param filePath    - Absolute path to the file.
     * @param pattern     - Pattern to find.
     * @param replacement - Replacement string or function.
     * @returns Object with `changed` flag and `diff`.
     */
    replaceInFile(filePath: string, pattern: RegExp | string, replacement: string | ((substring: string, ...args: unknown[]) => string)): Promise<ReplaceResult>;
    /**
     * Insert content at a specific line in a file.
     *
     * @param filePath   - Absolute path to the file.
     * @param lineNumber - Line number (1-based).
     * @param content    - Content to insert.
     * @param position   - `'before'` or `'after'` the target line (default `'after'`).
     */
    insertAtLine(filePath: string, lineNumber: number, content: string, position?: "before" | "after"): Promise<void>;
    /**
     * Append content to a file.
     *
     * @param filePath - Absolute path to the file.
     * @param content  - Content to append.
     */
    appendToFile(filePath: string, content: string): Promise<void>;
    /**
     * Prepend content to a file.
     *
     * @param filePath - Absolute path to the file.
     * @param content  - Content to prepend.
     */
    prependToFile(filePath: string, content: string): Promise<void>;
    /**
     * Delete lines matching a pattern from a file.
     *
     * @param filePath - Absolute path to the file.
     * @param pattern  - Pattern to match against each line.
     * @returns Object with `deletedLines` count.
     */
    deleteLines(filePath: string, pattern: RegExp | string): Promise<DeleteResult>;
    /**
     * Replace a range of lines in a file.
     *
     * @param filePath    - Absolute path to the file.
     * @param startLine   - Start line (1-based, inclusive).
     * @param endLine     - End line (1-based, inclusive).
     * @param replacement - Replacement text (may contain newlines).
     */
    replaceLineRange(filePath: string, startLine: number, endLine: number, replacement: string): Promise<void>;
    /**
     * Preview the changes a transform function would make, without writing to disk.
     *
     * @param filePath    - Absolute path to the file.
     * @param transformFn - Function that receives current content and returns new content.
     * @returns Diff, formatted diff string, and `hasChanges` flag.
     */
    previewChanges(filePath: string, transformFn: (content: string) => string): Promise<PreviewResult>;
    /**
     * Apply a transformation function to a file.
     *
     * @param filePath    - Absolute path to the file.
     * @param transformFn - Function that receives current content and returns new content.
     * @returns Object with `applied` flag and `diff`.
     */
    applyTransform(filePath: string, transformFn: (content: string) => string): Promise<TransformResult>;
}
