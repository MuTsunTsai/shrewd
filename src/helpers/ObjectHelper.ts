import { Observable, Observer, $observableHelper, Helper, WrappedObservable } from "Index";

export class ObjectProxyHandler<T extends UnknownObject = UnknownObject> implements ProxyHandler<T> {

	public has(target: WrappedObservable<T>, prop: PropertyKey): boolean {
		Observer.$refer(target[$observableHelper]);
		return Reflect.has(target, prop);
	}

	public get(target: WrappedObservable<T>, prop: PropertyKey, receiver: T): unknown {
		Observer.$refer(target[$observableHelper]);
		let result = Reflect.get(target, prop, receiver);
		return result;
	}

	public set(target: WrappedObservable<T>, prop: PropertyKey, value: unknown, receiver: T): boolean {
		let ob = target[$observableHelper];
		if(Observable.$isWritable(ob)) {
			let old = Reflect.get(target, prop, receiver);
			if(value !== old) {
				Reflect.set(target, prop, Helper.$wrap(value), receiver);
				Observable.$publish(ob);
			}
			return true;
		} else return true;
	}

	public deleteProperty(target: WrappedObservable<T>, prop: PropertyKey): boolean {
		let ob = target[$observableHelper];
		if(Observable.$isWritable(ob)) {
			let result = Reflect.deleteProperty(target, prop);
			if(result) Observable.$publish(ob);
			return result;
		} else return true;
	}
}

export type UnknownObject = Record<string, unknown>;

export class ObjectHelper extends Helper<UnknownObject> {

	private static _handler = new ObjectProxyHandler();

	constructor(target: UnknownObject) {
		for(let key in target) target[key] = Helper.$wrap(target[key]);
		super(target, ObjectHelper._handler);
	}

	public get $children() {
		let result = [];
		for(let key in this._target) {
			let value = this._target[key];
			if(typeof value == "object") {
				result.push(value);
			}
		}
		return result;
	}
}
