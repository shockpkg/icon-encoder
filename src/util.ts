import {PNG} from 'pngjs';

import {IImageData, IPngIhdr} from './types.ts';

const PNG_MAGIC = [137, 80, 78, 71, 13, 10, 26, 10];
const PNG_MAGIC_SIZE = 8;
const IHDR = 0x49484452;
const SRGB = 0x73524742;
const IDAT = 0x49444154;
const IEND = 0x49454e44;

const CRC32_TABLE: number[] = [];

/**
 * Hash data with CRC32.
 *
 * @param data Data to be hashed.
 * @returns Data hash.
 */
export function crc32(data: Readonly<Uint8Array>) {
	if (!CRC32_TABLE.length) {
		for (let i = 256; i--; ) {
			let c = i;
			for (let j = 0; j < 8; j++) {
				// eslint-disable-next-line no-bitwise
				c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
			}
			CRC32_TABLE[i] = c;
		}
	}
	let r = -1;
	const l = data.length;
	for (let i = 0; i < l; ) {
		// eslint-disable-next-line no-bitwise
		r = CRC32_TABLE[(r ^ data[i++]) & 0xff] ^ (r >>> 8);
	}
	// eslint-disable-next-line no-bitwise
	return r ^ -1;
}

/**
 * Concatenate multiple Uint8Array together.
 *
 * @param arrays Uint8Array arrays.
 * @returns Uint8Array array.
 */
export function concatUint8Arrays(arrays: readonly Readonly<Uint8Array>[]) {
	let l = 0;
	for (const a of arrays) {
		l += a.length;
	}
	const r = new Uint8Array(l);
	let i = 0;
	for (const a of arrays) {
		r.set(a, i);
		i += a.length;
	}
	return r;
}

/**
 * Decode PNG data to RGBA image.
 *
 * @param data PNG data.
 * @returns Image data.
 */
export async function decodePngToRgba(data: Readonly<Uint8Array>) {
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
export async function encodeRgbaToPng(
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
 * Read PNG file tags.
 *
 * @param data PNG data.
 * @yields PNG tags.
 */
export function* pngReader(data: Readonly<Uint8Array>) {
	let i = 0;
	for (; i < PNG_MAGIC_SIZE; i++) {
		if (data[i] !== PNG_MAGIC[i]) {
			throw new Error('Invalid PNG header signature');
		}
	}

	const dv = new DataView(data.buffer, data.byteOffset, data.byteLength);
	while (i < data.length) {
		const size = dv.getUint32(i, false);
		i += 4;
		const tag = dv.getUint32(i, false);
		i += 4;
		const d = data.subarray(i, i + size);
		i += size;
		const crc = dv.getUint32(i, false);
		yield [tag, d, crc] as [number, Uint8Array, number];
		i += 4;
	}
}

/**
 * Encode PNG from tags.
 *
 * @param tags PNG tags and data.
 * @returns PNG data.
 */
export function pngEncode(tags: readonly [number, Readonly<Uint8Array>][]) {
	let total = PNG_MAGIC_SIZE;
	for (const [, data] of tags) {
		total += 12 + data.length;
	}
	const r = new Uint8Array(total);
	const d = new DataView(r.buffer, r.byteOffset, r.byteLength);
	r.set(PNG_MAGIC);
	let i = PNG_MAGIC_SIZE;
	for (const [tag, data] of tags) {
		const l = data.length;
		d.setUint32(i, l, false);
		i += 4;
		const f = i;
		d.setUint32(i, tag, false);
		i += 4;
		r.set(data, i);
		i += l;
		d.setUint32(i, crc32(r.subarray(f, i)), false);
		i += 4;
	}
	return r;
}

/**
 * Repack PNG tag data with a single IDAT.
 *
 * @param data PNG data.
 * @param srgb Set an SRGB value.
 * @returns PNG data.
 */
export function pngRepack(
	data: Readonly<Uint8Array>,
	srgb: number | null = null
) {
	let ihdr: Uint8Array | null = null;
	let iend: Uint8Array | null = null;
	const idats = [];
	for (const [tag, d] of pngReader(data)) {
		switch (tag) {
			case IDAT: {
				idats.push(d);
				break;
			}
			case IHDR: {
				ihdr = d;
				break;
			}
			case IEND: {
				iend = d;
				break;
			}
			default: {
				// Discard others.
			}
		}
	}
	if (!ihdr || !iend) {
		throw new Error('Invalid PNG');
	}
	const pieces: [number, Uint8Array][] = [[IHDR, ihdr]];
	if (srgb !== null) {
		pieces.push([SRGB, new Uint8Array([srgb])]);
	}
	pieces.push([IDAT, concatUint8Arrays(idats)], [IEND, iend]);
	return pngEncode(pieces);
}

/**
 * Read PNG IHDR data.
 *
 * @param data PNG data.
 * @returns PNG IHDR.
 */
export function pngIhdr(data: Readonly<Uint8Array>): IPngIhdr {
	for (const [tag, td] of pngReader(data)) {
		if (tag === IHDR) {
			const d = new DataView(td.buffer, td.byteOffset, td.byteLength);
			return {
				width: d.getUint32(0, false),
				height: d.getUint32(4, false),
				bitDepth: d.getUint8(8),
				colorType: d.getUint8(9),
				compressionMethod: d.getUint8(10),
				filterMethod: d.getUint8(11),
				interlacemethod: d.getUint8(12)
			};
		}
	}
	throw new Error('Missing PNG IHDR tag');
}

/**
 * Encode data using PackBits ICNS compression.
 *
 * @param data Data to be compressed.
 * @returns Compressed data.
 */
export function packBitsIcns(data: Readonly<Uint8Array>) {
	const chunks = [];
	const l = data.length;
	for (let i = 0; i < l; ) {
		const b = data[i];
		if (i + 2 >= l) {
			// Not enough left for anything but literal data.
			chunks.push(new Uint8Array([l - i - 1]), data.subarray(i, l));
			break;
		}
		if (b === data[i + 1] && b === data[i + 2]) {
			// 3+ bytes repeat RLE.
			i += 2;
			let c = 3;
			for (; ++i < l && b === data[i] && c < 130; c++);
			chunks.push(new Uint8Array([c + 125, b]));
		} else {
			// Literal until next 3 bytes repeat.
			let e = i + 2;
			let c = 3;
			for (let r = 1, p = data[e]; ++e < l && c < 128; c++) {
				const b = data[e];
				if (p !== b) {
					p = b;
					r = 1;
				} else if (++r > 2) {
					e -= 2;
					c -= 2;
					break;
				}
			}
			chunks.push(new Uint8Array([c - 1]), data.subarray(i, e));
			i = e;
		}
	}
	return concatUint8Arrays(chunks);
}
