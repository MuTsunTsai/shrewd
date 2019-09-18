
//////////////////////////////////////////////////////////////////
/**
 * Observable 物件可以讓 Observer 物件來註冊觀測，
 * 並且在自身狀態發生改變（具體意義由繼承類別來定義）時通知那些 Observer 進行更新。
 */
//////////////////////////////////////////////////////////////////

class Observable {

	public static $isWritable(observable: Observable) {
		if(Global.$isConstructing || !observable.$hasSubscriber) return true;
		if(ObservableProperty.$isRendering && !ObservableProperty.$isAccessible(observable)) {
			console.warn("Inside a renderer function, only the objects owned by the ObservableProperty can be written.");
			return false;
		}
		if(!ObservableProperty.$isRendering && Global.$isCommitting) {
			console.warn("Writing into Observables is not allowed inside a ComputedProperty or a ReactiveMethod. For self-correcting behavior, use the renderer option of the ObservableProperty. For constructing new Shrewd objects, use Shrewd.construct() method.");
			return false;
		}
		return true;
	}

	/**
	 * 通知所有訂閱對象
	 */
	public static $publish(observable: Observable) {
		for(let observer of observable._subscribers) observer.$notified();
	}

	public $subscribe(observer: Observer) {
		this._subscribers.add(observer);
	}

	public $unsubscribe(observer: Observer) {
		this._subscribers.delete(observer);
	}

	protected get $hasSubscriber() {
		return this._subscribers.size > 0;
	}

	protected get $subscribers() {
		return this._subscribers.values();
	}

	private _subscribers: Set<Observer> = new Set();
}
