
//////////////////////////////////////////////////////////////////
/**
 * A ObservableProperty is an Observable field that can be set manually.
 * It is considered the source of the state changes. 
 */
//////////////////////////////////////////////////////////////////

class ObservableProperty extends DecoratedMemeber {

	// Reuse interceptor by its key to save memory.
	private static _interceptor: any = {};
	public static $interceptor(key: PropertyKey) {
		return ObservableProperty._interceptor[key] = ObservableProperty._interceptor[key] || {
			get() {
				let member = ShrewdObject.get(this).$getMember(key);
				return member.$getter();
			},
			set(value: any) {
				let member = ShrewdObject.get(this).$getMember<ObservableProperty>(key);
				member.$setter(value);
			}
		};
	}

	private static $setAccessible(target: any): void {
		if(target == null || typeof target != "object") return;
		if(Helper.$hasHelper(target)) {
			if(!Global.$isAccessible(target[$observableHelper])) {
				Global.$setAccessible(target[$observableHelper]);
				for(let child of target[$observableHelper].$child) ObservableProperty.$setAccessible(child);
			}
		} else if(HiddenProperty.$has(target, $shrewdObject)) {
			for(let obp of ShrewdObject.get(target).$observables) {
				if(!Global.$isAccessible(obp)) {
					Global.$setAccessible(obp);
					ObservableProperty.$setAccessible(obp._outputValue);
				}
			}
		}
	}

	private _option: IDecoratorOptions<any>;
	private _inputValue: any;
	private _outputValue: any;

	constructor(parent: IShrewdObjectParent, descriptor: IDecoratorDescriptor) {
		super(parent, descriptor);
		this._option = descriptor.$option || {};
		Object.defineProperty(parent, descriptor.$key, ObservableProperty.$interceptor(descriptor.$key));
		if(!this._option.renderer) {
			this._update();
		}
	}

	protected _outdate() {
		// Without a renderer, the ObservableProperty is always updated.
		if(this._option.renderer) {
			super._outdate();
		}
	}

	public $getter() {
		if(!this.$isTerminated) {
			Observer.$refer(this);
			if(this._option.renderer) {
				this._determineState();
			}
		}
		return this._outputValue;
	}

	public $setter(value: any) {
		if(this.$isTerminated) {
			this._outputValue = value;
			return;
		}
		if(Observable.$isWritable(this) && value !== this._inputValue) {
			if(this._option.validator && !this._option.validator.apply(this._parent, [value])) {
				// Notify client that the value has been changed back.
				return Core.$option.hook.write(this.$id);
			}
			this._inputValue = Helper.$wrap(value);
			if(this._option.renderer) {
				Observer.$render(this);
			} else {
				this.$publish(this._inputValue);
			}
		}
	}

	public $render() {
		Global.$pushState({
			$isRenderingProperty: true,
			$accessibles: new Set()
		})
		ObservableProperty.$setAccessible(this._inputValue);
		let value = this._option.renderer!.apply(this._parent, [this._inputValue]);
		Global.$restore();
		if(value !== this._outputValue) {
			this.$publish(Helper.$wrap(value));
		}
	}

	private $publish(value: any) {
		this._outputValue = value;
		Observable.$publish(this);
	}

	protected _onTerminate() {
		delete this._inputValue;
		delete this._option;
		super._onTerminate();
	}
}