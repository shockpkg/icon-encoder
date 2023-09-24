import {IImageData} from '../types';
import {Icon} from '../icon';
import {concatUint8Arrays, pngIhdr} from '../util';

/**
 * Icon entry.
 */
export interface IIconIcoEntry {
	//
	/**
	 * Icon width.
	 */
	readonly width: number;

	/**
	 * Icon height.
	 */
	readonly height: number;

	/**
	 * Icon data.
	 */
	readonly data: Readonly<Uint8Array>;
}

/**
 * IconIco object.
 */
export class IconIco extends Icon {
	/**
	 * List of icon entries.
	 */
	public entries: IIconIcoEntry[] = [];

	/**
	 * IconIco constructor.
	 */
	constructor() {
		super();
	}

	/**
	 * Add an icon from PNG data.
	 *
	 * @param data PNG data.
	 * @param png Encode entry as PNG.
	 * @param raw Use raw PNG data without re-encoding, if using PNG format.
	 */
	public addFromPng(
		data: Readonly<Uint8Array>,
		png: boolean | null = null,
		raw = false
	) {
		if (raw && png !== false) {
			const ihdr = pngIhdr(data);
			const isPng =
				png || !this.sizeRequiresLegacyBitmap(ihdr.width, ihdr.height);
			if (isPng) {
				this.entries.push({
					width: ihdr.width,
					height: ihdr.height,
					data: new Uint8Array(data)
				});
				return;
			}
		}
		this.addFromRgba(this._decodePngToRgba(data), png);
	}

	/**
	 * Add an icon from RGBA image data.
	 *
	 * @param imageData RGBA image data.
	 * @param png Encode entry as PNG.
	 */
	public addFromRgba(
		imageData: Readonly<IImageData>,
		png: boolean | null = null
	) {
		// Use PNG if forced or automatic and size large enough.
		const isPng =
			png ||
			(png === null &&
				!this.sizeRequiresLegacyBitmap(
					imageData.width,
					imageData.height
				));

		this.entries.push({
			width: imageData.width,
			height: imageData.height,
			data: isPng
				? this._encodeRgbaToPng(imageData)
				: this._encodeRgbaToBmp(imageData)
		});
	}

	/**
	 * Encode icon.
	 *
	 * @returns Encoded icon.
	 */
	public encode() {
		const {entries} = this;
		const dir = this._encodeIcoDir(entries.length);
		const dirs = [];
		const imgs = [];
		let offset = dir.length + entries.length * 16;
		for (const entry of entries) {
			const {data} = entry;
			const dataSize = data.length;
			const ent = this._encodeIcoDirEntry(entry, offset);
			dirs.push(ent);
			imgs.push(data);
			offset += dataSize;
		}
		return concatUint8Arrays([dir, ...dirs, ...imgs]);
	}

	/**
	 * Check if height requires legacy bitmap for compatiblity.
	 *
	 * @param width Image width.
	 * @param height Image height.
	 * @returns Returns true if requires legacy bitmap.
	 */
	public sizeRequiresLegacyBitmap(width: number, height: number) {
		return width < 64 || height < 64;
	}

	/**
	 * Encode icon directory header.
	 *
	 * @param count Entry count.
	 * @returns Encoded header.
	 */
	protected _encodeIcoDir(count: number) {
		// Structure: ICONDIR.
		const r = new Uint8Array(6);
		const encoded = new DataView(r.buffer, r.byteOffset, r.byteLength);
		encoded.setUint16(0, 0, true);
		encoded.setUint16(2, 1, true);
		encoded.setUint16(4, count, true);
		return r;
	}

	/**
	 * Encode icon directory entry.
	 *
	 * @param entry Icon entry.
	 * @param offset File offset.
	 * @returns Encoded entry.
	 */
	protected _encodeIcoDirEntry(
		entry: Readonly<IIconIcoEntry>,
		offset: number
	) {
		// Structure: ICONDIRENTRY.
		const {width, height, data} = entry;
		const r = new Uint8Array(16);
		const encoded = new DataView(r.buffer, r.byteOffset, r.byteLength);
		encoded.setUint8(0, width >= 256 ? 0 : width);
		encoded.setUint8(1, height >= 256 ? 0 : height);
		encoded.setUint8(2, 0);
		encoded.setUint8(3, 0);
		encoded.setUint16(4, 1, true);
		encoded.setUint16(6, 32, true);
		encoded.setUint32(8, data.length, true);
		encoded.setUint32(12, offset, true);
		return r;
	}

	/**
	 * Encode RGBA image to BMP data.
	 *
	 * @param imageData Image data.
	 * @returns BMP data.
	 */
	protected _encodeRgbaToBmp(imageData: Readonly<IImageData>) {
		const {width, height, data} = imageData;
		const dataSize = data.length;

		// Calculate the piece sizes.
		const headerSize = 40;
		const maskSize =
			((width + (width % 32 ? 32 - (width % 32) : 0)) * height) / 8;
		const bodySize = dataSize + maskSize;

		// Calculate the piece offsets.
		const imgOffset = headerSize;
		const maskOff = imgOffset + dataSize;
		const r = new Uint8Array(headerSize + bodySize);
		const encoded = new DataView(r.buffer, r.byteOffset, r.byteLength);

		// Structure: BITMAPINFOHEADER.
		// Height is doubled for alpha channel.
		encoded.setUint32(0, 40, true);
		encoded.setInt32(4, width, true);
		encoded.setInt32(8, height * 2, true);
		encoded.setUint16(12, 1, true);
		encoded.setUint16(14, 32, true);
		encoded.setUint32(16, 0, true);
		encoded.setUint32(20, bodySize, true);
		encoded.setInt32(24, 3780, true);
		encoded.setInt32(28, 3780, true);
		encoded.setUint32(32, 0, true);
		encoded.setUint32(36, 0, true);

		// Write image and mask, reverse the row order.
		const cols = width * 4;
		const rows = height * cols;
		const end = rows - cols;
		let maskI = 0;
		for (let row = 0; row < rows; row += cols) {
			let bits = 0;
			let bitc = 0;
			for (let col = 0; col < cols; col += 4) {
				// Write RGBA as BGRA.
				let pos = row + col;
				const r = data[pos++];
				const g = data[pos++];
				const b = data[pos++];
				const a = data[pos];
				pos = end - row + col;
				encoded.setUint8(imgOffset + pos++, b);
				encoded.setUint8(imgOffset + pos++, g);
				encoded.setUint8(imgOffset + pos++, r);
				encoded.setUint8(imgOffset + pos, a);

				// Write mask bits after image data.
				// eslint-disable-next-line no-bitwise
				bits = (bits << 1) | (data[pos] === 0 ? 1 : 0);
				if (++bitc === 8) {
					encoded.setUint8(maskOff + maskI++, bits);
					bits = 0;
					bitc = 0;
				}
			}

			// Align mask row to 4 bytes.
			while (maskI % 4) {
				// eslint-disable-next-line no-bitwise
				bits <<= 1;
				if (++bitc === 8) {
					encoded.setUint8(maskOff + maskI++, bits);
					bits = 0;
					bitc = 0;
				}
			}
		}
		return r;
	}
}
