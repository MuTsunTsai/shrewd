import { assert, expect } from 'chai';
import { shrewd, commit } from 'shrewd';

describe('Shrewd constructor', () => {

	describe('identifier', () => {
		@shrewd class A { }

		@shrewd class B extends A { }

		let b: B, proto: any;

		before(() => {
			b = new B();
			proto = Object.getPrototypeOf(b);
		});

		it('is a proxy', () => assert(b.constructor != B));

		it('can be compared using prototype constructor', () => {
			assert(b.constructor == B.prototype.constructor)
			assert(proto == B.prototype);
			let proto1 = Object.getPrototypeOf(proto);
			assert(proto1 == A.prototype, "往上檢查一層");
			let proto2 = Object.getPrototypeOf(proto1);
			assert(proto2 == Object.prototype, "再往上一層")
		});

		it('works with instanceof', () => assert(b instanceof B));

		it('works with inheritance', () => assert(b instanceof A));
	});

	describe('in nested situation', () => {
		@shrewd class A {
			@shrewd public n: number = 0;

			private arr: B[] = [];

			@shrewd private render() {
				for(let i = this.arr.length; i < this.n; i++) {
					this.arr[i] = new B();
				}
			}
		}

		@shrewd class B {
			constructor() {
				log += "b";
				new C();
			}

			@shrewd public get test(): number {
				log += "B";
				return 1;
			}
		}

		@shrewd class C {
			constructor() {
				log += "c";
			}

			@shrewd public get test(): number {
				log += "C";
				return 1;
			}
		}

		let log = "";

		it('runs child constructor top-down first, and then runs ReactiveMethods bottom-up', () => {
			let a = new A();
			a.n = 2;
			commit();
			expect(log, "初始值").to.equal("bcbcCBCB");
		})
	});
});
