import { shrewd, commit } from "../../dist/shrewd";

export = function() {

	class A {
		@shrewd public a: number;
		constructor(a: number) {
			this.a = a;
		}
	}

	class B {
		private a: A;
		constructor(a: A) {
			this.a = a;
		}
		@shrewd public get b() {
			n++;
			return this.a.a;
		}
	}

	class C {
		private b: B;
		constructor(b: B) {
			this.b = b;
		}

		@shrewd public log() {
			this.b.b;
			this.b.b;
			m++;
		}
	}

	var n = 0, m = 0;
	var a = new A(0);
	var b = new B(a);

	console.assert(b.b == 0 && n == 1, "第一次呼叫 b.b 會使計算屬性初始化並且開始監視");
	console.assert(b.b == 0 && n == 1, "手動再次存取 b.b 不會再次執行計算", n);

	a.a = 12;
	commit();
	console.assert(n == 1, "因為 b.b 沒有訂閱者，即使認可也不會自動更新 b.b");
	console.assert(b.b == 12 && n == 2, "不過手動讀取 b.b 仍然是可以的", n);

	a.a = 11;
	var c = new C(b); // 增加一個 b.b 的訂閱者
	c.log();
	console.assert(m == 1 && n == 3, "c.log 的初始化只會執行 b.b 一次", n);

	a.a = 10;
	commit();
	console.assert(m == 2, "c.log 有自動執行", m);
	console.assert(n == 4, "b.b 執行一次", n);
}
