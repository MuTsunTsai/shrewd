import { Core, Global, IHook } from "Index";

//////////////////////////////////////////////////////////////////
/**
 * {@link Vue3Hook} uses composition API of Vue 3 to establish reactivity
 * from any Vue app to Shrewd. Each Observable gets an dummy
 * Ref<object>, and the reading or writing
 * to those dummy Ref trigger the corresponding mechanism in Vue.
 */
//////////////////////////////////////////////////////////////////

type Ref = {
	readonly dep?: Set<object>;
	value: unknown;
}

export class Vue3Hook implements IHook {

	/**
	 * @param vue The `Vue` module to use; if unspecified, it will try to use the global `Vue` variable.
	 */
	constructor(vue?: any) {
		this._vue = vue || typeof window != "undefined" && window.Vue;
		if(!this._vue) throw new Error("Global Vue not found; you need to pass a Vue module to VueHook.");
		let version = this._vue.version;
		if(typeof version != 'string' || !version.startsWith('3.')) throw new Error("Vue version 3.x is required.");
	}

	/** Reactive object for tracking dependencies. */
	private _store: Record<number, Ref> = {};

	/** Pending writes. */
	private _queue: Set<number> = new Set();

	/** Newly created entries */
	private _created: Set<number> = new Set();

	/** Stored Vue module. */
	private _vue: any;

	public read(id: number): boolean {
		let t = this._store[id];
		t?.value;
		if(!Global.$isCommitting && !t) t = this._update(id);
		return t && this._hasDep(id);
	}

	public write(id: number) {
		if(Core.$option.autoCommit || Global.$isCommitting) this._update(id);
		else this._queue.add(id);
	}

	public precommit() {
		for(let id of this._queue) this._update(id);
		this._queue.clear();
	}

	private _update(id: number): Ref {
		if(id in this._store) this._store[id].value = {};
		else this._store[id] = this._vue.ref({});
		this._store[id].value; // side effect
		return this._store[id];
	}

	public gc() {
		let result: number[] = [];
		for(let id in this._store) {
			let n = Number(id);
			if(!Core.$option.autoCommit && !this._created.has(n)) {
				// If autoCommit is off, all entries will survive for at least one round,
				// otherwise it is impossible for dependencies to establish.
				this._created.add(n);
			} else if(!this._hasDep(n)) {
				if(!Core.$option.autoCommit) this._created.delete(n);
				delete this._store[id];
				result.push(Number(id));
			}
		}
		return result;
	}

	private _hasDep(id: number): boolean {
		return (this._store[id].dep?.size ?? 0) > 0;
	}

	public sub(id: number) {
		return id in this._store && this._hasDep(id);
	}
}
