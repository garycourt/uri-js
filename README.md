# URI.js

URI.js is an [RFC 3986](http://www.ietf.org/rfc/rfc3986.txt) compliant, scheme extendable URI parsing/validating/resolving library for all JavaScript environments (browsers, Node.js, etc).

## Loading

To load in a browser, use the following tag:

	<script type="text/javascript" src="uri-js/dist/uri.min.js"></script>
	
To load in a CommonJS (Node.js) environment, simply use:

	var URI = require("./uri-js");

## API

### Parsing & Validating

	var components = URI.parse("uri://user:pass@example.com:123/one/two.three?q1=a1&q2=a2#body");
	//returns:
	//{
	//  errors : [],
	//  scheme : "uri",
	//  userinfo : "user:pass",
	//  host : "example.com",
	//  port : 123,
	//  path : "/one/two.three",
	//  query : "q1=a1&q2=a2",
	//  fragment : "body"
	//}

### Serializing

	URI.serialize({scheme : "http", host : "example.com", fragment : "footer"}) === "http://example.com/#footer"

### Resolving

	URI.resolve("uri://a/b/c/d?q", "../../g") === "uri://a/g"

### Normalizing

	URI.normalize("HTTP://ABC.com/%7Esmith/home.html") === "http://abc.com/~smith/home.html"

### Comparison

	URI.equal("example://a/b/c/%7Bfoo%7D", "eXAMPLE://a/./b/../b/%63/%7bfoo%7d") === true

### Options

All of the above functions can accept an additional options argument that is an object that can contain one or more of the following properties:

*	`scheme`
	
	Indicates the scheme that the URI should be treated as, overriding the URI's normal scheme parsing behavior.

*	`reference`
	
	If set to `"suffix"`, it indicates that the URI is in the suffix format, and the validator will use the option's `scheme` property to determine the URI's scheme.
	
*	`tolerant`
	
	If set to `true`, the parser will not report invalid URIs. It will also relax URI resolving rules.

## Scheme Extendable

URI.js supports inserting custom [scheme](http://en.wikipedia.org/wiki/URI_scheme) dependent processing rules. For example, here is the code for HTTP scheme normalization:

	URI.SCHEMES["http"] = {
		serialize : function (components, options) {
			//normalize the default port
			if (components.port === 80) {
				components.port = undefined;
			}
			//normalize the empty path
			if (!components.path) {
				components.path = "/";
			}
			
			return components;
		}
	};

Currently, URI.js has built in support for the following schemes:

*	http \[[RFC 2616](http://www.ietf.org/rfc/rfc2616.txt)\]
*	urn \[[RFC 2141](http://www.ietf.org/rfc/rfc2141.txt)\]
*	urn:uuid \[[RFC 4122](http://www.ietf.org/rfc/rfc4122.txt)\]

## License

Copyright 2011 Gary Court. All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1.	Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2.	Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY GARY COURT "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL GARY COURT OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

The views and conclusions contained in the software and documentation are those of the authors and should not be interpreted as representing official policies, either expressed or implied, of Gary Court.