
const requireDir = require('require-dir');
const Tests = requireDir('./tests');

let assert = console.assert;
let pass = true;
console.assert = (a, ...obj) => {
	assert(a, ...obj);
	if(!a) throw true;
};

for(let test in Tests) {
	try {
		Tests[test]();
	} catch(e) {
		if(e instanceof Error) console.error(e);
		console.log(`\x1b[31m${test} : failed\x1b[0m`);
		pass = false;
		break;
	}
}

if(pass) console.log("\x1b[32mAll tests succeeded.\x1b[0m");

console.assert = assert;
