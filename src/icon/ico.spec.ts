import {mkdir, readFile, writeFile} from 'fs/promises';
import {dirname} from 'path';

import {specIconsPng, specIconFilePng, encodeFile} from '../util.spec';

import {IconIco} from './ico';

const sizes = [256, 128, 64, 48, 32, 16];

describe('icon/ico', () => {
	describe('IconIco', () => {
		for (const name of specIconsPng) {
			// eslint-disable-next-line no-loop-func
			describe(name, () => {
				it('all', async () => {
					const dest = encodeFile('ico', name, 'all.ico');
					const ico = new IconIco();
					for (const size of sizes) {
						// eslint-disable-next-line no-await-in-loop
						const png = await readFile(specIconFilePng(name, size));
						ico.addFromPng(png);
					}
					const data = ico.encode();
					await mkdir(dirname(dest), {recursive: true});
					await writeFile(dest, data);
				});

				it('all-bmp', async () => {
					const dest = encodeFile('ico', name, 'all-bmp.ico');
					const ico = new IconIco();
					for (const size of sizes) {
						// eslint-disable-next-line no-await-in-loop
						const png = await readFile(specIconFilePng(name, size));
						ico.addFromPng(png, false);
					}
					const data = ico.encode();
					await mkdir(dirname(dest), {recursive: true});
					await writeFile(dest, data);
				});

				it('all-png', async () => {
					const dest = encodeFile('ico', name, 'all-png.ico');
					const ico = new IconIco();
					for (const size of sizes) {
						// eslint-disable-next-line no-await-in-loop
						const png = await readFile(specIconFilePng(name, size));
						ico.addFromPng(png, true);
					}
					const data = ico.encode();
					await mkdir(dirname(dest), {recursive: true});
					await writeFile(dest, data);
				});

				for (const size of sizes) {
					it(`${size}`, async () => {
						const dest = encodeFile('ico', name, `${size}.ico`);
						const ico = new IconIco();
						const png = await readFile(specIconFilePng(name, size));
						ico.addFromPng(png);
						const data = ico.encode();
						await mkdir(dirname(dest), {recursive: true});
						await writeFile(dest, data);
					});
				}

				for (const size of sizes) {
					it(`${size}-bmp`, async () => {
						const dest = encodeFile('ico', name, `${size}-bmp.ico`);
						const ico = new IconIco();
						const png = await readFile(specIconFilePng(name, size));
						ico.addFromPng(png, false);
						const data = ico.encode();
						await mkdir(dirname(dest), {recursive: true});
						await writeFile(dest, data);
					});
				}

				for (const size of sizes) {
					it(`${size}-png`, async () => {
						const dest = encodeFile('ico', name, `${size}-png.ico`);
						const ico = new IconIco();
						const png = await readFile(specIconFilePng(name, size));
						ico.addFromPng(png, true);
						const data = ico.encode();
						await mkdir(dirname(dest), {recursive: true});
						await writeFile(dest, data);
					});
				}

				for (const size of sizes) {
					it(`${size}-png-raw`, async () => {
						const dest = encodeFile(
							'ico',
							name,
							`${size}-png-raw.ico`
						);
						const ico = new IconIco();
						const png = await readFile(specIconFilePng(name, size));
						ico.addFromPng(png, true, true);
						const data = ico.encode();
						await mkdir(dirname(dest), {recursive: true});
						await writeFile(dest, data);
					});
				}
			});
		}
	});
});
