import { expect } from 'chai';
import { shrewd, commit } from 'shrewd';

describe('ReactiveMethod', () => {

	describe('Execution', () => {
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

		it('runs automatically after construction', () => {
			let a = new A();
			expect(a.n, "初次執行").to.equal(1);
		});

		it('runs if dependencies have changed', () => {
			let a = new A();
			a.value = 1;
			commit();
			expect(a.middle, "中間值改變").to.equal(1);
			expect(a.n, "參照值改變導致 log 再次執行").to.equal(2);
			commit();
			expect(a.n, "如果沒有任何改變，再次認可並不會再次執行 log").to.equal(2);
		});

		it('runs only if immediate dependencies have changed after initialized', () => {
			let a = new A();
			a.value = 2;
			commit();
			expect(a.middle, "中間值沒有改變").to.equal(0);
			expect(a.n).to.equal(1);
		});
	});

	describe('Overriding', () => {
		@shrewd class A {
			@shrewd public value = 1;
			@shrewd log(): any {
				n += "1";
				return this.value != 3;
			}
		}

		@shrewd class B extends A {
			@shrewd log() {
				// 下層方法唯一參照到的就是上層方法；只要上層方法被執行，就會通知下層方法去執行
				n += "2"
				if(!super.log()) return;
				n += "3";
			}
		}

		let n: string = "";

		it('initializes child-first', () => {
			new B();
			commit();
			expect(n, "初始化的時候兩個層次的 log 都有被執行，且下層優先").to.equal("213");
		});

		it('then executes in order of dependency when updated', () => {
			let b = new B();
			n = "";
			b.value = 2;
			commit();
			expect(n, "兩個層次的 log 都恰再次被執行一次").to.equal("123");
		});

		it('passes returned value from parent to child method', () => {
			let b = new B();
			n = "";
			b.value = 3;
			commit();
			expect(n, "回傳值中斷").to.equal("12");
		});
	});
});
