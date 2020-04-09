
//////////////////////////////////////////////////////////////////
/**
 * DecoratedMember is the super class of ObservableProperty,
 * ComputedProperty, and ReactiveMethod.
 */
//////////////////////////////////////////////////////////////////

abstract class DecoratedMemeber extends Observer {

	protected _option: IDecoratorOptions<any>;

	constructor(parent: IShrewdObjectParent, descriptor: IDecoratorDescriptor) {
		super(descriptor.$name);
		this._option = Object.assign(this._defaultOption, descriptor.$option);
		this._parent = parent;
		Core.$register(this);
	}

	private _initialized: boolean = false;

	public $initialize() {
		this._initialized = true;
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
			if(!Global.$isCommitting && !this._initialized) {
				return this.$initialGet();
			} else {
				return this.$regularGet();
			}
		}
	}

	protected abstract $initialGet(): any;

	protected abstract $regularGet(): any;

	protected abstract $terminateGet(): any;
}