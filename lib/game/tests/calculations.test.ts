import { describe, it, expect } from 'vitest';
import {
	getDiffResults,
	getCorrectWordCount,
	getCorrectCharCount,
	calculateWPM,
	calculateAccuracy,
} from '../calculations';

describe('getDiffResults', () => {
	it('marks all chars pending when nothing is typed', () => {
		const result = getDiffResults('', 'hello');
		expect(result.every((r) => r.status === 'pending')).toBe(true);
	});

	it('marks correct characters as correct', () => {
		const result = getDiffResults('he', 'hello');
		expect(result[0].status).toBe('correct');
		expect(result[1].status).toBe('correct');
		expect(result[2].status).toBe('pending');
	});

	it('marks wrong characters as incorrect', () => {
		const result = getDiffResults('hx', 'hello');
		expect(result[1].status).toBe('incorrect');
	});
});

describe('getCorrectWordCount', () => {
	it('returns 0 when nothing typed', () => {
		expect(getCorrectWordCount('', 'hello world')).toBe(0);
	});

	it('counts a completed correct word', () => {
		expect(getCorrectWordCount('hello ', 'hello world')).toBe(1);
	});

	it('does not count a completed incorrect word', () => {
		expect(getCorrectWordCount('helo ', 'hello world')).toBe(0);
	});

	it('does not count a word that is in progress', () => {
		expect(getCorrectWordCount('hello wor', 'hello world')).toBe(1);
	});

	it('counts multiple correct words', () => {
		expect(getCorrectWordCount('the quick brown ', 'the quick brown fox')).toBe(3);
	});
});

describe('getCorrectCharCount', () => {
	it('returns 0 for empty input', () => {
		expect(getCorrectCharCount('', 'hello')).toBe(0);
	});

	it('counts correct chars', () => {
		expect(getCorrectCharCount('hel', 'hello')).toBe(3);
	});

	it('counts all matching positions even when some chars are wrong', () => {
		expect(getCorrectCharCount('hxllo', 'hello')).toBe(4);
	});
});

describe('calculateWPM', () => {
	it('returns 0 for elapsed time under 1 second', () => {
		expect(calculateWPM(10, 0.5)).toBe(0);
	});

	it('calculates correctly for 60 seconds', () => {
		expect(calculateWPM(10, 60)).toBe(10);
	});

	it('calculates correctly for 30 seconds', () => {
		expect(calculateWPM(5, 30)).toBe(10);
	});
});

describe('calculateAccuracy', () => {
	it('returns 0 when nothing typed', () => {
		expect(calculateAccuracy(0, 0)).toBe(0);
	});

	it('returns 1 for all correct', () => {
		expect(calculateAccuracy(10, 10)).toBe(1);
	});

	it('returns 0.5 for half correct', () => {
		expect(calculateAccuracy(5, 10)).toBe(0.5);
	});

	it('rounds to 3 decimal places', () => {
		expect(calculateAccuracy(2, 3)).toBe(0.667);
	});
});
