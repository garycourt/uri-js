import nodeResolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import nodePolyfills from 'rollup-plugin-node-polyfills';
import babel from 'rollup-plugin-babel';
const packageJson = require('./package.json');

export default {
	input : "dist/esnext/index.js",
      	plugins: [
		commonjs({
			transformMixedEsModules: true
		}),
      		nodeResolve({
				browser: true,
      			preferBuiltins: false
      		}),
      		babel({
      		  "presets": [
      		    ["latest", {
      		      "es2015": {
      		        "modules": false
      		      }
      		    }]
      		  ],
      		  "plugins": ["external-helpers"],
      		  "externalHelpers": false
      		}),
		nodePolyfills()
      	],
	output : {
        	format : "umd",
        	name : "URI",
        	file : "dist/es5/uri.all.js",
        	sourcemap : true,
        	banner : "/** @license URI.js v" + packageJson.version + " (c) 2011 Gary Court. License: http://github.com/garycourt/uri-js */"
	}
}
