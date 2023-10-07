import {IImageData} from './types';
import {decodePngToRgba, encodeRgbaToPng} from './util';

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
		return decodePngToRgba(data);
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
		return encodeRgbaToPng(imageData, srgb);
	}

	/**
	 * Encode icon.
	 *
	 * @returns Encoded icon.
	 */
	public abstract encode(): Uint8Array;
}
