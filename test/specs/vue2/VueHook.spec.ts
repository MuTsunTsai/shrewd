import { expect } from 'chai';
import { shrewd, commit, symbol, option, hook, IHook } from 'shrewd';

// Setup jsdom for Vue testing.
import "global-jsdom/register";

import Vue from "vue";
import { mount } from "@vue/test-utils";

describe('VueHook', () => {
	@shrewd class A {
		public count = 0;
		@shrewd public n: number = 1;
		@shrewd public get c() { return this.n + 1; }
	}

	let oldHook: IHook;

	before(() => {
		oldHook = option.hook;
		option.hook = new hook.vue(Vue);
	});

	after(() => option.hook = oldHook);

	function reset() {
		let a = new A();
		let ac = (a as any)[symbol as any]._members.get("A.c");
		let V = Vue.extend<{ switch: boolean }, object, { a: A, d: number }, never>({
			template: `<div>{{d}}</div>`,
			data: () => ({ switch: true }),
			computed: {
				a() { return a; },
				d() {
					a.count++;
					return this.switch ? this.a.c + 1 : 0;
				}
			}
		});
		let w = mount(V);
		return { a, ac, w };
	}

	it('will be processed when Vue component is mounting', () => {
		let { a, ac, w } = reset();
		expect(a.count, "計算屬性被計算了一次").to.equal(1);
		expect(w.text(), "初始渲染").to.equal("3");
		expect(option.hook.sub(ac.$id), "a.c 被 Vue 訂閱").to.be.true;
		expect(ac._isActive, "來自 Vue 的觀測使得 a.c 活躍").to.be.true;
	});

	it('renders after Vue.nextTick()', async () => {
		let { a, w } = reset();
		a.n = 2;
		commit();
		expect(w.text(), "此時 Vue 尚未完成渲染").to.equal("3");
		expect(a.count, "計算屬性不會立刻被觸發計算").to.equal(1);
		expect(w.vm.d).to.equal(4); // side effect
		expect(a.count, "直接呼叫計算屬性會觸發一次計算").to.equal(2);
		expect(w.text(), "然而 Vue 仍然沒有進行渲染").to.equal("3");
		await Vue.nextTick();
		expect(w.text(), "要等到 nextTick 才會完成渲染").to.equal("4");
	});

	it('updates even without invoking', async () => {
		let { a, w } = reset();
		a.n = 2;
		commit();
		expect(w.text(), "此時 Vue 尚未完成渲染").to.equal("3");
		expect(a.count, "計算屬性不會立刻被觸發計算").to.equal(1);
		await Vue.nextTick();
		expect(a.count, "計算被觸發").to.equal(2);
		expect(w.text(), "渲染完成").to.equal("4");
	});

	describe('when autoCommit is off', () => {

		it('would not render until commit', async () => {
			let { a, w } = reset();
			a.n = 5;
			await Vue.nextTick();
			expect(w.text(), "不會渲染").to.equal("3");
			expect(a.count).to.equal(1);
			commit();
			await Vue.nextTick();
			expect(w.text()).to.equal("7");
			expect(a.count).to.equal(2);
		});
	});

	describe('when autoCommit is on', () => {

		let auto: boolean;

		before(() => {
			auto = option.autoCommit;
			option.autoCommit = true;
		});

		after(() => option.autoCommit = auto);

		it('deactivates observable if no longer watching', async () => {
			let { a, ac, w } = reset();
			expect(w.text(), "原本的渲染結果").to.equal("3");
			w.vm.switch = false;
			expect(a.count, "確認計算尚未執行").to.equal(1);
			await Vue.nextTick();
			expect(a.count, "確認計算尚未執行").to.equal(2);
			expect(w.text(), "關掉 Vue 的相依性").to.equal("0");
			commit();
			expect(option.hook.sub(ac.$id), "a.c 的訂閱被解除").to.be.false;
			expect(ac._isActive, "a.c 因此非活躍").to.be.false;
		});

		it('reactivates observable if resume watching', async () => {
			let { ac, w } = reset();
			w.vm.switch = false;
			await Vue.nextTick();
			commit();
			expect(ac._isActive, "a.c 因此非活躍").to.be.false;

			w.vm.switch = true;
			await Vue.nextTick();
			expect(w.text(), "重新執行計算").to.equal("3");
			expect(option.hook.sub(ac.$id), "a.c 恢復被訂閱").to.be.true;
			expect(ac._isActive, "a.c 因此活躍").to.be.true;
		});

		it('renders without commit', async () => {
			let { a, w } = reset();
			expect(a.count).to.equal(1);
			a.n = 5;
			await Vue.nextTick();
			expect(w.text()).to.equal("7");
			expect(a.count).to.equal(2);
		});
	});
});
