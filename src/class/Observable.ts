
//////////////////////////////////////////////////////////////////
/**
 * Observable 物件可以讓 Observer 物件來註冊觀測，
 * 並且在自身狀態發生改變（具體意義由繼承類別來定義）時通知那些 Observer 進行更新。
 */
//////////////////////////////////////////////////////////////////

const $dependencyLevel = Symbol("Dependency Level");

class Observable {

	private static _validationTarget: Observable | null = null;

	protected static $validate<T>(value: T, validator: IValidator<T>, thisArg: object) {
		if(typeof value == "object" && HiddenProperty.$has(value as any, $observableHelper))
			Observable._validationTarget = (value as any)[$observableHelper];
		let result = validator.apply(thisArg, [value]);
		Observable._validationTarget = null;
		return result;
	}

	public static $isWritable(observable: Observable) {
		if(Core.$committing && Observable._validationTarget != observable) {
			if(Observable._validationTarget != null) {
				console.warn("For safety reasons, during validation only the value itself can be modified, not including descendant Observables.");
			} else {
				console.warn("Writing into Observables during committing is forbidden; use computed property instead.");
			}
			return false;
		}
		return true;
	}

	/**
	 * 通知所有訂閱對象
	 * 
	 * 之所以這個方法寫成靜態方法是為了方便繼承類別中的靜態方法也能呼叫。
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

	public [$dependencyLevel]: number = 0;

	private _subscribers: Set<Observer> = new Set();
}
