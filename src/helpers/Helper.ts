
const $observableHelper = Symbol("Observable Helper");

type WrappedObservable<T extends object> = T & IHelperParent<T>;

interface IHelperParent<T extends object> {
	[$observableHelper]: Helper<T>;
}

abstract class Helper<T extends object> extends Observable {

	/** 快取已經包裝過的物件 */
	private static readonly _proxyMap: WeakMap<object, object> = new WeakMap();

	/**
	 * 把原生的 Array, Set, Map, Object 物件包裝成反應式物件。
	 * 
	 * 這邊只支援完全原生的物件的包裝，也就是說包裝的對象必須直接以對應類別的原型作為原型，
	 * 而不能夠是任何繼承的類別，因為繼承類別的行為是 Shrewd 框架所沒辦法預測的。
	 */
	public static $wrap(value: any) {
		if(typeof value != "object") return value;
		if(Helper._proxyMap.has(value)) return Helper._proxyMap.get(value);
		if(!Helper.$hasHelper(value)) {
			switch(Object.getPrototypeOf(value)) {
				case Array.prototype: value = new ArrayHelper(value).$proxy; break;
				case Set.prototype: value = new SetHelper(value).$proxy; break;
				case Map.prototype: value = new MapHelper(value).$proxy; break;
				case Object.prototype: value = new ObjectHelper(value).$proxy; break;
			}
		}
		return value;
	}

	public static $hasHelper(value: any): value is IHelperParent<any> {
		return typeof value == "object" && HiddenProperty.$has(value, $observableHelper);
	}

	private readonly _proxy: T;

	protected _target: WrappedObservable<T>;

	constructor(target: T, handler: ProxyHandler<T>) {
		super();
		this._target = HiddenProperty.$add(target, $observableHelper, this);
		this._proxy = new Proxy(target, handler);
		Helper._proxyMap.set(target, this._proxy);
	}

	public get $proxy() { return this._proxy; }

	public abstract get $child(): any[];
}