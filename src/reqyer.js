/**
 * Reqyer.js
 * 
 * @fileoverview Cheaply simulates CommonJS's require/export in non-supporting environments
 * @author <a href="mailto:gary.court@gmail.com">Gary Court</a>
 */

/*global exports:true, require:true */

if (typeof exports === "undefined") { exports = {}; }
if (typeof require !== "function") { require = function (id) { return exports; }; }