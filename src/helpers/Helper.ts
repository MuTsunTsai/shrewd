
const $observableHelper = Symbol("Observable Helper");

type WrappedObservable<T extends object> = T & IObservableHelper<T>;

interface IObservableHelper<T extends object> {
	[$observableHelper]: Helper<T>;
}

class Helper<T extends object> extends Observable {

	/**
	 * 把原生的 Array, Set, Map, Object 物件包裝成反應式物件。
	 * 
	 * 這邊只支援完全原生的物件的包裝，也就是說包裝的對象必須直接以對應類別的原型作為原型，
	 * 而不能夠是任何繼承的類別，因為繼承類別的行為是 Shrewd 框架所沒辦法預測的。
	 */
	public static $wrap(value: any) {
		if(typeof value == "object" && !HiddenProperty.$has(value, $observableHelper)) {
			switch(Object.getPrototypeOf(value)) {
				case Array.prototype: value = new ArrayHelper(value).$proxy; break;
				case Set.prototype: value = new SetHelper(value).$proxy; break;
				case Map.prototype: value = new MapHelper(value).$proxy; break;
				case Object.prototype: value = new ObjectHelper(value).$proxy; break;
			}
		}
		return value;
	}

	private readonly _proxy: T;

	constructor(target: T, handler: ProxyHandler<T>) {
		super();
		HiddenProperty.$add(target, $observableHelper, this);
		this._proxy = new Proxy(target, handler);
	}

	public get $proxy() { return this._proxy; }
}