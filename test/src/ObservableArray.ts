import { shrewd, commit } from "../../dist/shrewd";

export = function() {
	
	@shrewd class A {
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
	commit();

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
}