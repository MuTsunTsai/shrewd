
//////////////////////////////////////////////////////////////////
/**
 * DecoratedMember 是三種裝飾成員（可觀測屬性、計算屬性、反應方法）的基底類別。
 */
//////////////////////////////////////////////////////////////////

abstract class DecoratedMemeber extends Observer {

	constructor(parent: IShrewdObject, descriptor: IDecoratorDescriptor) {
		super();
		this._parent = parent;
		this._name = descriptor.name;
	}

	protected _parent: IShrewdObject;

	/** 這個成員的識別名稱； */
	protected _name: string;

	public get [Symbol.toStringTag]() { return this._name; }

	/** 讀取這個成員時要傳回的東西；必須由繼承類別實作 */
	public abstract $getter(): any;
}