import { assert, expect } from 'chai';
import { shrewd, commit } from '../../dist/shrewd';

describe('ObservableProperty', () => {
	describe('Renderer', () => {

		@shrewd class A {

			@shrewd public switch = false;

			@shrewd public a: Set<number> = new Set();

			@shrewd({
				renderer(this: A, value: Set<number>) {
					for(let n of this.a) if(!value.has(n)) value.add(n);
					return value;
				}
			})
			public b: Set<number> = new Set();

			@shrewd({
				renderer(this: A, value: Set<number>) {
					if(this.switch) {
						for(let n of this.b) if(!value.has(n)) value.add(n);
					}
					return value;
				}
			})
			public c: Set<number> = new Set();

			// So that c is observed.
			@shrewd log() { this.c.size; }
		}

		it('will render the value if the dependency is updated', () => {
			let a = new A();
			commit();
			expect(a.c.size, "初始值").to.equal(0);
			// At this point a.b is not active and will not render itself.

			a.a.add(1);
			a.switch = true; // switch on; nested rendering of ObservableProperties
			commit();
			assert(a.c.has(1), "自動散佈");
		});

	});

	describe('Validator', () => {

		@shrewd class A {
			public o: number = 0;

			// 這是一個具有稽核的可觀測屬性
			@shrewd({ validator(v: number) { return v >= 0; } })
			public value: number = 0;

			@shrewd log() { this.o = this.value; }
		}

		let a: A;

		beforeEach(() => a = new A());

		it('accepts valid value', () => {
			a.value = 5;
			commit();
			expect(a.o, "輸入可接受的值無妨").to.equal(5);
		});

		it('rejects invalid value', () => {
			a.value = -3;
			commit();
			expect(a.o).to.equal(0);
		});
	});

	describe('Initialization', () => {

		/**
		 * This is the test related to update 0.0.8.
		 * Before the update, this test would not pass due to the bug that
		 * ObservableProperty `B.prop` get initialized inside the constructor of `A`
		 * (triggered by the get operation), and dependencies are not correctly established
		 * (because by that moment `A.c` has not been initialized yet,
		 * and behaved like a regular getter).
		 *
		 * Update 0.0.8 fixed this problem by making sure that early calls to the getter
		 * of an ObservablePropery would not actually initialize it,
		 * and the actual initialization takes place at the same phase as everything else.
		 */
		it('does not triggered by early invoking', () => {
			@shrewd class A {
				public b: B;

				constructor() {
					this.b = new B(this);
					this.b.prop;
				}

				@shrewd public n: number = 3;

				@shrewd public get c() { return this.n + 1; }

			}

			@shrewd class B {
				private a: A;

				constructor(a: A) {
					this.a = a;
				}

				@shrewd({
					renderer: function(this: B, v: number) {
						return (temp = v < this.a.c ? this.a.c : v);
					}
				})
				public prop: number = 0;

				@shrewd private get c() { return this.prop; }

				@shrewd private watch() {
					this.c;
				}
			}

			let temp: number = 0;

			let a = new A();
			commit();
			expect(temp, "Initial value").to.equal(4);

			a.n = 5;
			commit();
			expect(temp, "a.b.prop correctly observes a.c").to.equal(6);
		});
	});

	describe('overriding', ()=> {

		it('could override parent property', () => {
			@shrewd class A {
				@shrewd public prop: number = 1;
				@shrewd public max: number = 3;
				@shrewd public get output() { return this.prop + 1; }
			}

			@shrewd class B extends A {
				@shrewd({
					renderer(this: B, value: number) {
						return value > this.max ? this.max : value;
					}
				})
				public prop: number = 2;
			}

			let a = new A(), b = new B();

			a.prop = 4;
			b.prop = 4;
			commit();
			expect(a.output, "A.prop 並沒有加上 renderer").to.equal(5);
			expect(b.output, "因為 B.prop 覆寫了 @shrewd 特性，會自動修正").to.equal(4);

			b.max = 1;
			commit();
			expect(b.output, "再次驗證自動修正").to.equal(2);
		});
	});
});
