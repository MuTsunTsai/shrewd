
interface IShrewdOption {
	hook: IHook;
	autoCommit: boolean;
}

class Core {

	/** Shrewd global options. */
	public static $option: IShrewdOption = {
		hook: new DefaultHook(),
		autoCommit: true
	}

	/** Notified, to-be-rendered Observers. */
	private static readonly _queue: Set<Observer> = new Set();

	/** Objects to be terminated. */
	private static readonly _terminate: Set<ShrewdObject> = new Set();

	/** Whether there is auto-commit in the current stack. */
	private static _promised: boolean = false;

	public static $commit() {
		Global.$pushState({ $isCommitting: true });

		// Start comitting.
		for(let observer of Core._queue) Observer.$render(observer);

		// Finish comitting.
		Observer.$clearPending();
		Core._queue.clear();
		Global.$restore();

		// Terminate objects.
		for(let shrewd of Core._terminate) shrewd.$terminate();
		Core._terminate.clear();

		Core.$option.hook.gc();
	}

	/** Auto-commit runs after finishing the current stack (but before any setTimeout). */
	private static _autoCommit() {
		Core.$commit();
		Core._promised = false;
	}

	public static $unqueue(observer: Observer) {
		Core._queue.delete(observer);
	}

	public static $queue(observer: Observer) {
		// There's no need to add rendering Observers again.
		if(!observer.$isRendering) Core._queue.add(observer);

		// Setup auto-commit.
		if(Core.$option.autoCommit && !Core._promised) {
			let promise = Promise.resolve();
			promise.then(Core._autoCommit);
			Core._promised = true;
		}
	}

	public static $construct<T, A extends any[]>(constructor: new (...args: A) => T, ...args: A): T {
		Global.$pushState({
			$isConstructing: true,
			$isCommitting: false,
			$target: null
		});
		Observer.$trace.push("construct " + constructor.name);
		let result = new constructor(...args);
		Observer.$trace.pop();
		Global.$restore();
		return result;
	}

	public static $terminate(target: object) {
		if(HiddenProperty.$has(target, $shrewdObject)) Core._terminate.add(target[$shrewdObject]);
	}
}