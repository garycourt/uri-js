///<reference path="../uri.ts"/>
if (typeof COMPILED === "undefined" && typeof URI === "undefined" && typeof require === "function") {
	var URI = <typeof URI>require("../uri"), punycode = <typeof punycode>require("../punycode");
}

interface MailtoHeaders {
	[hfname:string]:string
}

interface MailtoComponents extends URIComponents {
	to:Array<string>,
	headers?:MailtoHeaders,
	subject?:string,
	body?:string
}

(function () {
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

	var
		O = {},
		isIRI = URI.IRI_SUPPORT,

		//RFC 3986
		UNRESERVED$$ = "[A-Za-z0-9\\-\\.\\_\\~" + (isIRI ? "\\xA0-\\u200D\\u2010-\\u2029\\u202F-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFEF" : "") + "]",
		HEXDIG$$ = "[0-9A-Fa-f]",  //case-insensitive
		PCT_ENCODED$ = subexp(subexp("%[EFef]" + HEXDIG$$ + "%" + HEXDIG$$ + HEXDIG$$ + "%" + HEXDIG$$ + HEXDIG$$) + "|" + subexp("%[89A-Fa-f]" + HEXDIG$$ + "%" + HEXDIG$$ + HEXDIG$$) + "|" + subexp("%" + HEXDIG$$ + HEXDIG$$)),  //expanded

		//RFC 5322, except these symbols as per RFC 6068: @ : / ? # [ ] & ; = 
		//ATEXT$$ = "[A-Za-z0-9\\!\\#\\$\\%\\&\\'\\*\\+\\-\\/\\=\\?\\^\\_\\`\\{\\|\\}\\~]",
		//WSP$$ = "[\\x20\\x09]",
		//OBS_QTEXT$$ = "[\\x01-\\x08\\x0B\\x0C\\x0E-\\x1F\\x7F]",  //(%d1-8 / %d11-12 / %d14-31 / %d127)
		//QTEXT$$ = merge("[\\x21\\x23-\\x5B\\x5D-\\x7E]", OBS_QTEXT$$),  //%d33 / %d35-91 / %d93-126 / obs-qtext
		//VCHAR$$ = "[\\x21-\\x7E]",
		//WSP$$ = "[\\x20\\x09]",
		//OBS_QP$ = subexp("\\\\" + merge("[\\x00\\x0D\\x0A]", OBS_QTEXT$$)),  //%d0 / CR / LF / obs-qtext
		//FWS$ = subexp(subexp(WSP$$ + "*" + "\\x0D\\x0A") + "?" + WSP$$ + "+"),
		//QUOTED_PAIR$ = subexp(subexp("\\\\" + subexp(VCHAR$$ + "|" + WSP$$)) + "|" + OBS_QP$),
		//QUOTED_STRING$ = subexp('\\"' + subexp(FWS$ + "?" + QCONTENT$) + "*" + FWS$ + "?" + '\\"'),
		ATEXT$$ = "[A-Za-z0-9\\!\\$\\%\\'\\*\\+\\-\\^\\_\\`\\{\\|\\}\\~]",
		QTEXT$$ = "[\\!\\$\\%\\'\\(\\)\\*\\+\\,\\-\\.0-9\\<\\>A-Z\\x5E-\\x7E]",
		VCHAR$$ = merge(QTEXT$$, "[\\\"\\\\]"),
		DOT_ATOM_TEXT$ = subexp(ATEXT$$ + "+" + subexp("\\." + ATEXT$$ + "+") + "*"),
		QUOTED_PAIR$ = subexp("\\\\" + VCHAR$$),
		QCONTENT$ = subexp(QTEXT$$ + "|" + QUOTED_PAIR$),
		QUOTED_STRING$ = subexp('\\"' + QCONTENT$ + "*" + '\\"'),

		//RFC 6068
		DTEXT_NO_OBS$$ = "[\\x21-\\x5A\\x5E-\\x7E]",  //%d33-90 / %d94-126
		SOME_DELIMS$$ = "[\\!\\$\\'\\(\\)\\*\\+\\,\\;\\:\\@]",
		QCHAR$ = subexp(UNRESERVED$$ + "|" + PCT_ENCODED$ + "|" + SOME_DELIMS$$),
		DOMAIN$ = subexp(DOT_ATOM_TEXT$ + "|" + "\\[" + DTEXT_NO_OBS$$ + "*" + "\\]"),
		LOCAL_PART$ = subexp(DOT_ATOM_TEXT$ + "|" + QUOTED_STRING$),
		ADDR_SPEC$ = subexp(LOCAL_PART$ + "\\@" + DOMAIN$),
		TO$ = subexp(ADDR_SPEC$ + subexp("\\," + ADDR_SPEC$) + "*"),
		HFNAME$ = subexp(QCHAR$ + "*"),
		HFVALUE$ = HFNAME$,
		HFIELD$ = subexp(HFNAME$ + "\\=" + HFVALUE$),
		HFIELDS2$ = subexp(HFIELD$ + subexp("\\&" + HFIELD$) + "*"),
		HFIELDS$ = subexp("\\?" + HFIELDS2$),
		MAILTO_URI = URI.VALIDATE_SUPPORT && new RegExp("^mailto\\:" + TO$ + "?" + HFIELDS$ + "?$"),

		UNRESERVED = new RegExp(UNRESERVED$$, "g"),
		PCT_ENCODED = new RegExp(PCT_ENCODED$, "g"),
		NOT_LOCAL_PART = new RegExp(merge("[^]", ATEXT$$, "[\\.]", '[\\"]', VCHAR$$), "g"),
		NOT_DOMAIN = new RegExp(merge("[^]", ATEXT$$, "[\\.]", "[\\[]", DTEXT_NO_OBS$$, "[\\]]"), "g"),
		NOT_HFNAME = new RegExp(merge("[^]", UNRESERVED$$, SOME_DELIMS$$), "g"),
		NOT_HFVALUE = NOT_HFNAME,
		TO = URI.VALIDATE_SUPPORT && new RegExp("^" + TO$ + "$"),
		HFIELDS = URI.VALIDATE_SUPPORT && new RegExp("^" + HFIELDS2$ + "$")
	;

	function toUpperCase(str:string):string {
		return str.toUpperCase();
	}

	function decodeUnreserved(str:string):string {
		var decStr = URI.pctDecChars(str);
		return (!decStr.match(UNRESERVED) ? str : decStr);
	}

	function toArray(obj:any):Array<any> {
		return obj !== undefined && obj !== null ? (obj instanceof Array && !obj.callee ? obj : (typeof obj.length !== "number" || obj.split || obj.setInterval || obj.call ? [obj] : Array.prototype.slice.call(obj))) : [];
	}

	URI.SCHEMES["mailto"] = {
		parse : function (components:MailtoComponents, options:URIOptions):MailtoComponents {
			if (URI.VALIDATE_SUPPORT && !components.error) {
				if (components.path && !TO.test(components.path)) {
					components.error = "Email address is not valid";
				} else if (components.query && !HFIELDS.test(components.query)) {
					components.error = "Header fields are invalid";
				}
			}

			let to = components.to = (components.path ? components.path.split(",") : []);
			components.path = undefined;

			if (components.query) {
				let unknownHeaders = false, headers:MailtoHeaders = {};

				let hfields = components.query.split("&");
				for (let x = 0, xl = hfields.length; x < xl; ++x) {
					let hfield = hfields[x].split("=");

					switch (hfield[0]) {
						case "to":
							let toAddrs = hfield[1].split(",");
							for (let x = 0, xl = toAddrs.length; x < xl; ++x) {
								to.push(toAddrs[x]);
							}
							break;
						case "subject":
							components.subject = URI.unescapeComponent(hfield[1], options);
							break;
						case "body":
							components.body = URI.unescapeComponent(hfield[1], options);
							break;
						default:
							unknownHeaders = true;
							headers[URI.unescapeComponent(hfield[0], options)] = URI.unescapeComponent(hfield[1], options);
							break;
					}
				}

				if (unknownHeaders) components.headers = headers;
			}
			components.query = undefined;

			for (let x = 0, xl = to.length; x < xl; ++x) {
				let addr = to[x].split("@");

				addr[0] = URI.unescapeComponent(addr[0]);

				if (typeof punycode !== "undefined" && !options.unicodeSupport) {
					//convert Unicode IDN -> ASCII IDN
					try {
						addr[1] = punycode.toASCII(URI.unescapeComponent(addr[1], options).toLowerCase());
					} catch (e) {
						components.error = components.error || "Email address's domain name can not be converted to ASCII via punycode: " + e;
					}
				} else {
					addr[1] = URI.unescapeComponent(addr[1], options).toLowerCase();
				}

				to[x] = addr.join("@");
			}

			return components;
		},
		
		serialize : function (components:MailtoComponents, options:URIOptions):URIComponents {
			let to = toArray(components.to);
			if (to) {
				for (let x = 0, xl = to.length; x < xl; ++x) {
					let toAddr = String(to[x]);
					let atIdx = toAddr.lastIndexOf("@");
					let localPart = toAddr.slice(0, atIdx);
					let domain = toAddr.slice(atIdx + 1);
					
					localPart = localPart.replace(PCT_ENCODED, decodeUnreserved).replace(PCT_ENCODED, toUpperCase).replace(NOT_LOCAL_PART, URI.pctEncChar);

					if (typeof punycode !== "undefined") {
						//convert IDN via punycode
						try {
							domain = (!options.iri ? punycode.toASCII(URI.unescapeComponent(domain, options).toLowerCase()) : punycode.toUnicode(domain));
						} catch (e) {
							components.error = components.error || "Email address's domain name can not be converted to " + (!options.iri ? "ASCII" : "Unicode") + " via punycode: " + e;
						}
					} else {
						domain = domain.replace(PCT_ENCODED, decodeUnreserved).toLowerCase().replace(PCT_ENCODED, toUpperCase).replace(NOT_DOMAIN, URI.pctEncChar);
					}

					to[x] = localPart + "@" + domain;
				}

				components.path = to.join(",");
			}

			let headers = components.headers = components.headers || {};

			if (components.subject) headers["subject"] = components.subject;
			if (components.body) headers["body"] = components.body;

			let fields = [];
			for (let name in headers) {
				if (headers[name] !== O[name]) {
					fields.push(
						name.replace(PCT_ENCODED, decodeUnreserved).replace(PCT_ENCODED, toUpperCase).replace(NOT_HFNAME, URI.pctEncChar) + 
						"=" + 
						headers[name].replace(PCT_ENCODED, decodeUnreserved).replace(PCT_ENCODED, toUpperCase).replace(NOT_HFVALUE, URI.pctEncChar)
					);
				}
			}
			if (fields.length) {
				components.query = fields.join("&");
			}

			return components;
		}
	}
})();