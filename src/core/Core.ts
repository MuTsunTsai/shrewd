
class Core {

	private static _queue: Set<Observer>[] = [];

	private static _commiting = false;

	public static $commit() {
		Core._commiting = true;
		for(let i in Core._queue)
			for(let observer of Core._queue[i]) Observer.$render(observer);

		Core._commiting = false;
	}

	public static get $committing() { return Core._commiting; }

	public static $queue(observer: Observer) {
		let level = observer[$dependencyLevel];
		Core._queue[level] = Core._queue[level] || new Set();
		Core._queue[level].add(observer);
	}
}