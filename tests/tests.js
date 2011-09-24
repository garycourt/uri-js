//
//
// Tests
//
//

test("Acquire URI", function () {
	URI = require("./uri").URI;
	ok(URI);
});

test("URI Parsing", function () {
	var components;
	
	//scheme
	components = URI.parse("uri:");
	strictEqual(components.errors.length, 0, "scheme errors");
	strictEqual(components.scheme, "uri", "scheme");
	strictEqual(components.authority, undefined, "authority");
	strictEqual(components.userinfo, undefined, "userinfo");
	strictEqual(components.host, undefined, "host");
	strictEqual(components.port, undefined, "port");
	strictEqual(components.path, "", "path");
	strictEqual(components.query, undefined, "query");
	strictEqual(components.fragment, undefined, "fragment");
	
	//userinfo
	components = URI.parse("//@");
	strictEqual(components.errors.length, 0, "userinfo errors");
	strictEqual(components.scheme, undefined, "scheme");
	strictEqual(components.authority, "@", "authority");
	strictEqual(components.userinfo, "", "userinfo");
	strictEqual(components.host, "", "host");
	strictEqual(components.port, undefined, "port");
	strictEqual(components.path, "", "path");
	strictEqual(components.query, undefined, "query");
	strictEqual(components.fragment, undefined, "fragment");
	
	//host
	components = URI.parse("//");
	strictEqual(components.errors.length, 0, "host errors");
	strictEqual(components.scheme, undefined, "scheme");
	strictEqual(components.authority, "", "authority");
	strictEqual(components.userinfo, undefined, "userinfo");
	strictEqual(components.host, "", "host");
	strictEqual(components.port, undefined, "port");
	strictEqual(components.path, "", "path");
	strictEqual(components.query, undefined, "query");
	strictEqual(components.fragment, undefined, "fragment");
	
	//port
	components = URI.parse("//:");
	strictEqual(components.errors.length, 0, "port errors");
	strictEqual(components.scheme, undefined, "scheme");
	strictEqual(components.authority, ":", "authority");
	strictEqual(components.userinfo, undefined, "userinfo");
	strictEqual(components.host, "", "host");
	strictEqual(components.port, "", "port");
	strictEqual(components.path, "", "path");
	strictEqual(components.query, undefined, "query");
	strictEqual(components.fragment, undefined, "fragment");
	
	//path
	components = URI.parse("");
	strictEqual(components.errors.length, 0, "path errors");
	strictEqual(components.scheme, undefined, "scheme");
	strictEqual(components.authority, undefined, "authority");
	strictEqual(components.userinfo, undefined, "userinfo");
	strictEqual(components.host, undefined, "host");
	strictEqual(components.port, undefined, "port");
	strictEqual(components.path, "", "path");
	strictEqual(components.query, undefined, "query");
	strictEqual(components.fragment, undefined, "fragment");
	
	//query
	components = URI.parse("?");
	strictEqual(components.errors.length, 0, "query errors");
	strictEqual(components.scheme, undefined, "scheme");
	strictEqual(components.authority, undefined, "authority");
	strictEqual(components.userinfo, undefined, "userinfo");
	strictEqual(components.host, undefined, "host");
	strictEqual(components.port, undefined, "port");
	strictEqual(components.path, "", "path");
	strictEqual(components.query, "", "query");
	strictEqual(components.fragment, undefined, "fragment");
	
	//fragment
	components = URI.parse("#");
	strictEqual(components.errors.length, 0, "fragment errors");
	strictEqual(components.scheme, undefined, "scheme");
	strictEqual(components.authority, undefined, "authority");
	strictEqual(components.userinfo, undefined, "userinfo");
	strictEqual(components.host, undefined, "host");
	strictEqual(components.port, undefined, "port");
	strictEqual(components.path, "", "path");
	strictEqual(components.query, undefined, "query");
	strictEqual(components.fragment, "", "fragment");
	
	//all
	components = URI.parse("uri://user:pass@example.com:123/one/two.three?q1=a1&q2=a2#body");
	strictEqual(components.errors.length, 0, "all errors");
	strictEqual(components.scheme, "uri", "scheme");
	strictEqual(components.authority, "user:pass@example.com:123", "authority");
	strictEqual(components.userinfo, "user:pass", "userinfo");
	strictEqual(components.host, "example.com", "host");
	strictEqual(components.port, 123, "port");
	strictEqual(components.path, "/one/two.three", "path");
	strictEqual(components.query, "q1=a1&q2=a2", "query");
	strictEqual(components.fragment, "body", "fragment");
});

