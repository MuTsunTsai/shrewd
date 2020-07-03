import { shrewd, commit } from "shrewd";

export = function() {

	@shrewd class A {
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
	commit();
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

}