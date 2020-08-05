
// Override "require" function to redirect alias.
const Module = require('module');
const originalRequire = Module.prototype.require;
Module.prototype.require = function() {
	if(arguments[0] == "shrewd") arguments[0] = "../../dist/shrewd.min";
	return originalRequire.apply(this, arguments);
};

// Load all tests.
const requireDir = require('require-dir');
const Tests = requireDir('./tests');

// Override console.assert.
let assert = console.assert;
let pass = true;
console.assert = (a, ...obj) => {
	assert(a, ...obj);
	if(!a) throw true;
};

function log(s) {
	if(process.stdout.isTTY) {
		process.stdout.clearLine();
		process.stdout.cursorTo(0);
		process.stdout.write(s);
	} else {
		// Fallback log for non-TTY console
		console.log(s);
	}
}

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
	for(let test in Tests) {
		try {
			log(`Testing: \x1b[32m${test}\x1b[0m`)
			Tests[test]();

			// To provide better feedback that the tests are really running.
			if(process.stdout.isTTY) await sleep(25);
		} catch(e) {
			if(e instanceof Error) console.error(e);
			log(`\x1b[31m${test} : failed\x1b[0m`);
			pass = false;
			break;
		}
	}
	if(pass) log("\x1b[32mAll tests succeeded.\x1b[0m");
}

run();