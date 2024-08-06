import {describe, it} from 'node:test';
import {copyFile, mkdir, readFile, rm, writeFile} from 'node:fs/promises';
import {dirname} from 'node:path';

import {
	specIconsPng,
	specIconFilePng,
	encodeFile,
	fixtureFile
} from '../util.spec';

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

void describe('icon/icns', () => {
	void describe('IconIcns', () => {
		for (const {name, version, sizes} of genTests()) {
			void describe(name, () => {
				for (const toc of [false, true]) {
					const suffix = toc ? '-toc' : '';
					void it(`${version}-all${suffix}`, async () => {
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
							// eslint-disable-next-line no-await-in-loop
							await icns.addFromPng(png, types);
						}
						const data = Buffer.from(icns.encode());
						await mkdir(dirname(dest), {recursive: true});
						await writeFile(dest, data);
					});
				}

				for (const raw of [false, true]) {
					for (const [sizeName, size, types] of sizes) {
						const suffix = raw ? '-raw' : '-enc';
						void it(`${version}-${sizeName}${suffix}`, async () => {
							const dest = encodeFile(
								'icns',
								name,
								`${version}-${sizeName}${suffix}.icns`
							);
							const icns = new IconIcns();
							const png = await readFile(
								specIconFilePng(name, size)
							);
							await icns.addFromPng(png, types, raw);
							const data = Buffer.from(icns.encode());
							await mkdir(dirname(dest), {recursive: true});
							await writeFile(dest, data);
						});
					}
				}
			});
		}

		void describe('darkmode', () => {
			void it('alphas', async () => {
				const icns = new IconIcns();
				icns.toc = true;
				for (const [, size, types] of sizesCurrent) {
					// eslint-disable-next-line no-await-in-loop
					const png = await readFile(
						specIconFilePng('alphagradientcolor', size)
					);
					// eslint-disable-next-line no-await-in-loop
					await icns.addFromPng(png, types);
				}

				{
					const dark = new IconIcns();
					dark.toc = true;
					for (const [, size, types] of sizesCurrent) {
						// eslint-disable-next-line no-await-in-loop
						const png = await readFile(
							specIconFilePng('alphagradientgrey', size)
						);
						// eslint-disable-next-line no-await-in-loop
						await dark.addFromPng(png, types);
					}
					icns.addDarkIcns(dark.encode());
				}

				const data = icns.encode();

				const base = ['icns', 'darkmode', 'test.app'];
				const cnts = [...base, 'Contents'];
				const app = encodeFile(...base);
				const bin = encodeFile(...cnts, 'MacOS', 'test');
				const icon = encodeFile(...cnts, 'Resources', 'test.icns');
				const plist = encodeFile(...cnts, 'Info.plist');

				await rm(app, {recursive: true, force: true});

				await mkdir(dirname(bin), {recursive: true});
				await copyFile(fixtureFile('darkmode', 'test'), bin);

				await mkdir(dirname(icon), {recursive: true});
				await writeFile(icon, data);

				await copyFile(fixtureFile('darkmode', 'Info.plist'), plist);
			});
		});
	});
});
