
class ObjectProxyHandler<T extends object = object> extends BaseProxyHandler<T> {

	public has(target: WrappedObservable<T>, prop: PropertyKey): boolean {
		Observer.$refer(target[$observableHelper]);
		return Reflect.has(target, prop);
	}

	public get(target: WrappedObservable<T>, prop: PropertyKey, receiver: T): any {
		Observer.$refer(target[$observableHelper]);
		let result = Reflect.get(target, prop, receiver);
		return result;
	}

	public set(target: WrappedObservable<T>, prop: PropertyKey, value: any, receiver: T): boolean {
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

class ObjectHelper extends Helper<object> {

	private static _handler = new ObjectProxyHandler();

	constructor(target: any) {
		for(let key in target) target[key] = Helper.$wrap(target[key]);
		super(target, ObjectHelper._handler);
	}

	public get $child() {
		let result = [];
		for(let key in this._target) {
			let value = (this._target as any)[key];
			if(typeof value == "object") result.push(value);
		}
		return result;
	}
}