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

import { logger } from "olinda_utils.js";
import { FileOperations } from "./file_operations.js";
import { FileSystemError } from "../utils/errors.js";

// ============================================================================
// INTERFACES
// ============================================================================

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

// ============================================================================
// PURE FUNCTIONS
// ============================================================================

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
export function findMatches(text: string, pattern: RegExp | string): Match[] {
	if (typeof text !== "string") {
		return [];
	}

	const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern, "g");
	const matches: Match[] = [];
	const lines = text.split("\n");

	lines.forEach((line, lineIndex) => {
		let match: RegExpExecArray | null;
		const lineRegex = new RegExp(regex.source, regex.flags);

		while ((match = lineRegex.exec(line)) !== null) {
			matches.push({
				match: match[0],
				index: match.index,
				line: lineIndex + 1,
				lineContent: line,
			});
		}
	});

	return matches;
}

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
export function replaceAll(
	text: string,
	pattern: RegExp | string,
	replacement: string | ((substring: string, ...args: unknown[]) => string),
): string {
	if (typeof text !== "string") {
		return "";
	}

	const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern, "g");
	return text.replace(regex, replacement as string);
}

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
export function replaceFirst(
	text: string,
	pattern: RegExp | string,
	replacement: string | ((substring: string, ...args: unknown[]) => string),
): string {
	if (typeof text !== "string") {
		return "";
	}

	const regex =
		pattern instanceof RegExp
			? new RegExp(pattern.source, pattern.flags.replace("g", ""))
			: new RegExp(pattern);
	return text.replace(regex, replacement as string);
}

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
export function insertAtLine(
	text: string,
	lineNumber: number,
	content: string,
	position: "before" | "after" = "after",
): string {
	if (typeof text !== "string" || lineNumber < 1) {
		return text;
	}

	const lines = text.split("\n");
	const index = lineNumber - 1;

	if (index < 0 || index > lines.length) {
		return text;
	}

	if (position === "before") {
		lines.splice(index, 0, content);
	} else {
		lines.splice(index + 1, 0, content);
	}

	return lines.join("\n");
}

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
export function appendText(
	text: string,
	content: string,
	ensureNewline = true,
): string {
	if (typeof text !== "string") {
		return content;
	}

	if (!content) {
		return text;
	}

	if (ensureNewline && text.length > 0 && !text.endsWith("\n")) {
		return text + "\n" + content;
	}

	return text + content;
}

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
export function prependText(
	text: string,
	content: string,
	ensureNewline = true,
): string {
	if (typeof text !== "string") {
		return content;
	}

	if (!content) {
		return text;
	}

	if (text.length === 0) {
		return content;
	}

	if (ensureNewline && content.length > 0 && !content.endsWith("\n")) {
		return content + "\n" + text;
	}

	return content + text;
}

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
export function deleteLines(text: string, pattern: RegExp | string): string {
	if (typeof text !== "string") {
		return "";
	}

	const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern);
	const lines = text.split("\n");
	const filtered = lines.filter((line) => !regex.test(line));

	return filtered.join("\n");
}

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
export function extractLines(text: string, pattern: RegExp | string): string[] {
	if (typeof text !== "string") {
		return [];
	}

	const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern);
	const lines = text.split("\n");

	return lines.filter((line) => regex.test(line));
}

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
export function getLineRange(
	text: string,
	startLine: number,
	endLine: number,
): string {
	if (typeof text !== "string" || startLine < 1) {
		return "";
	}

	const lines = text.split("\n");
	const start = startLine - 1;
	const end = endLine === -1 ? lines.length : endLine;

	return lines.slice(start, end).join("\n");
}

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
export function replaceLineRange(
	text: string,
	startLine: number,
	endLine: number,
	replacement: string,
): string {
	if (typeof text !== "string" || startLine < 1) {
		return text;
	}

	const lines = text.split("\n");
	const start = startLine - 1;
	const end = endLine;

	if (start < 0 || start >= lines.length) {
		return text;
	}

	const replacementLines = replacement.split("\n");
	lines.splice(start, end - start, ...replacementLines);

	return lines.join("\n");
}

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
export function generateDiff(oldText: string, newText: string, options: DiffOptions = {}): Diff {
	const { context = 0 } = options;
	const oldLines = oldText.split("\n");
	const newLines = newText.split("\n");

	const changedLines: DiffChange[] = [];
	const maxLength = Math.max(oldLines.length, newLines.length);

	for (let i = 0; i < maxLength; i++) {
		const oldLine = oldLines[i] !== undefined ? oldLines[i] : null;
		const newLine = newLines[i] !== undefined ? newLines[i] : null;

		if (oldLine !== newLine) {
			changedLines.push({
				line: i + 1,
				type:
					oldLine === null
						? "added"
						: newLine === null
							? "deleted"
							: "modified",
				oldContent: oldLine,
				newContent: newLine,
			});
		}
	}

	const changes: DiffChange[] = [...changedLines];

	if (context > 0 && changedLines.length > 0) {
		const changedIndices = new Set(changedLines.map((c) => c.line - 1));
		const addedContextIndices = new Set<number>();

		for (const idx of changedIndices) {
			const from = Math.max(0, idx - context);
			const to = Math.min(maxLength - 1, idx + context);

			for (let c = from; c <= to; c++) {
				if (!changedIndices.has(c) && !addedContextIndices.has(c)) {
					const lineContent = oldLines[c] !== undefined ? oldLines[c] : newLines[c] ?? null;
					changes.push({
						line: c + 1,
						type: "context",
						oldContent: lineContent,
						newContent: lineContent,
					});
					addedContextIndices.add(c);
				}
			}
		}

		changes.sort((a, b) => a.line - b.line);
	}

	return {
		totalChanges: changedLines.length,
		linesAdded: changedLines.filter((c) => c.type === "added").length,
		linesDeleted: changedLines.filter((c) => c.type === "deleted").length,
		linesModified: changedLines.filter((c) => c.type === "modified").length,
		changes,
	};
}

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
export function formatDiff(diff: Diff): string {
	if (!diff || !diff.changes || diff.changes.length === 0) {
		return "No changes detected.";
	}

	const lines: string[] = [];
	lines.push(`Total changes: ${diff.totalChanges}`);
	lines.push(`  +${diff.linesAdded} lines added`);
	lines.push(`  -${diff.linesDeleted} lines deleted`);
	lines.push(`  ~${diff.linesModified} lines modified`);
	lines.push("");

	diff.changes.forEach((change) => {
		if (change.type === "added") {
			lines.push(`+ Line ${change.line}: ${change.newContent}`);
		} else if (change.type === "deleted") {
			lines.push(`- Line ${change.line}: ${change.oldContent}`);
		} else if (change.type === "modified") {
			lines.push(`~ Line ${change.line}:`);
			lines.push(`  - ${change.oldContent}`);
			lines.push(`  + ${change.newContent}`);
		} else if (change.type === "context") {
			lines.push(`  Line ${change.line}: ${change.oldContent}`);
		}
	});

	return lines.join("\n");
}

