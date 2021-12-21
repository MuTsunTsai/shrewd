import { expect } from 'chai';
import { shrewd, commit } from 'shrewd';

describe('ObservableArray', () => {

	@shrewd class A {
		@shrewd({
			renderer(this: A, arr: number[]) {
				let j = 0;
				for(let i = 0; i < arr.length; i++) {
					if(arr[i] != 1) arr[j++] = arr[i];
				}
				arr.length = j;
				return arr;
			}
		}) public arr: number[] = [];

		@shrewd public get total() {
			n++;
			return this.arr.reduce((t, v) => t + v, 0);
		}

		@shrewd public log() {
			t = this.total; // 用個反應方法讀取以便觸發自動更新
		}
	}

	let n: number, t: number, a: A;

	beforeEach(() => {
		n = 0;
		t = 0;
		a = new A();
	});

	it('works with renderer', () => {
		a.arr.push(1, 2, 3);
		commit();
		expect(a.arr).to.eql([2, 3]);
		expect(n, "會紀錄到陣列的變更").to.equal(2);
		expect(t, "計算出結果").to.equal(5);
	});

	it('is considered changed even if rendered result is the same', () => {
		a.arr.push(1);
		commit();
		expect(a.arr).to.eql([]);
		expect(n, "會紀錄到陣列的變更").to.equal(2);
	});

	it('is reactive on each index', () => {
		a.arr.push(2, 3);
		commit();
		expect(t).to.equal(5);
		a.arr[1] = 2;
		commit();
		expect(n, "會紀錄到陣列的變更").to.equal(3);
		expect(t, "更新計算結果").to.equal(4);
	});

	it('would not trigger change if the same value is assigned', () => {
		a.arr.push(2, 3);
		commit();
		expect(t).to.equal(5);
		a.arr[1] = 3;
		commit();
		expect(n, "指定同樣的內容並不會觸發通知").to.equal(2);
	});
});
