/**
 * Define.js
 */

/**
 * Copyright 2010 Gary Court. All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without modification, are
 * permitted provided that the following conditions are met:
 * 
 *    1. Redistributions of source code must retain the above copyright notice, this list of
 *       conditions and the following disclaimer.
 * 
 *    2. Redistributions in binary form must reproduce the above copyright notice, this list
 *       of conditions and the following disclaimer in the documentation and/or other materials
 *       provided with the distribution.
 * 
 * THIS SOFTWARE IS PROVIDED BY GARY COURT ``AS IS'' AND ANY EXPRESS OR IMPLIED
 * WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
 * FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL GARY COURT OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
 * ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 * NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF
 * ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 * 
 * The views and conclusions contained in the software and documentation are those of the
 * authors and should not be interpreted as representing official policies, either expressed
 * or implied, of Gary Court.
 */

/*jslint white: true, sub: true, onevar: true, undef: true, eqeqeq: true, newcap: true, immed: true, indent: 4 */

if (typeof define !== "function") {
	if (typeof global === "undefined") {
		global = this;
	}

	if (typeof require === "undefined") {
		//assume a non-CommonJS environment
		require = function (id) {
			if (typeof id === "string") {
				if (id.indexOf("./") === 0) {
					id = id.slice(2);
				}
				if (require.modules.hasOwnProperty(id)) {
					return require.modules[id].exports;
				}
			}
		};

		require.modules = {};
	}

	define = function (id, injects, factory) {
		var thisModule = (typeof module !== "undefined" ? module : {
			exports: {}
		});

		if (!factory) {
			// two or less arguments
			factory = injects;
			if (factory) {
				// two args
				if (typeof id === "string") {
					if (!thisModule.id) {
						thisModule.id = id;
					} else if (id !== thisModule.id) {
						throw new Error("Can not assign module to a different id than the current file");
					}
					// default injects
					injects = ["require", "exports", "module"];
				}
				else {
					// anonymous, deps included
					injects = id;
				}
			}
			else {
				// only one arg, just the factory
				factory = id;
				injects = ["require", "exports", "module"];
			}
		}

		if (typeof require.modules === "object" && thisModule.id) {
			if (require.modules.hasOwnProperty(thisModule.id)) {
				throw new Error("Module with id '" + thisModule.id + "' already exists");
			}
			require.modules[thisModule.id] = thisModule;
		}

		if (typeof factory !== "function") {
			// we can just provide a plain object
			return thisModule.exports = factory;
		}

		var returned = factory.apply(thisModule.exports, injects.map(function (injection) {
			switch (injection) {
				// check for CommonJS injection variables
			case "require":
				return require;
			case "exports":
				return thisModule.exports;
			case "module":
				return thisModule;
			default:
				// a module dependency
				return require(injection);
			}
		}));

		if (returned) {
			// since AMD encapsulates a function/callback, it can allow the factory to return the exports.
			thisModule.exports = returned;
		}
	}
}