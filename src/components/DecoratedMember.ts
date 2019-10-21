
//////////////////////////////////////////////////////////////////
/**
 * DecoratedMember is the super class of ObservableProperty,
 * ComputedProperty, and ReactiveMethod.
 */
//////////////////////////////////////////////////////////////////

abstract class DecoratedMemeber extends Observer {

	constructor(parent: IShrewdObjectParent, descriptor: IDecoratorDescriptor) {
		super(descriptor.$name);
		this._parent = parent;
	}

	protected _parent: IShrewdObjectParent;

	/** The thing to return when calling "get" on this member. */
	public abstract $getter(): any;
}