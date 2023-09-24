import {PNG} from 'pngjs';

import {IImageData} from './types';

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
	protected _decodePngToRgba(data: Readonly<Uint8Array>) {
		const {
			width,
			height,
			data: d
		} = PNG.sync.read(
			Buffer.from(data.buffer, data.byteOffset, data.byteLength)
		);
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
	 * @returns PNG data.
	 */
	protected _encodeRgbaToPng(imageData: Readonly<IImageData>) {
		const {width, height, data} = imageData;
		const png = new PNG({width, height});
		png.data = Buffer.from(data.buffer, data.byteOffset, data.byteLength);
		const d = PNG.sync.write(png, {
			deflateLevel: 9,
			deflateStrategy: 1,
			deflateChunkSize: 32 * 1024
		});
		return new Uint8Array(d.buffer, d.byteOffset, d.byteLength);
	}

	/**
	 * Encode icon.
	 *
	 * @returns Encoded icon.
	 */
	public abstract encode(): Uint8Array;
}
