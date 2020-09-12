
//////////////////////////////////////////////////////////////////
/**
 * A ObservableProperty is an Observable field that can be set manually.
 * It is considered the source of the state changes. 
 */
//////////////////////////////////////////////////////////////////

class ObservableProperty extends DecoratedMemeber {

	// Reuse interceptor by its key to save memory.
	private static _interceptor: any = {};
	public static $interceptor(key: PropertyKey): PropertyDescriptor {
		return ObservableProperty._interceptor[key] = ObservableProperty._interceptor[key] || {
			get(this: IShrewdObjectParent) {
				let member = this[$shrewdObject].$getMember(key);
				return member.$getter();
			},
			set(this: IShrewdObjectParent, value: any) {
				let member = this[$shrewdObject].$getMember<ObservableProperty>(key);
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
			for(let obp of target[$shrewdObject].$observables) {
				if(!Global.$isAccessible(obp)) {
					Global.$setAccessible(obp);
					ObservableProperty.$setAccessible(obp._outputValue);
				}
			}
		}
	}

	private _inputValue: any;
	private _outputValue: any;
	private _initialized: boolean = false;

	constructor(parent: IShrewdObjectParent, descriptor: IDecoratorDescriptor) {
		super(parent, descriptor);
		this._inputValue = (parent as any)[descriptor.$key];
		Object.defineProperty(parent, descriptor.$key, ObservableProperty.$interceptor(descriptor.$key));
		if(!this._option.renderer) {
			this._update();
		}
	}

	public get $internalKey() {
		return this._descriptor.$key.toString();
	}

	public $initialize() {
		if(this._initialized) return;
		if(this._option.validator && !this._option.validator.apply(this._parent, [this._inputValue])) {
			this._inputValue = undefined;
		}
		this._confirm(this._inputValue);
		this._initialized = true;
	}

	protected _outdate() {
		// Without a renderer, the ObservableProperty is always updated.
		if(this._option.renderer) {
			super._outdate();
		}
	}

	protected $regularGet() {
		if(!this._initialized) this.$initialize();
		else if(this._option.renderer) {
			this._determineStateAndRender();
		}
		return this._outputValue;
	}

	protected $terminateGet() {
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
			this._confirm(value);
		}
	}

	private _confirm(value: any) {
		this._inputValue = Helper.$wrap(value);
		if(this._option.renderer) {
			this.$render();
		} else {
			this.$publish(this._inputValue);
		}
	}

	public $render() {
		Global.$pushState({
			$isRenderingProperty: true,
			$accessibles: new Set()
		})

		try {
			ObservableProperty.$setAccessible(this._inputValue);
			let value = this._option.renderer!.apply(this._parent, [this._inputValue]);
			if(value !== this._outputValue) {
				this.$publish(Helper.$wrap(value));
			}
		} finally {
			Global.$restore();
		}
	}

	private $publish(value: any) {
		this._outputValue = value;
		Observable.$publish(this);
	}

	protected _onTerminate() {
		delete this._inputValue;
		// @ts-ignore
		delete this._option;
		super._onTerminate();
	}
}