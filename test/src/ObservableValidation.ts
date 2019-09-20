import { shrewd, commit } from "../../dist/shrewd";

export = function() {
	
	class A {

		@shrewd public max = 10;

		// 這是一個具有稽核的可觀測屬性，而且其稽核規則引用了另一個可觀測值。
		@shrewd({
			validator(v: number) { return v >= 0; },
			renderer(this: A, v: number) {
				n++;
				return v > this.max ? this.max : v;
			}
		})
		public value: number = 0;

		@shrewd log() { o = this.value; }
	}

	var a = new A(), n = 0, o;
	a.value = 5;
	a.log();
	console.assert(o === 5 && n === 2, "輸入可接受的值無妨", n);

	a.value = 20;
	console.assert((o = a.value) === 10 && n === 3, "超過範圍的值會被修正", o, n);
	a.value = 20;
	console.assert(n === 3, "輸入同樣的數字不會重新稽核", n);

	a.max = 8;
	console.assert((o = a.value) === 8 && n === 4, "手動執行也會執行稽核", o, n);
	commit();
	console.assert(o === 8 && n === 4, "因為已經執行過，所以不會再次稽核", o, n);

	a.max = 12;
	commit();
	console.assert(o === 12 && n === 5, "會記得未稽核的值，以隨著新的稽核條件作出恢復");

	a.value = -3;
	console.assert(o === 12 && n === 5, "規則說如果指定負數，則完全不改變", o, n);
}