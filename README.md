# Icon Encoder

Package for encoding different icon files

[![npm](https://img.shields.io/npm/v/@shockpkg/icon-encoder.svg)](https://npmjs.com/package/@shockpkg/icon-encoder)
[![node](https://img.shields.io/node/v/@shockpkg/icon-encoder.svg)](https://nodejs.org)

[![size](https://packagephobia.now.sh/badge?p=@shockpkg/icon-encoder)](https://packagephobia.now.sh/result?p=@shockpkg/icon-encoder)
[![downloads](https://img.shields.io/npm/dm/@shockpkg/icon-encoder.svg)](https://npmcharts.com/compare/@shockpkg/icon-encoder?minimal=true)

[![Build Status](https://github.com/shockpkg/icon-encoder/workflows/main/badge.svg)](https://github.com/shockpkg/icon-encoder/actions?query=workflow%3Amain+branch%3Amaster)

# Overview

Encoders for Windows ICO and macOS ICNS files with fine grain control.

NOTE: Not all encode formats are currently supported but the major ones are.

# Usage

## CLI Usage

```
$ npx @shockpkg/icon-encoder
$ npm exec @shockpkg/icon-encoder
$ npm exec shockpkg-icon-encoder
```

```
Usage: shockpkg-icon-encoder [options...] (icon.ico | icon.icns) pngs...
  -v, --version       Show the current version.
  -h, --help          Show this help message.
  --raw               Prefer raw png data in icon.
  --png               Prefer png encoding in ico.
  --bmp               Prefer bmp encoding in ico.
  --toc               Include TOC entry in icns.
  --dark <file>       Embed dark mode icns in icns.
```

## API Usage

### Windows ICO

```js
import {readFile, writeFile} from 'node:fs/promises';
import {IconIco} from '@shockpkg/icon-encoder';

// Default null automatically compresses icons for backwards compatibility.
// Pass true to force icons to be PNG encoded, or false to force BMP.
const png = null;

// Default is to decode and re-encode the PNG data.
// Pass true to use the raw PNG input data when using PNG data in the icon.
const raw = false;

const ico = new IconIco();
await ico.addFromPng(await readFile('icon/256x256.png'), png, raw);
await ico.addFromPng(await readFile('icon/128x128.png'), png, raw);
await ico.addFromPng(await readFile('icon/64x64.png'), png, raw);
await ico.addFromPng(await readFile('icon/48x48.png'), png, raw);
await ico.addFromPng(await readFile('icon/32x32.png'), png, raw);
await ico.addFromPng(await readFile('icon/16x16.png'), png, raw);
await writeFile('icon.ico', ico.encode());
```

### macOS ICNS (current formats)

```js
import {readFile, writeFile} from 'node:fs/promises';
import {IconIcns} from '@shockpkg/icon-encoder';

const icns = new IconIcns();

// Optionally include the TOC (table of contents) header.
// Newer icons will often include this, the default is false.
icns.toc = true;

// Default is to decode and re-encode the PNG data.
// Pass true to use the raw PNG input data when using PNG data in the icon.
const raw = false;

// This order matches that of iconutil with the same image set in macOS 10.14.
// Images with @2x are just 2x the size their file name suggests.
await icns.addFromPng(await readFile('icon/32x32@2x.png'), ['ic12'], raw);
await icns.addFromPng(await readFile('icon/128x128.png'), ['ic07'], raw);
await icns.addFromPng(await readFile('icon/128x128@2x.png'), ['ic13'], raw);
await icns.addFromPng(await readFile('icon/256x256.png'), ['ic08'], raw);
await icns.addFromPng(await readFile('icon/16x16.png'), ['ic04'], raw);
await icns.addFromPng(await readFile('icon/256x256@2x.png'), ['ic14'], raw);
await icns.addFromPng(await readFile('icon/512x512.png'), ['ic09'], raw);
await icns.addFromPng(await readFile('icon/32x32.png'), ['ic05'], raw);
await icns.addFromPng(await readFile('icon/512x512@2x.png'), ['ic10'], raw);
await icns.addFromPng(await readFile('icon/16x16@2x.png'), ['ic11'], raw);
await writeFile('icon.icns', icns.encode());
```

### macOS ICNS with dark mode embedded (current formats)

Since macOS 10.14 an ICNS icon can contain an embedded dark version which can be shown automatically in dark mode.

```js
import {readFile, writeFile} from 'node:fs/promises';
import {IconIcns} from '@shockpkg/icon-encoder';

const icns = new IconIcns();
icns.toc = true;

// First insert light images.
await icns.addFromPng(await readFile('light/32x32@2x.png'), ['ic12']);
await icns.addFromPng(await readFile('light/128x128.png'), ['ic07']);
await icns.addFromPng(await readFile('light/128x128@2x.png'), ['ic13']);
await icns.addFromPng(await readFile('light/256x256.png'), ['ic08']);
await icns.addFromPng(await readFile('light/16x16.png'), ['ic04']);
await icns.addFromPng(await readFile('light/256x256@2x.png'), ['ic14']);
await icns.addFromPng(await readFile('light/512x512.png'), ['ic09']);
await icns.addFromPng(await readFile('light/32x32.png'), ['ic05']);
await icns.addFromPng(await readFile('light/512x512@2x.png'), ['ic10']);
await icns.addFromPng(await readFile('light/16x16@2x.png'), ['ic11']);

// Create and embed the dark variant.
const dark = new IconIcns();
dark.toc = icns.toc;
await dark.addFromPng(await readFile('dark/32x32@2x.png'), ['ic12']);
await dark.addFromPng(await readFile('dark/128x128.png'), ['ic07']);
await dark.addFromPng(await readFile('dark/128x128@2x.png'), ['ic13']);
await dark.addFromPng(await readFile('dark/256x256.png'), ['ic08']);
await dark.addFromPng(await readFile('dark/16x16.png'), ['ic04']);
await dark.addFromPng(await readFile('dark/256x256@2x.png'), ['ic14']);
await dark.addFromPng(await readFile('dark/512x512.png'), ['ic09']);
await dark.addFromPng(await readFile('dark/32x32.png'), ['ic05']);
await dark.addFromPng(await readFile('dark/512x512@2x.png'), ['ic10']);
await dark.addFromPng(await readFile('dark/16x16@2x.png'), ['ic11']);
icns.addDarkIcns(dark.encode());

// Write the icon with the dark icon embedded.
await writeFile('icon.icns', icns.encode());
```

### macOS ICNS (legacy formats)

```js
import {readFile, writeFile} from 'node:fs/promises';
import {IconIcns} from '@shockpkg/icon-encoder';

const icns = new IconIcns();
await icns.addFromPng(await readFile('icon/16x16.png'), ['is32', 's8mk']);
await icns.addFromPng(await readFile('icon/32x32.png'), ['il32', 'l8mk']);
await icns.addFromPng(await readFile('icon/48x48.png'), ['ih32', 'h8mk']);
await icns.addFromPng(await readFile('icon/128x128.png'), ['it32', 't8mk']);
await writeFile('icon.icns', icns.encode());
```

# Bugs

If you find a bug or have compatibility issues, please open a ticket under issues section for this repository.

# License

Copyright (c) 2019-2024 JrMasterModelBuilder

Licensed under the Mozilla Public License, v. 2.0.

If this license does not work for you, feel free to contact me.
