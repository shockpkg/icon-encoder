import {describe, it} from 'node:test';
import {strictEqual} from 'node:assert';
import {readFile} from 'node:fs/promises';

import {pngIhdr} from './util.ts';
import {genPngFiles, specIconFilePng} from './util.spec.ts';

void describe('util', () => {
	void describe('pngIhdr', () => {
		for (const {name, size} of genPngFiles()) {
			void it(`${name}: ${size}`, async () => {
				const info = pngIhdr(
					new Uint8Array(await readFile(specIconFilePng(name, size)))
				);

				strictEqual(info.width, size);
				strictEqual(info.height, size);
			});
		}
	});
});
