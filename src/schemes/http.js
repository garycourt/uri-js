(function () {
	var URI = require("../uri").URI;
	
	//RFC 2616
	URI.SCHEMES["http"] = {
		serialize : function (components, options) {
			//normalize the default port
			if (components.port === 80 || components.port === "") {
				components.port = undefined;
			}
			//normalize the empty path
			if (!components.path) {
				components.path = "/";
			}
			
			//NOTE: We do not parse query strings for HTTP URIs
			//as WWW Form Url Encoded query strings are part of the HTML4+ spec,
			//and not the HTTP spec. 
			
			return components;
		}
	};
}());