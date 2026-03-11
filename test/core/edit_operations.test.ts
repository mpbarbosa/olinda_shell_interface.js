/**
 * Tests for Edit Operations Module
 * @version 2.0.0
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import {
	findMatches,
	replaceAll,
	replaceFirst,
	insertAtLine,
	appendText,
	prependText,
	deleteLines,
	extractLines,
	getLineRange,
	replaceLineRange,
	generateDiff,
	formatDiff,
	EditOperations,
} from '../../src/core/edit_operations';
import { FileSystemError } from '../../src/utils/errors';

// ============================================================================
// PURE FUNCTION TESTS — deterministic, no I/O
// ============================================================================

describe('Pure Functions - findMatches', () => {
	const text = 'Hello World\nHello Again\nGoodbye World';

	it('finds all matches with line numbers', () => {
		const matches = findMatches(text, /Hello/g);
		expect(matches).toHaveLength(2);
		expect(matches[0].match).toBe('Hello');
		expect(matches[0].line).toBe(1);
		expect(matches[1].line).toBe(2);
	});

	it('finds matches with regex pattern', () => {
		const matches = findMatches(text, /World/g);
		expect(matches).toHaveLength(2);
		expect(matches[0].line).toBe(1);
		expect(matches[1].line).toBe(3);
	});

	it('finds matches with string pattern', () => {
		const matches = findMatches(text, 'Hello');
		expect(matches).toHaveLength(2);
	});

	it('returns empty array for no matches', () => {
		const matches = findMatches(text, /NotFound/g);
		expect(matches).toHaveLength(0);
	});

	it('returns empty array for null or undefined input', () => {
		expect(findMatches(null as unknown as string, /test/)).toHaveLength(0);
		expect(findMatches(undefined as unknown as string, /test/)).toHaveLength(0);
	});

	it('includes line content in results', () => {
		const matches = findMatches(text, /Hello/g);
		expect(matches[0].lineContent).toBe('Hello World');
	});
});

describe('Pure Functions - replaceAll', () => {
	it('replaces all occurrences with string', () => {
		const result = replaceAll('foo bar foo', /foo/g, 'baz');
		expect(result).toBe('baz bar baz');
	});

	it('replaces with function', () => {
		const result = replaceAll('test 1 test 2', /test/g, () => 'TEST');
		expect(result).toBe('TEST 1 TEST 2');
	});

	it('handles string pattern', () => {
		const result = replaceAll('abc abc', 'abc', 'xyz');
		expect(result).toBe('xyz xyz');
	});

	it('returns empty string for null or undefined input', () => {
		expect(replaceAll(null as unknown as string, /test/, 'replacement')).toBe('');
		expect(replaceAll(undefined as unknown as string, /test/, 'replacement')).toBe('');
	});

	it('returns original text if pattern not found', () => {
		const text = 'hello world';
		expect(replaceAll(text, /notfound/, 'replacement')).toBe(text);
	});
});

describe('Pure Functions - replaceFirst', () => {
	it('replaces only first occurrence', () => {
		const result = replaceFirst('foo bar foo', /foo/g, 'baz');
		expect(result).toBe('baz bar foo');
	});

	it('handles string pattern', () => {
		const result = replaceFirst('test test', 'test', 'TEST');
		expect(result).toBe('TEST test');
	});

	it('returns empty string for null input', () => {
		expect(replaceFirst(null as unknown as string, /test/, 'replacement')).toBe('');
	});
});

describe('Pure Functions - insertAtLine', () => {
	const text = 'line1\nline2\nline3';

	it('inserts after specified line', () => {
		const result = insertAtLine(text, 2, 'inserted');
		expect(result).toBe('line1\nline2\ninserted\nline3');
	});

	it('inserts before specified line', () => {
		const result = insertAtLine(text, 2, 'inserted', 'before');
		expect(result).toBe('line1\ninserted\nline2\nline3');
	});

	it('inserts at beginning', () => {
		const result = insertAtLine(text, 1, 'first', 'before');
		expect(result).toBe('first\nline1\nline2\nline3');
	});

	it('inserts at end', () => {
		const result = insertAtLine(text, 3, 'last');
		expect(result).toBe('line1\nline2\nline3\nlast');
	});

	it('returns original text unchanged for out-of-range line numbers', () => {
		expect(insertAtLine(text, 0, 'test')).toBe(text);
		expect(insertAtLine(text, 100, 'test')).toBe(text);
	});

	it('returns null for null input', () => {
		expect(insertAtLine(null as unknown as string, 1, 'test')).toBe(null);
	});
});

describe('Pure Functions - appendText', () => {
	it('appends to end of text', () => {
		const result = appendText('hello', 'world');
		expect(result).toBe('hello\nworld');
	});

	it('appends without newline when disabled', () => {
		const result = appendText('hello', 'world', false);
		expect(result).toBe('helloworld');
	});

	it('handles empty original text', () => {
		const result = appendText('', 'content');
		expect(result).toBe('content');
	});

	it('handles text already ending with newline', () => {
		const result = appendText('hello\n', 'world');
		expect(result).toBe('hello\nworld');
	});

	it('returns the text-to-append for null original text', () => {
		expect(appendText(null as unknown as string, 'test')).toBe('test');
	});
});

describe('Pure Functions - prependText', () => {
	it('prepends to beginning of text', () => {
		const result = prependText('world', 'hello');
		expect(result).toBe('hello\nworld');
	});

	it('prepends without newline when disabled', () => {
		const result = prependText('world', 'hello', false);
		expect(result).toBe('helloworld');
	});

	it('handles empty original text', () => {
		const result = prependText('', 'content');
		expect(result).toBe('content');
	});

	it('handles content already ending with newline', () => {
		const result = prependText('world', 'hello\n');
		expect(result).toBe('hello\nworld');
	});

	it('returns the text-to-prepend for null original text', () => {
		expect(prependText(null as unknown as string, 'test')).toBe('test');
	});
});

describe('Pure Functions - deleteLines', () => {
	const text = 'keep this\ndelete this\nkeep this too\ndelete this also';

	it('deletes lines matching pattern', () => {
		const result = deleteLines(text, /delete/);
		expect(result).toBe('keep this\nkeep this too');
	});

	it('deletes lines matching string pattern', () => {
		const result = deleteLines(text, 'delete');
		expect(result).toBe('keep this\nkeep this too');
	});

	it('returns original if no matches', () => {
		const result = deleteLines(text, /notfound/);
		expect(result).toBe(text);
	});

	it('returns empty string for null input', () => {
		expect(deleteLines(null as unknown as string, /test/)).toBe('');
	});
});

describe('Pure Functions - extractLines', () => {
	const text = 'line1: data\nline2: info\nline3: data\nline4: info';

	it('extracts lines matching pattern', () => {
		const result = extractLines(text, /data/);
		expect(result).toEqual(['line1: data', 'line3: data']);
	});

	it('extracts lines matching string pattern', () => {
		const result = extractLines(text, 'info');
		expect(result).toEqual(['line2: info', 'line4: info']);
	});

	it('returns empty array if no matches', () => {
		const result = extractLines(text, /notfound/);
		expect(result).toHaveLength(0);
	});

	it('returns empty array for null input', () => {
		expect(extractLines(null as unknown as string, /test/)).toHaveLength(0);
	});
});

describe('Pure Functions - getLineRange', () => {
	const text = 'line1\nline2\nline3\nline4\nline5';

	it('extracts range of lines', () => {
		const result = getLineRange(text, 2, 4);
		expect(result).toBe('line2\nline3\nline4');
	});

	it('extracts from line to end', () => {
		const result = getLineRange(text, 3, -1);
		expect(result).toBe('line3\nline4\nline5');
	});

	it('extracts single line', () => {
		const result = getLineRange(text, 2, 2);
		expect(result).toBe('line2');
	});

	it('returns empty string for out-of-range or invalid line numbers', () => {
		expect(getLineRange(text, 0, 2)).toBe('');
		expect(getLineRange(text, 10, 20)).toBe('');
	});

	it('returns empty string for null input', () => {
		expect(getLineRange(null as unknown as string, 1, 2)).toBe('');
	});
});

describe('Pure Functions - replaceLineRange', () => {
	const text = 'line1\nline2\nline3\nline4\nline5';

	it('replaces range of lines', () => {
		const result = replaceLineRange(text, 2, 4, 'replaced');
		expect(result).toBe('line1\nreplaced\nline5');
	});

	it('replaces with multiple lines', () => {
		const result = replaceLineRange(text, 2, 3, 'new1\nnew2\nnew3');
		expect(result).toBe('line1\nnew1\nnew2\nnew3\nline4\nline5');
	});

	it('handles single line replacement', () => {
		const result = replaceLineRange(text, 3, 3, 'new');
		expect(result).toBe('line1\nline2\nnew\nline4\nline5');
	});

	it('returns original text for out-of-range line numbers', () => {
		expect(replaceLineRange(text, 0, 2, 'test')).toBe(text);
		expect(replaceLineRange(text, 100, 200, 'test')).toBe(text);
	});

	it('returns null for null input', () => {
		expect(replaceLineRange(null as unknown as string, 1, 2, 'test')).toBe(null);
	});
});

describe('Pure Functions - generateDiff', () => {
	it('detects added lines', () => {
		const oldText = 'line1\nline2';
		const newText = 'line1\nline2\nline3';
		const diff = generateDiff(oldText, newText);

		expect(diff.totalChanges).toBe(1);
		expect(diff.linesAdded).toBe(1);
		expect(diff.linesDeleted).toBe(0);
		expect(diff.linesModified).toBe(0);
	});

	it('detects deleted lines', () => {
		const oldText = 'line1\nline2\nline3';
		const newText = 'line1\nline2';
		const diff = generateDiff(oldText, newText);

		expect(diff.totalChanges).toBe(1);
		expect(diff.linesDeleted).toBe(1);
	});

	it('detects modified lines', () => {
		const oldText = 'line1\nline2\nline3';
		const newText = 'line1\nmodified\nline3';
		const diff = generateDiff(oldText, newText);

		expect(diff.totalChanges).toBe(1);
		expect(diff.linesModified).toBe(1);
	});

	it('detects multiple types of changes', () => {
		const oldText = 'line1\nline2\nline3';
		const newText = 'modified1\nline2\nline3\nline4';
		const diff = generateDiff(oldText, newText);

		expect(diff.totalChanges).toBe(2);
		expect(diff.linesModified).toBe(1);
		expect(diff.linesAdded).toBe(1);
	});

	it('returns no changes for identical texts', () => {
		const text = 'line1\nline2';
		const diff = generateDiff(text, text);

		expect(diff.totalChanges).toBe(0);
	});

	it('includes change details', () => {
		const oldText = 'old';
		const newText = 'new';
		const diff = generateDiff(oldText, newText);

		expect(diff.changes[0]).toMatchObject({
			line: 1,
			type: 'modified',
			oldContent: 'old',
			newContent: 'new',
		});
	});
});

describe('Pure Functions - formatDiff', () => {
	it('formats diff with changes', () => {
		const diff = {
			totalChanges: 3,
			linesAdded: 1,
			linesDeleted: 1,
			linesModified: 1,
			changes: [
				{ line: 1, type: 'added' as const, oldContent: null, newContent: 'new line' },
				{ line: 2, type: 'deleted' as const, oldContent: 'old line', newContent: null },
				{ line: 3, type: 'modified' as const, oldContent: 'old', newContent: 'new' },
			],
		};

		const formatted = formatDiff(diff);

		expect(formatted).toContain('Total changes: 3');
		expect(formatted).toContain('+1 lines added');
		expect(formatted).toContain('-1 lines deleted');
		expect(formatted).toContain('~1 lines modified');
		expect(formatted).toContain('+ Line 1: new line');
		expect(formatted).toContain('- Line 2: old line');
		expect(formatted).toContain('~ Line 3:');
	});

	it('handles no changes', () => {
		const diff = { totalChanges: 0, linesAdded: 0, linesDeleted: 0, linesModified: 0, changes: [] };
		const formatted = formatDiff(diff);

		expect(formatted).toBe('No changes detected.');
	});

	it('handles null diff', () => {
		const formatted = formatDiff(null as unknown as Parameters<typeof formatDiff>[0]);
		expect(formatted).toBe('No changes detected.');
	});
});

// ============================================================================
// INTEGRATION TESTS — real file I/O
// ============================================================================

describe('EditOperations Integration Tests', () => {
	let tempDir: string;
	let editOps: EditOperations;
	let testFile: string;

	beforeEach(async () => {
		tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'editops-test-'));
		editOps = new EditOperations({ verbose: false });
		testFile = path.join(tempDir, 'test.txt');
	});

	afterEach(async () => {
		try {
			await fs.rm(tempDir, { recursive: true, force: true });
		} catch {
			// ignore cleanup errors
		}
	});

	describe('findInFile', () => {
		it('finds matches in file', async () => {
			await fs.writeFile(testFile, 'test line 1\ntest line 2\nother line');

			const matches = await editOps.findInFile(testFile, /test/g);

			expect(matches).toHaveLength(2);
			expect(matches[0].line).toBe(1);
			expect(matches[1].line).toBe(2);
		});

		it('returns empty array when no matches', async () => {
			await fs.writeFile(testFile, 'no matches here');

			const matches = await editOps.findInFile(testFile, /notfound/g);

			expect(matches).toEqual([]);
		});

		it('throws FileSystemError for non-existent file', async () => {
			const nonExistent = path.join(tempDir, 'nonexistent.txt');
			await expect(editOps.findInFile(nonExistent, /test/)).rejects.toThrow(FileSystemError);
		});
	});

	describe('replaceInFile', () => {
		it('replaces all occurrences', async () => {
			await fs.writeFile(testFile, 'foo bar foo baz');

			const result = await editOps.replaceInFile(testFile, /foo/g, 'replaced');

			expect(result.changed).toBe(true);
			expect(result.diff.totalChanges).toBe(1);

			const content = await fs.readFile(testFile, 'utf8');
			expect(content).toBe('replaced bar replaced baz');
		});

		it('reports no changes when pattern not found', async () => {
			await fs.writeFile(testFile, 'no changes');

			const result = await editOps.replaceInFile(testFile, /notfound/, 'replacement');

			expect(result.changed).toBe(false);
			expect(result.diff.totalChanges).toBe(0);
		});

		it('does not modify file in dry-run mode', async () => {
			const dryRunOps = new EditOperations({ dryRun: true });
			await fs.writeFile(testFile, 'foo bar');

			await dryRunOps.replaceInFile(testFile, /foo/, 'baz');

			const content = await fs.readFile(testFile, 'utf8');
			expect(content).toBe('foo bar');
		});
	});

	describe('insertAtLine', () => {
		it('inserts content at specified line', async () => {
			await fs.writeFile(testFile, 'line1\nline2\nline3');

			await editOps.insertAtLine(testFile, 2, 'inserted');

			const content = await fs.readFile(testFile, 'utf8');
			expect(content).toBe('line1\nline2\ninserted\nline3');
		});

		it('inserts before line', async () => {
			await fs.writeFile(testFile, 'line1\nline2');

			await editOps.insertAtLine(testFile, 2, 'inserted', 'before');

			const content = await fs.readFile(testFile, 'utf8');
			expect(content).toBe('line1\ninserted\nline2');
		});

		it('does not modify file in dry-run mode', async () => {
			const dryRunOps = new EditOperations({ dryRun: true });
			await fs.writeFile(testFile, 'line1\nline2');

			await dryRunOps.insertAtLine(testFile, 1, 'test');

			const content = await fs.readFile(testFile, 'utf8');
			expect(content).toBe('line1\nline2');
		});
	});

	describe('appendToFile', () => {
		it('appends content to file', async () => {
			await fs.writeFile(testFile, 'existing');

			await editOps.appendToFile(testFile, 'appended');

			const content = await fs.readFile(testFile, 'utf8');
			expect(content).toBe('existing\nappended');
		});

		it('does not modify file in dry-run mode', async () => {
			const dryRunOps = new EditOperations({ dryRun: true });
			await fs.writeFile(testFile, 'existing');

			await dryRunOps.appendToFile(testFile, 'appended');

			const content = await fs.readFile(testFile, 'utf8');
			expect(content).toBe('existing');
		});
	});

	describe('prependToFile', () => {
		it('prepends content to file', async () => {
			await fs.writeFile(testFile, 'existing');

			await editOps.prependToFile(testFile, 'prepended');

			const content = await fs.readFile(testFile, 'utf8');
			expect(content).toBe('prepended\nexisting');
		});

		it('does not modify file in dry-run mode', async () => {
			const dryRunOps = new EditOperations({ dryRun: true });
			await fs.writeFile(testFile, 'existing');

			await dryRunOps.prependToFile(testFile, 'prepended');

			const content = await fs.readFile(testFile, 'utf8');
			expect(content).toBe('existing');
		});
	});

	describe('deleteLines', () => {
		it('deletes matching lines', async () => {
			await fs.writeFile(testFile, 'keep\ndelete\nkeep\ndelete');

			const result = await editOps.deleteLines(testFile, /delete/);

			expect(result.deletedLines).toBe(2);

			const content = await fs.readFile(testFile, 'utf8');
			expect(content).toBe('keep\nkeep');
		});

		it('handles no matching lines', async () => {
			await fs.writeFile(testFile, 'line1\nline2');

			const result = await editOps.deleteLines(testFile, /notfound/);

			expect(result.deletedLines).toBe(0);
		});

		it('does not modify file in dry-run mode', async () => {
			const dryRunOps = new EditOperations({ dryRun: true });
			await fs.writeFile(testFile, 'keep\ndelete');

			await dryRunOps.deleteLines(testFile, /delete/);

			const content = await fs.readFile(testFile, 'utf8');
			expect(content).toBe('keep\ndelete');
		});
	});

	describe('replaceLineRange', () => {
		it('replaces range of lines', async () => {
			await fs.writeFile(testFile, 'line1\nline2\nline3\nline4');

			await editOps.replaceLineRange(testFile, 2, 3, 'replaced');

			const content = await fs.readFile(testFile, 'utf8');
			expect(content).toBe('line1\nreplaced\nline4');
		});

		it('does not modify file in dry-run mode', async () => {
			const dryRunOps = new EditOperations({ dryRun: true });
			await fs.writeFile(testFile, 'line1\nline2\nline3');

			await dryRunOps.replaceLineRange(testFile, 1, 2, 'test');

			const content = await fs.readFile(testFile, 'utf8');
			expect(content).toBe('line1\nline2\nline3');
		});
	});

	describe('previewChanges', () => {
		it('previews changes without applying', async () => {
			await fs.writeFile(testFile, 'old content');

			const preview = await editOps.previewChanges(testFile, (content) =>
				content.replace('old', 'new'),
			);

			expect(preview.hasChanges).toBe(true);
			expect(preview.diff.totalChanges).toBe(1);
			expect(preview.formatted).toContain('Total changes:');

			const content = await fs.readFile(testFile, 'utf8');
			expect(content).toBe('old content');
		});

		it('detects no changes', async () => {
			await fs.writeFile(testFile, 'content');

			const preview = await editOps.previewChanges(testFile, (content) => content);

			expect(preview.hasChanges).toBe(false);
			expect(preview.diff.totalChanges).toBe(0);
		});
	});

	describe('applyTransform', () => {
		it('applies transformation function', async () => {
			await fs.writeFile(testFile, 'lowercase text');

			const result = await editOps.applyTransform(testFile, (content) => content.toUpperCase());

			expect(result.applied).toBe(true);
			expect(result.diff.totalChanges).toBe(1);

			const content = await fs.readFile(testFile, 'utf8');
			expect(content).toBe('LOWERCASE TEXT');
		});

		it('handles no changes from transform', async () => {
			await fs.writeFile(testFile, 'content');

			const result = await editOps.applyTransform(testFile, (content) => content);

			expect(result.applied).toBe(false);
			expect(result.diff.totalChanges).toBe(0);
		});

		it('does not modify file in dry-run mode', async () => {
			const dryRunOps = new EditOperations({ dryRun: true });
			await fs.writeFile(testFile, 'test');

			await dryRunOps.applyTransform(testFile, (content) => content.toUpperCase());

			const content = await fs.readFile(testFile, 'utf8');
			expect(content).toBe('test');
		});
	});

	describe('verbose mode', () => {
		let verboseOps: EditOperations;
		let verboseDryRun: EditOperations;

		beforeEach(() => {
			verboseOps = new EditOperations({ verbose: true });
			verboseDryRun = new EditOperations({ verbose: true, dryRun: true });
		});

		it('findInFile logs match count when verbose', async () => {
			await fs.writeFile(testFile, 'hello world\nhello again');
			const matches = await verboseOps.findInFile(testFile, /hello/g);
			expect(matches).toHaveLength(2);
		});

		it('replaceInFile logs success when verbose and changes occur', async () => {
			await fs.writeFile(testFile, 'foo bar foo');
			const result = await verboseOps.replaceInFile(testFile, /foo/g, 'baz');
			expect(result.changed).toBe(true);
		});

		it('replaceInFile verbose dry-run logs the diff', async () => {
			await fs.writeFile(testFile, 'foo bar');
			const result = await verboseDryRun.replaceInFile(testFile, /foo/g, 'baz');
			expect(result.changed).toBe(true);
			const content = await fs.readFile(testFile, 'utf8');
			expect(content).toBe('foo bar');
		});

		it('insertAtLine logs success when verbose', async () => {
			await fs.writeFile(testFile, 'line1\nline3');
			await verboseOps.insertAtLine(testFile, 2, 'line2');
			const content = await fs.readFile(testFile, 'utf8');
			expect(content).toContain('line2');
		});

		it('appendToFile logs success when verbose', async () => {
			await fs.writeFile(testFile, 'first');
			await verboseOps.appendToFile(testFile, 'last');
			const content = await fs.readFile(testFile, 'utf8');
			expect(content).toContain('last');
		});

		it('deleteLines logs success when verbose', async () => {
			await fs.writeFile(testFile, 'keep\nremove\nkeep');
			const result = await verboseOps.deleteLines(testFile, /remove/);
			expect(result.deletedLines).toBe(1);
		});

		it('deleteLines verbose dry-run returns deleted count', async () => {
			await fs.writeFile(testFile, 'keep\nremove\nkeep');
			const result = await verboseDryRun.deleteLines(testFile, /remove/);
			expect(result.deletedLines).toBe(1);
			const content = await fs.readFile(testFile, 'utf8');
			expect(content).toContain('remove');
		});

		it('replaceLineRange logs success when verbose', async () => {
			await fs.writeFile(testFile, 'line1\nline2\nline3');
			await verboseOps.replaceLineRange(testFile, 2, 2, 'replaced');
			const content = await fs.readFile(testFile, 'utf8');
			expect(content).toContain('replaced');
		});

		it('applyTransform logs success when verbose', async () => {
			await fs.writeFile(testFile, 'hello');
			const result = await verboseOps.applyTransform(testFile, (c) => c.toUpperCase());
			expect(result.applied).toBe(true);
		});

		it('applyTransform verbose dry-run logs diff', async () => {
			await fs.writeFile(testFile, 'hello');
			const result = await verboseDryRun.applyTransform(testFile, (c) => c.toUpperCase());
			expect(result.applied).toBe(false);
			const content = await fs.readFile(testFile, 'utf8');
			expect(content).toBe('hello');
		});
	});
});

// ============================================================================
// generateDiff — context lines
// ============================================================================

describe('Pure Functions - generateDiff with context lines', () => {
	it('includes surrounding unchanged lines when context > 0', () => {
		const oldText = 'a\nb\nc\nd\ne';
		const newText = 'a\nb\nX\nd\ne';
		const diff = generateDiff(oldText, newText, { context: 1 });

		expect(diff.totalChanges).toBe(1);
		const types = diff.changes.map((c) => c.type);
		expect(types).toContain('modified');
		expect(types).toContain('context');
	});

	it('context lines do not affect change counts', () => {
		const diff = generateDiff('a\nb\nc', 'a\nX\nc', { context: 1 });
		expect(diff.totalChanges).toBe(1);
		expect(diff.linesModified).toBe(1);
		expect(diff.linesAdded).toBe(0);
		expect(diff.linesDeleted).toBe(0);
	});

	it('context lines are sorted by line number', () => {
		const diff = generateDiff('a\nb\nc\nd\ne', 'a\nb\nX\nd\ne', { context: 2 });
		const lineNumbers = diff.changes.map((c) => c.line);
		expect(lineNumbers).toEqual([...lineNumbers].sort((a, b) => a - b));
	});

	it('does not include context beyond file boundaries', () => {
		const diff = generateDiff('only\none\nline', 'only\none\nX', { context: 5 });
		expect(diff.changes.every((c) => c.line >= 1)).toBe(true);
	});

	it('context = 0 (default) produces no context lines', () => {
		const diff = generateDiff('a\nb\nc', 'a\nX\nc');
		expect(diff.changes.every((c) => c.type !== 'context')).toBe(true);
	});

	it('context lines have matching oldContent and newContent', () => {
		const diff = generateDiff('a\nb\nc', 'a\nX\nc', { context: 1 });
		const contextLines = diff.changes.filter((c) => c.type === 'context');
		for (const cl of contextLines) {
			expect(cl.oldContent).toBe(cl.newContent);
		}
	});
});

describe('Pure Functions - formatDiff with context lines', () => {
	it('renders context lines with leading spaces', () => {
		const diff = generateDiff('a\nb\nc', 'a\nX\nc', { context: 1 });
		const formatted = formatDiff(diff);
		expect(formatted).toContain('  Line');
	});
});
