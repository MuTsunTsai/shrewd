import { shrewd, commit } from "shrewd";

export = function() {

	@shrewd class A {
		@shrewd public value = 1;
		@shrewd public lookAtValue = true;

		@shrewd log() {
			t += "3";
			if(this.lookAtValue) this.c2;
		}

		@shrewd public get c2() {
			t += "2";
			return this.c1;
		}

		@shrewd public get c1() {
			t += "1";
			return this.value;
		}
	}

	var t = "";
	var a = new A();
	console.assert(t == "321", "初始執行", t);

	t = "";
	a.value = 2;
	commit();
	console.assert(t == "123", "認可", t);

	t = "";
	a.lookAtValue = false;
	a.value = 1;
	commit();
	console.assert(t == "123", "仍然會依照上次已知的相依性的順序執行", t);

	t = "";
	a.value = 2;
	commit();
	console.assert(t == "", "因為 a.value 不再有反應方法相依於它，相依的東西都不會在認可階段執行", t);

	t = "";
	a.lookAtValue = true;
	commit();
	console.assert(t == "312", "重新建立了參照關係", t);
}
