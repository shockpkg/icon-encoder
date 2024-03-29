import {join as pathJoin} from 'node:path';

export const specFixturesPath = pathJoin('spec', 'fixtures');
export const specEncodesPath = pathJoin('spec', 'encodes');
export const specIconsPng = [
	'alphagradientcolor',
	'alphagradientgrey',
	'circlecolor',
	'opaquecolor',
	'spheregrey',
	'squarecolor'
];

export function fixtureFile(...path: string[]) {
	return pathJoin(specFixturesPath, ...path);
}

export function encodeFile(...path: string[]) {
	return pathJoin(specEncodesPath, ...path);
}

export function specIconFilePng(name: string, size: number) {
	return fixtureFile(name, `${size}x${size}.png`);
}

export function* genPngFiles() {
	const sizes = [1024, 512, 256, 128, 64, 48, 32, 16];

	for (const name of specIconsPng) {
		for (const size of sizes) {
			yield {
				name,
				size
			};
		}
	}
}