// ============================================================================
// IMPURE WRAPPER CLASS
// ============================================================================

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
export class EditOperations {
	private readonly fileOps: FileOperations;
	private readonly dryRun: boolean;
	private readonly verbose: boolean;

	constructor(options: EditOperationsOptions = {}) {
		this.fileOps = options.fileOps ?? new FileOperations(options);
		this.dryRun = options.dryRun ?? false;
		this.verbose = options.verbose ?? false;
	}

	/**
	 * Find all matches of a pattern in a file.
	 *
	 * @param filePath - Absolute path to the file.
	 * @param pattern  - Pattern to search for.
	 * @returns Array of matches with position information.
	 */
	async findInFile(
		filePath: string,
		pattern: RegExp | string,
	): Promise<Match[]> {
		try {
			const content = await this.fileOps.readFile(filePath);
			const matches = findMatches(content, pattern);

			if (this.verbose) {
				logger.info(`Found ${matches.length} match(es) in ${filePath}`);
			}

			return matches;
		} catch (error) {
			throw new FileSystemError(
				`Failed to find in file: ${(error as Error).message}`,
				{
					path: filePath,
					originalError: error as Error,
				},
			);
		}
	}

	/**
	 * Replace all occurrences of a pattern in a file.
	 *
	 * @param filePath    - Absolute path to the file.
	 * @param pattern     - Pattern to find.
	 * @param replacement - Replacement string or function.
	 * @returns Object with `changed` flag and `diff`.
	 */
	async replaceInFile(
		filePath: string,
		pattern: RegExp | string,
		replacement: string | ((substring: string, ...args: unknown[]) => string),
	): Promise<ReplaceResult> {
		try {
			const oldContent = await this.fileOps.readFile(filePath);
			const newContent = replaceAll(oldContent, pattern, replacement);
			const diff = generateDiff(oldContent, newContent);

			if (this.dryRun) {
				logger.info(`[DRY RUN] Would replace in file: ${filePath}`);
				if (this.verbose) {
					logger.info(formatDiff(diff));
				}
				return { changed: diff.totalChanges > 0, diff };
			}

			if (diff.totalChanges > 0) {
				await this.fileOps.writeFile(filePath, newContent);

				if (this.verbose) {
					logger.success(
						`Replaced ${diff.totalChanges} occurrence(s) in ${filePath}`,
					);
				}
			}

			return { changed: diff.totalChanges > 0, diff };
		} catch (error) {
			throw new FileSystemError(
				`Failed to replace in file: ${(error as Error).message}`,
				{
					path: filePath,
					originalError: error as Error,
				},
			);
		}
	}

