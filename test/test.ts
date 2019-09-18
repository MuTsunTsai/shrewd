
import { shrewd, commit } from "../dist/shrewd";

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
		console.assert(b.b === 0 && n == 2, "手動再次存取 b.b 會再次執行計算", n);

		a.a = 12;
		commit();
		console.assert(n == 2, "因為 b.b 沒有訂閱者，即使認可也不會自動更新 b.b");
		console.assert(b.b == 12 && n == 3, "不過手動讀取 b.b 仍然是可以的", n);

		var c = new C(b); // 增加一個 b.b 的訂閱者
		c.log();
		console.assert(m == 1 && n == 4, "c.log 的初始化只會執行 b.b 一次", n);

		a.a = 10;
		commit();
		console.assert(m == 2, "c.log 有自動執行");
		console.assert(n == 5, "b.b 執行一次");
	},

	ComputedOverride() {
		class A {
			@shrewd public num: number = 0;
			@shrewd public get value() {
				n += "1";
				return this.num % 2;
			}
		}

		class B extends A {
			@shrewd public get value() {
				n += "2";
				return super.value;
			}

			@shrewd public log() {
				n += "3";
				this.value;
				n += "4";
			}
		}

		var b = new B(), n = "";
		b.log();
		console.assert(n == "3214", "第一次執行因為還沒有建立參照關係，是 top-down 的", n);

		n = "";
		b.num = 1;
		console.assert(n == "", "認可前還沒執行重新計算", n);
		commit();
		console.assert(n == "1234", "有了參照關係就會 bottom-up 執行", n);

		n = "";
		b.num = 0;
		b.log();
		console.assert(n == "1234", "有參照關係之後手動階段執行也會是 bottom-up", n);

		n = "";
		b.num = 2;
		commit();
		console.assert(n == "1", "資料流在 A.log 處中斷了");
	},

	ObservableValidation() {
		class A {

			@shrewd public max = 10;

			// 這是一個具有稽核的可觀測屬性，而且其稽核規則引用了另一個可觀測值。
			@shrewd({
				validator(v: number) { return v >= 0; },
				renderer(this: A, v: number) {
					n++;
					return v > this.max ? this.max : v;
				}
			})
			public value: number = 0;

			@shrewd log() { o = this.value; }
		}

		var a = new A(), n = 0, o;
		a.value = 5;
		a.log();
		console.assert(o === 5 && n === 2, "輸入可接受的值無妨", n);

		a.value = 20;
		console.assert((o = a.value) === 10 && n === 3, "超過範圍的值會被修正", o, n);
		a.value = 20;
		console.assert(n === 3, "輸入同樣的數字不會重新稽核", n);

		a.max = 8;
		console.assert((o = a.value) === 8 && n === 4, "手動執行也會執行稽核", o, n);
		commit();
		console.assert(o === 8 && n === 4, "因為已經執行過，所以不會再次稽核", o, n);

		a.max = 12;
		commit();
		console.assert(o === 12 && n === 5, "會記得未稽核的值，以隨著新的稽核條件作出恢復");

		a.value = -3;
		console.assert(o === 12 && n === 5, "規則說如果指定負數，則完全不改變", o, n);
	},

	DecoratorRequirement() {
		var error: any;
		try {
			class A {
				@shrewd public get value() { return 1; }
				public set value(v) { }
			}
		} catch(e) {
			error = e;
		}
		console.assert(error.class == "A" && error.prop == "value",
			"類別 A 的 value 屬性設置了 setter 是不能裝飾為 computed 的");
	},

	ReactiveMethod() {
		class A {
			constructor() {
				this.log(); // 自我啟動
			}

			public n = 0;

			@shrewd public value = 0;

			@shrewd public get middle() {
				return this.value % 2;
			}

			@shrewd public log() {
				this.middle; // 純粹讀取來使得 log 參照之
				this.n++;
			}
		}

		var a = new A();
		console.assert(a.n === 1, "初次執行");

		a.value = 1;
		commit();
		console.assert(a.middle === 1, "中間值改變");
		console.assert(a.n === 2, "參照值改變導致 log 再次執行", a.n);
		commit();
		console.assert(a.n === 2, "如果沒有任何改變，再次認可並不會再次執行 log");

		a.value = 3;
		commit();
		console.assert(a.n === 2, "因為中間值沒改變，log 不重新執行");

		a.value = 2;
		commit();
		console.assert(a.n === 3, "再次執行 log");
	},

	ReactiveOverride() {
		class A {
			public n = "";
			@shrewd public value = 1;
			@shrewd log(): any {
				this.n += "1";
				return this.value != 3;
			}
		}

		class B extends A {
			@shrewd log() {
				// 下層方法唯一參照到的就是上層方法；只要上層方法被執行，就會通知下層方法去執行
				this.n += "2"
				if(!super.log()) return;
				this.n += "3";
			}
		}

		var b = new B();
		b.log();
		console.assert(b.n == "213", "兩個層次的 log 都有被執行，且因為是獨立呼叫，下層優先", b.n);

		b.n = "";
		b.value = 2;
		commit();
		console.assert(b.n == "123", "兩個層次的 log 都恰再次被執行一次", b.n);

		b.n = "";
		b.value = 3;
		commit();
		console.assert(b.n == "12", "回傳值中斷", b.n);
	},

	ObservableArray() {
		class A {
			@shrewd private prop = 0;

			@shrewd({
				renderer(this: A, arr: number[]) {
					// 如果開啟下面這一行，程式將會發出警告
					// this.prop = 1;
					let j = 0;
					for(let i = 0; i < arr.length; i++) {
						if(arr[i] != 1) arr[j++] = arr[i];
					}
					arr.length = j;
					return arr;
				}
			}) public arr: number[] = [];

			@shrewd public get total() {
				n++;
				return this.arr.reduce((t, v) => t + v, 0);
			}

			@shrewd public log() {
				t = this.total; // 用個反應方法讀取以便觸發自動更新
			}
		}

		var n = 0, t;
		var a = new A();
		a.log();

		a.arr.push(1, 2, 3);
		commit();
		console.assert(a.arr.length == 2, "稽核會殺掉元素 1", a.arr.toString());
		console.assert(n == 2, "會紀錄到陣列的變更", n);
		console.assert(t == 5, "計算出結果");

		a.arr.push(1);
		commit();
		console.assert(a.arr.length == 2, "錯誤的元素加不進去", a.arr.length);
		console.assert(n == 3, "雖然稽核把陣列修正了回來，但是仍然視為是曾經變更過", n);

		a.arr[1] = 2;
		commit();
		console.assert(n == 4, "陣列元素變更會偵測到");
		console.assert(t == 4, "更新計算結果");

		a.arr[1] = 2;
		commit();
		console.assert(n == 4, "指定同樣的內容並不會觸發通知");
	},

	ObservableSet() {
		class A {

			// 稽核條件：不可以有偶數
			@shrewd({
				renderer(this: A, v: Set<number>) {
					for(let n of v) if(n % 2 == 0) v.delete(n);
					return v;
				}
			}) public set: Set<number> = new Set();

			@shrewd public log() {
				count = this.set.size;
				n++;
			}
		}

		var count = 0, n = 0;
		var a = new A();
		a.set.add(1);
		a.set.add(2);
		a.set.add(3);
		a.log();
		console.assert(count == 2 && n == 1, "初始計數", count, n);

		a.set.add(5);
		commit();
		console.assert(count == 3 && n == 2, "自動更新");

		a.set.add(5);
		commit();
		console.assert(count == 3 && n == 2, "沒有實際上的變更發生");

		a.set.clear();
		commit();
		console.assert(count == 0 && n == 3, "自動更新");
	},

	ObservableObject() {
		class A {
			@shrewd public value: { [key: string]: any } = {
				prop: 1
			};

			@shrewd public log() {
				m = this.value.prop;
				if("new" in this.value) m += this.value.new.value;
				n++;
			}
		}

		var n = 0, m = 0;
		var a = new A();
		a.log();
		console.assert(n == 1 && m == 1, "初始紀錄", n, m);

		a.value.prop = 2;
		a.value.prop = 3;
		commit();
		console.assert(n == 2 && m == 3, "自動更新", n, m);

		a.value.new = { value: 1 };
		commit();
		console.assert(n == 3 && m == 4, "加入新的屬性為純粹物件", n, m);

		a.value.new.value = 2;
		commit();
		console.assert(n == 4 && m == 5, "新加的屬性物件之屬性也具有反應能力", n, m);
	},

	Independent() {
		class A {
			@shrewd public value = 1;
			@shrewd public lookAtValue = true;

			@shrewd public get c1() {
				t += "1";
				return this.value;
			}

			@shrewd public get c2() {
				t += "2";
				return this.c1;
			}

			@shrewd log() {
				t += "3";
				if(this.lookAtValue) this.c2;
			}
		}

		var t = "";
		var a = new A();
		a.log();
		console.assert(t == "321", "初始執行", t);

		t = "";
		a.value = 2;
		commit();
		console.assert(t == "123", "認可", t);

		t = "";
		a.value = 1;
		a.lookAtValue = false;
		commit();
		console.assert(t == "13", "順序會使得 a.log 先被執行，而使 a.c2 不活躍", t);

		t = "";
		a.value = 2;
		commit();
		console.assert(t == "", "因為 a.value 不再有反應方法相依於它，相依的東西都不會在認可階段執行", t);

		t = "";
		a.lookAtValue = true;
		commit();
		console.assert(t == "321", "重新建立了參照關係", t);
	},

	CircularDependency() {
		class A {
			@shrewd public switch = true;
			@shrewd public get a(): number {
				return this.switch ? 1 : this.b;
			}

			@shrewd public get b(): number {
				return this.a + 1;
			}

			@shrewd log() { this.b; }
		}

		let a = new A();
		a.log();
		console.assert(a.b == 2, "初始值", a.b);

		let err = "";
		try {
			a.switch = false;
			commit();
		} catch(e) {
			if(e instanceof Error) err = e.message;
		}
		console.assert(err == "Circular dependency detected as [object A.b] attempt to read [object A.a].",
			"打開 a.switch 會產生循環參照而出錯", err);
	}
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
