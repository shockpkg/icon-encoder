import {readFile, rm} from 'fs/promises';
import {basename} from 'path';
import {pipeline} from 'stream';
import {spawn} from 'child_process';
import {promisify} from 'util';

import gulp from 'gulp';
import gulpRename from 'gulp-rename';
import gulpInsert from 'gulp-insert';
import gulpFilter from 'gulp-filter';
import gulpReplace from 'gulp-replace';
import gulpSourcemaps from 'gulp-sourcemaps';
import gulpBabel from 'gulp-babel';

const pipe = promisify(pipeline);

async function exec(cmd: string, args: string[] = []) {
	const code = await new Promise<number | null>((resolve, reject) => {
		const p = spawn(cmd, args, {
			stdio: 'inherit',
			shell: true
		});
		p.once('close', resolve);
		p.once('error', reject);
	});
	if (code) {
		throw new Error(`Exit code: ${code}`);
	}
}

async function packageJson() {
	return JSON.parse(await readFile('package.json', 'utf8')) as {
		[p: string]: string;
	};
}

async function babelrc() {
	return {
		...JSON.parse(await readFile('.babelrc', 'utf8')),
		babelrc: false
	} as {
		presets: [string, unknown][];
		babelOpts: unknown[];
		plugins: unknown[];
	};
}

async function babelTarget(
	src: string[],
	dest: string,
	modules: string | boolean
) {
	const ext = modules ? '.js' : '.mjs';

	const babelOptions = await babelrc();
	for (const preset of babelOptions.presets) {
		if (preset[0] === '@babel/preset-env') {
			(preset[1] as {modules: string | boolean}).modules = modules;
		}
	}
	if (modules === 'commonjs') {
		babelOptions.plugins.push([
			'@babel/plugin-transform-modules-commonjs',
			{importInterop: 'node'}
		]);
	}
	babelOptions.plugins.push([
		'esm-resolver',
		{
			source: {
				extensions: [
					[['.js', '.mjs', '.jsx', '.mjsx', '.ts', '.tsx'], ext]
				]
			}
		}
	]);

	// Read the package JSON.
	const pkg = await packageJson();

	// Filter meta data file and create replace transform.
	const filterMeta = gulpFilter(['*/meta.ts'], {restore: true});
	const filterMetaReplaces = [
		["'@VERSION@'", JSON.stringify(pkg.version)],
		["'@NAME@'", JSON.stringify(pkg.name)]
	].map(([f, r]) => gulpReplace(f, r));

	await pipe(
		gulp.src(src),
		filterMeta,
		...filterMetaReplaces,
		filterMeta.restore,
		gulpSourcemaps.init(),
		gulpBabel(babelOptions as {}),
		gulpRename(path => {
			path.extname = ext;
		}),
		gulpSourcemaps.write('.', {
			includeContent: true,
			addComment: false,
			destPath: dest
		}),
		gulpInsert.transform((code, {path}) => {
			if (path.endsWith(ext)) {
				return `${code}\n//# sourceMappingURL=${basename(path)}.map\n`;
			}
			return code;
		}),
		gulp.dest(dest)
	);
}

// clean

gulp.task('clean', async () => {
	await Promise.all([
		rm('lib', {recursive: true, force: true}),
		rm('spec/encodes', {recursive: true, force: true})
	]);
});

// lint

gulp.task('lint', async () => {
	await exec('eslint', ['.']);
});

// formatting

gulp.task('format', async () => {
	await exec('prettier', ['-w', '.']);
});

gulp.task('formatted', async () => {
	await exec('prettier', ['-c', '.']);
});

// build

gulp.task('build:dts', async () => {
	await exec('tsc');
});

gulp.task('build:cjs', async () => {
	await babelTarget(['src/**/*.ts'], 'lib', 'commonjs');
});

gulp.task('build:esm', async () => {
	await babelTarget(['src/**/*.ts'], 'lib', false);
});

gulp.task('build', gulp.parallel(['build:dts', 'build:cjs', 'build:esm']));

// test

gulp.task('test:cjs', async () => {
	await exec('jasmine');
});

gulp.task('test:esm', async () => {
	await exec('jasmine', ['--config=spec/support/jasmine.esm.json']);
});

gulp.task('test', gulp.series(['test:cjs', 'test:esm']));

// watch

gulp.task('watch', () => {
	gulp.watch(['src/**/*'], gulp.series(['all']));
});

gulp.task('watch:cjs', () => {
	gulp.watch(['src/**/*'], gulp.series(['all:cjs']));
});

gulp.task('watch:esm', () => {
	gulp.watch(['src/**/*'], gulp.series(['all:esm']));
});

// all

gulp.task(
	'all:cjs',
	gulp.series(['clean', 'build:cjs', 'test:cjs', 'lint', 'formatted'])
);

gulp.task(
	'all:esm',
	gulp.series(['clean', 'build:esm', 'test:esm', 'lint', 'formatted'])
);

gulp.task('all', gulp.series(['clean', 'build', 'test', 'lint', 'formatted']));

// prepack

gulp.task('prepack', gulp.series(['clean', 'build']));

// default

gulp.task('default', gulp.series(['all']));
