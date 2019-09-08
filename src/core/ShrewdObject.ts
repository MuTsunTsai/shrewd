
const $shrewdObject = Symbol("ShrewdObject");

interface IShrewdObject {
	[$shrewdObject]?: ShrewdObject;
}

class ShrewdObject {

	public static get(target: IShrewdObject): ShrewdObject {
		if(HiddenProperty.$has(target, $shrewdObject)) {
			return target[$shrewdObject]!;
		} else {
			let so = new ShrewdObject(target);
			HiddenProperty.$add(target, $shrewdObject, so);
			return so;
		}
	}

	public $getMember<T extends DecoratedMemeber>(key: PropertyKey) {
		return this._members.get(key) as T;
	}

	constructor(parent: IShrewdObject) {
		this._parent = parent;
	}

	/** 這個 ShrewdObject 對應的物件 */
	private _parent: IShrewdObject;

	/** 是否已經初始化 */
	private _initialized: boolean = false;

	/** 目前的 ShrewdObject 所具有的裝飾成員 */
	private _members: Map<PropertyKey, DecoratedMemeber> = new Map();

	/**
	 * 初始化：
	 * 依照註記在各層原型物件上的 IDecoratorDescriptor 去修改 parent。
	 * 這個方法會一口氣把所有應該要進行的修改完成。
	 */
	public $initialize() {
		if(this._initialized) return;
		let proto: IShrewdPrototype = Object.getPrototypeOf(this._parent);
		while(proto) {
			if(HiddenProperty.$has(proto, $shrewdDecorators)) {
				let decorators = proto[$shrewdDecorators]!;
				for(let decorator of decorators) {
					this._members.set(decorator.key, new decorator.type(this._parent, decorator));
				}
			}
			proto = Object.getPrototypeOf(proto);
		}
		this._initialized = true;
	}
}
