import {mkdir, readFile, writeFile} from 'fs/promises';
import {dirname} from 'path';

import {specIconsPng, specIconFilePng, encodeFile} from '../util.spec';

import {IconIcns} from './icns';

// NOTE:
// The types ic04 and ic05 may not display individually in Finder and Preview.
// They will display fine in a collection of icons however.
// Reason is unclear but it often happens with icons from official tools.
const sizesCurrent: [string, number, string[]][] = [
	['32x32@2x', 32 * 2, ['ic12']],
	['128x128', 128, ['ic07']],
	['128x128@2x', 128 * 2, ['ic13']],
	['256x256', 256, ['ic08']],
	['16x16', 16, ['ic04']],
	['256x256@2x', 256 * 2, ['ic14']],
	['512x512', 512, ['ic09']],
	['32x32', 32, ['ic05']],
	['512x512@2x', 512 * 2, ['ic10']],
	['16x16@2x', 16 * 2, ['ic11']]
];

const sizesLegacy: [string, number, string[]][] = [
	['16', 16, ['is32', 's8mk']],
	['32', 32, ['il32', 'l8mk']],
	['48', 48, ['ih32', 'h8mk']],
	['128', 128, ['it32', 't8mk']]
];

function* genTests() {
	for (const name of specIconsPng) {
		yield {
			name,
			version: 'current',
			sizes: sizesCurrent
		};
		yield {
			name,
			version: 'legacy',
			sizes: sizesLegacy
		};
	}
}

describe('icon/icns', () => {
	describe('IconIcns', () => {
		for (const {name, version, sizes} of genTests()) {
			// eslint-disable-next-line no-loop-func
			describe(name, () => {
				for (const toc of [false, true]) {
					const suffix = toc ? '-toc' : '';
					it(`${version}-all${suffix}`, async () => {
						const dest = encodeFile(
							'icns',
							name,
							`${version}-all${suffix}.icns`
						);
						const icns = new IconIcns();
						icns.toc = toc;
						for (const [, size, types] of sizes) {
							// eslint-disable-next-line no-await-in-loop
							const png = await readFile(
								specIconFilePng(name, size)
							);
							icns.addFromPng(png, types);
						}
						const data = icns.encode();
						await mkdir(dirname(dest), {recursive: true});
						await writeFile(dest, data);
					});
				}

				for (const raw of [false, true]) {
					for (const [sizeName, size, types] of sizes) {
						const suffix = raw ? 'raw' : 'enc';
						it(`${version}-${sizeName}-${suffix}`, async () => {
							const dest = encodeFile(
								'icns',
								name,
								`${version}-${sizeName}-${suffix}.icns`
							);
							const icns = new IconIcns();
							const png = await readFile(
								specIconFilePng(name, size)
							);
							icns.addFromPng(png, types, raw);
							const data = icns.encode();
							await mkdir(dirname(dest), {recursive: true});
							await writeFile(dest, data);
						});
					}
				}
			});
		}
	});
});
