
const $observableHelper = Symbol("Observable Helper");

type WrappedObservable<T extends object> = T & IHelperParent<T>;

interface IHelperParent<T extends object> {
	[$observableHelper]: Helper<T>;
}

abstract class Helper<T extends object> extends Observable {

	/** Cache for wrapped objects. */
	private static readonly _proxyMap: WeakMap<object, object> = new WeakMap();

	/**
	 * Wrap native Arrays, Sets, Maps, and Objects into reactive objects.
	 * 
	 * Only strict native objects are supported here, meaning that their prototype
	 * must be immediately the native prototype, not even derived prototypes.
	 */
	public static $wrap(value: any) {
		if(value == null || typeof value != "object") return value;
		if(Helper._proxyMap.has(value)) return Helper._proxyMap.get(value);
		if(!Helper.$hasHelper(value)) {
			switch(Object.getPrototypeOf(value)) {
				case Array.prototype:
					value = new ArrayHelper(value).$proxy; break;
				case Set.prototype:
					value = new SetHelper(value).$proxy; break;
				case Map.prototype:
					value = new MapHelper(value).$proxy; break;
				case Object.prototype:
					value = new ObjectHelper(value).$proxy; break;
			}
		}
		return value;
	}

	public static $hasHelper(value: any): value is IHelperParent<any> {
		return value != null && typeof value == "object" && HiddenProperty.$has(value, $observableHelper);
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