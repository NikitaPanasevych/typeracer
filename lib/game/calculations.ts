export type CharStatus = 'correct' | 'incorrect' | 'pending';

export type CharResult = {
	char: string;
	status: CharStatus;
};

export function getDiffResults(typed: string, target: string): CharResult[] {
	return target.split('').map((char, i) => {
		if (i >= typed.length) return { char, status: 'pending' };
		return { char, status: typed[i] === char ? 'correct' : 'incorrect' };
	});
}

export function getCorrectWordCount(typed: string, target: string): number {
	const targetWords = target.split(' ');
	const typedWords = typed.split(' ');
	let count = 0;

	const completedWordCount = typedWords.length - 1;

	for (let i = 0; i < completedWordCount && i < targetWords.length; i++) {
		if (typedWords[i] === targetWords[i]) count++;
	}

	return count;
}

export function getCorrectCharCount(typed: string, target: string): number {
	let count = 0;
	for (let i = 0; i < typed.length && i < target.length; i++) {
		if (typed[i] === target[i]) count++;
	}
	return count;
}

export function calculateWPM(correctWordCount: number, elapsedSeconds: number): number {
	if (elapsedSeconds < 1) return 0;
	return Math.round((correctWordCount / elapsedSeconds) * 60);
}

export function calculateAccuracy(correctChars: number, totalTyped: number): number {
	if (totalTyped === 0) return 0;
	return Math.round((correctChars / totalTyped) * 1000) / 1000;
}
