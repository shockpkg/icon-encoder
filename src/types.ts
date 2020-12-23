/**
 * Image data.
 */
export interface IImageData {

	/**
	 * Image width.
	 */
	width: number;

	/**
	 * Image height.
	 */
	height: number;

	/**
	 * Pixel data.
	 */
	data: Uint8Array;
}

/**
 * PNG IHDR.
 */
export interface IPngIhdr {

	/**
	 * Image width.
	 */
	width: number;

	/**
	 * Image height.
	 */
	height: number;

	/**
	 * Bit depth.
	 */
	bitDepth: number;

	/**
	 * Color type.
	 */
	colorType: number;

	/**
	 * Compression method.
	 */
	compressionMethod: number;

	/**
	 * Filter method.
	 */
	filterMethod: number;

	/**
	 * Interlace method.
	 */
	interlacemethod: number;
}
