import { shrewd, commit, symbol } from "shrewd";

export = function(useMinify: boolean) {
	if(useMinify) console.log("Some tests will be skipped due to minifying.");

	@shrewd class A {

		@shrewd public n: number = 1;

		public _c: number = 0;
		public _d: number = 0;

		@shrewd public get c() {
			this._c = this.n + 1;
			return this._c;
		}

		@shrewd public get d() {
			this._d = this.c + 1;
			return this._d;
		}
	}

	var a = new A();

	var so = (a as any)[symbol as any];
	var ac = useMinify ? null : so._members.get("A.c");

	console.assert(a._c == 2 && a._d == 3, "建構完成之後會先自動執行第一次計算屬性", a._c, a._d);

	a.n = 2;
	commit();
	if(!useMinify) console.assert(!ac._isActive, "此時 a.c 非活躍", ac._isActive);
	console.assert(a._c == 2, "因為 a.c 沒有觀測者，它不會自動執行", a._c);
	console.assert(a.c == 3, "手動直接呼叫 a.c 則會觸發其更新", a._c);
	console.assert(a._d == 3, "但是沒被呼叫到的 a.d 仍然不受影響", a._d);
	if(!useMinify) console.assert(!ac._isActive, "但是 a.c 仍然非活躍", ac._isActive);

	a.n = 3;
	commit();
	console.assert(a._c == 3 && a._d == 3, "兩個計算屬性都不會自動被執行", a._c, a._d);
	console.assert(a.d == 5, "跨過一層直接呼叫也會觸發全部的更新", a._d);
	console.assert(a._c == 4 && a._d == 5, "內部值確認", a._c, a._d);
}
