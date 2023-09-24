#!/usr/bin/env node

const {readFile, writeFile} = require('node:fs/promises');

const {VERSION, IconIcns, IconIco} = require('..');

function basename(file) {
	return file.split(/[\\/]/g).pop();
}

function help(script) {
	const cmd = basename(script);
	return [
		`Usage: ${cmd} [options...] (icon.ico | icon.icns) pngs...`,
		'  -v, --version       Show the current version.',
		'  -h, --help          Show this help message.',
		'  --raw               Prefer raw png data in icon.',
		'  --png               Prefer png encoding in ico.',
		'  --bmp               Prefer bmp encoding in ico.',
		'  --toc               Include TOC entry in icns.'
	].join('\n');
}

async function createIcns(pngs, toc, raw) {
	const icon = new IconIcns();
	icon.toc = toc;
	const types = {
		'32x32@2x': 'ic12',
		'128x128': 'ic07',
		'128x128@2x': 'ic13',
		'256x256': 'ic08',
		'16x16': 'ic04',
		'256x256@2x': 'ic14',
		'512x512': 'ic09',
		'32x32': 'ic05',
		'512x512@2x': 'ic10',
		'16x16@2x': 'ic11'
	};
	const read = [];
	for (const f of pngs) {
		const [, size] = f.match(/(\d+x\d+(@2x)?)\.png$/i) || [];
		const type = types[size];
		if (!type) {
			return [`Unknown size: ${f}`, null];
		}
		read.push([f, types[size]]);
	}
	try {
		await Promise.all(read.map(async a => a.push(await readFile(a[0]))));
	} catch (err) {
		return [err.message, null];
	}
	for (const [file, type, data] of read) {
		try {
			// eslint-disable-next-line no-await-in-loop
			await icon.addFromPng(data, [type], raw);
		} catch (err) {
			return [`${file}: ${err.message}`, null];
		}
	}
	return [null, icon.encode()];
}

async function createIco(pngs, png, raw) {
	const icon = new IconIco();
	let read;
	try {
		read = await Promise.all(pngs.map(async f => [f, await readFile(f)]));
	} catch (err) {
		return [err.message, null];
	}
	for (const [file, data] of read) {
		try {
			// eslint-disable-next-line no-await-in-loop
			await icon.addFromPng(data, png, raw);
		} catch (err) {
			return [`${file}: ${err.message}`, null];
		}
	}
	return [null, icon.encode()];
}

function argparse(args) {
	const switches = {
		'--': false,
		'-h': false,
		'--help': false,
		'-v': false,
		'--version': false,
		'--raw': false,
		'--png': false,
		'--bmp': false,
		'--toc': false
	};
	let error = null;
	const positional = [];
	for (const a of args) {
		if (!switches['--'] && a.startsWith('-')) {
			if (a in switches) {
				switches[a] = true;
				continue;
			}
			error = `Unknown option: ${a}`;
			break;
		}
		positional.push(a);
	}
	return [error, {switches, positional}];
}

async function main(argv) {
	const [, script, ...args] = argv;
	if (!args.length) {
		console.error(help(script));
		return 1;
	}
	const [argparseError, {switches, positional}] = argparse(args);
	if (argparseError) {
		console.error(argparseError);
		return 1;
	}
	if (switches['-v'] || switches['--version']) {
		console.log(VERSION);
		return 0;
	}
	if (switches['-h'] || switches['--help']) {
		console.log(help(script));
		return 0;
	}

	const [icon, ...pngs] = positional;
	const isIcns = /\.icns$/i.test(icon);
	const isIco = /\.ico$/i.test(icon);
	if (!isIcns && !isIco) {
		console.error(help(script));
		return 1;
	}

	const [err, data] = await (isIco
		? createIco(
				pngs,
				switches['--png'] || (switches['--bmp'] ? false : null),
				switches['--raw']
		  )
		: createIcns(pngs, switches['--toc'], switches['--raw']));
	if (err) {
		console.error(err);
		return 1;
	}

	try {
		await writeFile(icon, data);
	} catch (err) {
		console.error(err);
		return 1;
	}

	return 0;
}
main(process.argv)
	.then(code => {
		process.exitCode = code || 0;
	})
	.catch(err => {
		console.error(err);
		process.exitCode = 1;
	});
