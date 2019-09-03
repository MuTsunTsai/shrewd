
//////////////////////////////////////////////////////////////////
/**
 * Observable 物件可以讓 Observer 物件來註冊觀測，
 * 並且在自身狀態發生改變（具體意義由繼承類別來定義）時通知那些 Observer 進行更新。
 */
//////////////////////////////////////////////////////////////////

const $dependencyLevel = Symbol("Dependency Level");

class Observable {

	public static get $writable() {
		if(Core.$committing) {
			console.warn("Writing into Observables during committing is forbidden; use computed property instead.");
			return false;
		}
		return true;
	}

	public $subscribe(observer: Observer) {
		this._observers.add(observer);
	}

	public $unsubscribe(observer: Observer) {
		this._observers.delete(observer);
	}

	protected $notify() {
		for(let observer of this._observers) Core.$queue(observer);
	}

	public [$dependencyLevel]: number = 0;

	private _observers: Set<Observer> = new Set();
}
