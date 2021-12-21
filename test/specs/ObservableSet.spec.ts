import { expect } from 'chai';
import { shrewd, commit } from 'shrewd';

describe('ObservableSet', () => {

	@shrewd class A {

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


	let n: number, count: number, a: A;

	beforeEach(() => {
		n = 0;
		count = 0;
		a = new A();
	});

	it('is reactive', () => {
		a.set.add(1);
		a.set.add(3);
		commit();
		expect(n).to.equal(2);
		expect(count).to.equal(2);
	});

	it('works with renderer', () => {
		a.set.add(1);
		a.set.add(2);
		commit();
		expect(n).to.equal(2);
		expect(count).to.equal(1);
	});

	it('does not trigger update if duplicate element is added', () => {
		a.set.add(1);
		commit();
		expect(n).to.equal(2);
		expect(count).to.equal(1);

		a.set.add(1);
		commit();
		expect(n).to.equal(2);
		expect(count).to.equal(1);
	});

	it('triggers update on clear', () => {
		a.set.add(1);
		commit();
		expect(n).to.equal(2);
		expect(count).to.equal(1);

		a.set.clear();
		commit();
		expect(n).to.equal(3);
		expect(count).to.equal(0);
	});
});
