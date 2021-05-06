
//////////////////////////////////////////////////////////////////
/**
 * A ComputedProperty is a value depending on Observables;
 * its value cannot be set manually.
 *
 * Once calculated, it would not repeat its calculation until
 * some of its references has changed.
 *
 * Active ComputedProperties recalculate and propagate changes
 * automatically, whereas inactive ones will recalculate only when
 * the property is accessed.
 */
//////////////////////////////////////////////////////////////////

class ComputedProperty extends DecoratedMember {

	private _getter: Function;
	private _value: unknown;

	constructor(parent: IShrewdObjectParent, descriptor: IDecoratorDescriptor) {
		super(parent, descriptor);
		this._getter = descriptor.$method!
		if(this._option.active) this.$notified();
		this._option.comparer ??= (ov, nv) => ov === nv;
	}

	public get $renderer() {
		return this._getter.bind(this._parent);
	}

	public $postrendering(result: unknown) {
		if(!this._option.comparer!.apply(this._parent, [this._value, result, this])) {
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

	protected _onTerminate() {
		Helper.$clear(this._value);
		super._onTerminate();
	}
}
