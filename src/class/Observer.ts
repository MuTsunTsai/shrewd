
abstract class Observer extends Observable {

	/////////////////////////////////////////////////////
	// 靜態成員
	/////////////////////////////////////////////////////

	/** 側錄參照關係 */
	public static $refer(observable: Observable) {
		let target = Global.$target;
		if(target && target != observable && !target._terminated) target._reference.add(observable);
	}

	// 檢查參照死路；top-down 地把沒有被訂閱的可觀測物件清除參照。
	// 反應方法是例外，不管有沒有被訂閱，它的參照都是有效的。
	public static $checkDeadEnd(observable: Observable) {
		if(observable instanceof Observer && !(observable instanceof ReactiveMethod) && !observable.$hasSubscriber) {
			let oldReferences = new Set(observable._reference);
			observable.$clearReference();
			observable._updated = false; // 非活躍狀態的觀測者均視為未更新
			for(let ref of oldReferences) this.$checkDeadEnd(ref);
		}
	}

	public static $render(observer: Observer): any {

		// 暫存並推送新狀態
		let oldState = Global.$pushState({
			$constructing: false,
			$target: observer,
			$active: Global.$active			// 參照的觀測者為活躍
				|| observer instanceof ReactiveMethod	// 觀測者為反應方法
				|| observer.$hasSubscriber				// 觀測者已經有被訂閱
		});
		observer._rendering = true;

		// 如果在手動階段執行了觀測者操作，就把它從清單中移除
		if(!Global.$committing) Core.$unqueue(observer);

		// 把參照完全清除
		let oldReferences = new Set(observer._reference);
		observer.$clearReference();

		// 執行主體動作
		let result = observer.$render();

		// 非活躍狀態的觀測者不設定為已更新，因為它們無法接到通知而再次變成未更新
		if(Global.$active) observer._updated = true;

		// 根據側錄結果進行訂閱
		if(!observer._terminated) {
			for(let observable of observer._reference) {
				oldReferences.delete(observable);
				if(Global.$active) observable.$subscribe(observer);
			}
		}

		// 清理參照死路
		for(let observable of oldReferences) Observer.$checkDeadEnd(observable);

		// 恢復狀態
		observer._rendering = false;
		Global.$restore(oldState);

		// 回傳可能有的方法執行結果
		return result;
	}

	/////////////////////////////////////////////////////
	// 實體成員
	/////////////////////////////////////////////////////

	/** 參照的可觀測物件清單 */
	private _reference: Set<Observable> = new Set();

	/** 目前是否處於執行的堆疊中 */
	private _rendering: boolean = false;

	private _updated: boolean = false;

	private _terminated: boolean = false;

	public $notified() {
		this._updated = false;
		Core.$queue(this);
	}

	protected get $updated() { return this._updated; }

	/** 目前是否處於執行的堆疊中 */
	public get $rendering() { return this._rendering; }

	protected abstract $render(): any;

	protected $clearReference() {
		for(let observable of this._reference) observable.$unsubscribe(this);
		this._reference.clear();
		this[$dependencyLevel] = 0;
	}

	public $terminate() {
		if(this._terminated) return;
		this.$clearReference();
		this._terminated = true;
	}

	protected get $terminated() { return this._terminated; }
}