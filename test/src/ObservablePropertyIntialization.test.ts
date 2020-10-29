import { shrewd, commit } from "shrewd";

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
export = function() {

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
	console.assert(temp == 4, "Initial value", temp);

	a.n = 5;
	commit();
	console.assert(temp == 6, "a.b.prop correctly observes a.c", temp);
}
