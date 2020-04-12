import { shrewd, option } from "../../dist/shrewd";

export = function() {

	let err = "", warn = console.warn;
	console.warn = (s: string) => err = s;

	option.debug = false;

	@shrewd class A {
		@shrewd public get value() { return 1; }
		public set value(v) { }
	}

	console.assert(err == "Setup error at A[value]. Decorated member must be one of the following: " +
		"a field, a readonly get accessor, or a method.", "不正確的設定", err);
	console.warn = warn;
}