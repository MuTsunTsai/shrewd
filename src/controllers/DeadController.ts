import { Observable, Observer , Core } from "Index";

export class DeadController {

	/** {@link Observer}s that just lost a subscriber and might be dead. */
	private static readonly _queue: Set<Observer> = new Set();

	/** {@link Observer}s that have passed dead-check in the current commission. */
	private static readonly _checked: Set<Observer> = new Set();

	public static $enqueue(observable: Observable): void {
		if(observable instanceof Observer) DeadController._queue.add(observable);
	}

	public static $flush(): void {
		for(let ob of DeadController._queue) {
			Observer.$checkDeadEnd(ob);
		}
		DeadController._queue.clear();
		for(let id of Core.$option.hook.gc()) {
			let ob = Observer._map.get(id);
			if(ob) Observer.$checkDeadEnd(ob);
		}
		DeadController._checked.clear();
	}

	/** Mark an {@link Observer} as checked, if it's not done yet. */
	public static $tryMarkChecked(observer: Observer): boolean {
		if(!DeadController._checked.has(observer)) {
			DeadController._checked.add(observer);
			return true;
		}
		return false;
	}
}
