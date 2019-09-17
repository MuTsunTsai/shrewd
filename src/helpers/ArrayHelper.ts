
class ArrayProxyHandler extends ObjectProxyHandler<any[]> {

	public get(target: WrappedObservable<any[]>, prop: PropertyKey, receiver: WrappedObservable<any[]>): any {
		// 這邊列舉的情況可以說是陣列的「原始讀取操作」，
		// 除了這些以外的讀取方法最終其實在內部程式碼執行都會用到這幾個，
		// 所以只要攔截到這些就可以監視一切的讀取行為
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
		for(let i in arr) arr[i] = Helper.$wrap(arr[i]);
		super(arr, ArrayHelper._handler);
	}

	public get $child() {
		let result = [];
		for(let value of this._target) {
			if(typeof value == "object") result.push(value);
		}
		return this._target;
	}
}