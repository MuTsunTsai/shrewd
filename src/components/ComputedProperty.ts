
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

	constructor(parent: IShrewdObject, descriptor: IDecoratorDescriptor) {
		super(parent, descriptor);
		this._getter = descriptor.method!;
	}

	protected $refer(observable: Observable) {
		// 計算屬性中，只有當有訂閱者存在的時候才會加入參照
		if(this.$hasSubscriber) super.$refer(observable);
	}

	protected get $shouldRender() {
		// 只有在手動階段或者當目前有訂閱者的時候才真的執行計算
		return !Core.$committing || this.$hasSubscriber;
	}

	protected $render() {
		let value = this._getter.apply(this._parent);
		if(value != this._value) {
			this._value = value;
			Observable.$publish(this);
		}
	}

	public $getter() {
		// 如果呼叫的是一個觀測者，那麼此時觀測者就會訂閱這個計算屬性，
		// 於是這個計算屬性至少會有一個訂閱者
		Observer.$refer(this);

		// 如果處於未更新狀態或者處於手動階段，試圖重新計算
		if(!this.$updated || !Core.$committing) Observer.$render(this);

		// 傳回暫存值
		return this._value;
	}
}
