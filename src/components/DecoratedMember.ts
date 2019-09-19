
//////////////////////////////////////////////////////////////////
/**
 * DecoratedMember 是三種裝飾成員（可觀測屬性、計算屬性、反應方法）的基底類別。
 */
//////////////////////////////////////////////////////////////////

abstract class DecoratedMemeber extends Observer {

	constructor(parent: IShrewdObjectParent, descriptor: IDecoratorDescriptor) {
		super(descriptor.$name);
		this._parent = parent;
	}

	protected _parent: IShrewdObjectParent;

	/** 讀取這個成員時要傳回的東西；必須由繼承類別實作 */
	public abstract $getter(): any;
}