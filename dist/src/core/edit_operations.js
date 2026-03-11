"use strict";
/**
 * File Editing Operations Module (Pure Functions + Wrapper)
 * @module core/edit_operations
 * @description File content editing utilities with referential transparency.
 *
 * Architecture: Pure functions + async wrapper class
 * - Pure functions: text search, replace, line manipulation, diff generation
 * - Async wrapper class: EditOperations for real file I/O
 * @since 0.5.8
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EditOperations = void 0;
exports.findMatches = findMatches;
exports.replaceAll = replaceAll;
exports.replaceFirst = replaceFirst;
exports.insertAtLine = insertAtLine;
exports.appendText = appendText;
exports.prependText = prependText;
exports.deleteLines = deleteLines;
exports.extractLines = extractLines;
exports.getLineRange = getLineRange;
exports.replaceLineRange = replaceLineRange;
exports.generateDiff = generateDiff;
exports.formatDiff = formatDiff;
const olinda_utils_js_1 = require("olinda_utils.js");
const file_operations_js_1 = require("./file_operations.js");
const errors_js_1 = require("../utils/errors.js");
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
function findMatches(text, pattern) {
    if (typeof text !== "string") {
        return [];
    }
    const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern, "g");
    const matches = [];
    const lines = text.split("\n");
    lines.forEach((line, lineIndex) => {
        let match;
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
function replaceAll(text, pattern, replacement) {
    if (typeof text !== "string") {
        return "";
    }
    const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern, "g");
    return text.replace(regex, replacement);
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
function replaceFirst(text, pattern, replacement) {
    if (typeof text !== "string") {
        return "";
    }
    const regex = pattern instanceof RegExp
        ? new RegExp(pattern.source, pattern.flags.replace("g", ""))
        : new RegExp(pattern);
    return text.replace(regex, replacement);
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
function insertAtLine(text, lineNumber, content, position = "after") {
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
    }
    else {
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
function appendText(text, content, ensureNewline = true) {
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
function prependText(text, content, ensureNewline = true) {
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
function deleteLines(text, pattern) {
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
function extractLines(text, pattern) {
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
function getLineRange(text, startLine, endLine) {
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
function replaceLineRange(text, startLine, endLine, replacement) {
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
function generateDiff(oldText, newText, options = {}) {
    const { context = 0 } = options;
    const oldLines = oldText.split("\n");
    const newLines = newText.split("\n");
    const changedLines = [];
    const maxLength = Math.max(oldLines.length, newLines.length);
    for (let i = 0; i < maxLength; i++) {
        const oldLine = oldLines[i] !== undefined ? oldLines[i] : null;
        const newLine = newLines[i] !== undefined ? newLines[i] : null;
        if (oldLine !== newLine) {
            changedLines.push({
                line: i + 1,
                type: oldLine === null
                    ? "added"
                    : newLine === null
                        ? "deleted"
                        : "modified",
                oldContent: oldLine,
                newContent: newLine,
            });
        }
    }
    const changes = [...changedLines];
    if (context > 0 && changedLines.length > 0) {
        const changedIndices = new Set(changedLines.map((c) => c.line - 1));
        const addedContextIndices = new Set();
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
function formatDiff(diff) {
    if (!diff || !diff.changes || diff.changes.length === 0) {
        return "No changes detected.";
    }
    const lines = [];
    lines.push(`Total changes: ${diff.totalChanges}`);
    lines.push(`  +${diff.linesAdded} lines added`);
    lines.push(`  -${diff.linesDeleted} lines deleted`);
    lines.push(`  ~${diff.linesModified} lines modified`);
    lines.push("");
    diff.changes.forEach((change) => {
        if (change.type === "added") {
            lines.push(`+ Line ${change.line}: ${change.newContent}`);
        }
        else if (change.type === "deleted") {
            lines.push(`- Line ${change.line}: ${change.oldContent}`);
        }
        else if (change.type === "modified") {
            lines.push(`~ Line ${change.line}:`);
            lines.push(`  - ${change.oldContent}`);
            lines.push(`  + ${change.newContent}`);
        }
        else if (change.type === "context") {
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
class EditOperations {
    constructor(options = {}) {
        this.fileOps = options.fileOps ?? new file_operations_js_1.FileOperations(options);
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
    async findInFile(filePath, pattern) {
        try {
            const content = await this.fileOps.readFile(filePath);
            const matches = findMatches(content, pattern);
            if (this.verbose) {
                olinda_utils_js_1.logger.info(`Found ${matches.length} match(es) in ${filePath}`);
            }
            return matches;
        }
        catch (error) {
            throw new errors_js_1.FileSystemError(`Failed to find in file: ${error.message}`, {
                path: filePath,
                originalError: error,
            });
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
    async replaceInFile(filePath, pattern, replacement) {
        try {
            const oldContent = await this.fileOps.readFile(filePath);
            const newContent = replaceAll(oldContent, pattern, replacement);
            const diff = generateDiff(oldContent, newContent);
            if (this.dryRun) {
                olinda_utils_js_1.logger.info(`[DRY RUN] Would replace in file: ${filePath}`);
                if (this.verbose) {
                    olinda_utils_js_1.logger.info(formatDiff(diff));
                }
                return { changed: diff.totalChanges > 0, diff };
            }
            if (diff.totalChanges > 0) {
                await this.fileOps.writeFile(filePath, newContent);
                if (this.verbose) {
                    olinda_utils_js_1.logger.success(`Replaced ${diff.totalChanges} occurrence(s) in ${filePath}`);
                }
            }
            return { changed: diff.totalChanges > 0, diff };
        }
        catch (error) {
            throw new errors_js_1.FileSystemError(`Failed to replace in file: ${error.message}`, {
                path: filePath,
                originalError: error,
            });
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
    async insertAtLine(filePath, lineNumber, content, position = "after") {
        try {
            const oldContent = await this.fileOps.readFile(filePath);
            const newContent = insertAtLine(oldContent, lineNumber, content, position);
            if (this.dryRun) {
                olinda_utils_js_1.logger.info(`[DRY RUN] Would insert at line ${lineNumber} in ${filePath}`);
                return;
            }
            await this.fileOps.writeFile(filePath, newContent);
            if (this.verbose) {
                olinda_utils_js_1.logger.success(`Inserted content at line ${lineNumber} in ${filePath}`);
            }
        }
        catch (error) {
            throw new errors_js_1.FileSystemError(`Failed to insert at line: ${error.message}`, {
                path: filePath,
                originalError: error,
            });
        }
    }
    /**
     * Append content to a file.
     *
     * @param filePath - Absolute path to the file.
     * @param content  - Content to append.
     */
    async appendToFile(filePath, content) {
        try {
            const oldContent = await this.fileOps.readFile(filePath);
            const newContent = appendText(oldContent, content);
            if (this.dryRun) {
                olinda_utils_js_1.logger.info(`[DRY RUN] Would append to file: ${filePath}`);
                return;
            }
            await this.fileOps.writeFile(filePath, newContent);
            if (this.verbose) {
                olinda_utils_js_1.logger.success(`Appended content to ${filePath}`);
            }
        }
        catch (error) {
            throw new errors_js_1.FileSystemError(`Failed to append to file: ${error.message}`, {
                path: filePath,
                originalError: error,
            });
        }
    }
    /**
     * Prepend content to a file.
     *
     * @param filePath - Absolute path to the file.
     * @param content  - Content to prepend.
     */
    async prependToFile(filePath, content) {
        try {
            const oldContent = await this.fileOps.readFile(filePath);
            const newContent = prependText(oldContent, content);
            if (this.dryRun) {
                olinda_utils_js_1.logger.info(`[DRY RUN] Would prepend to file: ${filePath}`);
                return;
            }
            await this.fileOps.writeFile(filePath, newContent);
            if (this.verbose) {
                olinda_utils_js_1.logger.success(`Prepended content to ${filePath}`);
            }
        }
        catch (error) {
            throw new errors_js_1.FileSystemError(`Failed to prepend to file: ${error.message}`, {
                path: filePath,
                originalError: error,
            });
        }
    }
    /**
     * Delete lines matching a pattern from a file.
     *
     * @param filePath - Absolute path to the file.
     * @param pattern  - Pattern to match against each line.
     * @returns Object with `deletedLines` count.
     */
    async deleteLines(filePath, pattern) {
        try {
            const oldContent = await this.fileOps.readFile(filePath);
            const newContent = deleteLines(oldContent, pattern);
            const oldLineCount = oldContent.split("\n").length;
            const newLineCount = newContent.split("\n").length;
            const deletedLines = oldLineCount - newLineCount;
            if (this.dryRun) {
                olinda_utils_js_1.logger.info(`[DRY RUN] Would delete ${deletedLines} line(s) from ${filePath}`);
                return { deletedLines };
            }
            if (deletedLines > 0) {
                await this.fileOps.writeFile(filePath, newContent);
                if (this.verbose) {
                    olinda_utils_js_1.logger.success(`Deleted ${deletedLines} line(s) from ${filePath}`);
                }
            }
            return { deletedLines };
        }
        catch (error) {
            throw new errors_js_1.FileSystemError(`Failed to delete lines: ${error.message}`, {
                path: filePath,
                originalError: error,
            });
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
    async replaceLineRange(filePath, startLine, endLine, replacement) {
        try {
            const oldContent = await this.fileOps.readFile(filePath);
            const newContent = replaceLineRange(oldContent, startLine, endLine, replacement);
            if (this.dryRun) {
                olinda_utils_js_1.logger.info(`[DRY RUN] Would replace lines ${startLine}-${endLine} in ${filePath}`);
                return;
            }
            await this.fileOps.writeFile(filePath, newContent);
            if (this.verbose) {
                olinda_utils_js_1.logger.success(`Replaced lines ${startLine}-${endLine} in ${filePath}`);
            }
        }
        catch (error) {
            throw new errors_js_1.FileSystemError(`Failed to replace line range: ${error.message}`, {
                path: filePath,
                originalError: error,
            });
        }
    }
    /**
     * Preview the changes a transform function would make, without writing to disk.
     *
     * @param filePath    - Absolute path to the file.
     * @param transformFn - Function that receives current content and returns new content.
     * @returns Diff, formatted diff string, and `hasChanges` flag.
     */
    async previewChanges(filePath, transformFn) {
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
        }
        catch (error) {
            throw new errors_js_1.FileSystemError(`Failed to preview changes: ${error.message}`, {
                path: filePath,
                originalError: error,
            });
        }
    }
    /**
     * Apply a transformation function to a file.
     *
     * @param filePath    - Absolute path to the file.
     * @param transformFn - Function that receives current content and returns new content.
     * @returns Object with `applied` flag and `diff`.
     */
    async applyTransform(filePath, transformFn) {
        try {
            const oldContent = await this.fileOps.readFile(filePath);
            const newContent = transformFn(oldContent);
            const diff = generateDiff(oldContent, newContent);
            if (this.dryRun) {
                olinda_utils_js_1.logger.info(`[DRY RUN] Would transform file: ${filePath}`);
                if (this.verbose) {
                    olinda_utils_js_1.logger.info(formatDiff(diff));
                }
                return { applied: false, diff };
            }
            if (diff.totalChanges > 0) {
                await this.fileOps.writeFile(filePath, newContent);
                if (this.verbose) {
                    olinda_utils_js_1.logger.success(`Applied transformation to ${filePath}`);
                }
            }
            return { applied: diff.totalChanges > 0, diff };
        }
        catch (error) {
            throw new errors_js_1.FileSystemError(`Failed to apply transform: ${error.message}`, {
                path: filePath,
                originalError: error,
            });
        }
    }
}
exports.EditOperations = EditOperations;
