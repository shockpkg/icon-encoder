import * as packbits from '@fiahfy/packbits';

import {IImageData} from '../types';
import {property} from '../decorators';
import {Icon} from '../icon';

// For compatability for CommonJS and ESM.
const packbitsEncode = packbits.encode || (packbits as any).default.encode;

const typeArgb = [
	'ic04',
	'ic05'
];

const typePng = [
	'icp4',
	'icp5',
	'icp6',
	'ic07',
	'ic08',
	'ic09',
	'ic10',
	'ic11',
	'ic12',
	'ic13',
	'ic14'
];

const typeIcon24Bit = [
	'is32',
	'il32',
	'ih32',
	'it32'
];

const typeMask8Bit = [
	's8mk',
	'l8mk',
	'h8mk',
	't8mk'
];

/**
 * Icon entry.
 */
export interface IIconIcnsEntry {

	/**
	 * Icon type.
	 */
	readonly type: string;

	/**
	 * Icon data.
	 */
	readonly data: Readonly<Buffer>;
}

/**
 * IconIcns constructor.
 */
export class IconIcns extends Icon {
	/**
	 * List of icon entries.
	 */
	public entries: IIconIcnsEntry[] = [];

	/**
	 * Types that are ARGB.
	 */
	@property(false)
	protected _typeArgb = new Set(typeArgb);

	/**
	 * Types that are PNG.
	 */
	@property(false)
	protected _typePng = new Set(typePng);

	/**
	 * Types that are icon 24-bit.
	 */
	@property(false)
	protected _typeIcon24Bit = new Set(typeIcon24Bit);

	/**
	 * Types that are mask 8-bit.
	 */
	@property(false)
	protected _typeMask8Bit = new Set(typeMask8Bit);

	constructor() {
		super();
	}

	/**
	 * Add an icon from PNG data.
	 *
	 * @param data PNG data.
	 * @param types Types to encode as.
	 * @param raw Use raw PNG data without re-encoding for the PNG types.
	 */
	public addFromPng(
		data: Readonly<Buffer>,
		types: readonly string[],
		raw = false
	) {
		if (!raw) {
			this.addFromRgba(this._decodePngToRgba(data), types);
			return;
		}
		let rgba: IImageData | null = null;
		for (const type of types) {
			if (this._typePng.has(type)) {
				this.entries.push({
					type,
					data: Buffer.concat([data as Buffer], data.length)
				});
				continue;
			}
			rgba ||= this._decodePngToRgba(data);
			this.addFromRgba(rgba, [type]);
		}
	}

	/**
	 * Add an icon from RGBA image data.
	 *
	 * @param imageData RGBA image data.
	 * @param types Types to encode as.
	 */
	public addFromRgba(
		imageData: Readonly<IImageData>,
		types: readonly string[]
	) {
		for (const type of types) {
			this._addFromRgbaType(imageData, type);
		}
	}

	/**
	 * Encode icon.
	 *
	 * @returns Encoded icon.
	 */
	public encode() {
		const head = Buffer.alloc(8);
		head.write('icns', 0);
		let size = 8;
		const pieces: Readonly<Buffer>[] = [head];
		for (const {type, data} of this.entries) {
			const tagType = Buffer.alloc(4);
			tagType.write(type, 0);
			const tagSize = Buffer.alloc(4);
			const tagSizeValue = data.length + 8;
			tagSize.writeUInt32BE(tagSizeValue, 0);
			pieces.push(tagType, tagSize, data);
			size += tagSizeValue;
		}
		head.writeUInt32BE(size, 4);
		return Buffer.concat(pieces as Buffer[], size);
	}

	/**
	 * Add an icon from RGBA image data, individual type.
	 *
	 * @param imageData RGBA image data.
	 * @param type Type to encode as.
	 */
	protected _addFromRgbaType(imageData: Readonly<IImageData>, type: string) {
		if (this._typeArgb.has(type)) {
			this.entries.push({
				type,
				data: this._encodeRgbaToTypeArgb(imageData, type)
			});
			return;
		}
		if (this._typePng.has(type)) {
			this.entries.push({
				type,
				data: this._encodeRgbaToTypePng(imageData, type)
			});
			return;
		}
		if (this._typeIcon24Bit.has(type)) {
			this.entries.push({
				type,
				data: this._encodeRgbaToTypeIcon24Bit(imageData, type)
			});
			return;
		}
		if (this._typeMask8Bit.has(type)) {
			this.entries.push({
				type,
				data: this._encodeRgbaToTypeMask8Bit(imageData, type)
			});
			return;
		}
		throw new Error(`Unknown type: ${type}`);
	}

