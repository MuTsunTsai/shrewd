import { shrewd, commit } from "../../dist/shrewd";

export = function() {

	@shrewd class A {
		@shrewd public switch = true;
		@shrewd public get a(): number {
			return this.switch ? 1 : this.b;
		}

		@shrewd public get b(): number {
			return this.switch ? this.a : 2;
		}

		@shrewd log() { this.a; this.b; }
	}

	let a = new A();
	console.assert(a.b == 1, "初始值", a.b);

	a.switch = false;
	commit();
	console.assert(a.a == 2, "其實這裡並沒有真的發生循環參照，只是路徑改變");

}