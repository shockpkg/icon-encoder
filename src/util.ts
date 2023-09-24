import {IPngIhdr} from './types';

/**
 * Read PNG IHDR data.
 *
 * @param data PNG data.
 * @returns PNG IHDR.
 */
export function pngIhdr(data: Readonly<Uint8Array>): IPngIhdr {
	let i = 0;
	if (
		data[i++] !== 137 ||
		data[i++] !== 80 ||
		data[i++] !== 78 ||
		data[i++] !== 71 ||
		data[i++] !== 13 ||
		data[i++] !== 10 ||
		data[i++] !== 26 ||
		data[i++] !== 10
	) {
		throw new Error('Invalid PNG header signature');
	}

	// Seek out IHDR tag, which should be first (spec requires, some ignore).
	const dv = new DataView(data.buffer, data.byteOffset, data.byteLength);
	while (i < data.length) {
		const size = dv.getUint32(i, false);
		i += 4;
		const na = data[i++];
		const nb = data[i++];
		const nc = data[i++];
		const nd = data[i++];
		if (na === 73 && nb === 72 && nc === 68 && nd === 82) {
			const d = new DataView(dv.buffer, dv.byteOffset + i, size);
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
		i += size;
	}

	throw new Error('Missing PNG IHDR tag');
}
