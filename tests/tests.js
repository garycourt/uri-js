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
	//strictEqual(components.authority, undefined, "authority");
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
	//strictEqual(components.authority, "@", "authority");
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
	//strictEqual(components.authority, "", "authority");
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
	//strictEqual(components.authority, ":", "authority");
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
	//strictEqual(components.authority, undefined, "authority");
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
	//strictEqual(components.authority, undefined, "authority");
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
	//strictEqual(components.authority, undefined, "authority");
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
	//strictEqual(components.authority, "user:pass@example.com:123", "authority");
	strictEqual(components.userinfo, "user:pass", "userinfo");
	strictEqual(components.host, "example.com", "host");
	strictEqual(components.port, 123, "port");
	strictEqual(components.path, "/one/two.three", "path");
	strictEqual(components.query, "q1=a1&q2=a2", "query");
	strictEqual(components.fragment, "body", "fragment");
	
	//IPv4address
	components = URI.parse("//10.10.10.10/test");
	strictEqual(components.errors.length, 0, "IPv4address errors");
	strictEqual(components.scheme, undefined, "scheme");
	strictEqual(components.userinfo, undefined, "userinfo");
	strictEqual(components.host, "10.10.10.10", "host");
	strictEqual(components.port, undefined, "port");
	strictEqual(components.path, "/test", "path");
	strictEqual(components.query, undefined, "query");
	strictEqual(components.fragment, undefined, "fragment");
	
	//mixed IPv4address & reg-name, example from terion-name (https://github.com/garycourt/uri-js/issues/4)
	components = URI.parse("uri://10.10.10.10.example.com/en/process");
	strictEqual(components.errors.length, 0, "mixed errors");
	strictEqual(components.scheme, "uri", "scheme");
	strictEqual(components.userinfo, undefined, "userinfo");
	strictEqual(components.host, "10.10.10.10.example.com", "host");
	strictEqual(components.port, undefined, "port");
	strictEqual(components.path, "/en/process", "path");
	strictEqual(components.query, undefined, "query");
	strictEqual(components.fragment, undefined, "fragment");
});

test("URI Serialization", function () {
	var components = {
		scheme : undefined,
		userinfo : undefined,
		host : undefined,
		port : undefined,
		path : undefined,
		query : undefined,
		fragment : undefined
	};
	strictEqual(URI.serialize(components), "", "Undefined Components");
	
	components = {
		scheme : "",
		userinfo : "",
		host : "",
		port : 0,
		path : "",
		query : "",
		fragment : ""
	};
	strictEqual(URI.serialize(components), "//@:0?#", "Empty Components");
	
	components = {
		scheme : "uri",
		userinfo : "foo:bar",
		host : "example.com",
		port : 1,
		path : "path",
		query : "query",
		fragment : "fragment"
	};
	strictEqual(URI.serialize(components), "uri://foo:bar@example.com:1/path?query#fragment", "All Components");
	
	strictEqual(URI.serialize({path:"//path"}), "/%2Fpath", "Double slash path");
	strictEqual(URI.serialize({path:"foo:bar"}), "foo%3Abar", "Colon path");
	strictEqual(URI.serialize({path:"?query"}), "%3Fquery", "Query path");
});

