
abstract class Observer extends Observable {

	/** 目錢的側錄執行者 */
	private static _currentTarget: Observer | null = null;

	/** 側錄一個參照關係 */
	public static $refer(observable: Observable) {
		if(Observer._currentTarget) Observer._currentTarget._reference.add(observable);
	}

	public static $render(observer: Observer) {
		// 登錄為目前的側錄執行者
		let lastTarget = Observer._currentTarget;
		Observer._currentTarget = observer;

		// 把參照完全清楚
		for(let observable of observer._reference) observable.$unsubscribe(observer);
		observer._reference.clear();
		observer[$dependencyLevel] = 0;

		// 執行主體動作
		observer.$render();

		// 整理側錄到的參照
		for(let observable of observer._reference) {
			observable.$subscribe(observer);
			if(observable[$dependencyLevel] >= observer[$dependencyLevel]) {
				observer[$dependencyLevel] = observable[$dependencyLevel] + 1;
			}
		}

		// 恢復側錄執行者
		Observer._currentTarget = lastTarget;
	}

	private _reference: Set<Observable> = new Set();

	protected abstract $render(): void;
}