import { assert } from 'chai';
import { shrewd, commit } from '../../dist/shrewd';

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
var test: number;

it('Basic Test', () => {
	var a = new A(0);
	var b = new B(a);

	assert(b.b == 0 && n == 1, "在認可前手動呼叫 b.b 會進行初始化");
	commit();
	assert(b.b == 0 && n == 1, "已經更新過了就不會在認可階段再次執行 b.b 的計算");

	a.a = 1;
	assert(test == 0, "認可前不會重新計算 b.b");
	commit();
	assert(test == 0 && n == 1, "由於 b.b 沒有訂閱者，認可也不會重新計算 b.b");
	assert(b.b == 1 && n == 2, "但是如果手動呼叫 b.b 就會執行計算");

	new C(b); // 增加一個 b.b 的訂閱者
	assert(m == 1 && n == 2, "c.log 方法被初始化了");

	a.a = 2;
	assert(test == 1 && n == 2, "認可之前 b.b 還是不會重新計算");
	commit();
	assert(test == 2 && n == 3 && m == 2, "可是這回因為 b.b 有訂閱者是 c.log，會自動重新計算");
});
