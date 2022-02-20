import svelte from 'rollup-plugin-svelte'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import { terser } from 'rollup-plugin-terser'
// import buble from '@rollup/plugin-buble'
import filesize from 'rollup-plugin-filesize'
import { fastDimension } from 'svelte-fast-dimension'
import modify from 'rollup-plugin-modify'

const production = !process.env.ROLLUP_WATCH

const terserOptions = {
	format: {
		ecma: 2015,
	},
	compress: {
		booleans_as_integers: true,
		pure_getters: true,
		drop_console: true,
		unsafe: true,
		hoist_vars: true,
		unsafe_arrows: true,
		unsafe_comps: true,
		unsafe_Function: true,
		unsafe_math: true,
		unsafe_symbols: true,
		unsafe_methods: true,
		unsafe_proto: true,
		unsafe_regexp: true,
		unsafe_undefined: true,
		ecma: 2015,
		passes: 2,
	},
}

/*
rm unneeded svelte stuff for dist scripts (hacky but saves a few bytes)
may need to modify in the future if changes are made
*/
const findReplace = {
	find: /^\s*validate_store.+$|throw.+interpolate.+$/gm,
	replace: '',
}
const findReplace2 = {
	find: 'if (options.hydrate)',
	replace: 'if (false)',
}
const findReplace3 = {
	find: /if \(type === 'object'\) {(.|\n)+if \(type === 'number'\)/gm,
	replace: `if (type === 'number')`,
}

let config = [
	// demo js
	{
		input: 'src/demo/demo.js',
		output: {
			format: 'iife',
			file: 'public/demo.js',
		},
		plugins: [
			commonjs(),
			svelte({
				preprocess: [fastDimension()],
				compilerOptions: {
					dev: !production,
				},
			}),
			resolve(),
			production && modify(findReplace),
			production && modify(findReplace2),
			production && modify(findReplace3),
			production && terser(terserOptions),
			// buble({
			// 	transforms: { forOf: false },
			// }),
		],
	},
]

if (production) {
	config.push({
		input: 'src/bigger-picture.js',
		output: [
			// {
			// dist
			// 	format: 'iife',
			// 	name: 'BiggerPicture',
			// 	file: 'public/bigger-picture.js',
			// 	strict: false,
			// },
			{
				// dist file
				format: 'iife',
				name: 'BiggerPicture',
				file: 'dist/bigger-picture.min.js',
				strict: false,
			},
			{
				// dist file
				format: 'umd',
				name: 'BiggerPicture',
				file: 'dist/bigger-picture.umd.js',
				strict: false,
			},
			{
				format: 'es',
				file: 'dist/bigger-picture.mjs',
			},
		],
		plugins: [
			svelte({
				preprocess: [fastDimension()],
			}),
			resolve(),
			modify(findReplace),
			modify(findReplace2),
			modify(findReplace3),
			terser(terserOptions),
			// production &&
			// 	buble({
			// 		transforms: { forOf: false },
			// 	}),
			filesize({
				showMinifiedSize: !production,
			}),
		],
	})
}

export default config
