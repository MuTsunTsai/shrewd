import { expect } from 'chai';
import { shrewd, commit, symbol } from '../../dist/shrewd';

describe('ComputedProperty', () => {

	@shrewd class A {

		@shrewd public n: number = 1;

		public _c: number = 0;
		public _d: number = 0;

		@shrewd public get c() {
			this._c = this.n + 1;
			return this._c;
		}

		@shrewd public get d() {
			this._d = this.c + 1;
			return this._d;
		}
	}

	it('initializes after constructor', () => {
		let a = new A();
		expect(a._c).to.equal(2);
		expect(a._d).to.equal(3);
	});

	describe('when there is no observer', () => {

		it('it is inactive and will not render', () => {
			let a = new A();
			let ac = (a as any)[symbol as any]._members.get("A.c");
			expect(ac._isActive).to.be.false;

			a.n = 2;
			commit();
			expect(a._c).to.equal(2);
			expect(a._d).to.equal(3);
		});

		it('renders when called manually', () => {
			let a = new A();
			a.n = 2;
			commit();
			expect(a._c).to.equal(2);
			expect(a.c).to.equal(3); // side effect
			expect(a._c).to.equal(3);
		});

		it('does not become active by merely called manually', () => {
			let a = new A();
			let ac = (a as any)[symbol as any]._members.get("A.c");

			a.n = 2;
			commit();
			expect(a.c).to.equal(3);
			expect(ac._isActive).to.be.false;
		});

		it('will trigger all upstream rendering when called manually', () => {
			let a = new A();
			a.n = 3;
			commit();
			expect(a._c).to.equal(2);
			expect(a._d).to.equal(3);
			expect(a.d).to.equal(5); // side effect
			expect(a._c).to.equal(4);
			expect(a._d).to.equal(5);
		});
	});

	describe('overriding', () => {
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

		let n: string;

		it('initializes in the order of code', () => {
			n = "";
			new B();
			expect(n).to.equal("2134");
		});

		it('updates in bottom-up order after initializing', () => {
			let b = new B();
			n = "";
			b.num = 1;
			commit();
			expect(n).to.equal("1234");
		});

		it('could stop in mid-stream if the value is not changed', () => {
			let b = new B();
			commit();
			n = "";
			b.num = 2;
			commit();
			console.assert(n == "1", "資料流在 A.log 處中斷了", n);
		});
	});
});
