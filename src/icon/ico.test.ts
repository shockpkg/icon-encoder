import {describe, it} from 'node:test';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {dirname} from 'node:path';

import {specIconsPng, specIconFilePng, encodeFile} from '../util.spec';

import {IconIco} from './ico';

const sizes = [256, 128, 64, 48, 32, 16];

void describe('icon/ico', () => {
	void describe('IconIco', () => {
		for (const name of specIconsPng) {
			// eslint-disable-next-line no-loop-func
			void describe(name, () => {
				void it('all', async () => {
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

				void it('all-bmp', async () => {
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

				void it('all-png', async () => {
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
					void it(`${size}`, async () => {
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
					void it(`${size}-bmp`, async () => {
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
					void it(`${size}-png`, async () => {
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
					void it(`${size}-png-raw`, async () => {
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
