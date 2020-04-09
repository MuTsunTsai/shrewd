import { shrewd, commit } from "../../dist/shrewd";

export = function() {
	
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
	commit();
	console.assert(b.n == "213", "兩個層次的 log 都有被執行，且因為是獨立呼叫，下層優先", b.n);

	b.n = "";
	b.value = 2;
	commit();
	console.assert(b.n == "123", "兩個層次的 log 都恰再次被執行一次", b.n);

	b.n = "";
	b.value = 3;
	commit();
	console.assert(b.n == "12", "回傳值中斷", b.n);
}