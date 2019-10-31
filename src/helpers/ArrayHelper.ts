
class ArrayProxyHandler extends ObjectProxyHandler<any[]> {

	public get(target: WrappedObservable<any[]>, prop: PropertyKey, receiver: WrappedObservable<any[]>): any {
		// These are the "raw reading operations" of an Array;
		// all other reading methods will eventually use one of these
		// in the internal code, so by intercepting these operations,
		// we can monitor all readings.
		if(prop == "length" ||
			typeof prop == "symbol" || typeof prop == "number" ||
			typeof prop == "string" && prop.match(/^\d+$/)) {
			Observer.$refer(target[$observableHelper]);
		}
		return Reflect.get(target, prop, receiver);
	}
}

class ArrayHelper extends Helper<any[]> {

	private static _handler = new ArrayProxyHandler();

	constructor(arr: any[]) {
		for(let i in arr) {
			arr[i] = Helper.$wrap(arr[i]);
		}
		super(arr, ArrayHelper._handler);
	}

	public get $child() {
		let result = [];
		for(let value of this._target) {
			if(typeof value == "object") {
				result.push(value);
			}
		}
		return this._target;
	}
}