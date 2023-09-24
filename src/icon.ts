import UPNG from 'upng-js';

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
	protected _decodePngToRgba(data: Readonly<Buffer>) {
		const image = UPNG.decode(data);
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
		return Buffer.from(
			(
				UPNG.encode as (
					imgs: ArrayBuffer[],
					w: number,
					h: number,
					cnum: number,
					dels?: number[],
					forbidPlte?: boolean
				) => ArrayBuffer
			)(
				[imageData.data.buffer],
				imageData.width,
				imageData.height,
				0,
				[],
				true
			)
		);
	}

	/**
	 * Encode icon.
	 *
	 * @returns Encoded icon.
	 */
	public abstract encode(): Uint8Array;
}
