import { shrewd, commit, option } from "../../dist/shrewd";

export = function() {

	option.debug = true;

	@shrewd class A {
		@shrewd public num: number = 0;
		@shrewd public get value() {
			n += "1";
			return this.num % 2;
		}
	}

	@shrewd class B extends A {
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

	var n = "";
	var b = new B();
	console.assert(n == "2134", "初始化的時候是依照定義的順序執行", n);

	n = "";
	b.num = 1;
	console.assert(n == "", "認可前還沒執行重新計算", n);
	commit();
	console.assert(n == "1234", "有了參照關係就會 bottom-up 執行", n);

	n = "";
	b.num = 3;
	commit();
	console.assert(n == "1", "資料流在 A.log 處中斷了", n);
}