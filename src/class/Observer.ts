
enum ObserverState {
	$outdated, $updated, $pending
}

abstract class Observer extends Observable {

	/////////////////////////////////////////////////////
	// 靜態成員
	/////////////////////////////////////////////////////

	private static _pending: Set<Observer> = new Set();

	private static _trace: Observer[] = [];

	public static $clearPending() {
		for(let pending of Observer._pending) {
			if(pending._state == ObserverState.$pending) pending._update();
		}
		Observer._pending.clear();
	}

	/** 側錄參照關係 */
	public static $refer(observable: Observable) {
		let target = Global.$target;
		if(target && target != observable && !target._isTerminated) target._reference.add(observable);
	}

	// 檢查參照死路；top-down 地把沒有被訂閱的可觀測物件清除參照。
	// 反應方法是例外，不管有沒有被訂閱，它的參照都是有效的。
	public static $checkDeadEnd(observable: Observable) {
		if(observable instanceof Observer && !observable._isActive) {
			let oldReferences = new Set(observable._reference);
			observable.$clearReference();
			Core.$unqueue(observable);
			observable._state = ObserverState.$outdated; // 非活躍狀態的觀測者均視為未更新
			for(let ref of oldReferences) Observer.$checkDeadEnd(ref);
		}
	}

	public static $render(observer: Observer): any {

		// 暫存並推送新狀態
		Global.$pushState({
			$isConstructing: false,
			$target: observer,
			$isActive: Global.$isActive || observer._isActive
		});
		observer._isRendering = true;
		Core.$unqueue(observer);

		// 把參照完全清除
		let oldReferences = new Set(observer._reference);
		observer.$clearReference();

		// 執行主體動作
		let result = observer.$render();

		// 活躍狀態的觀測者設定為更新；非活躍觀測者不改變狀態
		if(Global.$isActive) observer._update();

		// 根據側錄結果進行訂閱
		if(!observer._isTerminated) {
			for(let observable of observer._reference) {
				oldReferences.delete(observable);
				if(Global.$isActive) observable.$subscribe(observer);
			}
		}

		// 清理參照死路
		for(let observable of oldReferences) Observer.$checkDeadEnd(observable);

		// 恢復狀態
		observer._isRendering = false;
		Global.$restore();

		// 回傳可能有的方法執行結果
		return result;
	}

	/////////////////////////////////////////////////////
	// 實體成員
	/////////////////////////////////////////////////////

	/** 參照的可觀測物件清單 */
	private _reference: Set<Observable> = new Set();

	/** 目前是否處於執行的堆疊中 */
	private _isRendering: boolean = false;

	/** 目前的更新狀態 */
	private _state: ObserverState = ObserverState.$outdated;

	private _isTerminated: boolean = false;

	/** 識別名稱； */
	protected _name: string;

	constructor(name: string) {
		super();
		this._name = name;
	}

	/** 目前是否處於執行的堆疊中 */
	public get $isRendering() { return this._isRendering; }

	public $notified() {
		this._pend();
		this._state = ObserverState.$outdated;
		Core.$queue(this);
	}

	public $terminate() {
		if(this._isTerminated) return;
		this.$clearReference();
		this._update();
		this._isTerminated = true;
	}

	private _pend() {
		if(this._state == ObserverState.$updated) {
			this._state = ObserverState.$pending;
			Observer._pending.add(this);
			for(let subscriber of this.$subscribers) subscriber._pend();
		}
	}

	protected _determineState() {

		// 真的找到循環參照了
		if(this.$isRendering) {
			// this 不一定會是往下回溯的起點，有可能是往下的途中發現了較小的循環，
			// 所以找出最小的循環圈子
			let last = Observer._trace.indexOf(this);
			let cycle = [this, ...Observer._trace.slice(last + 1), this];

			// 把循環裡面的東西全部終結掉，以便程式可以在不丟錯的情況下繼續執行
			cycle.forEach(o => o.$terminate());

			// 產生偵錯訊息
			let trace = cycle.map(o => o._name).join(" => ");
			console.warn("Circular dependency detected: " + trace + "\nAll these observers will be terminated.");
		}

		if(this._state == ObserverState.$updated) return;
		Observer._trace.push(this);

		// 整理目前的未更新的參照
		for(let ref of this._reference) {
			if(ref instanceof Observer) {
				// 發現了一個可能的循環參照，但仍然有可能只是參照路徑變動
				// 唯有的確定辦法是真的執行看看；若是真的，會跑到上面那邊去
				if(ref._isRendering) Observer.$render(this);
				else if(ref._state != ObserverState.$updated) ref._determineState();
			}
		}

		if(this._state == ObserverState.$outdated) Observer.$render(this);
		else {
			Observer._pending.delete(this);
			this._update();
		}
		Observer._trace.pop();
	}

	protected _update() { this._state = ObserverState.$updated; }

	protected get _isPending() { return this._state == ObserverState.$pending; }

	/** 不考慮參照者的情況下，自身是否活躍；反應方法覆寫了這個方法 */
	protected get _isActive() { return this.$hasSubscriber; }

	protected abstract $render(): any;

	protected $clearReference() {
		for(let observable of this._reference) observable.$unsubscribe(this);
		this._reference.clear();
	}

	protected get $isTerminated() { return this._isTerminated; }
}