	/**
	 * Insert content at a specific line in a file.
	 *
	 * @param filePath   - Absolute path to the file.
	 * @param lineNumber - Line number (1-based).
	 * @param content    - Content to insert.
	 * @param position   - `'before'` or `'after'` the target line (default `'after'`).
	 */
	async insertAtLine(
		filePath: string,
		lineNumber: number,
		content: string,
		position: "before" | "after" = "after",
	): Promise<void> {
		try {
			const oldContent = await this.fileOps.readFile(filePath);
			const newContent = insertAtLine(
				oldContent,
				lineNumber,
				content,
				position,
			);

			if (this.dryRun) {
				logger.info(
					`[DRY RUN] Would insert at line ${lineNumber} in ${filePath}`,
				);
				return;
			}

			await this.fileOps.writeFile(filePath, newContent);

			if (this.verbose) {
				logger.success(`Inserted content at line ${lineNumber} in ${filePath}`);
			}
		} catch (error) {
			throw new FileSystemError(
				`Failed to insert at line: ${(error as Error).message}`,
				{
					path: filePath,
					originalError: error as Error,
				},
			);
		}
	}

	/**
	 * Append content to a file.
	 *
	 * @param filePath - Absolute path to the file.
	 * @param content  - Content to append.
	 */
	async appendToFile(filePath: string, content: string): Promise<void> {
		try {
			const oldContent = await this.fileOps.readFile(filePath);
			const newContent = appendText(oldContent, content);

			if (this.dryRun) {
				logger.info(`[DRY RUN] Would append to file: ${filePath}`);
				return;
			}

			await this.fileOps.writeFile(filePath, newContent);

			if (this.verbose) {
				logger.success(`Appended content to ${filePath}`);
			}
		} catch (error) {
			throw new FileSystemError(
				`Failed to append to file: ${(error as Error).message}`,
				{
					path: filePath,
					originalError: error as Error,
				},
			);
		}
	}

	/**
	 * Prepend content to a file.
	 *
	 * @param filePath - Absolute path to the file.
	 * @param content  - Content to prepend.
	 */
	async prependToFile(filePath: string, content: string): Promise<void> {
		try {
			const oldContent = await this.fileOps.readFile(filePath);
			const newContent = prependText(oldContent, content);

			if (this.dryRun) {
				logger.info(`[DRY RUN] Would prepend to file: ${filePath}`);
				return;
			}

			await this.fileOps.writeFile(filePath, newContent);

			if (this.verbose) {
				logger.success(`Prepended content to ${filePath}`);
			}
		} catch (error) {
			throw new FileSystemError(
				`Failed to prepend to file: ${(error as Error).message}`,
				{
					path: filePath,
					originalError: error as Error,
				},
			);
		}
	}

