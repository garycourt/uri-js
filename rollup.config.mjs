import resolve from '@rollup/plugin-node-resolve';
import packageJson from './package.json' assert { type: "json" };

export default {
	input: "dist/esnext/index.js",
	plugins: [
		resolve({
			module: true,
			jsnext: true,
			preferBuiltins: false
		})
	],
	output: {
		file: "dist/es5/uri.all.js",
		format : "umd",
		name : "URI",
		sourcemap: true,
		banner: "/** @license URI.js v" + packageJson.version + " (c) 2011 Gary Court. License: http://github.com/garycourt/uri-js */"
	},
}