test("URI Resolving", function () {
	//normal examples from RFC 3986
	var base = "uri://a/b/c/d;p?q";
	strictEqual(URI.resolve(base, "g:h"), "g:h", "g:h");
	strictEqual(URI.resolve(base, "g:h"), "g:h", "g:h");
	strictEqual(URI.resolve(base, "g"), "uri://a/b/c/g", "g");
	strictEqual(URI.resolve(base, "./g"), "uri://a/b/c/g", "./g");
	strictEqual(URI.resolve(base, "g/"), "uri://a/b/c/g/", "g/");
	strictEqual(URI.resolve(base, "/g"), "uri://a/g", "/g");
	strictEqual(URI.resolve(base, "//g"), "uri://g", "//g");
	strictEqual(URI.resolve(base, "?y"), "uri://a/b/c/d;p?y", "?y");
	strictEqual(URI.resolve(base, "g?y"), "uri://a/b/c/g?y", "g?y");
	strictEqual(URI.resolve(base, "#s"), "uri://a/b/c/d;p?q#s", "#s");
	strictEqual(URI.resolve(base, "g#s"), "uri://a/b/c/g#s", "g#s");
	strictEqual(URI.resolve(base, "g?y#s"), "uri://a/b/c/g?y#s", "g?y#s");
	strictEqual(URI.resolve(base, ";x"), "uri://a/b/c/;x", ";x");
	strictEqual(URI.resolve(base, "g;x"), "uri://a/b/c/g;x", "g;x");
	strictEqual(URI.resolve(base, "g;x?y#s"), "uri://a/b/c/g;x?y#s", "g;x?y#s");
	strictEqual(URI.resolve(base, ""), "uri://a/b/c/d;p?q", "");
	strictEqual(URI.resolve(base, "."), "uri://a/b/c/", ".");
	strictEqual(URI.resolve(base, "./"), "uri://a/b/c/", "./");
	strictEqual(URI.resolve(base, ".."), "uri://a/b/", "..");
	strictEqual(URI.resolve(base, "../"), "uri://a/b/", "../");
	strictEqual(URI.resolve(base, "../g"), "uri://a/b/g", "../g");
	strictEqual(URI.resolve(base, "../.."), "uri://a/", "../..");
	strictEqual(URI.resolve(base, "../../"), "uri://a/", "../../");
	strictEqual(URI.resolve(base, "../../g"), "uri://a/g", "../../g");
	
	//abnormal examples from RFC 3986
	strictEqual(URI.resolve(base, "../../../g"), "uri://a/g", "../../../g");
	strictEqual(URI.resolve(base, "../../../../g"), "uri://a/g", "../../../../g");
	
	strictEqual(URI.resolve(base, "/./g"), "uri://a/g", "/./g");
	strictEqual(URI.resolve(base, "/../g"), "uri://a/g", "/../g");
	strictEqual(URI.resolve(base, "g."), "uri://a/b/c/g.", "g.");
	strictEqual(URI.resolve(base, ".g"), "uri://a/b/c/.g", ".g");
	strictEqual(URI.resolve(base, "g.."), "uri://a/b/c/g..", "g..");
	strictEqual(URI.resolve(base, "..g"), "uri://a/b/c/..g", "..g");
      
	strictEqual(URI.resolve(base, "./../g"), "uri://a/b/g", "./../g");
	strictEqual(URI.resolve(base, "./g/."), "uri://a/b/c/g/", "./g/.");
	strictEqual(URI.resolve(base, "g/./h"), "uri://a/b/c/g/h", "g/./h");
	strictEqual(URI.resolve(base, "g/../h"), "uri://a/b/c/h", "g/../h");
	strictEqual(URI.resolve(base, "g;x=1/./y"), "uri://a/b/c/g;x=1/y", "g;x=1/./y");
	strictEqual(URI.resolve(base, "g;x=1/../y"), "uri://a/b/c/y", "g;x=1/../y");
      
	strictEqual(URI.resolve(base, "g?y/./x"), "uri://a/b/c/g?y/./x", "g?y/./x");
	strictEqual(URI.resolve(base, "g?y/../x"), "uri://a/b/c/g?y/../x", "g?y/../x");
	strictEqual(URI.resolve(base, "g#s/./x"), "uri://a/b/c/g#s/./x", "g#s/./x");
	strictEqual(URI.resolve(base, "g#s/../x"), "uri://a/b/c/g#s/../x", "g#s/../x");
      
	strictEqual(URI.resolve(base, "uri:g"), "uri:g", "uri:g");
	strictEqual(URI.resolve(base, "uri:g", {tolerant:true}), "uri://a/b/c/g", "uri:g");
    
	//examples by PAEz
	strictEqual(URI.resolve("//www.g.com/","/adf\ngf"), "//www.g.com/adf%0Agf", "/adf\\ngf");
	strictEqual(URI.resolve("//www.g.com/error\n/bleh/bleh",".."), "//www.g.com/error%0A/", "//www.g.com/error\\n/bleh/bleh");
});

test("URI Normalizing", function () {
	//test from RFC 3987
	strictEqual(URI.normalize("uri://www.example.org/red%09ros\xE9#red"), "uri://www.example.org/red%09ros%C3%A9#red");
});

test("URI Equals", function () {
	//test from RFC 3986
	strictEqual(URI.equal("example://a/b/c/%7Bfoo%7D", "eXAMPLE://a/./b/../b/%63/%7bfoo%7d"), true);
	
	//test from RFC 3987
	strictEqual(URI.equal("http://example.org/~user", "http://example.org/%7euser"), true);
});

test("Escape Component", function () {
	var chr;
	for (var d = 0; d <= 129; ++d) {
		chr = String.fromCharCode(d);
		if (!chr.match(/[\$\&\+\,\;\=]/)) {
			strictEqual(URI.escapeComponent(chr), encodeURIComponent(chr));
		} else {
			strictEqual(URI.escapeComponent(chr), chr);
		}
	}
	strictEqual(URI.escapeComponent("\u00c0"), encodeURIComponent("\u00c0"));
	strictEqual(URI.escapeComponent("\u07ff"), encodeURIComponent("\u07ff"));
	strictEqual(URI.escapeComponent("\u0800"), encodeURIComponent("\u0800"));
	strictEqual(URI.escapeComponent("\u30a2"), encodeURIComponent("\u30a2"));
});

test("Unescape Component", function () {
	var chr;
	for (var d = 0; d <= 129; ++d) {
		chr = String.fromCharCode(d);
		strictEqual(URI.unescapeComponent(encodeURIComponent(chr)), chr);
	}
	strictEqual(URI.unescapeComponent(encodeURIComponent("\u00c0")), "\u00c0");
	strictEqual(URI.unescapeComponent(encodeURIComponent("\u07ff")), "\u07ff");
	strictEqual(URI.unescapeComponent(encodeURIComponent("\u0800")), "\u0800");
	strictEqual(URI.unescapeComponent(encodeURIComponent("\u30a2")), "\u30a2");
});

