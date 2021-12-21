import { expect } from 'chai';
import { shrewd, option } from '../../dist/shrewd';

describe('Syntax error handling', () => {
	let err = "", warn = console.warn;

	before(() => {
		option.debug = false;
		console.warn = (s: string) => err = s
	});

	after(() => {
		option.debug = true;
		console.warn = warn
	});

	it('reports error if @shrewed is applied to an accessor with setter', () => {
		@shrewd class A {
			@shrewd public get value() { return 1; }
			public set value(v) { }
		}

		expect(err).to.equal("Setup error at A[value]. Decorated member must be one of the following: " +
			"a field, a readonly get accessor, or a method.");
	});

	it('reports error if non-@shrewd class extends @shrewd class', () => {
		@shrewd class A { }
		class B extends A { }

		new B();

		expect(err).to.equal("Class [B] is derived form @shrewd class [A], but it is not decorated with @shrewd.");
	})
});
