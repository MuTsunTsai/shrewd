
//////////////////////////////////////////////////////////////////
/**
 * A ReactiveMethod runs automatically whenever any of its references
 * has changed. It would only run once during the comitting stage.
 */
//////////////////////////////////////////////////////////////////

class ReactiveMethod extends DecoratedMemeber {

	private _method: Function;
	private _result: any;

	constructor(parent: IShrewdObjectParent, descriptor: IDecoratorDescriptor) {
		super(parent, descriptor);
		this._method = descriptor.$method!;
	}

	protected get _defaultOption(): IDecoratorOptions<any> {
		return { active: true };
	}

	protected $initialGet() {
		return () => {
			this.$notified();
			return this._result;
		}
	}

	protected $regularGet() {
		return () => {
			this._determineStateAndRender();
			return this._result;
		}
	}

	protected $terminateGet() {
		return () => this._result;
	}

	protected $render() {
		this._result = this._method.apply(this._parent);
		// ReactiveMethods always publish themselves regardless of return value.
		Observable.$publish(this);
		return this._result;
	}
}