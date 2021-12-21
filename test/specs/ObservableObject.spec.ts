import { expect } from 'chai';
import { shrewd, commit } from 'shrewd';

describe('ObservableObject', () => {

	@shrewd class A {
		@shrewd public value: { [key: string]: any } = {
			prop: 1
		};

		@shrewd public log() {
			m = this.value.prop;
			if("new" in this.value) m += this.value.new.value;
			n++;
		}
	}

	let n: number, m: number, a: A;

	beforeEach(() => {
		n = 0;
		m = 0;
		a = new A();
	});

	it('is deeply reactive', () => {
		expect(n).to.equal(1);
		expect(m).to.equal(1);

		a.value.prop = 2;
		commit();
		expect(n).to.equal(2);
		expect(m).to.equal(2);
	});

	it('converts value into ObservableObjects', () => {
		a.value.new = { value: 1 };
		commit();
		expect(n).to.equal(2);
		expect(m).to.equal(2);

		a.value.new.value = 2;
		commit();
		expect(n).to.equal(3);
		expect(m).to.equal(3);
	});
});
