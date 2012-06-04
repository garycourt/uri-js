/**
 * URI.js
 * 
 * @fileoverview An RFC 3986 compliant, scheme extendable URI parsing/validating/resolving library for JavaScript.
 * @author <a href="mailto:gary.court@gmail.com">Gary Court</a>
 * @version 1.5.0
 * @see http://github.com/garycourt/uri-js
 * @license URI.js v1.5.0 (c) 2011 Gary Court. License: http://github.com/garycourt/uri-js
 */

/**
 * Copyright 2011 Gary Court. All rights reserved.
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

/*jslint white: true, sub: true, undef: true, newcap: true, plusplus: true, bitwise: true, regexp: true, nomen: true, indent: 4 */
/*global exports:true, require:true, URI:true */

if (typeof exports === "undefined") {
	exports = {}; 
}

if (typeof require !== "function") {
	require = function (id) {
		"use strict";
		return exports;
	};
}

URI = (function () {
	"use strict";
	var	
		punycode = require("./punycode"),
		
		/**
		 * @param {...string} sets
		 * @return {string}
		 */
		mergeSet = function (sets) {
			var set = sets,
				x = 1,
				nextSet = arguments[x];
			
			while (nextSet) {
				set = set.slice(0, -1) + nextSet.slice(1);
				nextSet = arguments[++x];
			}
			
			return set;
		},
		
		/**
		 * @param {string} str
		 * @return {string}
		 */
		subexp = function (str) {
			return "(?:" + str + ")";
		},
		
		/**
		 * @param {boolean} iri
		 * @return {Object}
		 */
		
		buildExps = function (iri) {
			var
				ALPHA$$ = "[A-Za-z]",
				CR$ = "[\\x0D]",
				DIGIT$$ = "[0-9]",
				DQUOTE$$ = "[\\x22]",
				HEXDIG$$ = mergeSet(DIGIT$$, "[A-Fa-f]"),  //case-insensitive
				LF$$ = "[\\x0A]",
				SP$$ = "[\\x20]",
				PCT_ENCODED$ = subexp(subexp("%[EFef]" + HEXDIG$$ + "%" + HEXDIG$$ + HEXDIG$$ + "%" + HEXDIG$$ + HEXDIG$$) + "|" + subexp("%[89A-Fa-f]" + HEXDIG$$ + "%" + HEXDIG$$ + HEXDIG$$) + "|" + subexp("%" + HEXDIG$$ + HEXDIG$$)),  //expanded
				GEN_DELIMS$$ = "[\\:\\/\\?\\#\\[\\]\\@]",
				SUB_DELIMS$$ = "[\\!\\$\\&\\'\\(\\)\\*\\+\\,\\;\\=]",
				RESERVED$$ = mergeSet(GEN_DELIMS$$, SUB_DELIMS$$),
				UCSCHAR$$ = iri ? "[\\xA0-\\u200D\\u2010-\\u2029\\u202F-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFEF]" : "[]",  //subset, excludes bidi control characters
				IPRIVATE$$ = iri ? "[\\uE000-\\uF8FF]" : "[]",  //subset
				UNRESERVED$$ = mergeSet(ALPHA$$, DIGIT$$, "[\\-\\.\\_\\~]", UCSCHAR$$),
				SCHEME$ = subexp(ALPHA$$ + mergeSet(ALPHA$$, DIGIT$$, "[\\+\\-\\.]") + "*"),
				USERINFO$ = subexp(subexp(PCT_ENCODED$ + "|" + mergeSet(UNRESERVED$$, SUB_DELIMS$$, "[\\:]")) + "*"),
				DEC_OCTET$ = subexp(subexp("25[0-5]") + "|" + subexp("2[0-4]" + DIGIT$$) + "|" + subexp("1" + DIGIT$$ + DIGIT$$) + "|" + subexp("[1-9]" + DIGIT$$) + "|" + DIGIT$$),
				IPV4ADDRESS$ = subexp(DEC_OCTET$ + "\\." + DEC_OCTET$ + "\\." + DEC_OCTET$ + "\\." + DEC_OCTET$),
				H16$ = subexp(HEXDIG$$ + "{1,4}"),
				LS32$ = subexp(subexp(H16$ + "\\:" + H16$) + "|" + IPV4ADDRESS$),
				IPV6ADDRESS$ = subexp(mergeSet(UNRESERVED$$, SUB_DELIMS$$, "[\\:]") + "+"),  //FIXME
				IPVFUTURE$ = subexp("v" + HEXDIG$$ + "+\\." + mergeSet(UNRESERVED$$, SUB_DELIMS$$, "[\\:]") + "+"),
				IP_LITERAL$ = subexp("\\[" + subexp(IPV6ADDRESS$ + "|" + IPVFUTURE$) + "\\]"),
				REG_NAME$ = subexp(subexp(PCT_ENCODED$ + "|" + mergeSet(UNRESERVED$$, SUB_DELIMS$$)) + "*"),
				HOST$ = subexp(IP_LITERAL$ + "|" + IPV4ADDRESS$ + "|" + REG_NAME$),
				PORT$ = subexp(DIGIT$$ + "*"),
				AUTHORITY$ = subexp(subexp(USERINFO$ + "@") + "?" + HOST$ + subexp("\\:" + PORT$) + "?"),
				PCHAR$ = subexp(PCT_ENCODED$ + "|" + mergeSet(UNRESERVED$$, SUB_DELIMS$$, "[\\:\\@]")),
				SEGMENT$ = subexp(PCHAR$ + "*"),
				SEGMENT_NZ$ = subexp(PCHAR$ + "+"),
				SEGMENT_NZ_NC$ = subexp(subexp(PCT_ENCODED$ + "|" + mergeSet(UNRESERVED$$, SUB_DELIMS$$, "[\\@]")) + "+"),
				PATH_ABEMPTY$ = subexp(subexp("\\/" + SEGMENT$) + "*"),
				PATH_ABSOLUTE$ = subexp("\\/" + subexp(SEGMENT_NZ$ + PATH_ABEMPTY$) + "?"),  //simplified
				PATH_NOSCHEME$ = subexp(SEGMENT_NZ_NC$ + PATH_ABEMPTY$),  //simplified
				PATH_ROOTLESS$ = subexp(SEGMENT_NZ$ + PATH_ABEMPTY$),  //simplified
				PATH_EMPTY$ = subexp(""),  //simplified
				PATH$ = subexp(PATH_ABEMPTY$ + "|" + PATH_ABSOLUTE$ + "|" + PATH_NOSCHEME$ + "|" + PATH_ROOTLESS$ + "|" + PATH_EMPTY$),
				QUERY$ = subexp(subexp(PCHAR$ + "|" + mergeSet("[\\/\\?]", IPRIVATE$$)) + "*"),
				FRAGMENT$ = subexp(subexp(PCHAR$ + "|[\\/\\?]") + "*"),
				HIER_PART$ = subexp(subexp("\\/\\/" + AUTHORITY$ + PATH_ABEMPTY$) + "|" + PATH_ABSOLUTE$ + "|" + PATH_ROOTLESS$ + "|" + PATH_EMPTY$),
				URI$ = subexp(SCHEME$ + "\\:" + HIER_PART$ + subexp("\\?" + QUERY$) + "?" + subexp("\\#" + FRAGMENT$) + "?"),
				RELATIVE_PART$ = subexp(subexp("\\/\\/" + AUTHORITY$ + PATH_ABEMPTY$) + "|" + PATH_ABSOLUTE$ + "|" + PATH_NOSCHEME$ + "|" + PATH_EMPTY$),
				RELATIVE$ = subexp(RELATIVE_PART$ + subexp("\\?" + QUERY$) + "?" + subexp("\\#" + FRAGMENT$) + "?"),
				URI_REFERENCE$ = subexp(URI$ + "|" + RELATIVE$),
				ABSOLUTE_URI$ = subexp(SCHEME$ + "\\:" + HIER_PART$ + subexp("\\?" + QUERY$) + "?"),
				
				GENERIC_REF$ = "^(" + SCHEME$ + ")\\:" + subexp(subexp("\\/\\/(" + subexp("(" + USERINFO$ + ")@") + "?(" + HOST$ + ")" + subexp("\\:(" + PORT$ + ")") + "?)") + "?(" + PATH_ABEMPTY$ + "|" + PATH_ABSOLUTE$ + "|" + PATH_ROOTLESS$ + "|" + PATH_EMPTY$ + ")") + subexp("\\?(" + QUERY$ + ")") + "?" + subexp("\\#(" + FRAGMENT$ + ")") + "?$",
				RELATIVE_REF$ = "^(){0}" + subexp(subexp("\\/\\/(" + subexp("(" + USERINFO$ + ")@") + "?(" + HOST$ + ")" + subexp("\\:(" + PORT$ + ")") + "?)") + "?(" + PATH_ABEMPTY$ + "|" + PATH_ABSOLUTE$ + "|" + PATH_NOSCHEME$ + "|" + PATH_EMPTY$ + ")") + subexp("\\?(" + QUERY$ + ")") + "?" + subexp("\\#(" + FRAGMENT$ + ")") + "?$",
				ABSOLUTE_REF$ = "^(" + SCHEME$ + ")\\:" + subexp(subexp("\\/\\/(" + subexp("(" + USERINFO$ + ")@") + "?(" + HOST$ + ")" + subexp("\\:(" + PORT$ + ")") + "?)") + "?(" + PATH_ABEMPTY$ + "|" + PATH_ABSOLUTE$ + "|" + PATH_ROOTLESS$ + "|" + PATH_EMPTY$ + ")") + subexp("\\?(" + QUERY$ + ")") + "?$",
				SAMEDOC_REF$ = "^" + subexp("\\#(" + FRAGMENT$ + ")") + "?$",
				AUTHORITY_REF$ = "^" + subexp("(" + USERINFO$ + ")@") + "?(" + HOST$ + ")" + subexp("\\:(" + PORT$ + ")") + "?$"
			;
			
			return {
				URI_REF : new RegExp("(" + GENERIC_REF$ + ")|(" + RELATIVE_REF$ + ")"),
				NOT_SCHEME : new RegExp(mergeSet("[^]", ALPHA$$, DIGIT$$, "[\\+\\-\\.]"), "g"),
				NOT_USERINFO : new RegExp(mergeSet("[^\\%\\:]", UNRESERVED$$, SUB_DELIMS$$), "g"),
				NOT_HOST : new RegExp(mergeSet("[^\\%]", UNRESERVED$$, SUB_DELIMS$$), "g"),
				NOT_PATH : new RegExp(mergeSet("[^\\%\\/\\:\\@]", UNRESERVED$$, SUB_DELIMS$$), "g"),
				NOT_PATH_NOSCHEME : new RegExp(mergeSet("[^\\%\\/\\@]", UNRESERVED$$, SUB_DELIMS$$), "g"),
				NOT_QUERY : new RegExp(mergeSet("[^\\%]", UNRESERVED$$, SUB_DELIMS$$, "[\\:\\@\\/\\?]", IPRIVATE$$), "g"),
				NOT_FRAGMENT : new RegExp(mergeSet("[^\\%]", UNRESERVED$$, SUB_DELIMS$$, "[\\:\\@\\/\\?]"), "g"),
				ESCAPE : new RegExp(mergeSet("[^]", UNRESERVED$$, SUB_DELIMS$$), "g"),
				UNRESERVED : new RegExp(UNRESERVED$$, "g"),
				OTHER_CHARS : new RegExp(mergeSet("[^\\%]", UNRESERVED$$, RESERVED$$), "g"),
				PCT_ENCODED : new RegExp(PCT_ENCODED$, "g")
			};
		},
		
		URI_PROTOCOL = buildExps(false),
		IRI_PROTOCOL = buildExps(true),
		URI_PARSE = /^(?:([^:\/?#]+):)?(?:\/\/((?:([^\/?#@]*)@)?([^\/?#:]*)(?:\:(\d*))?))?([^?#]*)(?:\?([^#]*))?(?:#((?:.|\n)*))?/i,
		RDS1 = /^\.\.?\//,
		RDS2 = /^\/\.(\/|$)/,
		RDS3 = /^\/\.\.(\/|$)/,
		RDS4 = /^\.\.?$/,
		RDS5 = /^\/?(?:.|\n)*?(?=\/|$)/,
		NO_MATCH_IS_UNDEFINED = ("").match(/(){0}/)[1] === undefined,
		
		/**
		 * @param {string} chr
		 * @return {string}
		 */
		pctEncChar = function (chr) {
			var c = chr.charCodeAt(0), e;
 
			if (c < 16) {
				e = "%0" + c.toString(16).toUpperCase();
			}
			else if (c < 128) {
				e = "%" + c.toString(16).toUpperCase();
			}
			else if (c < 2048) {
				e = "%" + ((c >> 6) | 192).toString(16).toUpperCase() + "%" + ((c & 63) | 128).toString(16).toUpperCase();
			}
			else {
				e = "%" + ((c >> 12) | 224).toString(16).toUpperCase() + "%" + (((c >> 6) & 63) | 128).toString(16).toUpperCase() + "%" + ((c & 63) | 128).toString(16).toUpperCase();
			}
			
			return e;
		},
		
		/**
		 * @param {string} str
		 * @return {string}
		 */
		pctDecChars = function (str) {
			var newStr = "", 
				i = 0,
				il = str.length,
				c, c2, c3;
	 
			while (i < il) {
				c = parseInt(str.substr(i + 1, 2), 16);
	 
				if (c < 128) {
					newStr += String.fromCharCode(c);
					i += 3;
				}
				else if (c >= 194 && c < 224) {
					if ((il - i) >= 6) {
						c2 = parseInt(str.substr(i + 4, 2), 16);
						newStr += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
					} else {
						newStr += str.substr(i, 6);
					}
					i += 6;
				}
				else if (c >= 224) {
					if ((il - i) >= 9) {
						c2 = parseInt(str.substr(i + 4, 2), 16);
						c3 = parseInt(str.substr(i + 7, 2), 16);
						newStr += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
					} else {
						newStr += str.substr(i, 9);
					}
					i += 9;
				}
				else {
					newStr += str.substr(i, 3);
					i += 3;
				}
			}
	 
			return newStr;
		},
		
		/**
		 * @return {string}
		 */
		typeOf = function (o) {
			return o === undefined ? "undefined" : (o === null ? "null" : Object.prototype.toString.call(o).split(" ").pop().split("]").shift().toLowerCase());
		},
		
		/**
		 * @param {string} str
		 * @return {string}
		 */
		
		upperCase = function (str) {
			return str.toUpperCase();
		},
		
		/**
		 * @constructor
		 * @implements URIComponents
		 */
		Components = function () {
			this.errors = [];
		}, 
		
		/** @namespace */ 
		URI = exports;
	
	/**
	 * Components
	 */
	
	Components.prototype = {
		/**
		 * @type string
		 */
		
		scheme : undefined,
		
		/**
		 * @type string
		 */
		
		userinfo : undefined,
		
		/**
		 * @type string
		 */
		
		host : undefined,
		
		/**
		 * @type number
		 */
		
		port : undefined,
		
		/**
		 * @type string
		 */
		
		path : undefined,
		
		/**
		 * @type string
		 */
		
		query : undefined,
		
		/**
		 * @type string
		 */
		
		fragment : undefined,
		
		/**
		 * @type string
		 * @values "uri", "absolute", "relative", "same-document"
		 */
		
		reference : undefined,
		
		/**
		 * @type Array
		 */
		
		errors : undefined
	};
	
	/**
	 * URI
	 */
	
	/**
	 * @namespace
	 */
	
	URI.SCHEMES = {};
	
	/**
	 * @private
	 * @param {URIComponents} components
	 * @param {Object} protocol
	 * @return {URIComponents}
	 */
	
	URI._normalizeComponentEncoding = function (components, protocol) {
		function decodeUnreserved(str) {
			var decStr = pctDecChars(str);
			return (!decStr.match(protocol.UNRESERVED) ? str : decStr);
		}
		
		if (components.scheme) {
			components.scheme = String(components.scheme).replace(protocol.PCT_ENCODED, decodeUnreserved).toLowerCase().replace(protocol.NOT_SCHEME, "");
		}
		
		if (components.userinfo !== undefined) {
			components.userinfo = String(components.userinfo).replace(protocol.PCT_ENCODED, decodeUnreserved).replace(protocol.NOT_USERINFO, pctEncChar).replace(/%[0-9A-Fa-f]{2}/g, upperCase);
		}
		
		if (components.host !== undefined) {
			components.host = String(components.host).replace(protocol.PCT_ENCODED, decodeUnreserved).toLowerCase().replace(protocol.NOT_HOST, pctEncChar).replace(/%[0-9A-Fa-f]{2}/g, upperCase);
		}
		
		if (components.path !== undefined) {
			components.path = String(components.path).replace(protocol.PCT_ENCODED, decodeUnreserved).replace((components.scheme ? protocol.NOT_PATH : protocol.NOT_PATH_NOSCHEME), pctEncChar).replace(/%[0-9A-Fa-f]{2}/g, upperCase);
		}
		
		if (components.query !== undefined) {
			components.query = String(components.query).replace(protocol.PCT_ENCODED, decodeUnreserved).replace(protocol.NOT_QUERY, pctEncChar).replace(/%[0-9A-Fa-f]{2}/g, upperCase);
		}
		
		if (components.fragment !== undefined) {
			components.fragment = String(components.fragment).replace(protocol.PCT_ENCODED, decodeUnreserved).replace(protocol.NOT_FRAGMENT, pctEncChar).replace(/%[0-9A-Fa-f]{2}/g, upperCase);
		}
		
		return components;
	};
	
	/**
	 * @param {string} uriString
	 * @param {Options} [options]
	 * @returns {URIComponents}
	 */
	
	URI.parse = function (uriString, options) {
		var protocol = URI_PROTOCOL,
			matches, 
			parseError = false,
			components = new Components(),
			schemeHandler;
		
		uriString = uriString ? uriString.toString() : "";
		options = options || /** @type {Options} */ ({});
		
		if (options.iri) {
			protocol = IRI_PROTOCOL;
		}
		
		if (options.reference === "suffix") {
			uriString = (options.scheme ? options.scheme + ":" : "") + "//" + uriString;
		}
		
		matches = uriString.match(protocol.URI_REF);
		
		if (matches) {
			if (matches[1]) {
				//generic URI
				matches = matches.slice(1, 10);
			} else {
				//relative URI
				matches = matches.slice(10, 19);
			}
		} 
		
		if (!matches) {
			parseError = true;
			if (!options.tolerant) {
				components.errors.push("URI is not strictly valid.");
			}
			matches = uriString.match(URI_PARSE);
		}
		
		if (matches) {
			if (NO_MATCH_IS_UNDEFINED) {
				//store each component
				components.scheme = matches[1];
				//components.authority = matches[2];
				components.userinfo = matches[3];
				components.host = matches[4];
				components.port = parseInt(matches[5], 10);
				components.path = matches[6] || "";
				components.query = matches[7];
				components.fragment = matches[8];
				
				//fix port number
				if (isNaN(components.port)) {
					components.port = matches[5];
				}
			} else {  //IE FIX for improper RegExp matching
				//store each component
				components.scheme = matches[1] || undefined;
				//components.authority = (uriString.indexOf("//") !== -1 ? matches[2] : undefined);
				components.userinfo = (uriString.indexOf("@") !== -1 ? matches[3] : undefined);
				components.host = (uriString.indexOf("//") !== -1 ? matches[4] : undefined);
				components.port = parseInt(matches[5], 10);
				components.path = matches[6] || "";
				components.query = (uriString.indexOf("?") !== -1 ? matches[7] : undefined);
				components.fragment = (uriString.indexOf("#") !== -1 ? matches[8] : undefined);
				
				//fix port number
				if (isNaN(components.port)) {
					components.port = (uriString.match(/\/\/(?:.|\n)*\:(?:\/|\?|\#|$)/) ? matches[4] : undefined);
				}
			}
			
			//determine reference type
			if (components.scheme === undefined && components.userinfo === undefined && components.host === undefined && components.port === undefined && components.path === undefined && components.query === undefined) {
				components.reference = "same-document";
			} else if (components.scheme === undefined) {
				components.reference = "relative";
			} else if (components.fragment === undefined) {
				components.reference = "absolute";
			} else {
				components.reference = "uri";
			}
			
			//check for reference errors
			if (options.reference && options.reference !== "suffix" && options.reference !== components.reference) {
				components.errors.push("URI is not a " + options.reference + " reference.");
			}
			
			//find scheme handler
			schemeHandler = URI.SCHEMES[(options.scheme || components.scheme || "").toLowerCase()];
			
			//if IRI, check if scheme can't handle IRIs
			if (options.iri && schemeHandler && !schemeHandler.iri) {
				//if host component is a domain name
				if (components.host && (options.domainHost || (schemeHandler && schemeHandler.domainHost))) {
					try {
						components.host = punycode.toASCII(components.host.replace(protocol.PCT_ENCODED, pctDecChars).toLowerCase());  //convert Unicode IDN -> ASCII IDN
					} catch (e) {
						components.errors.push("Host's domain name can not be converted to ASCII via punycode: " + e);
					}
				}
				
				URI._normalizeComponentEncoding(components, URI_PROTOCOL);  //convert IRI -> URI
			}
			
			//perform scheme specific parsing
			if (schemeHandler && schemeHandler.parse) {
				schemeHandler.parse(components, options);
			}
		} else {
			parseError = true;
			components.errors.push("URI can not be parsed.");
		}
		
		return components;
	};
	
	/**
	 * @private
	 * @param {URIComponents} components
	 * @param {Options} [options]
	 * @returns {string|undefined}
	 */
	
	URI._recomposeAuthority = function (components, options) {
		var uriTokens = [];
		
		if (components.userinfo !== undefined) {
			uriTokens.push(components.userinfo);
			uriTokens.push("@");
		}
		
		if (components.host !== undefined) {
			uriTokens.push(components.host);
		}
		
		if (typeof components.port === "number") {
			uriTokens.push(":");
			uriTokens.push(components.port.toString(10));
		}
		
		return uriTokens.length ? uriTokens.join("") : undefined;
	};
	
	/**
	 * @param {string} input
	 * @returns {string}
	 */
	
	URI.removeDotSegments = function (input) {
		var output = [], s;
		
		while (input.length) {
			if (input.match(RDS1)) {
				input = input.replace(RDS1, "");
			} else if (input.match(RDS2)) {
				input = input.replace(RDS2, "/");
			} else if (input.match(RDS3)) {
				input = input.replace(RDS3, "/");
				output.pop();
			} else if (input === "." || input === "..") {
				input = "";
			} else {
				s = input.match(RDS5)[0];
				input = input.slice(s.length);
				output.push(s);
			}
		}
		
		return output.join("");
	};
	
	/**
	 * @param {URIComponents} components
	 * @param {Options} [options]
	 * @returns {string}
	 */
	
	URI.serialize = function (components, options) {
		var protocol = URI_PROTOCOL,
			uriTokens = [], 
			schemeHandler,
			authority,
			s;
		options = options || /** @type {Options} */ ({});
		
		if (options.iri) {
			protocol = IRI_PROTOCOL;
		}
		
		//find scheme handler
		schemeHandler = URI.SCHEMES[(options.scheme || components.scheme || "").toLowerCase()];
		
		//perform scheme specific serialization
		if (schemeHandler && schemeHandler.serialize) {
			schemeHandler.serialize(components, options);
		}
		
		//if host component is a domain name, convert IDN via punycode
		if (components.host && (options.domainHost || (schemeHandler && schemeHandler.domainHost))) {
			try {
				components.host = (!options.iri ? punycode.toASCII(components.host.replace(protocol.PCT_ENCODED, pctDecChars).toLowerCase()) : punycode.toUnicode(components.host));
			} catch (e) {
				components.errors.push("Host's domain name can not be converted to " + (!options.iri ? "ASCII" : "Unicode") + " via punycode: " + e);
			}
		}
		
		//normalize encoding
		URI._normalizeComponentEncoding(components, protocol);
		
		if (options.reference !== "suffix" && components.scheme) {
			uriTokens.push(components.scheme);
			uriTokens.push(":");
		}
		
		authority = URI._recomposeAuthority(components, options);
		if (authority !== undefined) {
			if (options.reference !== "suffix") {
				uriTokens.push("//");
			}
			
			uriTokens.push(authority);
			
			if (components.path && components.path.charAt(0) !== "/") {
				uriTokens.push("/");
			}
		}
		
		if (components.path !== undefined) {
			s = components.path;
			
			if (!options.absolutePath && (!schemeHandler || !schemeHandler.absolutePath)) {
				s = URI.removeDotSegments(s);
			}
			
			if (authority === undefined) {
				s = s.replace(/^\/\//, "/%2F");  //don't allow the path to start with "//"
			}
			
			uriTokens.push(s);
		}
		
		if (components.query !== undefined) {
			uriTokens.push("?");
			uriTokens.push(components.query);
		}
		
		if (components.fragment !== undefined) {
			uriTokens.push("#");
			uriTokens.push(components.fragment);
		}
		
		return uriTokens.join('');  //merge tokens into a string
	};
	
	/**
	 * @param {URIComponents} base
	 * @param {URIComponents} relative
	 * @param {Options} [options]
	 * @param {boolean} [skipNormalization]
	 * @returns {URIComponents}
	 */
	
	URI.resolveComponents = function (base, relative, options, skipNormalization) {
		var target = new Components();
		
		if (!skipNormalization) {
			base = URI.parse(URI.serialize(base, options), options);  //normalize base components
			relative = URI.parse(URI.serialize(relative, options), options);  //normalize relative components
		}
		options = options || /** @type {Options} */ ({});
		
		if (!options.tolerant && relative.scheme) {
			target.scheme = relative.scheme;
			//target.authority = relative.authority;
			target.userinfo = relative.userinfo;
			target.host = relative.host;
			target.port = relative.port;
			target.path = URI.removeDotSegments(relative.path);
			target.query = relative.query;
		} else {
			if (relative.userinfo !== undefined || relative.host !== undefined || relative.port !== undefined) {
				//target.authority = relative.authority;
				target.userinfo = relative.userinfo;
				target.host = relative.host;
				target.port = relative.port;
				target.path = URI.removeDotSegments(relative.path);
				target.query = relative.query;
			} else {
				if (!relative.path) {
					target.path = base.path;
					if (relative.query !== undefined) {
						target.query = relative.query;
					} else {
						target.query = base.query;
					}
				} else {
					if (relative.path.charAt(0) === "/") {
						target.path = URI.removeDotSegments(relative.path);
					} else {
						if ((base.userinfo !== undefined || base.host !== undefined || base.port !== undefined) && !base.path) {
							target.path = "/" + relative.path;
						} else if (!base.path) {
							target.path = relative.path;
						} else {
							target.path = base.path.slice(0, base.path.lastIndexOf("/") + 1) + relative.path;
						}
						target.path = URI.removeDotSegments(target.path);
					}
					target.query = relative.query;
				}
				//target.authority = base.authority;
				target.userinfo = base.userinfo;
				target.host = base.host;
				target.port = base.port;
			}
			target.scheme = base.scheme;
		}
		
		target.fragment = relative.fragment;
		
		return target;
	};
	
	/**
	 * @param {string} baseURI
	 * @param {string} relativeURI
	 * @param {Options} [options]
	 * @returns {string}
	 */
	
	URI.resolve = function (baseURI, relativeURI, options) {
		return URI.serialize(URI.resolveComponents(URI.parse(baseURI, options), URI.parse(relativeURI, options), options, true), options);
	};
	
	/**
	 * @param {string|URIComponents} uri
	 * @param {Options} options
	 * @returns {string|URIComponents}
	 */
	
	URI.normalize = function (uri, options) {
		if (typeof uri === "string") {
			uri = URI.serialize(URI.parse(uri, options), options);
		} else if (typeOf(uri) === "object") {
			uri = URI.parse(URI.serialize(uri, options), options);
		}
		
		return uri;
	};
	
	/**
	 * @param {string|URIComponents} uriA
	 * @param {string|URIComponents} uriB
	 * @param {Options} options
	 */
	
	URI.equal = function (uriA, uriB, options) {
		if (typeof uriA === "string") {
			uriA = URI.serialize(URI.parse(uriA, options), options);
		} else if (typeOf(uriA) === "object") {
			uriA = URI.serialize(uriA, options);
		}
		
		if (typeof uriB === "string") {
			uriB = URI.serialize(URI.parse(uriB, options), options);
		} else if (typeOf(uriB) === "object") {
			uriB = URI.serialize(uriB, options);
		}
		
		return uriA === uriB;
	};
	
	/**
	 * @param {string} str
	 * @param {Options} [options]
	 * @returns {string}
	 */
	
	URI.escapeComponent = function (str, options) {
		return str && str.toString().replace((!options || !options.iri ? URI_PROTOCOL.ESCAPE : IRI_PROTOCOL.ESCAPE), pctEncChar);
	};
	
	/**
	 * @param {string} str
	 * @param {Options} [options]
	 * @returns {string}
	 */
	
	URI.unescapeComponent = function (str, options) {
		return str && str.toString().replace((!options || !options.iri ? URI_PROTOCOL.PCT_ENCODED : IRI_PROTOCOL.PCT_ENCODED), pctDecChars);
	};
	
	//export API
	exports.pctEncChar = pctEncChar;
	exports.pctDecChars = pctDecChars;
	exports.Components = Components;
	exports.URI = URI;
	exports.punycode = punycode;
	
	//name-safe export API
	exports["pctEncChar"] = pctEncChar;
	exports["pctDecChars"] = pctDecChars;
	exports["Components"] = Components;
	exports["URI"] = {
		"SCHEMES" : URI.SCHEMES,
		"parse" : URI.parse,
		"removeDotSegments" : URI.removeDotSegments,
		"serialize" : URI.serialize,
		"resolveComponents" : URI.resolveComponents,
		"resolve" : URI.resolve,
		"normalize" : URI.normalize,
		"equal" : URI.equal,
		"escapeComponent" : URI.escapeComponent,
		"unescapeComponent" : URI.unescapeComponent
	};
	exports["punycode"] = {
		"ucs2" : {
			"decode" : punycode.ucs2.decode,
			"encode" : punycode.ucs2.encode
		},
		"decode" : punycode.decode,
		"encode" : punycode.encode,
		"toASCII" : punycode.toASCII,
		"toUnicode" : punycode.toUnicode
	};
	
	//load all schemes
	require("./schemes");
	
	return URI;
}());