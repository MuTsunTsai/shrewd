import { DecoratedMember, ObservableProperty, InitializationController, $shrewdDecorators, HiddenProperty } from "Index";

export const $shrewdObject = Symbol("ShrewdObject");

export interface IShrewdObjectParent {
	[$shrewdObject]: ShrewdObject;
}

export class ShrewdObject {

	constructor(parent: object) {
		this._parent = HiddenProperty.$add(parent, $shrewdObject, this);
		let proto = Object.getPrototypeOf(this._parent);
		while(proto) {
			if(HiddenProperty.$has(proto, $shrewdDecorators)) {
				let decorators = proto[$shrewdDecorators];
				for(let decorator of decorators) {
					let member = new decorator.$constructor(this._parent, decorator);

					// In case of overriding the @shrewd options of ObservableProperties,
					// only the last override will get initialized.
					if(!this._members.has(member.$internalKey)) {
						this._members.set(member.$internalKey, member);
					} else {
						member.$terminate(); // For garbage collecting
					}
				}
			}
			proto = Object.getPrototypeOf(proto);
		}
		for(let member of this._members.values()) {
			InitializationController.$enqueue(member);
		}
	}

	/** The object corresponding to this {@link ShrewdObject}. */
	private _parent: IShrewdObjectParent;

	/** Whether the current {@link ShrewdObject} has been terminated. */
	private _isTerminated: boolean = false;

	/** All {@link DecoratedMember}s owned by this {@link ShrewdObject} */
	private _members: Map<PropertyKey, DecoratedMember> = new Map();

	public $terminate() {
		if(this._isTerminated) return;
		for(let member of this._members.values()) member.$terminate();
		//@ts-ignore
		delete this._parent;
		this._isTerminated = true;
	}

	public $getMember<T extends DecoratedMember>(): IterableIterator<T>;
	public $getMember<T extends DecoratedMember>(key?: PropertyKey): T;
	public $getMember<T extends DecoratedMember>(key?: PropertyKey) {
		if(!key) return this._members.values();
		return this._members.get(key) as T;
	}

	public get $observables() {
		let result = [];
		for(let member of this._members.values()) {
			if(member instanceof ObservableProperty) {
				result.push(member);
			}
		}
		return result;
	}
}
