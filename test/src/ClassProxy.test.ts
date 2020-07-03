import { shrewd } from "shrewd";

export = function() {

	@shrewd class A { }

	@shrewd class B extends A { }

	class C extends A { }

	var b = new B();

	console.assert(b.constructor != B, "B 是 Proxy，所以這樣寫不會成立");
	console.assert(b.constructor == B.prototype.constructor, "但是這樣寫是可以的");
	console.assert(b.constructor.prototype == B.prototype, "原型檢查也會通過");
	console.assert(b instanceof B, "因此可以使用 instanceof 運算子");
	console.assert(b instanceof A, "繼承檢查也沒問題");

	var proto = Object.getPrototypeOf(b);
	console.assert(proto == B.prototype, "原型檢查的另一種寫法");
	proto = Object.getPrototypeOf(proto);
	console.assert(proto == A.prototype, "往上檢查一層");
	proto = Object.getPrototypeOf(proto);
	console.assert(proto == Object.prototype, "再往上一層");

	let err = "", warn = console.warn;
	console.warn = (s: string) => err = s;

	new C();

	console.assert(err == "Class [C] is derived form @shrewd class [A], but it is not decorated with @shrewd.",
		"C 沒有加上 @shrewd 會報錯", err);
	console.warn = warn;
}
