import {IImageData} from '../types.ts';
import {Icon} from '../icon.ts';
import {concatUint8Arrays, packBitsIcns} from '../util.ts';

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

const typeArgb = ['ic04', 'ic05'];

const typeIcon24Bit = ['is32', 'il32', 'ih32', 'it32'];

const typeMask8Bit = ['s8mk', 'l8mk', 'h8mk', 't8mk'];

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
	readonly data: Readonly<Uint8Array>;
}

/**
 * IconIcns object.
 */
export class IconIcns extends Icon {
	/**
	 * Option to include TOC tag (table of contents) in encode.
	 */
	public toc = false;

	/**
	 * List of icon entries.
	 */
	public entries: IIconIcnsEntry[] = [];

	/**
	 * Types that are ARGB.
	 */
	protected _typeArgb = new Set(typeArgb);

	/**
	 * Types that are PNG.
	 */
	protected _typePng = new Set(typePng);

	/**
	 * Types that are icon 24-bit.
	 */
	protected _typeIcon24Bit = new Set(typeIcon24Bit);

	/**
	 * Types that are mask 8-bit.
	 */
	protected _typeMask8Bit = new Set(typeMask8Bit);

	/**
	 * IconIcns constructor.
	 */
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
	public async addFromPng(
		data: Readonly<Uint8Array>,
		types: readonly string[],
		raw = false
	) {
		if (!raw) {
			await this.addFromRgba(await this._decodePngToRgba(data), types);
			return;
		}
		let rgba: IImageData | null = null;
		for (const type of types) {
			if (this._typePng.has(type)) {
				this.entries.push({
					type,
					data: new Uint8Array(data)
				});
				continue;
			}
			// eslint-disable-next-line no-await-in-loop
			rgba ||= await this._decodePngToRgba(data);
			// eslint-disable-next-line no-await-in-loop
			await this.addFromRgba(rgba, [type]);
		}
	}

	/**
	 * Add an icon from RGBA image data.
	 *
	 * @param imageData RGBA image data.
	 * @param types Types to encode as.
	 */
	public async addFromRgba(
		imageData: Readonly<IImageData>,
		types: readonly string[]
	) {
		for (const type of types) {
			// eslint-disable-next-line no-await-in-loop
			await this._addFromRgbaType(imageData, type);
		}
	}

	/**
	 * Add raw data chunk.
	 *
	 * @param data Chunk data.
	 * @param type Chunk tag.
	 */
	public addRaw(data: Readonly<Uint8Array>, type: string) {
		this.entries.push({
			type,
			data: new Uint8Array(data)
		});
	}

	/**
	 * Add dark mode icns.
	 *
	 * @param data Full encoded icns data.
	 */
	public addDarkIcns(data: Readonly<Uint8Array>) {
		const {length} = data;
		if (
			length < 8 ||
			data[0] !== 105 ||
			data[1] !== 99 ||
			data[2] !== 110 ||
			data[3] !== 115 ||
			new DataView(
				data.buffer,
				data.byteOffset,
				data.byteLength
			).getUint32(4) !== length
		) {
			throw new Error('Invalid icns header data');
		}
		const body = new Uint8Array(length - 8);
		body.set(data.subarray(8));
		this.entries.push({
			type: '\xFD\xD9\x2F\xA8',
			data: body
		});
	}

	/**
	 * Encode icon.
	 *
	 * @returns Encoded icon.
	 */
	public encode() {
		const {toc} = this;
		const headName = new Uint8Array([105, 99, 110, 115]);
		const headSize = new Uint8Array(4);
		let sized = 8;
		let tocSized = 8;
		const tocs = toc
			? [new Uint8Array([84, 79, 67, 32]), new Uint8Array(4)]
			: null;
		const imgs = [];
		for (const {type, data} of this.entries) {
			const imgName = new Uint8Array(4);
			for (let i = 0; i < 4; i++) {
				// eslint-disable-next-line unicorn/prefer-code-point
				imgName[i] = type.charCodeAt(i) || 0;
			}
			const imgSize = new Uint8Array(4);
			const imgSized = data.length + 8;
			new DataView(
				imgSize.buffer,
				imgSize.byteOffset,
				imgSize.byteLength
			).setUint32(0, imgSized, false);
			if (tocs) {
				tocs.push(imgName, imgSize);
				tocSized += 8;
				sized += 8;
			}
			imgs.push(imgName, imgSize, data);
			sized += imgSized;
		}
		if (tocs) {
			const [, tocSize] = tocs;
			new DataView(
				tocSize.buffer,
				tocSize.byteOffset,
				tocSize.byteLength
			).setUint32(0, tocSized, false);
			sized += 8;
		}
		new DataView(
			headSize.buffer,
			headSize.byteOffset,
			headSize.byteLength
		).setUint32(0, sized, false);
		return concatUint8Arrays([
			headName,
			headSize,
			...(tocs || []),
			...imgs
		]);
	}

	/**
	 * Add an icon from RGBA image data, individual type.
	 *
	 * @param imageData RGBA image data.
	 * @param type Type to encode as.
	 */
	protected async _addFromRgbaType(
		imageData: Readonly<IImageData>,
		type: string
	) {
		if (this._typePng.has(type)) {
			this.entries.push({
				type,
				data: await this._encodeRgbaToTypePng(imageData, type)
			});
			return;
		}
		if (this._typeArgb.has(type)) {
			this.entries.push({
				type,
				data: this._encodeRgbaToTypeArgb(imageData, type)
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
	 * Encode RGBA image data to PNG.
	 *
	 * @param imageData RGBA image data.
	 * @param _type Icon type.
	 * @returns Encoded data.
	 */
	protected async _encodeRgbaToTypePng(
		imageData: Readonly<IImageData>,
		_type: string
	) {
		return this._encodeRgbaToPng(imageData, 0);
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
			new Uint8Array([65, 82, 71, 66])
		);
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
			type === 'it32' ? new Uint8Array(4) : null
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
		header: Readonly<Uint8Array> | null = null
	) {
		const pieces: Uint8Array[] = header ? [header] : [];
		if (alpha) {
			// A:
			pieces.push(
				this._encodePackBitsIcns(this._encodeRgbaChannel(imageData, 3))
			);
		}
		// RGB:
		pieces.push(
			this._encodePackBitsIcns(this._encodeRgbaChannel(imageData, 0)),
			this._encodePackBitsIcns(this._encodeRgbaChannel(imageData, 1)),
			this._encodePackBitsIcns(this._encodeRgbaChannel(imageData, 2))
		);
		return concatUint8Arrays(pieces);
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
		const encoded = new Uint8Array(size / 4);
		for (let i = index, j = 0; i < size; i += 4) {
			encoded[j++] = data[i];
		}
		return encoded;
	}

	/**
	 * Encode data using PackBits ICNS compression.
	 *
	 * @param data Data to be compressed.
	 * @returns Compressed data.
	 */
	protected _encodePackBitsIcns(data: Readonly<Uint8Array>) {
		return packBitsIcns(data);
	}
}
