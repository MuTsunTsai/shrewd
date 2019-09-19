
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

	constructor(parent: IShrewdObjectParent, descriptor: IDecoratorDescriptor) {
		super(parent, descriptor);
		this._getter = descriptor.$method!;
	}

	protected $render() {
		let value = this._getter.apply(this._parent);
		if(value != this._value) {
			this._value = value;
			Observable.$publish(this);
		}
	}

	public $getter() {
		if(!this.$isTerminated) {
			// 如果呼叫的是一個觀測者，那麼此時觀測者就會訂閱這個計算屬性，
			// 於是這個計算屬性至少會有一個訂閱者
			Observer.$refer(this);
			this._determineState();
		} else {
			this._value = this._getter.apply(this._parent);
		}

		// 傳回暫存值
		return this._value;
	}
}
