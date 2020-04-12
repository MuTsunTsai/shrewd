
//////////////////////////////////////////////////////////////////
/**
 * DecoratedMember is the super class of ObservableProperty,
 * ComputedProperty, and ReactiveMethod.
 */
//////////////////////////////////////////////////////////////////

abstract class DecoratedMemeber extends Observer {

	protected _option: IDecoratorOptions<any>;

	protected _descriptor: IDecoratorDescriptor;

	constructor(parent: IShrewdObjectParent, descriptor: IDecoratorDescriptor) {
		super(descriptor.$class + "." + descriptor.$key.toString());
		this._descriptor = descriptor;
		this._option = Object.assign(this._defaultOption, descriptor.$option);
		this._parent = parent;
	}

	public get $internalKey() {
		return this._descriptor.$class + "." + this._descriptor.$key.toString();
	}

	public $initialize() {
		this._determineStateAndRender();
	}

	protected get _defaultOption(): IDecoratorOptions<any> {
		return {};
	}

	protected checkActive(): boolean {
		if(this._option.active) return true;
		return super.checkActive();
	}

	/** The parent object of this `DecoratedMember`. */
	protected _parent: IShrewdObjectParent;

	/** The thing to return when calling "get" on this member. */
	public $getter() {
		if(this.$isTerminated) {
			return this.$terminateGet();
		} else {
			Observer.$refer(this);
			return this.$regularGet();
		}
	}

	protected abstract $regularGet(): any;

	protected abstract $terminateGet(): any;
}