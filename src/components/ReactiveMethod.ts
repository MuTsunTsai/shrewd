
//////////////////////////////////////////////////////////////////
/**
 * ReactiveMethod 是反應方法。
 * 
 * 它會在參照對象發生改變的時候自動執行，然後通知後續的處理（無論執行結果）。
 * 定義在每一個類別層次上的反應方法都是獨立的實體。
 * 
 * 如果一個反應方法在認可階段中已經執行過一次，
 * 再次呼叫時它只會傳回暫存的傳回值，而不會重新再執行一次。
 * 不過無論如何，它都會通知參照了自己後續操作去執行。
 */
//////////////////////////////////////////////////////////////////

class ReactiveMethod extends DecoratedMemeber {

	private _method: Function;
	private _result: any;

	constructor(parent: object, descriptor: IDecoratorDescriptor) {
		super(parent, descriptor);
		this._method = descriptor.method!;
	}

	public $getter() {
		Observer.$refer(this);
		// 如果在當前的認可階段已經執行過，直接把暫存的結果傳回
		if(Core.$committing && this.$updated) return () => this._result;
		// 否則就執行一次
		else return () => Observer.$render(this);
	}

	protected $render() {
		this._result = this._method.apply(this._parent);
		Observable.$publish(this);
		return this._result;
	}
}