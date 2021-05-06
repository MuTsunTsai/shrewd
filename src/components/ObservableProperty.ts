
//////////////////////////////////////////////////////////////////
/**
 * A ObservableProperty is an Observable field that can be set manually.
 * It is considered the source of the state changes.
 */
//////////////////////////////////////////////////////////////////

class ObservableProperty extends DecoratedMember {

	// Reuse interceptor by its key to save memory.
	private static _interceptor: Record<PropertyKey, PropertyDescriptor> = {};
	public static $interceptor(key: PropertyKey): PropertyDescriptor {
		return ObservableProperty._interceptor[key as string] = ObservableProperty._interceptor[key as string] || {
			get(this: IShrewdObjectParent) {
				let member = this[$shrewdObject].$getMember(key);
				return member.$getter();
			},
			set(this: IShrewdObjectParent, value: unknown) {
				let member = this[$shrewdObject].$getMember<ObservableProperty>(key);
				member.$setter(value);
			}
		};
	}

	private static $setAccessible(target: unknown): void {
		if(!(target instanceof Object)) return;
		if(Helper.$hasHelper(target)) {
			if(!Global.$isAccessible(target[$observableHelper])) {
				Global.$setAccessible(target[$observableHelper]);
				for(let child of target[$observableHelper].$children) ObservableProperty.$setAccessible(child);
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

	private _inputValue: unknown;
	private _outputValue: unknown;
	private _initialized: boolean = false;

	constructor(parent: IShrewdObjectParent, descriptor: IDecoratorDescriptor) {
		super(parent, descriptor);
		this._outputValue = this._inputValue = Reflect.get(parent, descriptor.$key);
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
		this._initialValidation();
		if(this._option.renderer) {
			// Perform initial rendering to establish dependencies.
			this._determineStateAndRender();
		} else {
			this._outputValue = this._inputValue;
		}
		this._initialized = true;
	}

	protected _outdate(by?: Observable) {
		// Without a renderer, the ObservableProperty is always updated.
		if(this._option.renderer) {
			super._outdate(by);
		}
	}

	/** Validation used before and during initialization */
	private _initialValidation() {
		if(!(this._option.validator?.apply(this._parent, [this._inputValue]) ?? true)) {
			this._inputValue = undefined;
		}
		this._inputValue = Helper.$wrap(this._inputValue);
	}

	protected $regularGet() {
		if(!this._initialized) {
			// Before initialized, perform only the validation but not the rendering,
			// and dependencies are not established.
			this._initialValidation();
			return this._inputValue;
		} else if(this._option.renderer) {
			this._determineStateAndRender();
		}
		return this._outputValue;
	}

	protected $terminateGet() {
		return this._outputValue;
	}

	public $setter(value: unknown) {
		if(this.$isTerminated) {
			this._outputValue = value;
			return;
		}
		if(Observable.$isWritable(this) && value !== this._inputValue) {
			if(!(this._option.validator?.apply(this._parent, [value]) ?? true)) {
				// Notify client that the value has been changed back.
				return Core.$option.hook.write(this.$id);
			}
			this._inputValue = Helper.$wrap(value);
			if(this._option.renderer) {
				/**
				 * Perform a quick rendering based on the data before commit, without updating dependencies.
				 * This part is the same as the core of `Observer.$render`,
				 * and we do not reuse the code in order to flatten the execution stack.
				 */
				this.$prerendering();
				try {
					this.$postrendering(this.$renderer());
				} finally {
					this.$cleanup();
				}
			} else {
				this.$publish(this._inputValue);
			}
		}
	}

	public $prerendering() {
		Global.$pushState({
			$isRenderingProperty: true,
			$accessibles: new Set()
		});
		ObservableProperty.$setAccessible(this._inputValue);
	}

	public get $renderer() {
		return this._option.renderer!.bind(this._parent, this._inputValue);
	}

	public $postrendering(result: unknown) {
		if(result !== this._outputValue) {
			this.$publish(Helper.$wrap(result));
		}
	}

	public $cleanup() {
		Global.$restore();
	}

	private $publish(value: unknown) {
		this._outputValue = value;
		Observable.$publish(this);
	}

	protected _onTerminate() {
		Helper.$clear(this._inputValue);
		Helper.$clear(this._outputValue);
		delete this._inputValue;
		// @ts-ignore
		delete this._option;
		super._onTerminate();
	}
}
