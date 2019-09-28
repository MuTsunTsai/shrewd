
class ObservableProperty extends DecoratedMemeber {

	// 為了節省記憶體，根據 key 來暫存函數以重複使用
	private static _interceptor: any = {};
	public static $interceptor(key: PropertyKey) {
		return ObservableProperty._interceptor[key] = ObservableProperty._interceptor[key] || {
			get() { return ShrewdObject.get(this).$getMember(key).$getter(); },
			set(value: any) { ShrewdObject.get(this).$getMember<ObservableProperty>(key).$setter(value); }
		};
	}

	private static _isRendering: boolean = false;
	public static get $isRendering() { return ObservableProperty._isRendering; }

	private static _accessibles: Set<Observable> = new Set();
	private static $setAccessible(target: any): void {
		if(target == null || typeof target != "object") return;
		if(Helper.$hasHelper(target)) {
			if(!ObservableProperty._accessibles.has(target[$observableHelper])) {
				ObservableProperty._accessibles.add(target[$observableHelper]);
				for(let child of target[$observableHelper].$child) ObservableProperty.$setAccessible(child);
			}
		} else if(HiddenProperty.$has(target, $shrewdObject)) {
			for(let obp of ShrewdObject.get(target).$observables) {
				if(!ObservableProperty._accessibles.has(obp)) {
					ObservableProperty._accessibles.add(obp);
					ObservableProperty.$setAccessible(obp._outputValue);
				}
			}
		}
	}
	public static $isAccessible(observable: Observable): boolean {
		return ObservableProperty._accessibles.has(observable);
	}

	private _option: IDecoratorOptions<any>;
	private _inputValue: any;
	private _outputValue: any;

	constructor(parent: IShrewdObjectParent, descriptor: IDecoratorDescriptor) {
		super(parent, descriptor);
		this._option = descriptor.$option || {};
		Object.defineProperty(parent, descriptor.$key, ObservableProperty.$interceptor(descriptor.$key));
		if(!this._option.renderer) this._update();
	}

	protected _outdate() {
		// 如果沒有配置渲染方法，就無所謂過期
		if(this._option.renderer) super._outdate();
	}

	public $getter() {
		if(!this.$isTerminated) {
			Observer.$refer(this);
			if(this._option.renderer) this._determineState();
		}
		return this._outputValue;
	}

	public $setter(value: any) {
		if(this.$isTerminated) {
			this._outputValue = value;
			return;
		}
		if(Observable.$isWritable(this) && value != this._inputValue) {
			if(this._option.validator && !this._option.validator.apply(this._parent, [value])) return;
			this._inputValue = Helper.$wrap(value);
			if(this._option.renderer) Observer.$render(this);
			else this.$publish(this._inputValue);
		}
	}

	public $render() {
		ObservableProperty._isRendering = true;
		ObservableProperty.$setAccessible(this._inputValue);
		let value = this._option.renderer!.apply(this._parent, [this._inputValue]);
		ObservableProperty._accessibles.clear();
		ObservableProperty._isRendering = false;
		if(value !== this._outputValue) this.$publish(Helper.$wrap(value));
	}

	private $publish(value: any) {
		this._outputValue = value;
		Observable.$publish(this);
	}

	public $terminate() {
		if(this.$isTerminated) return;
		delete this._inputValue;
		delete this._option;
		super.$terminate();
	}
}