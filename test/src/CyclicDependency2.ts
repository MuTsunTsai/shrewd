import { shrewd, construct, commit, option } from "../../dist/shrewd";

export = function() {

	class A {
		constructor() { this.log(); }

		@shrewd public n: number = 0;

		private _list: B[] = [];
		@shrewd public get list(): B[] {
			if(this.n > this._list.length) {
				for(let i = this._list.length; i < this.n; i++) {
					this._list[i] = construct(B, this);
				}
			}
			return this._list.concat();
		}

		@shrewd public log() { this.list; }
	}

	class B {

		private parent: A;

		constructor(a: A) {
			this.parent = a;
			this.run();
		}

		@shrewd private run() {
			this.parent.list;
		}
	}

	let a = new A();

	option.debug = false;

	let err = "", warn = console.warn;
	console.warn = (s: string) => err = s;
	a.n = 1;
	commit();
	console.assert(err == "Cyclic dependency detected: A.list => construct B => B.run => A.list" +
		"\nAll these reactions will be terminated.", "包含有建構式的循環參照", err);
	console.warn = warn;

	commit();
}