import fse from 'fs-extra';

import {
	specIconsPng,
	specIconFilePng,
	encodeFile
} from '../util.spec';

import {
	IconIcns
} from './icns';

// NOTE:
// The types ic04 and ic05 may not display individually in Finder and Preview.
// They will display fine in a collection of icons however.
// Reason is unclear but it often happens with icons from official tools.
const sizesNew: [string, number, string[]][] = [
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

const sizesOld: [string, number, string[]][] = [
	['16', 16, ['is32', 's8mk']],
	['32', 32, ['il32', 'l8mk']],
	['48', 48, ['ih32', 'h8mk']],
	['128', 128, ['it32', 't8mk']]
];

function * genTests() {
	for (const name of specIconsPng) {
		yield {
			name,
			version: 'new',
			sizes: sizesNew
		};
		yield {
			name,
			version: 'old',
			sizes: sizesOld
		};
	}
}

describe('icons/icns', () => {
	describe('IconIcns', () => {
		for (const {name, version, sizes} of genTests()) {
			describe(name, () => {
				it(`${version}-all`, async () => {
					const dest = encodeFile(
						'icns',
						name,
						`${version}-all.icns`
					);
					const icns = new IconIcns();
					for (const [, size, types] of sizes) {
						// eslint-disable-next-line no-await-in-loop
						const png = await fse.readFile(
							specIconFilePng(name, size)
						);
						icns.addFromPng(png, types);
					}
					const data = icns.encode();
					await fse.outputFile(dest, data);
				});

				for (const [sizeName, size, types] of sizes) {
					it(`${version}-${sizeName}`, async () => {
						const dest = encodeFile(
							'icns',
							name,
							`${version}-${sizeName}.icns`
						);
						const icns = new IconIcns();
						const png = await fse.readFile(
							specIconFilePng(name, size)
						);
						icns.addFromPng(png, types);
						const data = icns.encode();
						await fse.outputFile(dest, data);
					});
				}
			});
		}
	});
});