test("URI Serialization", function () {
	var components = {
		scheme : "",
		userinfo : "",
		host : "",
		port : 0,
		path : "",
		query : "",
		fragment : ""
	};
	strictEqual(URI.serialize(components), "//@:0", "Empty Components");
	
	//TODO: NEED MOAR TESTS!!
});

test("URI Resolving", function () {
	//normal examples from RFC 3986
	var base = "http://a/b/c/d;p?q";
	strictEqual(URI.resolve(base, "g:h"), "g:h", "g:h");
	strictEqual(URI.resolve(base, "g:h"), "g:h", "g:h");
	strictEqual(URI.resolve(base, "g"), "http://a/b/c/g", "g");
	strictEqual(URI.resolve(base, "./g"), "http://a/b/c/g", "./g");
	strictEqual(URI.resolve(base, "g/"), "http://a/b/c/g/", "g/");
	strictEqual(URI.resolve(base, "/g"), "http://a/g", "/g");
	strictEqual(URI.resolve(base, "//g"), "http://g", "//g");
	strictEqual(URI.resolve(base, "?y"), "http://a/b/c/d;p?y", "?y");
	strictEqual(URI.resolve(base, "g?y"), "http://a/b/c/g?y", "g?y");
	strictEqual(URI.resolve(base, "#s"), "http://a/b/c/d;p?q#s", "#s");
	strictEqual(URI.resolve(base, "g#s"), "http://a/b/c/g#s", "g#s");
	strictEqual(URI.resolve(base, "g?y#s"), "http://a/b/c/g?y#s", "g?y#s");
	strictEqual(URI.resolve(base, ";x"), "http://a/b/c/;x", ";x");
	strictEqual(URI.resolve(base, "g;x"), "http://a/b/c/g;x", "g;x");
	strictEqual(URI.resolve(base, "g;x?y#s"), "http://a/b/c/g;x?y#s", "g;x?y#s");
	strictEqual(URI.resolve(base, ""), "http://a/b/c/d;p?q", "");
	strictEqual(URI.resolve(base, "."), "http://a/b/c/", ".");
	strictEqual(URI.resolve(base, "./"), "http://a/b/c/", "./");
	strictEqual(URI.resolve(base, ".."), "http://a/b/", "..");
	strictEqual(URI.resolve(base, "../"), "http://a/b/", "../");
	strictEqual(URI.resolve(base, "../g"), "http://a/b/g", "../g");
	strictEqual(URI.resolve(base, "../.."), "http://a/", "../..");
	strictEqual(URI.resolve(base, "../../"), "http://a/", "../../");
	strictEqual(URI.resolve(base, "../../g"), "http://a/g", "../../g");
	
	//abnormal examples from RFC 3986
	strictEqual(URI.resolve(base, "../../../g"), "http://a/g", "../../../g");
	strictEqual(URI.resolve(base, "../../../../g"), "http://a/g", "../../../../g");
	
	strictEqual(URI.resolve(base, "/./g"), "http://a/g", "/./g");
	strictEqual(URI.resolve(base, "/../g"), "http://a/g", "/../g");
	strictEqual(URI.resolve(base, "g."), "http://a/b/c/g.", "g.");
	strictEqual(URI.resolve(base, ".g"), "http://a/b/c/.g", ".g");
	strictEqual(URI.resolve(base, "g.."), "http://a/b/c/g..", "g..");
	strictEqual(URI.resolve(base, "..g"), "http://a/b/c/..g", "..g");
      
	strictEqual(URI.resolve(base, "./../g"), "http://a/b/g", "./../g");
	strictEqual(URI.resolve(base, "./g/."), "http://a/b/c/g/", "./g/.");
	strictEqual(URI.resolve(base, "g/./h"), "http://a/b/c/g/h", "g/./h");
	strictEqual(URI.resolve(base, "g/../h"), "http://a/b/c/h", "g/../h");
	strictEqual(URI.resolve(base, "g;x=1/./y"), "http://a/b/c/g;x=1/y", "g;x=1/./y");
	strictEqual(URI.resolve(base, "g;x=1/../y"), "http://a/b/c/y", "g;x=1/../y");
      
	strictEqual(URI.resolve(base, "g?y/./x"), "http://a/b/c/g?y/./x", "g?y/./x");
	strictEqual(URI.resolve(base, "g?y/../x"), "http://a/b/c/g?y/../x", "g?y/../x");
	strictEqual(URI.resolve(base, "g#s/./x"), "http://a/b/c/g#s/./x", "g#s/./x");
	strictEqual(URI.resolve(base, "g#s/../x"), "http://a/b/c/g#s/../x", "g#s/../x");
      
	strictEqual(URI.resolve(base, "http:g"), "http:g", "http:g");
	strictEqual(URI.resolve(base, "http:g", {tolerant:true}), "http://a/b/c/g", "http:g");
      
});

