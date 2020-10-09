
interface Window {
	Vue?: any;
}

//////////////////////////////////////////////////////////////////
/**
 * `VueHook` uses a very simple idea to establish the dependencies
 * from any Vue instance to Shrewd. Each Observable gets an dummy
 * field in an isolated Vue instance, and the reading or writing
 * to those dummy fields trigger the corresponding mechanism in Vue.
 */
//////////////////////////////////////////////////////////////////

class VueHook implements IHook {

	/**
	 * @param vue The `Vue` Constructor to use; if unspecified, it will try to use the global `Vue` variable.
	 */
	constructor(vue?: any) {
		this._Vue = vue || typeof window != "undefined" && window.Vue;
		if(!this._Vue) throw new Error("Global Vue not found; you need to pass a Vue constructor to VueHook.");
		this._vue = new this._Vue({
			data: {
				shrewd: {}
			}
		});
	}

	/** Stored Vue constructor. */
	private _Vue: any;

	/** Isolated Vue instance for tracking dependencies. */
	private _vue: any;

	/** Pending writes. */
	private _writes: Set<number> = new Set();

	public read(id: number): boolean {
		let t = this._vue.shrewd[id];
		return t && t.__ob__.dep.subs.length > 0;
	}

	public write(id: number) {
		if(Core.$option.autoCommit) this._Vue.set(this._vue.shrewd, id, {});
		else this._writes.add(id);
	}

	public precommit() {
		if(!Core.$option.autoCommit) {
			for(let id of this._writes) this._Vue.set(this._vue.shrewd, id, {});
			this._writes.clear();
		}
	}

	public gc() {
		let result: number[] = [];
		for(let id in this._vue.shrewd) {
			if(this._vue.shrewd[id].__ob__.dep.subs.length == 0) {
				this._Vue.delete(this._vue.shrewd, id);
				result.push(Number(id));
			}
		}
		return result;
	}

	public sub(id: number) {
		return id in this._vue.shrewd && this._vue.shrewd[id].__ob__.dep.subs.length > 0;
	}
}