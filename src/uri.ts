/**
 * URI.js
 * 
 * @fileoverview An RFC 3986 compliant, scheme extendable URI parsing/validating/resolving library for JavaScript.
 * @author <a href="mailto:gary.court@gmail.com">Gary Court</a>
 * @version 2.0.0
 * @see http://github.com/garycourt/uri-js
 * @license URI.js v2.0.0 (c) 2011 Gary Court. License: http://github.com/garycourt/uri-js
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

///<reference path="punycode.d.ts"/>
///<reference path="commonjs.d.ts"/>

/**
 * Compiler switch for indicating code is compiled
 * @define {boolean}
 */
const COMPILED = false;

/**
 * Compiler switch for supporting IRI URIs
 * @define {boolean}
 */
const URI__IRI_SUPPORT = true;

/**
 * Compiler switch for supporting URI validation
 * @define {boolean}
 */
const URI__VALIDATE_SUPPORT = true;

interface URIComponents {
	scheme?:string,
	userinfo?:string,
	host?:string,
	port?:number|string,
	path?:string,
	query?:string,
	fragment?:string,
	reference?:string,
	error?:string
}

interface URIOptions {
	scheme?:string,
	reference?:string,
	tolerant?:boolean,
	absolutePath?:boolean,
	iri?:boolean,
	unicodeSupport?:boolean,
	domainHost?:boolean
}

interface URISchemeHandler {
	parse(components:URIComponents, options:URIOptions):URIComponents,
	serialize(components:URIComponents, options:URIOptions):URIComponents,
	unicodeSupport?:boolean,
	domainHost?:boolean,
	absolutePath?:boolean
}

interface URIRegExps {
	URI_REF : RegExp,
	NOT_SCHEME : RegExp,
	NOT_USERINFO : RegExp,
	NOT_HOST : RegExp,
	NOT_PATH : RegExp,
	NOT_PATH_NOSCHEME : RegExp,
	NOT_QUERY : RegExp,
	NOT_FRAGMENT : RegExp,
	ESCAPE : RegExp,
	UNRESERVED : RegExp,
	OTHER_CHARS : RegExp,
	PCT_ENCODED : RegExp
}

