
class Core {

	/** 一個從 0 起算的數值，表示目前是第幾次的認可階段 */
	private static _tick: number = 0;

	/** 已接到通知、等待被執行的 Observer */
	private static _queue: Set<Observer>[] = [];

	/** 目前是否處於認可階段 */
	private static _commiting: boolean = false;

	public static $commit() {
		Core._tick++;
		Core._commiting = true;

		// 開始執行認可；這邊的外層迴圈不能用 for in 的寫法，
		// 因為 Core._queue 在迴圈執行的同時還是有可能會繼續新增
		for(let i = 0; i < Core._queue.length; i++) if(Core._queue[i]) {
			for(let observer of Core._queue[i]) Observer.$render(observer);
		}

		// 結束認可
		Core._queue = [];
		Core._commiting = false;
	}

	public static get $tick() { return Core._commiting ? Core._tick : -1; }

	public static get $committing() { return Core._commiting; }

	public static $queue(observer: Observer) {
		let level = observer[$dependencyLevel];
		Core._queue[level] = Core._queue[level] || new Set();
		Core._queue[level].add(observer);
	}
}