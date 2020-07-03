import { shrewd, commit } from "shrewd";

export = function() {

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

		@shrewd log() { this.c.size; }
	}

	let a = new A();
	a.log();
	commit();
	console.assert(a.c.size == 0, "初始值", a.c);
	// At this point a.b is not active and will not render itself.

	a.a.add(1);
	a.switch = true; // switch on; nested rendering of ObservableProperties
	commit();
	console.assert(a.c.has(1), "自動散佈", [...a.c]);
}