var URI = (function () {
	function merge(...sets:Array<string>):string {
		if (sets.length > 1) {
			sets[0] = sets[0].slice(0, -1);
			let xl = sets.length - 1;
			for (let x = 1; x < xl; ++x) {
				sets[x] = sets[x].slice(1, -1);
			}
			sets[xl] = sets[xl].slice(1);
			return sets.join('');
		} else {
			return sets[0];
		}
	}

	function subexp(str:string):string {
		return "(?:" + str + ")";
	}

	function buildExps(isIRI:boolean):URIRegExps {
		const
			ALPHA$$ = "[A-Za-z]",
			CR$ = "[\\x0D]",
			DIGIT$$ = "[0-9]",
			DQUOTE$$ = "[\\x22]",
			HEXDIG$$ = merge(DIGIT$$, "[A-Fa-f]"),  //case-insensitive
			LF$$ = "[\\x0A]",
			SP$$ = "[\\x20]",
			PCT_ENCODED$ = subexp(subexp("%[EFef]" + HEXDIG$$ + "%" + HEXDIG$$ + HEXDIG$$ + "%" + HEXDIG$$ + HEXDIG$$) + "|" + subexp("%[89A-Fa-f]" + HEXDIG$$ + "%" + HEXDIG$$ + HEXDIG$$) + "|" + subexp("%" + HEXDIG$$ + HEXDIG$$)),  //expanded
			GEN_DELIMS$$ = "[\\:\\/\\?\\#\\[\\]\\@]",
			SUB_DELIMS$$ = "[\\!\\$\\&\\'\\(\\)\\*\\+\\,\\;\\=]",
			RESERVED$$ = merge(GEN_DELIMS$$, SUB_DELIMS$$),
			UCSCHAR$$ = isIRI ? "[\\xA0-\\u200D\\u2010-\\u2029\\u202F-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFEF]" : "[]",  //subset, excludes bidi control characters
			IPRIVATE$$ = isIRI ? "[\\uE000-\\uF8FF]" : "[]",  //subset
			UNRESERVED$$ = merge(ALPHA$$, DIGIT$$, "[\\-\\.\\_\\~]", UCSCHAR$$),
			SCHEME$ = subexp(ALPHA$$ + merge(ALPHA$$, DIGIT$$, "[\\+\\-\\.]") + "*"),
			USERINFO$ = subexp(subexp(PCT_ENCODED$ + "|" + merge(UNRESERVED$$, SUB_DELIMS$$, "[\\:]")) + "*"),
			DEC_OCTET$ = subexp(subexp("25[0-5]") + "|" + subexp("2[0-4]" + DIGIT$$) + "|" + subexp("1" + DIGIT$$ + DIGIT$$) + "|" + subexp("[1-9]" + DIGIT$$) + "|" + DIGIT$$),
			IPV4ADDRESS$ = subexp(DEC_OCTET$ + "\\." + DEC_OCTET$ + "\\." + DEC_OCTET$ + "\\." + DEC_OCTET$),
			H16$ = subexp(HEXDIG$$ + "{1,4}"),
			LS32$ = subexp(subexp(H16$ + "\\:" + H16$) + "|" + IPV4ADDRESS$),
			IPV6ADDRESS$ = subexp(merge(UNRESERVED$$, SUB_DELIMS$$, "[\\:]") + "+"),  //FIXME
			IPVFUTURE$ = subexp("v" + HEXDIG$$ + "+\\." + merge(UNRESERVED$$, SUB_DELIMS$$, "[\\:]") + "+"),
			IP_LITERAL$ = subexp("\\[" + subexp(IPV6ADDRESS$ + "|" + IPVFUTURE$) + "\\]"),
			REG_NAME$ = subexp(subexp(PCT_ENCODED$ + "|" + merge(UNRESERVED$$, SUB_DELIMS$$)) + "*"),
			HOST$ = subexp(IP_LITERAL$ + "|" + IPV4ADDRESS$ + "(?!" + REG_NAME$ + ")" + "|" + REG_NAME$),
			PORT$ = subexp(DIGIT$$ + "*"),
			AUTHORITY$ = subexp(subexp(USERINFO$ + "@") + "?" + HOST$ + subexp("\\:" + PORT$) + "?"),
			PCHAR$ = subexp(PCT_ENCODED$ + "|" + merge(UNRESERVED$$, SUB_DELIMS$$, "[\\:\\@]")),
			SEGMENT$ = subexp(PCHAR$ + "*"),
			SEGMENT_NZ$ = subexp(PCHAR$ + "+"),
			SEGMENT_NZ_NC$ = subexp(subexp(PCT_ENCODED$ + "|" + merge(UNRESERVED$$, SUB_DELIMS$$, "[\\@]")) + "+"),
			PATH_ABEMPTY$ = subexp(subexp("\\/" + SEGMENT$) + "*"),
			PATH_ABSOLUTE$ = subexp("\\/" + subexp(SEGMENT_NZ$ + PATH_ABEMPTY$) + "?"),  //simplified
			PATH_NOSCHEME$ = subexp(SEGMENT_NZ_NC$ + PATH_ABEMPTY$),  //simplified
			PATH_ROOTLESS$ = subexp(SEGMENT_NZ$ + PATH_ABEMPTY$),  //simplified
			PATH_EMPTY$ = "(?!" + PCHAR$ + ")",
			PATH$ = subexp(PATH_ABEMPTY$ + "|" + PATH_ABSOLUTE$ + "|" + PATH_NOSCHEME$ + "|" + PATH_ROOTLESS$ + "|" + PATH_EMPTY$),
			QUERY$ = subexp(subexp(PCHAR$ + "|" + merge("[\\/\\?]", IPRIVATE$$)) + "*"),
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
			URI_REF : URI__VALIDATE_SUPPORT && new RegExp("(" + GENERIC_REF$ + ")|(" + RELATIVE_REF$ + ")"),
			NOT_SCHEME : new RegExp(merge("[^]", ALPHA$$, DIGIT$$, "[\\+\\-\\.]"), "g"),
			NOT_USERINFO : new RegExp(merge("[^\\%\\:]", UNRESERVED$$, SUB_DELIMS$$), "g"),
			NOT_HOST : new RegExp(merge("[^\\%]", UNRESERVED$$, SUB_DELIMS$$), "g"),
			NOT_PATH : new RegExp(merge("[^\\%\\/\\:\\@]", UNRESERVED$$, SUB_DELIMS$$), "g"),
			NOT_PATH_NOSCHEME : new RegExp(merge("[^\\%\\/\\@]", UNRESERVED$$, SUB_DELIMS$$), "g"),
			NOT_QUERY : new RegExp(merge("[^\\%]", UNRESERVED$$, SUB_DELIMS$$, "[\\:\\@\\/\\?]", IPRIVATE$$), "g"),
			NOT_FRAGMENT : new RegExp(merge("[^\\%]", UNRESERVED$$, SUB_DELIMS$$, "[\\:\\@\\/\\?]"), "g"),
			ESCAPE : new RegExp(merge("[^]", UNRESERVED$$, SUB_DELIMS$$), "g"),
			UNRESERVED : new RegExp(UNRESERVED$$, "g"),
			OTHER_CHARS : new RegExp(merge("[^\\%]", UNRESERVED$$, RESERVED$$), "g"),
			PCT_ENCODED : new RegExp(PCT_ENCODED$, "g")
		};
	}

	const 
		URI_PROTOCOL = buildExps(false),
		IRI_PROTOCOL = URI__IRI_SUPPORT ? buildExps(true) : undefined,
		URI_PARSE = /^(?:([^:\/?#]+):)?(?:\/\/((?:([^\/?#@]*)@)?([^\/?#:]*)(?:\:(\d*))?))?([^?#]*)(?:\?([^#]*))?(?:#((?:.|\n)*))?/i,
		RDS1 = /^\.\.?\//,
		RDS2 = /^\/\.(\/|$)/,
		RDS3 = /^\/\.\.(\/|$)/,
		RDS4 = /^\.\.?$/,
		RDS5 = /^\/?(?:.|\n)*?(?=\/|$)/,
		NO_MATCH_IS_UNDEFINED = ("").match(/(){0}/)[1] === undefined
	;

	function pctEncChar(chr:string):string {
		let c = chr.charCodeAt(0), e:string;
	
		if (c < 16) e = "%0" + c.toString(16).toUpperCase();
		else if (c < 128) e = "%" + c.toString(16).toUpperCase();
		else if (c < 2048) e = "%" + ((c >> 6) | 192).toString(16).toUpperCase() + "%" + ((c & 63) | 128).toString(16).toUpperCase();
		else e = "%" + ((c >> 12) | 224).toString(16).toUpperCase() + "%" + (((c >> 6) & 63) | 128).toString(16).toUpperCase() + "%" + ((c & 63) | 128).toString(16).toUpperCase();
		
		return e;
	}

	function pctDecChars(str:string):string {
		var 
			newStr = "", 
			i = 0,
			il = str.length,
			c:number, 
			c2:number, 
			c3:number
		;
	
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
	}

	function typeOf(o:any):string {
		return o === undefined ? "undefined" : (o === null ? "null" : Object.prototype.toString.call(o).split(" ").pop().split("]").shift().toLowerCase());
	}

	function toUpperCase(str:string):string {
		return str.toUpperCase();
	}

	var SCHEMES:{[scheme:string]:URISchemeHandler} = {};
	
	function _normalizeComponentEncoding(components:URIComponents, protocol:URIRegExps) {
		function decodeUnreserved(str:string):string {
			var decStr = pctDecChars(str);
			return (!decStr.match(protocol.UNRESERVED) ? str : decStr);
		}
		
		if (components.scheme) components.scheme = String(components.scheme).replace(protocol.PCT_ENCODED, decodeUnreserved).toLowerCase().replace(protocol.NOT_SCHEME, "");
		if (components.userinfo !== undefined) components.userinfo = String(components.userinfo).replace(protocol.PCT_ENCODED, decodeUnreserved).replace(protocol.NOT_USERINFO, pctEncChar).replace(protocol.PCT_ENCODED, toUpperCase);
		if (components.host !== undefined) components.host = String(components.host).replace(protocol.PCT_ENCODED, decodeUnreserved).toLowerCase().replace(protocol.NOT_HOST, pctEncChar).replace(protocol.PCT_ENCODED, toUpperCase);
		if (components.path !== undefined) components.path = String(components.path).replace(protocol.PCT_ENCODED, decodeUnreserved).replace((components.scheme ? protocol.NOT_PATH : protocol.NOT_PATH_NOSCHEME), pctEncChar).replace(protocol.PCT_ENCODED, toUpperCase);
		if (components.query !== undefined) components.query = String(components.query).replace(protocol.PCT_ENCODED, decodeUnreserved).replace(protocol.NOT_QUERY, pctEncChar).replace(protocol.PCT_ENCODED, toUpperCase);
		if (components.fragment !== undefined) components.fragment = String(components.fragment).replace(protocol.PCT_ENCODED, decodeUnreserved).replace(protocol.NOT_FRAGMENT, pctEncChar).replace(protocol.PCT_ENCODED, toUpperCase);
		
		return components;
	};
	
	function parse(uriString:string, options:URIOptions = {}):URIComponents {
		var 
			protocol = (URI__IRI_SUPPORT && options.iri !== false ? IRI_PROTOCOL : URI_PROTOCOL),
			matches:RegExpMatchArray, 
			parseError = false,
			components:URIComponents = {},
			schemeHandler:URISchemeHandler
		;
		
		if (options.reference === "suffix") uriString = (options.scheme ? options.scheme + ":" : "") + "//" + uriString;
		
		if (URI__VALIDATE_SUPPORT) {
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
				if (!options.tolerant) components.error = components.error || "URI is not strictly valid.";
				matches = uriString.match(URI_PARSE);
			}
		} else {
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
				if (isNaN(<number>components.port)) {
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
				if (isNaN(<number>components.port)) {
					components.port = (uriString.match(/\/\/(?:.|\n)*\:(?:\/|\?|\#|$)/) ? matches[4] : undefined);
				}
			}
			
			//determine reference type
			if (components.scheme === undefined && components.userinfo === undefined && components.host === undefined && components.port === undefined && !components.path && components.query === undefined) {
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
				components.error = components.error || "URI is not a " + options.reference + " reference.";
			}
			
			//find scheme handler
			schemeHandler = SCHEMES[(options.scheme || components.scheme || "").toLowerCase()];
			
			//check if scheme can't handle IRIs
			if (URI__IRI_SUPPORT && typeof punycode !== "undefined" && !options.unicodeSupport && (!schemeHandler || !schemeHandler.unicodeSupport)) {
				//if host component is a domain name
				if (components.host && (options.domainHost || (schemeHandler && schemeHandler.domainHost))) {
					//convert Unicode IDN -> ASCII IDN
					try {
						components.host = punycode.toASCII(components.host.replace(protocol.PCT_ENCODED, pctDecChars).toLowerCase());
					} catch (e) {
						components.error = components.error || "Host's domain name can not be converted to ASCII via punycode: " + e;
					}
				}
				//convert IRI -> URI
				_normalizeComponentEncoding(components, URI_PROTOCOL);
			} else {
				//normalize encodings
				_normalizeComponentEncoding(components, protocol);
			}
			
			//perform scheme specific parsing
			if (schemeHandler && schemeHandler.parse) {
				schemeHandler.parse(components, options);
			}
		} else {
			parseError = true;
			components.error = components.error || "URI can not be parsed.";
		}
		
		return components;
	};
	
	function _recomposeAuthority(components:URIComponents, options:URIOptions):string {
		var uriTokens:Array<string> = [];
		
		if (components.userinfo !== undefined) {
			uriTokens.push(components.userinfo);
			uriTokens.push("@");
		}
		
		if (components.host !== undefined) {
			uriTokens.push(components.host);
		}
		
		if (typeof components.port === "number") {
			uriTokens.push(":");
			uriTokens.push((<number>components.port).toString(10));
		}
		
		return uriTokens.length ? uriTokens.join("") : undefined;
	};
	
	function removeDotSegments(input:string):string {
		var output:Array<string> = [], s:string;
		
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
	
	function serialize(components:URIComponents, options:URIOptions = {}):string {
		var protocol = (URI__IRI_SUPPORT && options.iri ? IRI_PROTOCOL : URI_PROTOCOL),
			uriTokens:Array<string> = [], 
			schemeHandler:URISchemeHandler,
			authority:string,
			s:string
		;
		
		//find scheme handler
		schemeHandler = SCHEMES[(options.scheme || components.scheme || "").toLowerCase()];
		
		//perform scheme specific serialization
		if (schemeHandler && schemeHandler.serialize) schemeHandler.serialize(components, options);
		
		//if host component is a domain name
		if (URI__IRI_SUPPORT && typeof punycode !== "undefined" && components.host && (options.domainHost || (schemeHandler && schemeHandler.domainHost))) {
			//convert IDN via punycode
			try {
				components.host = (!options.iri ? punycode.toASCII(components.host.replace(protocol.PCT_ENCODED, pctDecChars).toLowerCase()) : punycode.toUnicode(components.host));
			} catch (e) {
				components.error = components.error || "Host's domain name can not be converted to " + (!options.iri ? "ASCII" : "Unicode") + " via punycode: " + e;
			}
		}
		
		//normalize encoding
		_normalizeComponentEncoding(components, protocol);
		
		if (options.reference !== "suffix" && components.scheme) {
			uriTokens.push(components.scheme);
			uriTokens.push(":");
		}
		
		authority = _recomposeAuthority(components, options);
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
				s = removeDotSegments(s);
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
	
	function resolveComponents(base:URIComponents, relative:URIComponents, options:URIOptions = {}, skipNormalization?:boolean):URIComponents {
		var target:URIComponents = {};
		
		if (!skipNormalization) {
			base = parse(serialize(base, options), options);  //normalize base components
			relative = parse(serialize(relative, options), options);  //normalize relative components
		}
		options = options || {};
		
		if (!options.tolerant && relative.scheme) {
			target.scheme = relative.scheme;
			//target.authority = relative.authority;
			target.userinfo = relative.userinfo;
			target.host = relative.host;
			target.port = relative.port;
			target.path = removeDotSegments(relative.path);
			target.query = relative.query;
		} else {
			if (relative.userinfo !== undefined || relative.host !== undefined || relative.port !== undefined) {
				//target.authority = relative.authority;
				target.userinfo = relative.userinfo;
				target.host = relative.host;
				target.port = relative.port;
				target.path = removeDotSegments(relative.path);
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
						target.path = removeDotSegments(relative.path);
					} else {
						if ((base.userinfo !== undefined || base.host !== undefined || base.port !== undefined) && !base.path) {
							target.path = "/" + relative.path;
						} else if (!base.path) {
							target.path = relative.path;
						} else {
							target.path = base.path.slice(0, base.path.lastIndexOf("/") + 1) + relative.path;
						}
						target.path = removeDotSegments(target.path);
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
	
	function resolve(baseURI:string, relativeURI:string, options?:URIOptions):string {
		return serialize(resolveComponents(parse(baseURI, options), parse(relativeURI, options), options, true), options);
	};
	
	function normalize(uri:string, options?:URIOptions):string;
	function normalize(uri:URIComponents, options?:URIOptions):URIComponents;
	function normalize(uri:any, options?:URIOptions):any {
		if (typeof uri === "string") {
			uri = serialize(parse(<string>uri, options), options);
		} else if (typeOf(uri) === "object") {
			uri = parse(serialize(<URIComponents>uri, options), options);
		}
		
		return uri;
	};
	
	function equal(uriA:string, uriB:string, options?: URIOptions):boolean;
	function equal(uriA:URIComponents, uriB:URIComponents, options?:URIOptions):boolean;
	function equal(uriA:any, uriB:any, options?:URIOptions):boolean {
		if (typeof uriA === "string") {
			uriA = serialize(parse(uriA, options), options);
		} else if (typeOf(uriA) === "object") {
			uriA = serialize(uriA, options);
		}
		
		if (typeof uriB === "string") {
			uriB = serialize(parse(uriB, options), options);
		} else if (typeOf(uriB) === "object") {
			uriB = serialize(uriB, options);
		}
		
		return uriA === uriB;
	};
	
	function escapeComponent(str:string, options?:URIOptions):string {
		return str && str.toString().replace((!URI__IRI_SUPPORT || !options || !options.iri ? URI_PROTOCOL.ESCAPE : IRI_PROTOCOL.ESCAPE), pctEncChar);
	};
	
	function unescapeComponent(str:string, options?:URIOptions):string {
		return str && str.toString().replace((!URI__IRI_SUPPORT || !options || !options.iri ? URI_PROTOCOL.PCT_ENCODED : IRI_PROTOCOL.PCT_ENCODED), pctDecChars);
	};

	return {
		IRI_SUPPORT: URI__IRI_SUPPORT,
		VALIDATE_SUPPORT: URI__VALIDATE_SUPPORT,
		pctEncChar,
		pctDecChars,
		SCHEMES,
		parse,
		_recomposeAuthority,
		removeDotSegments,
		serialize,
		resolveComponents,
		resolve,
		normalize,
		equal,
		escapeComponent,
		unescapeComponent
	};
})();

if (!COMPILED && typeof module !== "undefined" && typeof require === "function") {
	var punycode = <typeof punycode>require("./punycode");
	module.exports = URI;
	require("./schemes");
}