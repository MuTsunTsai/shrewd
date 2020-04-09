import { shrewd, commit, option } from "../../dist/shrewd";

export = function() {

	class A {
		@shrewd public switch = true;
		@shrewd public get a(): number {
			return this.switch ? 1 : this.c;
		}

		@shrewd public get b(): number {
			return this.a + 1;
		}

		@shrewd public get c(): number {
			return this.b;
		}

		@shrewd log() { this.c; }
	}

	let a = new A();
	a.log();
	commit();
	console.assert(a.c == 2, "初始值", a.c);

	option.debug = false;

	let err = "", warn = console.warn;
	console.warn = (s: string) => err = s;
	a.switch = false;
	commit();
	console.assert(err == "Cyclic dependency detected: A.a => A.c => A.b => A.a" +
		"\nAll these reactions will be terminated.", "打開 a.switch 會產生循環參照而出錯", err);
	console.warn = warn;

}