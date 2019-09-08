
abstract class Observer extends Observable {

	/////////////////////////////////////////////////////
	// 靜態成員
	/////////////////////////////////////////////////////

	/** 目前的側錄執行者 */
	private static _currentTarget: Observer | null = null;

	/** 側錄參照關係 */
	public static $refer(observable: Observable) {
		if(Observer._currentTarget && Observer._currentTarget != observable) // 參照自己是不算的
			Observer._currentTarget.$refer(observable);
	}

	public static $render(observer: Observer): any {
		// 登錄為目前的側錄執行者
		let lastTarget = Observer._currentTarget;
		Observer._currentTarget = observer;
		observer._rendering = true;

		// 如果在手動階段執行了觀測者操作，就把它從清單中移除
		if(!Core.$committing) Core.$unqueue(observer);

		// 把參照完全清除
		for(let observable of observer._reference) observable.$unsubscribe(observer);
		observer._reference.clear();
		observer[$dependencyLevel] = 0;

		// 執行主體動作
		let result: any;
		if(observer.$shouldRender) {
			result = observer.$render();
			observer._updated = true;
		}

		// 整理相依度；之所以這段程式碼是最後才一口氣執行（而非是在參照的當下立刻執行）
		// 是因為在 top-down 的執行情境中，參照的當下參照對象還沒確立出正確的相依度
		for(let observable of observer._reference) {
			if(observer[$dependencyLevel] <= observable[$dependencyLevel]) {
				observer[$dependencyLevel] = observable[$dependencyLevel] + 1;
			}
		}

		// 恢復側錄執行者
		observer._rendering = false;
		Observer._currentTarget = lastTarget;

		// 回傳可能有的方法執行結果
		return result;
	}

	/////////////////////////////////////////////////////
	// 實體成員
	/////////////////////////////////////////////////////

	/** 參照的可觀測物件清單 */
	private _reference: Set<Observable> = new Set();

	private _rendering: boolean = false;

	private _updated: boolean = false;

	public $notified() {
		this._updated = false;
		Core.$queue(this);
	}

	protected get $updated() { return this._updated; }

	public get $rendering() { return this._rendering; }

	protected abstract $render(): any;

	/** 當前的物件是否有必要執行，預設行為為恆真 */
	protected get $shouldRender() { return true; }

	/** 參照一個可觀測物件；預設行為是直接把對象加入參照清單，但例如計算屬性有覆寫這個行為 */
	protected $refer(observable: Observable) {
		if(!this._reference.has(observable)) {
			this._reference.add(observable);
			observable.$subscribe(this);
		}
	}
}