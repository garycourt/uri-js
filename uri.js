(function () {
	
	var Options, Components, URI,
	
		mergeSet = function () {
			var set = arguments[0],
				x = 1,
				nextSet = arguments[x];
			
			while (nextSet) {
				set = set.slice(0, -1) + nextSet.slice(1);
				nextSet = arguments[++x];
			}
			
			return set;
		},
		
		subexp = function (str) {
			return "(?:" + str + ")";
		},
	
		ALPHA$$ = "[A-Za-z]",
		CR$ = "[\\x0D]",
		DIGIT$$ = "[0-9]",
		DQUOTE$$ = "[\\x22]",
		HEXDIG$$ = mergeSet(DIGIT$$, "[ABCDEF]"),
		LF$$ = "[\\x0A]",
		SP$$ = "[\\x20]",
		PCT_ENCODED$ = subexp("%" + HEXDIG$$ + HEXDIG$$),
		GEN_DELIMS$$ = "[\\:\\/\\?\\#\\[\\]\\@]",
		SUB_DELIMS$$ = "[\\!\\$\\&\\'\\(\\)\\*\\+\\,\\;\\=]",
		RESERVED$$ = mergeSet(GEN_DELIMS$$, SUB_DELIMS$$),
		UNRESERVED$$ = mergeSet(ALPHA$$, DIGIT$$, "[\\-\\.\\_\\~]"),
		SCHEME$ = subexp(ALPHA$$ + mergeSet(ALPHA$$, DIGIT$$, "[\\+\\-\\.]") + "*"),
		USERINFO$ = subexp(subexp(PCT_ENCODED$ + "|" + mergeSet(UNRESERVED$$, SUB_DELIMS$$, "[\\:]")) + "*"),
		DEC_OCTET$ = subexp(DIGIT$$ + "|" + subexp("[1-9]" + DIGIT$$) + "|" + subexp("1" + DIGIT$$ + DIGIT$$) + "|" + subexp("2[0-4]" + DIGIT$$) + "|" + subexp("25[0-5]")),
		IPV4ADDRESS$ = subexp(DEC_OCTET$ + "." + DEC_OCTET$ + "." + DEC_OCTET$ + "." + DEC_OCTET$),
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
		QUERY$ = subexp(subexp(PCHAR$ + "|[\\/\\?]") + "*"),
		FRAGMENT$ = subexp(subexp(PCHAR$ + "|[\\/\\?]") + "*"),
		HIER_PART$ = subexp(subexp("\\/\\/" + AUTHORITY$ + PATH_ABEMPTY$) + "|" + PATH_ABSOLUTE$ + "|" + PATH_ROOTLESS$ + "|" + PATH_EMPTY$),
		URI$ = subexp(SCHEME$ + "\\:" + HIER_PART$ + subexp("\\?" + QUERY$) + "?" + subexp("\\#" + FRAGMENT$) + "?"),
		RELATIVE_PART$ = subexp(subexp("\\/\\/" + AUTHORITY$ + PATH_ABEMPTY$) + "|" + PATH_ABSOLUTE$ + "|" + PATH_NOSCHEME$ + "|" + PATH_EMPTY$),
		RELATIVE_REF$ = subexp(RELATIVE_PART$ + subexp("\\?" + QUERY$) + "?" + subexp("\\#" + FRAGMENT$) + "?"),
		URI_REFERENCE$ = subexp(URI$ + "|" + RELATIVE_REF$),
		ABSOLUTE_URI$ = subexp(SCHEME$ + "\\:" + HIER_PART$ + subexp("\\?" + QUERY$) + "?"),
		
		URI_REF = new RegExp("^" + subexp("(" + URI$ + ")|(" + RELATIVE_REF$ + ")") + "$", "i"),
		GENERIC_REF = new RegExp("^(" + SCHEME$ + ")\\:" + subexp(subexp("\\/\\/(" + AUTHORITY$ + ")") + "?(" + PATH_ABSOLUTE$ + "|" + PATH_ROOTLESS$ + "|" + PATH_EMPTY$ + ")") + subexp("\\?(" + QUERY$ + ")") + "?" + subexp("\\#(" + FRAGMENT$ + ")") + "?$", "i"),
		RELATIVE_REF = new RegExp("^(){0}" + subexp(subexp("\\/\\/(" + AUTHORITY$ + ")") + "?(" + PATH_ABSOLUTE$ + "|" + PATH_NOSCHEME$ + "|" + PATH_EMPTY$ + ")") + subexp("\\?(" + QUERY$ + ")") + "?" + subexp("\\#(" + FRAGMENT$ + ")") + "?$", "i"),
		ABSOLUTE_REF = new RegExp("^(" + SCHEME$ + ")\\:" + subexp(subexp("\\/\\/(" + AUTHORITY$ + ")") + "?(" + PATH_ABSOLUTE$ + "|" + PATH_ROOTLESS$ + "|" + PATH_EMPTY$ + ")") + subexp("\\?(" + QUERY$ + ")") + "?$", "i"),
		SAMEDOC_REF = new RegExp("^" + subexp("\\#(" + FRAGMENT$ + ")") + "?$", "i"),
		AUTHORITY = new RegExp("^" + subexp("(" + USERINFO$ + ")@") + "?(" + HOST$ + ")" + subexp("\\:(" + PORT$ + ")") + "?$", "i"),
		
		URI_PARSE = /^(?:([^:\/?#]+):)?(?:\/\/([^\/?#]*))?([^?#]*)(?:\?([^#]*))?(?:#(.*))?/i;
	
	//debug
	this.URI_REF = URI_REF;
	this.GENERIC_REF = GENERIC_REF;
	this.RELATIVE_REF = RELATIVE_REF;
	this.ABSOLUTE_REF = ABSOLUTE_REF;
	this.SAMEDOC_REF = SAMEDOC_REF;
	this.AUTHORITY = AUTHORITY;
	
	/**
	 * @class
	 */
	
	Options = function () {};
	
	/**
	 * @type Boolean
	 * @default true
	 */
	
	Options.prototype.validate;
	
	/**
	 * @type String
	 */
	
	Options.prototype.scheme;
	
	/**
	 * @type String
	 * @enum "uri", "absolute", "relative", "same-document", "suffix"
	 */
	
	Options.prototype.reference;
	
	/**
	 * @class
	 */
	
	Components = function () {
		this.errors = [];
	};
	
	/**
	 * @type String
	 */
	
	Components.prototype.scheme;
	
	/**
	 * @type String
	 */
	
	Components.prototype.authority;
	
	/**
	 * @type String
	 */
	
	Components.prototype.userinfo;
	
	/**
	 * @type String
	 */
	
	Components.prototype.host;
	
	/**
	 * @type Number
	 */
	
	Components.prototype.port;
	
	/**
	 * @type String
	 */
	
	Components.prototype.path;
	
	/**
	 * @type String
	 */
	
	Components.prototype.query;
	
	/**
	 * @type String
	 */
	
	Components.prototype.fragment;
	
	/**
	 * @type String
	 * @enum "uri", "relative", "same-document"
	 */
	
	Components.prototype.reference;
	
	/**
	 * @type Array
	 */
	
	Components.prototype.errors;
	
	/**
	 * @namespace
	 */
	
	URI = {};
	
	/**
	 * @param {String} uriString
	 * @param {Options} [options]
	 * @returns {Components}
	 */
	
	URI.parse = function (uriString, options) {
		var matches, 
			components = new Components();
		
		uriString = uriString ? uriString.toString() : "";
		options = options || {};
		if (typeof options.validate !== "boolean") {
			options.validate = true;
		}
		
		matches = uriString.match(URI_REF);
		
		if (matches) {
			if (matches[1]) {
				//generic URI
				if (options.reference && !(options.reference === "absolute" && ABSOLUTE_REF.test(uriString)) && options.reference !== "uri") {
					components.errors.push("URI is not a " + options.reference + " reference.");
				}
				matches = uriString.match(GENERIC_REF);
			} else {
				//relative URI
				if (options.reference && !(options.reference === "same-document" && SAMEDOC_REF.test(uriString)) && options.reference !== "relative") {
					components.errors.push("URI is not a " + options.reference + " reference.");
				}
				matches = uriString.match(RELATIVE_REF);
			}
		} else {
			if (options.validate) {
				components.errors.push("URI is not valid.");
			}
			matches = uriString.match(URI_PARSE);
		}
		
		if (matches) {
			components.scheme = matches[1];
			components.authority = matches[2];
			components.path = matches[3] || "";
			components.query = matches[4];
			components.fragment = matches[5];
			
			//process authority  //TODO: Move this into first match
			if (typeof components.authority === "string") {
				matches = components.authority.match(AUTHORITY);
				
				components.userinfo = matches[1];
				components.host = matches[2];
				components.port = matches[3] && parseInt(matches[3]);
			}
			
			if (!components.scheme && !components.authority && !components.path && !components.query) {
				components.reference = "same-document";
			} else if (!components.scheme) {
				components.reference = "relative";
			} else {
				components.reference = "uri";
			}
		} else {
			components.errors.push("URI can not be parsed.");
		}
		
		return components;
	};
	
	this.URI = URI;
	
}());