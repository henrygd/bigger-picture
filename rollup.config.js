import svelte from 'rollup-plugin-svelte'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import { terser } from 'rollup-plugin-terser'
import size from 'rollup-plugin-size'
import modify from 'rollup-plugin-modify'

const production = !process.env.ROLLUP_WATCH

const terserOptions = {
	ecma: 2015,
	mangle: {
		properties: {
			regex:
				/^(duration|easing|delay|activeItem|calculateDimensions|dirty|tick|preloadNext|opts|prev|next|close|loadImage|smallScreen|props|setResizeFunc|before_update|after_update|ctx|\$\$set|\$set|invalidate|skip_bound|callbacks|on_disconnect|on_mount|not_equal|on_destroy|fragment|\$\$)$/,
		},
	},
	compress: {
		booleans_as_integers: true,
		pure_getters: true,
		drop_console: true,
		unsafe: true,
		unsafe_arrows: true,
		unsafe_comps: true,
		unsafe_Function: true,
		unsafe_math: true,
		unsafe_symbols: true,
		unsafe_methods: true,
		unsafe_proto: true,
		unsafe_regexp: true,
		unsafe_undefined: true,
		passes: 3,
	},
}

/*
rm unneeded svelte stuff for vanilla scripts (hacky but saves a few bytes)
need to re-test / modify if svelte is updated
*/
const cleanSvelteWhitespace = {
	markup: ({ content }) => {
		const code = content
			.replace(/(>)[\s]*([<{])/g, '$1$2')
			.replace(/({[/:][a-z]+})[\s]*([<{])/g, '$1$2')
			.replace(/({[#:][a-z]+ .+?})[\s]*([<{])/g, '$1$2')
			.replace(/([>}])[\s]+(<|{[/#:][a-z][^}]*})/g, '$1$2')
		return { code }
	},
}
const findReplaceOptions = [
	[/^\s*validate_store.+$|throw.+interpolate.+$/gm, ''],
	['if (options.hydrate)', 'if (false)'],
	['if (options.intro)', 'if (false)'],
	[`, important ? 'important' : ''`, ''],
	[/if \('props' in \$\$props.+;$/gm, ''],
	[/\$\$self\.\$\$set = \$\$props => {\s+};$/gm, ''],
	[
		/if \(type === 'object'\) {(.|\n)+if \(type === 'number'\)/gm,
		`if (type === 'number')`,
	],
	[': blank_object()', ': {}'],
	['__svelte', '_bp'],
	[`typeof window !== 'undefined'`, 'true'],
	['window', 'globalThis'],
	['const doc = get_root_for_style(node)', 'const doc = document'],
	[/get_root_for_style\(node\),/g, 'document,'],
].map(([find, replace]) => modify({ find, replace }))

let config = [
	{
		input: 'src/demo/demo.js',
		output: {
			format: 'iife',
			file: 'public/demo.js',
		},
		plugins: [
			commonjs(),
			svelte({
				preprocess: [cleanSvelteWhitespace],
				compilerOptions: {
					dev: !production,
					immutable: true,
					css: false,
				},
			}),
			resolve({ browser: true }),
			...findReplaceOptions,
			production && terser(terserOptions),
		],
	},
]

if (production) {
	// remove unneeded setters in library
	findReplaceOptions.push(
		modify({ find: /^\sset .+{$\n\s+this.+[^}]+}/gm, replace: '' })
	)
	// unminified dist files
	config.push({
		input: 'src/bigger-picture.js',
		output: [
			{
				format: 'es',
				file: 'dist/bigger-picture.mjs',
			},
			{
				format: 'umd',
				name: 'BiggerPicture',
				file: 'dist/bigger-picture.umd.js',
				strict: false,
			},
			{
				format: 'cjs',
				name: 'BiggerPicture',
				file: 'dist/bigger-picture.cjs',
				strict: false,
				exports: 'default',
			},
		],
		plugins: [
			commonjs(),
			svelte({
				preprocess: [cleanSvelteWhitespace],
				compilerOptions: {
					immutable: true,
					css: false,
				},
			}),
			resolve({ browser: true }),
			...findReplaceOptions,
		],
	})
	// minified dist files
	config.push({
		input: 'src/bigger-picture.js',
		output: [
			{
				format: 'iife',
				name: 'BiggerPicture',
				file: 'dist/bigger-picture.min.js',
				strict: false,
			},
			{
				format: 'es',
				file: 'dist/bigger-picture.min.mjs',
			},
		],
		plugins: [
			commonjs(),
			svelte({
				preprocess: [cleanSvelteWhitespace],
				compilerOptions: {
					immutable: true,
					css: false,
				},
			}),
			resolve({ browser: true }),
			...findReplaceOptions,
			terser(terserOptions),
			size(),
		],
	})
}

export default config
