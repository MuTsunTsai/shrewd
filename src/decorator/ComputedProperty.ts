
//////////////////////////////////////////////////////////////////
/**
 * ComputedProperty 是計算屬性。
 * 
 * 它會在參照對象發生改變的時候重新計算自己的值，
 * 並且在計算結果改變的時候通知後續的處理。
 * 
 * 定義在每一個類別層次上的計算屬性都是獨立的實體，也就是說，
 * 在常見的應用中，下層計算屬性經常會參照上層計算屬性，
 * 而如果上層計算結果不變，下層就不用繼續計算了。
 */
//////////////////////////////////////////////////////////////////

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
		Observer.$refer(this);
		if(!this._initialized) {
			Observer.$render(this);
			this._initialized = true;
		}
		return this._value;
	}
}
