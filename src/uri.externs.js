/**
 * External API declaration for URI.js
 * 
 * @fileoverview Used by the Closure Compiler to determine which variable names are external to URI.js
 * @author <a href="mailto:gary.court@gmail.com">Gary Court</a>
 * @see http://github.com/garycourt/uri-js
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

function URIComponents() {}
URIComponents.prototype = {
	scheme:"",
	userinfo:"",
	host:"",
	port:0,
	path:"",
	query:"",
	fragment:"",
	reference:"",
	error:""
};

function URIOptions() {}
URIOptions.prototype = {
	scheme:"",
	reference:"",
	tolerant:false,
	absolutePath:false,
	iri:false,
	unicodeSupport:false,
	domainHost:false
};

function URISchemeHandler() {} 
URISchemeHandler.prototype = {
	parse : function () {},
	serialize : function () {},
	unicodeSupport:false,
	domainHost:false,
	absolutePath:false
};

/**
 * @library
 */

var URI = {
	IRI_SUPPORT : false,
	VALIDATE_SUPPORT : false,
	pctEncChar : function () {},
	pctDecChars : function () {},
	SCHEMES : {},
	parse : function () {},
	_recomposeAuthority : function () {},
	removeDotSegments : function () {},
	serialize : function () {},
	resolveComponents : function () {},
	resolve : function () {},
	normalize : function () {},
	equal : function () {},
	escapeComponent : function () {},
	unescapeComponent : function () {}
};

var module = {
	exports : {}
};

function require(id) {}

function MailtoComponents() {}
MailtoComponents.prototype = {
	to:[],
	headers:{},
	subject:"",
	body:""
};