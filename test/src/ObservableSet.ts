import { shrewd, commit } from "../../dist/shrewd";

export = function() {

	class A {

		// 稽核條件：不可以有偶數
		@shrewd({
			renderer(this: A, v: Set<number>) {
				for(let n of v) if(n % 2 == 0) v.delete(n);
				return v;
			}
		}) public set: Set<number> = new Set();

		@shrewd public log() {
			count = this.set.size;
			n++;
		}
	}

	var count = 0, n = 0;
	var a = new A();
	a.set.add(1);
	a.set.add(2);
	a.set.add(3);
	a.log();
	console.assert(count == 2 && n == 1, "初始計數", count, n);

	a.set.add(5);
	commit();
	console.assert(count == 3 && n == 2, "自動更新");

	a.set.add(5);
	commit();
	console.assert(count == 3 && n == 2, "沒有實際上的變更發生");

	a.set.clear();
	commit();
	console.assert(count == 0 && n == 3, "自動更新");

}