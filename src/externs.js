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

/*jslint white: true, sub: true, onevar: true, undef: true, eqeqeq: true, newcap: true, immed: true, indent: 4 */

/**
 * @type {Object}
 */

var exports = {};

/**
 * @param {string} id
 */

function require(id) {}

/**
 * @interface 
 */
 
function Options() {}

Options.prototype = {
	/**
	 * @type boolean
	 */
	
	tolerant : false,
	
	/**
	 * @type string
	 */
	
	scheme : "",
	
	/**
	 * @type string
	 * @values "uri", "absolute", "relative", "same-document", "suffix"
	 */
	
	reference : ""
};

/** 
 * @interface 
 */
 
function URIComponents() {}

URIComponents.prototype = {
	/**
	 * @type string
	 */
	
	scheme : "",
	
	/**
	 * @type string
	 */
	
	authority : "",
	
	/**
	 * @type string
	 */
	
	userinfo : "",
	
	/**
	 * @type string
	 */
	
	host : "",
	
	/**
	 * @type number
	 */
	
	port : 0,
	
	/**
	 * @type string
	 */
	
	path : "",
	
	/**
	 * @type string
	 */
	
	query : "",
	
	/**
	 * @type string
	 */
	
	fragment : "",
	
	/**
	 * @type string
	 * @values "uri", "absolute", "relative", "same-document"
	 */
	
	reference : "",
	
	/**
	 * @type Array
	 */
	
	errors : []
};

		
/** 
 * @interface 
 */

function SchemeHandler() {}

/**
 * @param {URIComponents} components
 * @param {Options} options
 */

SchemeHandler.prototype.parse = function (components, options) {};

/**
 * @param {URIComponents} components
 * @param {Options} options
 */

SchemeHandler.prototype.serialize = function (components, options) {};