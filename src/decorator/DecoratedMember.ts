
abstract class DecoratedMemeber extends Observer {

	constructor(parent: IShrewdObject, descriptor: IDecoratorDescriptor) {
		super();
		this._parent = parent;
		this._name = parent.constructor.name + "." + descriptor.key.toString();
	}
	
	protected _parent: IShrewdObject;

	protected _name: string;
	
	public get [Symbol.toStringTag]() { return this._name; }

	public abstract $getter(): any;
}