import { Observable, Observer, CollectionProxyHandler, IMethodDescriptor, Helper } from "Index";

class SetProxyHandler extends CollectionProxyHandler<Set<unknown>> {

	protected _method(this: IMethodDescriptor<Set<unknown>>, ...args: unknown[]) {
		if(this.$prop == "add") {
			if(Observer.$isWritable(this.$helper) && !this.$target.has(args[0])) {
				this.$target.add(Helper.$wrap(args[0]));
				Observable.$publish(this.$helper);
			}
			return this.$receiver;
		}
		return super._method.apply(this, args);
	}
}

export class SetHelper extends Helper<Set<unknown>> {

	private static _handler = new SetProxyHandler();

	constructor(set: Set<unknown>) {
		for(let value of set) {
			set.delete(value);
			set.add(Helper.$wrap(value));
		}
		super(set, SetHelper._handler);
	}

	public get $children() {
		let result = [];
		for(let value of this._target) {
			if(typeof value == "object") {
				result.push(value);
			}
		}
		return result;
	}
}