	/**
	 * Encode RGBA image data to ARGB.
	 *
	 * @param imageData RGBA image data.
	 * @param _type Icon type.
	 * @returns Encoded data.
	 */
	protected _encodeRgbaToTypeArgb(
		imageData: Readonly<IImageData>,
		_type: string
	) {
		// The compressed data always has an ARGB header.
		return this._encodeRgbaToPackBits(
			imageData,
			true,
			Buffer.from('ARGB', 'ascii')
		);
	}

	/**
	 * Encode RGBA image data to PNG.
	 *
	 * @param imageData RGBA image data.
	 * @param _type Icon type.
	 * @returns Encoded data.
	 */
	protected _encodeRgbaToTypePng(
		imageData: Readonly<IImageData>,
		_type: string
	) {
		return this._encodeRgbaToPng(imageData);
	}

	/**
	 * Encode RGBA image data to icon 24-bit.
	 *
	 * @param imageData RGBA image data.
	 * @param type Icon type.
	 * @returns Encoded data.
	 */
	protected _encodeRgbaToTypeIcon24Bit(
		imageData: Readonly<IImageData>,
		type: string
	) {
		// The 'it32' type has 4 null byte header.
		return this._encodeRgbaToPackBits(
			imageData,
			false,
			type === 'it32' ? Buffer.alloc(4) : null
		);
	}

	/**
	 * Encode RGBA image data to mask 8-bit.
	 *
	 * @param imageData RGBA image data.
	 * @param _type Icon type.
	 * @returns Encoded data.
	 */
	protected _encodeRgbaToTypeMask8Bit(
		imageData: Readonly<IImageData>,
		_type: string
	) {
		return this._encodeRgbaChannel(imageData, 3);
	}

	/**
	 * Encode RGBA image data to packbits.
	 *
	 * @param imageData RGBA image data.
	 * @param alpha Incldue the alpha channel.
	 * @param header Header to prepend to the output.
	 * @returns Encoded data.
	 */
	protected _encodeRgbaToPackBits(
		imageData: Readonly<IImageData>,
		alpha: boolean,
		header: Readonly<Buffer> | null = null
	) {
		const pieces = header ? [header] : [];
		if (alpha) {
			// A:
			pieces.push(this._encodePackBitsIcns(
				this._encodeRgbaChannel(imageData, 3)
			));
		}
		// RGB:
		pieces.push(
			this._encodePackBitsIcns(
				this._encodeRgbaChannel(imageData, 0)
			),
			this._encodePackBitsIcns(
				this._encodeRgbaChannel(imageData, 1)
			),
			this._encodePackBitsIcns(
				this._encodeRgbaChannel(imageData, 2)
			)
		);
		return Buffer.concat(pieces as Buffer[]);
	}

	/**
	 * Encode channel from RGBA image data.
	 *
	 * @param imageData RGBA image data.
	 * @param index Channel index (R=0, B=1, G=2, A=3).
	 * @returns Encoded data.
	 */
	protected _encodeRgbaChannel(
		imageData: Readonly<IImageData>,
		index: 0 | 1 | 2 | 3
	) {
		const {data} = imageData;
		const size = data.length;
		const encoded = Buffer.alloc(size / 4);
		for (let i = index, j = 0; i < size; i += 4) {
			encoded.writeUInt8(data[i], j++);
		}
		return encoded;
	}

	/**
	 * Encode data using PackBits ICNS compression.
	 *
	 * @param data Data to be compressed.
	 * @returns Compressed data.
	 */
	protected _encodePackBitsIcns(data: Readonly<Buffer>) {
		return packbitsEncode(data as Buffer, {
			format: 'icns'
		});
	}
}
