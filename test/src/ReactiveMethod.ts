import { shrewd, commit } from "shrewd";

export = function() {
	
	@shrewd class A {

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
	console.assert(a.n === 1, "初次執行", a.n);

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
}