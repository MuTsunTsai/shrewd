
//////////////////////////////////////////////////////////////////
/**
 * A ComputedProperty is a value depending on Observables;
 * its value cannot be set manually.
 * 
 * Once calculated, it would not repeat its calculation until
 * any of its references has changed.
 * 
 * Active ComputedProperties recalculate and propagate changes
 * automatically, whereas inactive ones will recalculate only when
 * the property is accessed.
 */
//////////////////////////////////////////////////////////////////

class ComputedProperty extends DecoratedMemeber {

	private _getter: Function;
	private _value: any;

	constructor(parent: IShrewdObjectParent, descriptor: IDecoratorDescriptor) {
		super(parent, descriptor);
		this._getter = descriptor.$method!;
		if(this._option.active) this.$notified();
	}

	protected $render() {
		let value = this._getter.apply(this._parent);
		if(value != this._value) {
			this._value = value;
			Observable.$publish(this);
		}
	}

	protected $initialGet() {
		return this.$regularGet();
	}

	protected $regularGet() {
		this._determineStateAndRender();
		return this._value;
	}

	protected $terminateGet() {
		return this._value;
	}
}
