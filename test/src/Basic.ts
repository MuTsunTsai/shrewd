import { shrewd, commit } from "../../dist/shrewd";

export = function() {

	@shrewd class A {
		@shrewd public a: number;
		constructor(a: number) {
			this.a = a;
		}
	}

	@shrewd class B {
		private a: A;
		constructor(a: A) {
			this.a = a;
		}
		@shrewd public get b() {
			n++;
			return test = this.a.a;
		}
	}

	@shrewd class C {
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

	a.a = 1;
	console.assert(test == 0, "認可前不會重新計算 b.b", test);
	commit();
	console.assert(test == 0 && n == 1, "由於 b.b 沒有訂閱者，認可也不會重新計算 b.b", test);
	console.assert(b.b == 1 && n == 2, "但是如果手動呼叫 b.b 就會執行計算", test);

	new C(b); // 增加一個 b.b 的訂閱者
	console.assert(m == 1 && n == 2, "c.log 方法被初始化了", m);

	a.a = 2;
	console.assert(test == 1 && n == 2, "認可之前 b.b 還是不會重新計算", test);
	commit();
	console.assert(test == 2 && n == 3 && m == 2, "可是這回因為 b.b 有訂閱者是 c.log，會自動重新計算", test, n, m);
}
