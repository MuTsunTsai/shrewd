import { shrewd, commit } from "../../dist/shrewd";

export = function() {
	
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
}