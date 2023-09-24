import {IPngIhdr} from './types';

const PNG_MAGIC = [137, 80, 78, 71, 13, 10, 26, 10];
const PNG_IDHR = 0x49484452;

/**
 * Concatenate multiple Uint8Array together.
 *
 * @param arrays Uint8Array arrays.
 * @returns Uint8Array array.
 */
export function concatUint8Arrays(arrays: Readonly<Readonly<Uint8Array>[]>) {
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
 * Read PNG file tags.
 *
 * @param data PNG data.
 * @yields PNG tags.
 */
export function* pngReader(data: Readonly<Uint8Array>) {
	let i = 0;
	for (; i < 8; i++) {
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
		yield [tag, data.subarray(i, i + size)] as [number, Uint8Array];
		i += size;
	}
}

/**
 * Read PNG IHDR data.
 *
 * @param data PNG data.
 * @returns PNG IHDR.
 */
export function pngIhdr(data: Readonly<Uint8Array>): IPngIhdr {
	for (const [tag, td] of pngReader(data)) {
		if (tag === PNG_IDHR) {
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