//
// IRI
//

var IRI_OPTION = { iri : true };

test("IRI Parsing", function () {
	var components = URI.parse("uri://us\xA0er:pa\uD7FFss@example.com:123/o\uF900ne/t\uFDCFwo.t\uFDF0hree?q1=a1\uF8FF\uE000&q2=a2#bo\uFFEFdy", IRI_OPTION);
	strictEqual(components.errors.length, 0, "all errors");
	strictEqual(components.scheme, "uri", "scheme");
	//strictEqual(components.authority, "us\xA0er:pa\uD7FFss@example.com:123", "authority");
	strictEqual(components.userinfo, "us\xA0er:pa\uD7FFss", "userinfo");
	strictEqual(components.host, "example.com", "host");
	strictEqual(components.port, 123, "port");
	strictEqual(components.path, "/o\uF900ne/t\uFDCFwo.t\uFDF0hree", "path");
	strictEqual(components.query, "q1=a1\uF8FF\uE000&q2=a2", "query");
	strictEqual(components.fragment, "bo\uFFEFdy", "fragment");
});

test("IRI Serialization", function () {
	var components = {
		scheme : "uri",
		userinfo : "us\xA0er:pa\uD7FFss",
		host : "example.com",
		port : 123,
		path : "/o\uF900ne/t\uFDCFwo.t\uFDF0hree",
		query : "q1=a1\uF8FF\uE000&q2=a2",
		fragment : "bo\uFFEFdy\uE001"
	};
	strictEqual(URI.serialize(components, IRI_OPTION), "uri://us\xA0er:pa\uD7FFss@example.com:123/o\uF900ne/t\uFDCFwo.t\uFDF0hree?q1=a1\uF8FF\uE000&q2=a2#bo\uFFEFdy%EE%80%81");
});

test("IRI Normalizing", function () {
	strictEqual(URI.normalize("uri://www.example.org/red%09ros\xE9#red", IRI_OPTION), "uri://www.example.org/red%09ros\xE9#red");
});

test("IRI Equals", function () {
	//example from RFC 3987
	strictEqual(URI.equal("example://a/b/c/%7Bfoo%7D/ros\xE9", "eXAMPLE://a/./b/../b/%63/%7bfoo%7d/ros%C3%A9", IRI_OPTION), true);
});

test("Convert IRI to URI", function () {
	//example from RFC 3987
	strictEqual(URI.serialize(URI.parse("uri://www.example.org/red%09ros\xE9#red", IRI_OPTION)), "uri://www.example.org/red%09ros%C3%A9#red");
	
	//Internationalized Domain Name conversion via punycode example from RFC 3987
	strictEqual(URI.serialize(URI.parse("uri://r\xE9sum\xE9.example.org", {iri:true, domainHost:true}), {domainHost:true}), "uri://xn--rsum-bpad.example.org");
});

test("Convert URI to IRI", function () {
	//examples from RFC 3987
	strictEqual(URI.serialize(URI.parse("uri://www.example.org/D%C3%BCrst"), IRI_OPTION), "uri://www.example.org/D\xFCrst");
	strictEqual(URI.serialize(URI.parse("uri://www.example.org/D%FCrst"), IRI_OPTION), "uri://www.example.org/D%FCrst");
	strictEqual(URI.serialize(URI.parse("uri://xn--99zt52a.example.org/%e2%80%ae"), IRI_OPTION), "uri://xn--99zt52a.example.org/%E2%80%AE");  //or uri://\u7D0D\u8C46.example.org/%E2%80%AE
	
	//Internationalized Domain Name conversion via punycode example from RFC 3987
	strictEqual(URI.serialize(URI.parse("uri://xn--rsum-bpad.example.org", {domainHost:true}), {iri:true, domainHost:true}), "uri://r\xE9sum\xE9.example.org");
});

//
// HTTP
//

module("HTTP");

test("HTTP Equals", function () {
	//test from RFC 2616
	strictEqual(URI.equal("http://abc.com:80/~smith/home.html", "http://abc.com/~smith/home.html"), true);
	strictEqual(URI.equal("http://ABC.com/%7Esmith/home.html", "http://abc.com/~smith/home.html"), true);
	strictEqual(URI.equal("http://ABC.com:/%7esmith/home.html", "http://abc.com/~smith/home.html"), true);
	strictEqual(URI.equal("HTTP://ABC.COM", "http://abc.com/"), true);
	//test from RFC 3986
	strictEqual(URI.equal("http://example.com:/", "http://example.com:80/"), true);
});

//
// HTTP
//

module("HTTPS");

test("HTTPS Equals", function () {
	strictEqual(URI.equal("https://example.com", "https://example.com:443/"), true);
	strictEqual(URI.equal("https://example.com:/", "https://example.com:443/"), true);
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
	//strictEqual(components.authority, undefined, "authority");
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

test("UUID Equals", function () {
	strictEqual(URI.equal("URN:UUID:F81D4FAE-7DEC-11D0-A765-00A0C91E6BF6", "urn:uuid:f81d4fae-7dec-11d0-a765-00a0c91e6bf6"), true);
});