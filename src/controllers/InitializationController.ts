import { DecoratedMember , $shrewdObject, Decorators, IShrewdObjectParent } from "../Index";

export class InitializationController {

	/** Reactions to be initialized. */
	private static readonly _queue: Set<DecoratedMember> = new Set();

	/** A flag for preventing nested initialization. */
	private static _running: boolean = false;

	public static $enqueue(member: DecoratedMember): void {
		InitializationController._queue.add(member);
	}

	public static $flush(): void {
		if(InitializationController._running) return;
		InitializationController._running = true;
		for(let member of InitializationController._queue) {
			InitializationController._queue.delete(member);
			member.$initialize();
		}
		InitializationController._running = false;
	}

	public static $initialize(target: IShrewdObjectParent): void {
		if(!target[$shrewdObject]) {
			Decorators.$immediateInit.add(target);
			return;
		}
		if(InitializationController._running) return;
		InitializationController._running = true;
		for(let member of target[$shrewdObject].$getMember()) {
			InitializationController._queue.delete(member);
			member.$initialize();
		}
		InitializationController._running = false;
	}

}
