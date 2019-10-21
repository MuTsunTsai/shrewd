
const $shrewdObject = Symbol("ShrewdObject");

interface IShrewdObjectParent {
	[$shrewdObject]: ShrewdObject;
}

class ShrewdObject {

	public static get(target: object): ShrewdObject {
		if(HiddenProperty.$has(target, $shrewdObject)) return target[$shrewdObject];
		else return new ShrewdObject(target);
	}

	constructor(parent: object) {
		this._parent = HiddenProperty.$add(parent, $shrewdObject, this);
		let proto = Object.getPrototypeOf(this._parent);
		while(proto) {
			if(HiddenProperty.$has(proto, $shrewdDecorators)) {
				let decorators = proto[$shrewdDecorators];
				for(let decorator of decorators) this.setup(decorator);
			}
			proto = Object.getPrototypeOf(proto);
		}
	}

	public setup(decorator: IDecoratorDescriptor) {
		this._members.set(decorator.$key, new decorator.$constructor(this._parent, decorator));
	}

	/** The object corresponding to this ShrewdObject. */
	private _parent: IShrewdObjectParent;

	/** Whether the current ShrewdObject has been terminated. */
	private _isTerminated: boolean = false;

	/** All DecoratedMembers owned by this ShrewdObject */
	private _members: Map<PropertyKey, DecoratedMemeber> = new Map();

	public $terminate() {
		if(this._isTerminated) return;
		for(let memeber of this._members.values()) memeber.$terminate();
		this._isTerminated = true;
	}

	public $getMember<T extends DecoratedMemeber>(key: PropertyKey) {
		return this._members.get(key) as T;
	}

	public get $observables() {
		let result = [];
		for(let member of this._members.values())
			if(member instanceof ObservableProperty)
				result.push(member);
		return result;
	}
}
