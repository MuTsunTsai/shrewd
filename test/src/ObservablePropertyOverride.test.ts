import { shrewd, commit } from "shrewd";

export = function() {

	@shrewd class A {
		@shrewd public prop: number = 1;
		@shrewd public max: number = 3;
		@shrewd public get output() { return this.prop + 1; }
	}

	@shrewd class B extends A {
		@shrewd({
			renderer(this: B, value: number) {
				return value > this.max ? this.max : value;
			}
		})
		public prop: number = 2;
	}

	var a = new A(), b = new B();

	a.prop = 4;
	b.prop = 4;
	commit();
	console.assert(a.output == 5, "A.prop 並沒有加上 renderer", a.output);
	console.assert(b.output == 4, "因為 B.prop 覆寫了 @shrewd 特性，會自動修正", b.output);

	b.max = 1;
	commit();
	console.assert(b.output == 2, "再次驗證自動修正", b.output);
}