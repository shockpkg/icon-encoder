import UPNG from 'upng-js';

import {IImageData} from './types';

/**
 * Icon constructor.
 */
export abstract class Icon extends Object {
	constructor() {
		super();
	}

	/**
	 * Decode PNG data to RGBA image.
	 *
	 * @param data PNG data.
	 * @returns Image data.
	 */
	protected _decodePngToRgba(data: Readonly<Buffer>) {
		const image = UPNG.decode(data as Buffer);
		return {
			width: image.width,
			height: image.height,
			data: new Uint8Array(UPNG.toRGBA8(image)[0])
		} as IImageData;
	}

	/**
	 * Encode RGBA image to PNG data.
	 *
	 * @param imageData Image data.
	 * @returns PNG data.
	 */
	protected _encodeRgbaToPng(imageData: Readonly<IImageData>) {
		return Buffer.from((UPNG as any).encode(
			[imageData.data.buffer],
			imageData.width,
			imageData.height,
			0,
			[],
			true
		) as ArrayBuffer);
	}

	/**
	 * Encode icon.
	 *
	 * @returns Encoded icon.
	 */
	public abstract encode(): Buffer;
}
