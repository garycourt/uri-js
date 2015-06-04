module.exports = function(grunt) {

	grunt.initConfig({
		pkg : grunt.file.readJSON('package.json'),
		typescript : {
			'all' : {
				src : [
					"src/uri.ts",
					"src/schemes.ts",
					"src/schemes/http.ts",
					"src/schemes/urn.ts"
				],
				dest : "build/",
				options : {
					module: "commonjs",
					target: "ES3",
					removeComments: false,
					sourceMap: false,
					noEmitOnError: false
				}
			}
		},
		copy : {
			'js' : {
				files : [
					{src:["src/punycode.js"], dest:"build/punycode.js"}
				]
			}
		},
		'closure-compiler-build' : {
			build : {
				url : "http://dl.google.com/closure-compiler/compiler-latest.zip",
				dir : "dev/",
				filename : "compiler.zip"
			}
		},
		'closure-compiler' : {
			'uri' : {
				closurePath : "dev/",
				jar : "compiler.jar",
				noreport : true,
				js : [
					"build/uri.js",
					"build/schemes/http.js"
				],
				jsOutputFile : "dist/uri.min.js",
				options : {
					compilation_level : "ADVANCED",
					externs : "src/uri.externs.js",
					define : [
						"COMPILED=true",
						"URI__IRI_SUPPORT=false",
						"URI__VALIDATE_SUPPORT=false"
					]
				}
			},
			'uri-iri' : {
				closurePath : "dev/",
				jar : "compiler.jar",
				noreport : true,
				js : [
					"build/uri.js",
					"build/punycode.js",
					"build/schemes/http.js"
				],
				jsOutputFile : "dist/uri-iri.min.js",
				options : {
					compilation_level : "ADVANCED",
					externs : "src/uri.externs.js",
					define : [
						"COMPILED=true",
						"URI__IRI_SUPPORT=true",
						"URI__VALIDATE_SUPPORT=false"
					]
				}
			},
			'urn' : {
				closurePath : "dev/",
				jar : "compiler.jar",
				noreport : true,
				js : [
					"build/schemes/urn.js"
				],
				jsOutputFile : "dist/schemes/urn.min.js",
				options : {
					compilation_level : "ADVANCED",
					externs : "src/uri.externs.js"
				}
			}
		}
	});

	grunt.loadNpmTasks('grunt-typescript');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-closure-compiler-build');
	grunt.loadNpmTasks('api-closure-compiler');

	grunt.registerTask('default', ['typescript', 'copy', 'closure-compiler']);
	grunt.registerTask('setup', ['closure-compiler-build']);

};