
import { computed, observable, SetupError, commit } from "../dist/shrewd";

/**
 * 使用說明：
 * 
 * 在底下的這個 Tests 物件裡面加入新的方法便是一組測試。
 * 在測試中的任何時間點執行 console.assert 以檢查一個執行結果，
 * 不通過的話目前的這一組測試就會中止並且回報錯誤；
 * 其餘測試仍然會繼續執行。
 */

const Tests: { [test: string]: () => void } = {

	Basic() {
		class A {
			@observable public a: number;
			constructor(a: number) {
				this.a = a;
			}
		}

		class B {
			private a: A;
			constructor(a: A) {
				this.a = a;
			}
			@computed public get b() {
				n *= 2;
				return this.a.a;
			}
		}

		var n = 1;
		var a = new A(0);
		var b = new B(a);

		console.assert(b.b === 0, "第一次呼叫 b.b 會使計算屬性初始化並且開始監視", b.b);
		console.assert(b.b === 0 && n === 2, "再次存取 b.b 不應該重新執行計算", n);

		a.a = 12;
		console.assert(b.b === 0 && n === 2, "在認可之前，b.b 的值不會改變", n);
		commit();
		console.assert(b.b === 12 && n === 4, "認可動作應該自動執行 b.b 的計算並更新", b.b, n);
	},

	ComputedOverride() {
		class A {
			@observable public num: number = 0;
			@computed public get value() {
				n *= 2;
				return this.num % 2;
			}
		}

		class B extends A {
			@computed public get value() {
				n *= 3;
				return super.value;
			}
		}

		var b = new B(), n = 1;
		b.num = 1;
		console.assert(b.value == 1 && n == 6, "兩個層級的 value 都會被呼叫", b.value, n);

		b.num = 3;
		commit();
		console.assert(b.value == 1 && n == 12, "執行會在 A 的層次停住", b.value, n);
	},

	ObservableValidation() {
		class A {

			@observable public max = 10;

			// 這是一個具有稽核的可觀測屬性，而且其稽核規則引用了另一個可觀測值。
			@observable(function(this: A, v: number) {
				n++;
				return v > this.max ? this.max : v;
			})
			public value: number = 0;
		}

		var a = new A(), n = 0;
		a.value = 5;
		console.assert(a.value === 5 && n === 1, "輸入可接受的值無妨");

		a.value = 20;
		console.assert(a.value === 10 && n === 2, "超過範圍的值會被修正", a.value);
		a.value = 20;
		console.assert(n === 2, "輸入同樣的數字不會重新稽核");

		a.max = 8;
		console.assert(a.value === 10 && n === 2, "認可之前不會重新稽核", a.value);
		commit();
		console.assert(a.value === 8 && n === 3, "認可之後執行稽核", a.value);

		a.max = 12;
		commit();
		console.assert(a.value === 12 && n === 4, "會記得未稽核的值，以隨著新的稽核條件作出恢復");
	},

	DecoratorRequirement() {
		var error: Error | undefined;
		try {
			class A {
				@computed public get value() { return 1; }
				public set value(v) { }
			}
		} catch(e) {
			if(e instanceof SetupError) error = e;
			else throw e;
		}
		console.assert(error instanceof SetupError && error.class == "A" && error.prop == "value",
			"類別 A 的 value 屬性設置了 setter 是不能裝飾為 computed 的");

		error = undefined;
		try {
			class B {
				@observable public get value() { return 1; }
			}
		} catch(e) {
			if(e instanceof SetupError) error = e;
			else throw e;
		}
		console.assert(error instanceof SetupError && error.class == "B" && error.prop == "value",
			"類別 B 的 value 屬性是不能裝飾為 observable 的");
	},

};

let assert = console.assert;
let pass: boolean = true;
console.assert = (a: boolean, ...obj: any[]) => { assert(a, ...obj); if(!a) throw true; }
for(let test in Tests) {
	try {
		Tests[test]();
	} catch(e) {
		if(e instanceof Error) console.error(e);
		console.log(`\x1b[31m${test} : failed\x1b[0m`);
		pass = false;
	}
}
if(pass) console.log("\x1b[32mAll tests succeeded.\x1b[0m");
console.assert = assert;
