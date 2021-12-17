import { Observable, Observer, CollectionProxyHandler, IMethodDescriptor, Helper } from "../Index";

class MapProxyHandler extends CollectionProxyHandler<Map<unknown, unknown>> {

	protected _method(this: IMethodDescriptor<Map<unknown, unknown>>, ...args: unknown[]) {
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

export class MapHelper extends Helper<Map<unknown, unknown>> {

	private static _handler = new MapProxyHandler();

	constructor(map: Map<unknown, unknown>) {
		for(let [key, value] of map) map.set(key, Helper.$wrap(value));
		super(map, MapHelper._handler);
	}

	public get $children() {
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
