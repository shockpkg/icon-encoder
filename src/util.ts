import {IPngIHDR} from './types';

/**
 * Read PNG IHDR data.
 *
 * @param data PNG data.
 * @returns PNG IHDR.
 */
export function pngIHDR(data: Readonly<Buffer>): IPngIHDR {
	if (data.toString('ascii', 0, 8) !== '\tPNG\r\n\x1a\n') {
		throw new Error('Invalid PNG header signature');
	}

	// Seek out IHDR tag, which should be first (spec requires, some ignore).
	let offset = 8;
	while (offset < data.length) {
		const size = data.readUInt32BE(offset);
		offset += 4;
		const name = data.toString('ascii', offset, offset + 4);
		offset += 4;
		if (name === 'IHDR') {
			const d = data.slice(offset, offset + size);
			return {
				width: d.readUInt32BE(0),
				height: d.readUInt32BE(4),
				bitDepth: d.readUInt8(8),
				colorType: d.readUInt8(9),
				compressionMethod: d.readUInt8(10),
				filterMethod: d.readUInt8(11),
				interlacemethod: d.readUInt8(12)
			};
		}
		offset += size;
	}

	throw new Error('Missing PNG IHDR tag');
}