	/**
	 * Delete lines matching a pattern from a file.
	 *
	 * @param filePath - Absolute path to the file.
	 * @param pattern  - Pattern to match against each line.
	 * @returns Object with `deletedLines` count.
	 */
	async deleteLines(
		filePath: string,
		pattern: RegExp | string,
	): Promise<DeleteResult> {
		try {
			const oldContent = await this.fileOps.readFile(filePath);
			const newContent = deleteLines(oldContent, pattern);

			const oldLineCount = oldContent.split("\n").length;
			const newLineCount = newContent.split("\n").length;
			const deletedLines = oldLineCount - newLineCount;

			if (this.dryRun) {
				logger.info(
					`[DRY RUN] Would delete ${deletedLines} line(s) from ${filePath}`,
				);
				return { deletedLines };
			}

			if (deletedLines > 0) {
				await this.fileOps.writeFile(filePath, newContent);

				if (this.verbose) {
					logger.success(`Deleted ${deletedLines} line(s) from ${filePath}`);
				}
			}

			return { deletedLines };
		} catch (error) {
			throw new FileSystemError(
				`Failed to delete lines: ${(error as Error).message}`,
				{
					path: filePath,
					originalError: error as Error,
				},
			);
		}
	}

	/**
	 * Replace a range of lines in a file.
	 *
	 * @param filePath    - Absolute path to the file.
	 * @param startLine   - Start line (1-based, inclusive).
	 * @param endLine     - End line (1-based, inclusive).
	 * @param replacement - Replacement text (may contain newlines).
	 */
	async replaceLineRange(
		filePath: string,
		startLine: number,
		endLine: number,
		replacement: string,
	): Promise<void> {
		try {
			const oldContent = await this.fileOps.readFile(filePath);
			const newContent = replaceLineRange(
				oldContent,
				startLine,
				endLine,
				replacement,
			);

			if (this.dryRun) {
				logger.info(
					`[DRY RUN] Would replace lines ${startLine}-${endLine} in ${filePath}`,
				);
				return;
			}

			await this.fileOps.writeFile(filePath, newContent);

			if (this.verbose) {
				logger.success(`Replaced lines ${startLine}-${endLine} in ${filePath}`);
			}
		} catch (error) {
			throw new FileSystemError(
				`Failed to replace line range: ${(error as Error).message}`,
				{
					path: filePath,
					originalError: error as Error,
				},
			);
		}
	}

	/**
	 * Preview the changes a transform function would make, without writing to disk.
	 *
	 * @param filePath    - Absolute path to the file.
	 * @param transformFn - Function that receives current content and returns new content.
	 * @returns Diff, formatted diff string, and `hasChanges` flag.
	 */
	async previewChanges(
		filePath: string,
		transformFn: (content: string) => string,
	): Promise<PreviewResult> {
		try {
			const oldContent = await this.fileOps.readFile(filePath);
			const newContent = transformFn(oldContent);

			const diff = generateDiff(oldContent, newContent);
			const formatted = formatDiff(diff);

			return {
				diff,
				formatted,
				hasChanges: diff.totalChanges > 0,
			};
		} catch (error) {
			throw new FileSystemError(
				`Failed to preview changes: ${(error as Error).message}`,
				{
					path: filePath,
					originalError: error as Error,
				},
			);
		}
	}

	/**
	 * Apply a transformation function to a file.
	 *
	 * @param filePath    - Absolute path to the file.
	 * @param transformFn - Function that receives current content and returns new content.
	 * @returns Object with `applied` flag and `diff`.
	 */
	async applyTransform(
		filePath: string,
		transformFn: (content: string) => string,
	): Promise<TransformResult> {
		try {
			const oldContent = await this.fileOps.readFile(filePath);
			const newContent = transformFn(oldContent);

			const diff = generateDiff(oldContent, newContent);

			if (this.dryRun) {
				logger.info(`[DRY RUN] Would transform file: ${filePath}`);
				if (this.verbose) {
					logger.info(formatDiff(diff));
				}
				return { applied: false, diff };
			}

			if (diff.totalChanges > 0) {
				await this.fileOps.writeFile(filePath, newContent);

				if (this.verbose) {
					logger.success(`Applied transformation to ${filePath}`);
				}
			}

			return { applied: diff.totalChanges > 0, diff };
		} catch (error) {
			throw new FileSystemError(
				`Failed to apply transform: ${(error as Error).message}`,
				{
					path: filePath,
					originalError: error as Error,
				},
			);
		}
	}
}
