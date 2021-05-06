import { shrewd, commit, symbol, option, hook } from "shrewd";
import Vue from "vue";
import { mount } from "@vue/test-utils";

export = async function(useMinify: boolean) {
	if(useMinify) console.log("Some tests will be skipped due to minifying.");

	let oldHook = option.hook;
	option.hook = new hook.vue(Vue);

	@shrewd class A {
		@shrewd public n: number = 1;
		@shrewd public get c() { return this.n + 1; }
	}

	var a = new A();
	var so = (a as any)[symbol as any];
	var ac = useMinify ? null : so._members.get("A.c");

	if(!useMinify) {
		console.assert(!ac._isActive, "一開始因為沒有觀測者，a.c 非活躍", ac._isActive);
		console.assert(!option.hook.sub(ac.$id), "一開始 a.c 沒被訂閱");
	}

	var d_count = 0;
	var V = Vue.extend<{ switch: boolean }, object, { a: A, d: number }, never>({
		template: `<div>{{d}}</div>`,
		data: () => ({ switch: true }),
		computed: {
			a() { return a; },
			d() {
				d_count++;
				return this.switch ? this.a.c + 1 : 0;
			}
		}
	});
	var w = mount(V);

	console.assert(d_count == 1, "計算屬性被計算了一次", d_count);
	console.assert(w.text() == "3", "初始渲染");
	if(!useMinify) {
		console.assert(option.hook.sub(ac.$id), "a.c 被 Vue 訂閱");
		console.assert(ac._isActive, "來自 Vue 的觀測使得 a.c 活躍", ac._isActive);
	}

	a.n = 2;
	commit();
	console.assert(w.text() == "3", "此時 Vue 尚未完成渲染");
	console.assert(d_count == 1, "計算屬性不會立刻被觸發計算", d_count);
	console.assert(w.vm.d == 4 && d_count == 2, "直接呼叫計算屬性會觸發一次計算", w.vm.d, d_count);
	console.assert(w.text() == "3", "然而 Vue 仍然沒有進行渲染");
	await Vue.nextTick();
	console.assert(w.text() == "4", "要等到 nextTick 才會完成渲染");

	a.n = 3;
	commit();
	console.assert(d_count == 2 && w.text() == "4", "確認 Vue 尚未完成計算和渲染", d_count);
	await Vue.nextTick();
	console.assert(d_count == 3 && w.text() == "5", "即使沒有手動呼叫，Vue 也會自動重新計算和渲染", d_count);

	w.vm.switch = false;
	console.assert(w.text() == "5" && d_count == 3, "確認計算尚未執行", d_count);
	await Vue.nextTick();
	console.assert(w.text() == "0" && d_count == 4, "關掉 Vue 的相依性");
	commit();
	if(!useMinify) {
		console.assert(!option.hook.sub(ac.$id), "a.c 的訂閱被解除");
		console.assert(!ac._isActive, "a.c 因此非活躍", ac._isActive);
	}

	w.vm.switch = true;
	commit();
	await Vue.nextTick();
	console.assert(w.text() == "5" && d_count == 5, "重新執行計算");
	if(!useMinify) {
		console.assert(option.hook.sub(ac.$id), "a.c 恢復被訂閱");
		console.assert(ac._isActive, "a.c 因此活躍", ac._isActive);
	}
	a.n = 4;
	await Vue.nextTick();
	console.assert(w.text() == "6" && d_count == 6, "即時沒有執行認可，Vue 下一次渲染也會手動呼叫 a.c 的值");

	let oldSetting = option.autoCommit;
	option.autoCommit = false;
	await Vue.nextTick(); // 先把之前一輪的自動認可執行掉

	a.n = 5;
	d_count = 0;
	await Vue.nextTick();
	console.assert(w.text() == "6" && d_count == 0, "關閉自動認可之後，VueHook 的行為也會改成不會立即通知更新");
	commit();
	await Vue.nextTick();
	console.assert(w.text() == "7" && d_count == 1, "認可之後，Vue 才會渲染出正確的值", w.text(), d_count);

	option.hook = oldHook;
	option.autoCommit = oldSetting;
}
