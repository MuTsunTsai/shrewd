import { shrewd, commit } from "shrewd";

export = function() {

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

	let a = new A();
	a.n = 2;
	commit();
	console.assert(log == "bcbcCBCB", "初始值", log);
}