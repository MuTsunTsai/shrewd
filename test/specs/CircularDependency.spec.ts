import { expect } from 'chai';
import { shrewd, commit, option } from '../../dist/shrewd';

describe('Circular dependency detection', () => {
	let err: string, warn = console.warn;

	before(() => {
		option.debug = false;
		console.warn = (s: string) => err = s
	});

	after(() => {
		option.debug = true;
		console.warn = warn
	});

	beforeEach(() => err = "");

	it('detects and report circular dependency', () => {
		@shrewd class A {
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
		expect(a.c, "初始值").to.equal(2);

		a.switch = false;
		commit();
		expect(err, "打開 a.switch 會產生循環參照而出錯").to.equal("Cyclic dependency detected: A.a => A.c => A.b => A.a" +
			"\nAll these reactions will be terminated.");
	});

	it('would not falsely identify dynamic dependency changes', () => {
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
		expect(a.b, "初始值").to.equal(1);

		a.switch = false;
		commit();
		expect(err).to.equal('');
		expect(a.a, "其實這裡並沒有真的發生循環參照，只是路徑改變").to.equal(2);
	});
});
