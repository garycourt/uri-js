//CommonJS module proxy; see src/uri.js for implementation
var URI = require("./src/uri");
for (var key in URI) {
	exports[key] = URI[key];
}