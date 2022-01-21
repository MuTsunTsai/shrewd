import { Core, Global, IHook } from "Index";

//////////////////////////////////////////////////////////////////
/**
 * {@link VueHook} uses a very simple idea to establish the dependencies
 * from any Vue instance to Shrewd. Each Observable gets an dummy
 * field in an isolated Vue instance, and the reading or writing
 * to those dummy fields trigger the corresponding mechanism in Vue.
 */
//////////////////////////////////////////////////////////////////

declare global {
	interface Window {
		Vue?: unknown;
	}
}

export class VueHook implements IHook {

	/**
	 * @param vue The `Vue` Constructor to use; if unspecified, it will try to use the global `Vue` variable.
	 */
	constructor(vue?: any) {
		this._Vue = vue || typeof window != "undefined" && window.Vue;
		if(!this._Vue) throw new Error("Global Vue not found; you need to pass a Vue constructor to VueHook.");
		let version = this._Vue.version;
		if(typeof version != 'string' || !version.startsWith('2.')) throw new Error("Vue version 2.x is required.");
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
	private _queue: Set<number> = new Set();

	/** Newly created entries */
	private _created: Set<number> = new Set();

	public read(id: number): boolean {
		let t = this._vue.shrewd[id];
		if(!Global.$isCommitting && !t) {
			this._Vue.set(this._vue.shrewd, id, {});
			t = this._vue.shrewd[id];
		}
		return t && t.__ob__.dep.subs.length > 0;
	}

	public write(id: number) {
		if(Core.$option.autoCommit || Global.$isCommitting) this._Vue.set(this._vue.shrewd, id, {});
		else this._queue.add(id);
	}

	public precommit() {
		for(let id of this._queue) this._Vue.set(this._vue.shrewd, id, {});
		this._queue.clear();
	}

	public gc() {
		let result: number[] = [];
		for(let id in this._vue.shrewd) {
			let n = Number(id);
			if(!Core.$option.autoCommit && !this._created.has(n)) {
				// If autoCommit is off, all entries will survive for at least one round,
				// otherwise it is impossible for dependencies to establish.
				this._created.add(n);
			} else if(this._vue.shrewd[id].__ob__.dep.subs.length == 0) {
				if(!Core.$option.autoCommit) this._created.delete(n);
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
