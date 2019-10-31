
class MapProxyHandler extends CollectionProxyHandler<Map<any, any>> {

	protected _method(this: IMethodDescriptor<Map<any, any>>, ...args: any[]) {
		if(this.$prop == "set") {
			if(Observer.$isWritable(this.$helper) && !this.$target.has(args[0])) {
				this.$target.set(args[0], Helper.$wrap(args[1]));
				Observable.$publish(this.$helper);
			}
			return this.$receiver;
		}
		return super._method.apply(this, args);
	}
}

class MapHelper extends Helper<Map<any, any>> {

	private static _handler = new MapProxyHandler();

	constructor(map: Map<any, any>) {
		for(let [key, value] of map) map.set(key, Helper.$wrap(value));
		super(map, MapHelper._handler);
	}

	public get $child() {
		let result = [];
		for(let [key, value] of this._target) {
			if(typeof key == "object") {
				result.push(key);
			}
			if(typeof value == "object") {
				result.push(value);
			}
		}
		return result;
	}
}