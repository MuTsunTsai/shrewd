
// Some Test depends on the internal names.
const useMinify = false;

// Override "require" function to redirect alias.
const Module = require('module');
const originalRequire = Module.prototype.require;
const shrewdPath = process.cwd() + "/dist/shrewd" + (useMinify ? ".min" : "");
Module.prototype.require = function() {
	if(arguments[0] == "shrewd") arguments[0] = shrewdPath;
	return originalRequire.apply(this, arguments);
};

// Setup jsdom for Vue testing.
require("jsdom-global")();

// Silence Vue warning.
console.info = () => { }

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

// To enable this feature, use `"console": "integratedTerminal"` in launch.json.
let isTTY = process.stdout.isTTY;

function log(s) {
	if(isTTY) {
		process.stdout.clearLine();
		process.stdout.cursorTo(0);
		process.stdout.write(s);
	} else {
		console.log(s); // Fallback log for non-TTY console
	}
}

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

const Color = require('ansi-colors');
async function run() {
	for(let test in Tests) {
		try {
			log(Color.cyan(`Testing: ${test} `))
			await Tests[test](useMinify);
			if(isTTY) await sleep(25); // To provide better feedback that the tests are really running.
		} catch(e) {
			if(e instanceof Error) console.error(e);
			log(Color.bold.red(`${test} : failed `));
			pass = false;
			break;
		}
	}
	if(pass) log(Color.bold.green("All tests succeeded.\n"));
}

run();