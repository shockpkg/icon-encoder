# icon-encoder

Package for encoding different icon files

[![npm](https://img.shields.io/npm/v/@shockpkg/icon-encoder.svg)](https://npmjs.com/package/@shockpkg/icon-encoder)
[![node](https://img.shields.io/node/v/@shockpkg/icon-encoder.svg)](https://nodejs.org)

[![dependencies](https://david-dm.org/shockpkg/icon-encoder.svg)](https://david-dm.org/shockpkg/icon-encoder)
[![size](https://packagephobia.now.sh/badge?p=@shockpkg/icon-encoder)](https://packagephobia.now.sh/result?p=@shockpkg/icon-encoder)
[![downloads](https://img.shields.io/npm/dm/@shockpkg/icon-encoder.svg)](https://npmcharts.com/compare/@shockpkg/icon-encoder?minimal=true)

[![travis-ci](https://travis-ci.org/shockpkg/icon-encoder.svg?branch=master)](https://travis-ci.org/shockpkg/icon-encoder)


# Overview

Encoders for Windows ICO and macOS ICNS files with fine grain control.

NOTE: Not all encode formats are currently supported but the major ones are.


# Usage

## Basic Usage

### Windows ICO

```js
import {fs} from 'fs';
import {IconIco} from '@shockpkg/icon-encoder';

// Passing null automatically compresses icons for backwards compatibility.
// Pass true to force icons to be PNG encoded, or false to force BMP.
const png = null;
const ico = new IconIco();
ico.addFromPng(fs.readFileSync('icon/256x256.png'), png);
ico.addFromPng(fs.readFileSync('icon/128x128.png'), png);
ico.addFromPng(fs.readFileSync('icon/64x64.png'), png);
ico.addFromPng(fs.readFileSync('icon/48x48.png'), png);
ico.addFromPng(fs.readFileSync('icon/32x32.png'), png);
ico.addFromPng(fs.readFileSync('icon/16x16.png'), png);
fs.writeFileSync('icon.ico', ico.encode());
```

### macOS ICNS (current formats)

```js
import {fs} from 'fs';
import {IconIcnc} from '@shockpkg/icon-encoder';

const icns = new IconIcnc();
// This order matches that of iconutil with the same image set in macOS 10.14.
// Images with @2x are just 2x the size their file name suggests.
icns.addFromPng(fs.readFileSync('icon/32x32@2x.png'), ['ic12']);
icns.addFromPng(fs.readFileSync('icon/128x128.png'), ['ic07']);
icns.addFromPng(fs.readFileSync('icon/128x128@2x.png'), ['ic13']);
icns.addFromPng(fs.readFileSync('icon/256x256.png'), ['ic08']);
icns.addFromPng(fs.readFileSync('icon/16x16.png'), ['ic04']);
icns.addFromPng(fs.readFileSync('icon/256x256@2x.png'), ['ic14']);
icns.addFromPng(fs.readFileSync('icon/512x512.png'), ['ic09']);
icns.addFromPng(fs.readFileSync('icon/32x32.png'), ['ic05']);
icns.addFromPng(fs.readFileSync('icon/512x512@2x.png'), ['ic10']);
icns.addFromPng(fs.readFileSync('icon/16x16@2x.png'), ['ic11']);
fs.writeFileSync('icon.icns', icns.encode());
```

### macOS ICNS (legacy formats)

```js
import {fs} from 'fs';
import {IconIcnc} from '@shockpkg/icon-encoder';

const icns = new IconIcnc();
icns.addFromPng(fs.readFileSync('icon/16x16.png'), ['is32', 's8mk']);
icns.addFromPng(fs.readFileSync('icon/32x32.png'), ['il32', 'l8mk']);
icns.addFromPng(fs.readFileSync('icon/48x48.png'), ['ih32', 'h8mk']);
icns.addFromPng(fs.readFileSync('icon/128x128.png'), ['it32', 't8mk']);
fs.writeFileSync('icon.icns', icns.encode());
```


# Bugs

If you find a bug or have compatibility issues, please open a ticket under issues section for this repository.


# License

Copyright (c) 2019 JrMasterModelBuilder

Licensed under the Mozilla Public License, v. 2.0.

If this license does not work for you, feel free to contact me.
