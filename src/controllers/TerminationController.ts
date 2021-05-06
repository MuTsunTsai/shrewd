
class TerminationController {

	/** Objects to be terminated. */
	private static readonly _queue: Set<ShrewdObject> = new Set();

	public static $flush(): void {
		for(let shrewd of TerminationController._queue) {
			shrewd.$terminate();
		}
		TerminationController._queue.clear();
	}

	public static $terminate(target: object, lazy: boolean = false): void {
		if(HiddenProperty.$has(target, $shrewdObject)) {
			let shrewd = target[$shrewdObject];
			if(lazy) {
				TerminationController._queue.add(shrewd);
			} else {
				shrewd.$terminate();
			}
		}
	}
}
