//calls o(true) if no error is thrown
function okNoError(func, msg) {
	try {
		func();
		ok(true, msg);
	} catch (e) {
		ok(false, msg + ': ' + e);
	}
}

//calls ok(true) if an error is thrown
function okError(func, msg) {
	try {
		func();
		ok(false, msg);
	} catch (e) {
		ok(true, msg + ': ' + e);
	}
}

//
//
// Tests
//
//

test("Generic URI", function () {
	
});