import {PNG} from 'pngjs';

import {IImageData} from './types';
import {concatUint8Arrays, pngRepack} from './util';

/**
 * Icon object.
 */
export abstract class Icon {
	/**
	 * Icon constructor.
	 */
	constructor() {}

	/**
	 * Decode PNG data to RGBA image.
	 *
	 * @param data PNG data.
	 * @returns Image data.
	 */
	protected async _decodePngToRgba(data: Readonly<Uint8Array>) {
		const png = new PNG();
		await new Promise((resolve, reject) => {
			png.parse(
				Buffer.from(data.buffer, data.byteOffset, data.byteLength),
				err => {
					if (err) {
						reject(err);
						return;
					}
					resolve(png);
				}
			);
		});
		const {width, height, data: d} = png;
		return {
			width,
			height,
			data: new Uint8Array(d.buffer, d.byteOffset, d.byteLength)
		} as IImageData;
	}

	/**
	 * Encode RGBA image to PNG data.
	 *
	 * @param imageData Image data.
	 * @param srgb SRGB mode.
	 * @returns PNG data.
	 */
	protected async _encodeRgbaToPng(
		imageData: Readonly<IImageData>,
		srgb: number | null = null
	) {
		const {width, height, data} = imageData;
		const png = new PNG({
			width,
			height,
			deflateLevel: 9,
			deflateStrategy: 1,
			deflateChunkSize: 32 * 1024
		});
		png.data = Buffer.from(data.buffer, data.byteOffset, data.byteLength);
		const packed: Uint8Array[] = [];
		await new Promise((resolve, reject) => {
			png.on('data', (d: Buffer) => {
				packed.push(d);
			});
			png.on('error', reject);
			png.on('end', resolve);
			png.pack();
		});
		return pngRepack(concatUint8Arrays(packed), srgb);
	}

	/**
	 * Encode icon.
	 *
	 * @returns Encoded icon.
	 */
	public abstract encode(): Uint8Array;
}
