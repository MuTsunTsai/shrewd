
//////////////////////////////////////////////////////////////////
/**
 * Observable 物件可以讓 Observer 物件來註冊觀測，
 * 並且在自身狀態發生改變（具體意義由繼承類別來定義）時通知那些 Observer 進行更新。
 */
//////////////////////////////////////////////////////////////////

const $dependencyLevel = Symbol("Dependency Level");

class Observable {

	public static $isWritable(observable: Observable) {
		if(Global.$constructing || !observable.$hasSubscriber) return true;
		if(ObservableProperty.$rendering && !ObservableProperty.$accessible(observable)) {
			console.warn("Inside a renderer function, only the objects owned by the ObservableProperty can be written.");
			return false;
		}
		if(!ObservableProperty.$rendering && Global.$committing) {
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
		if(observer[$dependencyLevel] <= this[$dependencyLevel]) {
			observer[$dependencyLevel] = this[$dependencyLevel] + 1;
		}
	}

	public $unsubscribe(observer: Observer) {
		this._subscribers.delete(observer);
	}

	protected get $hasSubscriber() {
		return this._subscribers.size > 0;
	}

	public [$dependencyLevel]: number = 0;

	private _subscribers: Set<Observer> = new Set();
}
