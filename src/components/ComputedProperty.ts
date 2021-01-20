
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

class ComputedProperty extends DecoratedMember {

	private _getter: Function;
	private _value: any;

	constructor(parent: IShrewdObjectParent, descriptor: IDecoratorDescriptor) {
		super(parent, descriptor);
		this._getter = descriptor.$method!
		if(this._option.active) this.$notified();
	}

	public get $renderer() {
		return this._getter.bind(this._parent);
	}

	public $postrendering(result: any) {
		if(result !== this._value) {
			this._value = result;
			Observable.$publish(this);
		}
		if(!this.$hasReferences) this.$terminate();
	}

	protected $regularGet() {
		this._determineStateAndRender();
		if(!this.$hasReferences) this.$terminate();
		return this._value;
	}

	protected $terminateGet() {
		return this._value;
	}
}
