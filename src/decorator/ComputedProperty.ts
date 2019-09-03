
class ComputedProperty extends DecoratedMemeber {

	private _getter: Function;
	private _value: any;
	private _initialized: boolean = false;

	constructor(parent: IShrewdObject, descriptor: IDecoratorDescriptor) {
		super(parent, descriptor);
		this._getter = descriptor.method!;
	}

	protected $render() {
		let value = this._getter.apply(this._parent);
		if(value != this._value) {
			this._value = value;
			this.$notify();
		}
	}

	public $getter() {
		if(!this._initialized) {
			Observer.$render(this);
			this._initialized = true;
		}
		return this._value;
	}
}