test("URI Equals", function () {
	//test from RFC 3986
	strictEqual(URI.equal("example://a/b/c/%7Bfoo%7D", "eXAMPLE://a/./b/../b/%63/%7bfoo%7d"), true);
});

test("Escape Component", function () {
	var input = "", output = "";
	for (var d = 32; d < 128; ++d) {
		input += String.fromCharCode(d);
		if (String.fromCharCode(d).match(/[0-9A-Za-z\-\.\_\~\!\$\&\'\(\)\*\+\,\;\=]/)) {
			output += String.fromCharCode(d);
		} else {
			output += "%" + d.toString(16).toUpperCase();
		}
	}
	input += "\u00c0\u30a2";
	output += "%C3%80%E3%82%A2";
	
	strictEqual(URI.escapeComponent(input), output);
});

test("Unescape Component", function () {
	var input = "", output = "";
	for (var d = 32; d < 128; ++d) {
		input += String.fromCharCode(d);
		if (String.fromCharCode(d).match(/[0-9A-Za-z\-\.\_\~\!\$\&\'\(\)\*\+\,\;\=]/)) {
			output += String.fromCharCode(d);
		} else {
			output += "%" + d.toString(16).toUpperCase();
		}
	}
	input += "\u00c0\u30a2";
	output += "%C3%80%E3%82%A2";
	
	strictEqual(URI.unescapeComponent(output), input);
});

//
// URN
//

module("URN");

test("URN Parsing", function () {
	//example from RFC 2141
	var components = URI.parse("urn:foo:a123,456");
	strictEqual(components.errors.length, 0, "errors");
	strictEqual(components.scheme, "urn:foo", "scheme");
	strictEqual(components.authority, undefined, "authority");
	strictEqual(components.userinfo, undefined, "userinfo");
	strictEqual(components.host, undefined, "host");
	strictEqual(components.port, undefined, "port");
	strictEqual(components.path, "a123,456", "path");
	strictEqual(components.query, undefined, "query");
	strictEqual(components.fragment, undefined, "fragment");
});

test("URN Serialization", function () {
	//example from RFC 2141
	var components = {
		scheme : "urn:foo",
		path : "a123,456"
	};
	strictEqual(URI.serialize(components), "urn:foo:a123,456");
});

test("URN Equals", function () {
	//test from RFC 2141
	strictEqual(URI.equal("urn:foo:a123,456", "urn:foo:a123,456"), true);
	strictEqual(URI.equal("urn:foo:a123,456", "URN:foo:a123,456"), true);
	strictEqual(URI.equal("urn:foo:a123,456", "urn:FOO:a123,456"), true);
	strictEqual(URI.equal("urn:foo:a123,456", "urn:foo:A123,456"), false);
	strictEqual(URI.equal("urn:foo:a123%2C456", "URN:FOO:a123%2c456"), true);
});

//
// URN UUID
//

module("URN:UUID");

test("UUID Parsing", function () {
	//example from RFC 4122
	var components = URI.parse("urn:uuid:f81d4fae-7dec-11d0-a765-00a0c91e6bf6");
	strictEqual(components.errors.length, 0, "errors");
	strictEqual(components.scheme, "urn:uuid", "scheme");
	strictEqual(components.path, "f81d4fae-7dec-11d0-a765-00a0c91e6bf6", "path");
	
	components = URI.parse("urn:uuid:notauuid-7dec-11d0-a765-00a0c91e6bf6");
	notStrictEqual(components.errors.length, 0, "errors");
});

test("UUID Serialization", function () {
	//example from RFC 4122
	var components = {
		scheme : "urn:uuid",
		path : "f81d4fae-7dec-11d0-a765-00a0c91e6bf6"
	};
	strictEqual(URI.serialize(components), "urn:uuid:f81d4fae-7dec-11d0-a765-00a0c91e6bf6");
	
	components = {
		scheme : "urn:uuid",
		path : "notauuid-7dec-11d0-a765-00a0c91e6bf6"
	};
	strictEqual(URI.serialize(components), "notauuid-7dec-11d0-a765-00a0c91e6bf6");
});