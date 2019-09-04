
interface IValidator<T> {
	(value: T): T;
}

class ObservableProperty extends DecoratedMemeber {

	private static _interceptor: any = {};
	public static interceptor(key: PropertyKey) {
		return ObservableProperty._interceptor[key] = ObservableProperty._interceptor[key] || {
			get() { return ShrewdObject.get(this).$getMember(key).$getter(); },
			set(value: any) { ShrewdObject.get(this).$getMember<ObservableProperty>(key).$setter(value); }
		};
	}

	private static _defaultValidator = (value: any) => value;

	private _validator: IValidator<any>;
	private _inputValue: any;
	private _outputValue: any;
	private _initialized: boolean = false;

	constructor(parent: object, descriptor: IDecoratorDescriptor) {
		super(parent, descriptor);
		this._validator = descriptor.validator || ObservableProperty._defaultValidator;
		Object.defineProperty(parent, descriptor.key, ObservableProperty.interceptor(descriptor.key));
	}

	private $initialize() {
		Observer.$render(this);
		this._initialized = true;
	}

	public $getter() {
		if(!this._initialized) this.$initialize();
		Observer.$refer(this);
		return this._outputValue;
	}

	public $setter(value: any) {
		if(Observable.$writable && value != this._inputValue) {
			this._inputValue = value;
			if(this._initialized) this.$render();
			else this.$initialize();
		}
	}

	public $render() {
		let value = this._validator.apply(this._parent, [this._inputValue]);
		if(value !== this._outputValue) {
			this._outputValue = value;
			this.$notify();
		}
	}
}