
//////////////////////////////////////////////////////////////////
/**
 * A ReactiveMethod runs automatically whenever any of its references
 * has changed. It would only run once during the comitting stage.
 */
//////////////////////////////////////////////////////////////////

class ReactiveMethod extends DecoratedMemeber {

	private _option: IDecoratorOptions<any>;
	private _method: Function;
	private _result: any;

	constructor(parent: IShrewdObjectParent, descriptor: IDecoratorDescriptor) {
		super(parent, descriptor);
		this._method = descriptor.$method!;
		this._option = descriptor.$option || {};
	}

	// ReactiveMethods are always active.
	protected checkActive() { return true; }

	public $getter() {
		if(!this.$isTerminated) {
			Observer.$refer(this);
			let force = false;
			// Manual stage.
			if(!Global.$isCommitting) {
				if(this._option.lazy && this.$state != ObserverState.$updated) {
					return () => (this.$notified(), this._result);
				}
				if(this.$state != ObserverState.$pending) {
					force = true;
				}
			}
			return () => {
				this._determineState(force);
				return this._result;
			}
		} else {
			return () => this._result;
		}
	}

	protected $render() {
		this._result = this._method.apply(this._parent);
		// ReactiveMethods always publish themselves regardless of return value.
		Observable.$publish(this);
		return this._result;
	}
}