
class Core {

	/** 已接到通知、等待被執行的 Observer */
	private static _queue: Set<Observer>[] = [];

	/** 在當前堆疊中是否已經設置了自動認可 */
	private static _promised: boolean = false;

	public static $commit() {
		let oldState = Global.$pushState({ $committing: true });

		// 開始執行認可；這邊的外層迴圈不能用 for in 的寫法，
		// 因為 Core._queue 在迴圈執行的同時還是有可能會繼續新增
		for(let i = 0; i < Core._queue.length; i++) if(Core._queue[i]) {
			for(let observer of Core._queue[i]) Observer.$render(observer);
		}

		// 結束認可
		Core._queue = [];
		Global.$restore(oldState);
	}

	/** 自動認可會在堆疊清空時立刻執行（比任何 setTimeout 都更早） */
	private static _autoCommit() {
		Core.$commit();
		Core._promised = false;
	}

	public static $unqueue(observer: Observer) {
		let set = Core._queue[observer[$dependencyLevel]];
		if(set) set.delete(observer);
	}

	public static $queue(observer: Observer) {
		// 正在執行中的觀測者就不用重新加入了
		if(!observer.$rendering) {
			let level = observer[$dependencyLevel];
			Core._queue[level] = Core._queue[level] || new Set();
			Core._queue[level].add(observer);
		}

		// 設置自動認可
		if(!Core._promised) {
			let promise = Promise.resolve();
			promise.then(Core._autoCommit);
			Core._promised = true;
		}
	}

	public static $construct<T, A extends any[]>(constructor: new (...args: A) => T, ...args: A): T {
		let oldState = Global.$pushState({
			$constructing: true,
			$committing: false,
			$active: false,
			$target: null
		});
		let result = new constructor(...args);
		Global.$restore(oldState);
		return result;
	}
}