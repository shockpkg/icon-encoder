import {describe, it} from 'node:test';
import {strictEqual} from 'node:assert';
import {readFile} from 'node:fs/promises';

import {pngIhdr} from './util';
import {genPngFiles, specIconFilePng} from './util.spec';

void describe('util', () => {
	void describe('pngIhdr', () => {
		for (const {name, size} of genPngFiles()) {
			// eslint-disable-next-line no-loop-func
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
