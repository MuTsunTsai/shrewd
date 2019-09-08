
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

	constructor(parent: object, descriptor: IDecoratorDescriptor) {
		super(parent, descriptor);
		this._validator = descriptor.validator || ObservableProperty._defaultValidator;
		Object.defineProperty(parent, descriptor.key, ObservableProperty.interceptor(descriptor.key));
	}

	public $getter() {
		Observer.$refer(this);
		if(!this.$updated) Observer.$render(this);
		return this._outputValue;
	}

	public $setter(value: any) {
		if(Observable.$isWritable(this) && value != this._inputValue) {
			this._inputValue = Helper.$wrap(value);
			Observer.$render(this);
		}
	}

	public $render() {
		let value = Observable.$validate(this._inputValue, this._validator, this._parent);
		if(value !== this._outputValue) {
			this._outputValue = Helper.$wrap(value);
			Observable.$publish(this);
		}
	}
}