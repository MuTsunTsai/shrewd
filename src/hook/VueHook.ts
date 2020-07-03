
declare const Vue: any;

//////////////////////////////////////////////////////////////////
/**
 * `VueHook` uses a very simple idea to establish the dependencies
 * from any Vue instance to Shrewd. Each Observable gets an dummy
 * field in an isolated Vue instance, and the reading or writing
 * to those dummy fields trigger the corresponding mechanism in Vue.
 */
//////////////////////////////////////////////////////////////////

class VueHook implements IHook {

	private _vue = new Vue({
		data: {
			shrewd: {}
		}
	});

	public read(id: number) {
		this._vue.shrewd[id];
	}

	public write(id: number) {
		Vue.set(this._vue.shrewd, id, {});
	}

	public gc() {
		for(let id in this._vue.shrewd) {
			if(this._vue.shrewd[id].__ob__.dep.subs.length == 0) Vue.delete(this._vue.shrewd, id);
		}
	}

	public sub(id: number) {
		return id in this._vue.shrewd && this._vue.shrewd[id].__ob__.dep.subs.length > 0;
	}
}