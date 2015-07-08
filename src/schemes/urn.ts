///<reference path="../uri.ts"/>
if (typeof COMPILED === "undefined" && typeof URI === "undefined" && typeof require === "function") var URI = <typeof URI>require("../uri");

(function () {
	var pctEncChar = URI.pctEncChar,
		NID$ = "(?:[0-9A-Za-z][0-9A-Za-z\\-]{1,31})",
		PCT_ENCODED$ = "(?:\\%[0-9A-Fa-f]{2})",
		TRANS$$ = "[0-9A-Za-z\\(\\)\\+\\,\\-\\.\\:\\=\\@\\;\\$\\_\\!\\*\\'\\/\\?\\#]",
		NSS$ = "(?:(?:" + PCT_ENCODED$ + "|" + TRANS$$ + ")+)",
		URN_SCHEME = new RegExp("^urn\\:(" + NID$ + ")$"),
		URN_PATH = new RegExp("^(" + NID$ + ")\\:(" + NSS$ + ")$"),
		URN_PARSE = /^([^\:]+)\:(.*)/,
		URN_EXCLUDED = /[\x00-\x20\\\"\&\<\>\[\]\^\`\{\|\}\~\x7F-\xFF]/g,
		UUID = /^[0-9A-Fa-f]{8}(?:\-[0-9A-Fa-f]{4}){3}\-[0-9A-Fa-f]{12}$/;
	
	//RFC 2141
	URI.SCHEMES["urn"] = {
		parse : function (components:URIComponents, options:URIOptions):URIComponents {
			var matches = components.path.match(URN_PATH),
				scheme:string, 
				schemeHandler:URISchemeHandler;
			
			if (!matches) {
				if (!options.tolerant) {
					components.error = components.error || "URN is not strictly valid.";
				}
				
				matches = components.path.match(URN_PARSE);
			}
			
			if (matches) {
				scheme = "urn:" + matches[1].toLowerCase();
				schemeHandler = URI.SCHEMES[scheme];
				
				//in order to serialize properly, 
				//every URN must have a serializer that calls the URN serializer 
				if (!schemeHandler) {
					//create fake scheme handler
					schemeHandler = URI.SCHEMES[scheme] = {
						parse : function (components:URIComponents, options:URIOptions):URIComponents {
							return components;
						},
						serialize : URI.SCHEMES["urn"].serialize
					};
				}
				
				components.scheme = scheme;
				components.path = matches[2];
				
				components = schemeHandler.parse(components, options);
			} else {
				components.error = components.error || "URN can not be parsed.";
			}
	
			return components;
		},
		
		serialize : function (components:URIComponents, options:URIOptions):URIComponents {
			var scheme = components.scheme || options.scheme,
				matches:RegExpMatchArray;
			
			if (scheme && scheme !== "urn") {
				var matches = scheme.match(URN_SCHEME);
				
				if (!matches) {
					matches = ["urn:" + scheme, scheme];
				}
				
				components.scheme = "urn";
				components.path = matches[1] + ":" + (components.path ? components.path.replace(URN_EXCLUDED, pctEncChar) : "");
			}
			
			return components;
		}
	};
	
	//RFC 4122
	URI.SCHEMES["urn:uuid"] = {
		parse : function (components:URIComponents, options:URIOptions):URIComponents {
			if (!options.tolerant && (!components.path || !components.path.match(UUID))) {
				components.error = components.error || "UUID is not valid.";
			}
			return components;
		},
		
		serialize : function (components:URIComponents, options:URIOptions):URIComponents {
			//ensure UUID is valid
			if (!options.tolerant && (!components.path || !components.path.match(UUID))) {
				//invalid UUIDs can not have this scheme
				components.scheme = undefined;
			} else {
				//normalize UUID
				components.path = (components.path || "").toLowerCase();
			}
			
			return URI.SCHEMES["urn"].serialize(components, options);
		}
	};
}());