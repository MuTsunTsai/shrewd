import { shrewd, commit } from "../../dist/shrewd";

export = function() {

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
}