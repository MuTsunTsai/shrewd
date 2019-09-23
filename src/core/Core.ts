
class Core {

	/** 已接到通知、等待被執行的 Observer */
	private static readonly _queue: Set<Observer> = new Set();

	/** 等待終結的物件 */
	private static readonly _terminate: Set<ShrewdObject> = new Set();

	/** 在當前堆疊中是否已經設置了自動認可 */
	private static _promised: boolean = false;

	public static $commit() {
		Global.$pushState({ $isCommitting: true });

		// 開始執行認可
		for(let observer of Core._queue) Observer.$render(observer);

		// 結束認可
		Observer.$clearPending();
		Core._queue.clear();
		Global.$restore();

		// 終結物件
		for(let shrewd of Core._terminate) shrewd.$terminate();
		Core._terminate.clear();
	}

	/** 自動認可會在堆疊清空時立刻執行（比任何 setTimeout 都更早） */
	private static _autoCommit() {
		Core.$commit();
		Core._promised = false;
	}

	public static $unqueue(observer: Observer) {
		Core._queue.delete(observer);
	}

	public static $queue(observer: Observer) {
		// 正在執行中的觀測者就不用重新加入了
		if(!observer.$isRendering) Core._queue.add(observer);

		// 設置自動認可
		if(!Core._promised) {
			let promise = Promise.resolve();
			promise.then(Core._autoCommit);
			Core._promised = true;
		}
	}

	public static $construct<T, A extends any[]>(constructor: new (...args: A) => T, ...args: A): T {
		Global.$pushState({
			$isConstructing: true,
			$isCommitting: false,
			$isActive: false,
			$target: null
		});
		let result = new constructor(...args);
		Global.$restore();
		return result;
	}

	public static $terminate(target: object) {
		if(HiddenProperty.$has(target, $shrewdObject)) Core._terminate.add(target[$shrewdObject]);
	}
}