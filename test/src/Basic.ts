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
			return test = this.a.a;
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
	var test;

	console.assert(b.b == 0 && n == 1, "在認可前手動呼叫 b.b 會進行初始化", test, n);
	commit();
	console.assert(b.b == 0 && n == 1, "已經更新過了就不會在認可階段再次執行 b.b 的計算", test, n);

	var c = new C(b); // 增加一個 b.b 的訂閱者
	c.log();
	console.assert(m == 0, "反應方法要等到認可才會被執行", m);
	commit();
	console.assert(test == 0 && n == 1 && m == 1, "認可之後 b.b 初始化且執行一次", test, n, m);

	a.a = 10;
	console.assert(test == 0 && n == 1 && m == 1, "如果沒有呼叫，b.b 不會自動更新", test, n, m);
	commit();
	console.assert(test == 10 && n == 2 && m == 2, "認可後自動變更", test, n, m);
}
