import {IImageData} from '../types';
import {Icon} from '../icon';
import {pngIhdr} from '../util';

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
	readonly data: Readonly<Buffer>;
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
		data: Readonly<Buffer>,
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
					data: Buffer.concat([data as Buffer], data.length)
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
		const dirs: Buffer[] = [];
		const imgs: Buffer[] = [];
		let size = dir.length;
		let offset = size + entries.length * 16;
		for (const entry of entries) {
			const {data} = entry;
			const dataSize = data.length;
			const ent = this._encodeIcoDirEntry(entry, offset);
			dirs.push(ent);
			imgs.push(data as Buffer);
			offset += dataSize;
			size += dataSize + ent.length;
		}
		return Buffer.concat([dir, ...dirs, ...imgs], size);
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
		const encoded = Buffer.alloc(6);
		encoded.writeUInt16LE(0, 0);
		encoded.writeUInt16LE(1, 2);
		encoded.writeUInt16LE(count, 4);
		return encoded;
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
		const encoded = Buffer.alloc(16);
		encoded.writeUInt8(width >= 256 ? 0 : width, 0);
		encoded.writeUInt8(height >= 256 ? 0 : height, 1);
		encoded.writeUInt8(0, 2);
		encoded.writeUInt8(0, 3);
		encoded.writeUInt16LE(1, 4);
		encoded.writeUInt16LE(32, 6);
		encoded.writeUInt32LE(data.length, 8);
		encoded.writeUInt32LE(offset, 12);
		return encoded;
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
		const encoded = Buffer.alloc(headerSize + bodySize);

		// Structure: BITMAPINFOHEADER.
		// Height is doubled for alpha channel.
		encoded.writeUInt32LE(40, 0);
		encoded.writeInt32LE(width, 4);
		encoded.writeInt32LE(height * 2, 8);
		encoded.writeUInt16LE(1, 12);
		encoded.writeUInt16LE(32, 14);
		encoded.writeUInt32LE(0, 16);
		encoded.writeUInt32LE(bodySize, 20);
		encoded.writeInt32LE(3780, 24);
		encoded.writeInt32LE(3780, 28);
		encoded.writeUInt32LE(0, 32);
		encoded.writeUInt32LE(0, 36);

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
				encoded.writeUInt8(b, imgOffset + pos++);
				encoded.writeUInt8(g, imgOffset + pos++);
				encoded.writeUInt8(r, imgOffset + pos++);
				encoded.writeUInt8(a, imgOffset + pos);

				// Write mask bits after image data.
				// eslint-disable-next-line no-bitwise
				bits = (bits << 1) | (data[pos] === 0 ? 1 : 0);
				if (++bitc === 8) {
					encoded.writeUInt8(bits, maskOff + maskI++);
					bits = 0;
					bitc = 0;
				}
			}

			// Align mask row to 4 bytes.
			while (maskI % 4) {
				// eslint-disable-next-line no-bitwise
				bits <<= 1;
				if (++bitc === 8) {
					encoded.writeUInt8(bits, maskOff + maskI++);
					bits = 0;
					bitc = 0;
				}
			}
		}
		return encoded;
	}
}
