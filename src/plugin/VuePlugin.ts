
interface Window {
	Vue?: any;
}

class VuePlugin {
	public static install(Vue: any) {
		Vue.mixin({
			mounted() {
				let shrewd = new ShrewdObject(this._watcher);
				shrewd.setup({
					$key: "Watcher.getter",
					$name: "Watcher.getter",
					$constructor: ReactiveMethod,
					$method: this._watcher.getter
				});
				Object.defineProperty(this._watcher, "getter", {
					get: function(this: IShrewdObjectParent) {
						return ShrewdObject.get(this).$getMember("Watcher.getter").$getter();
					}
				})
				this._watcher.getter();
			}
		})
	}
}

if(typeof window !== 'undefined' && window.Vue) {
	window.Vue.use(VuePlugin);
}