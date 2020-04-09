
interface IShrewdOption {
	hook: IHook;
	autoCommit: boolean;
	debug: boolean;
}

class Core {

	/** Shrewd global options. */
	public static $option: IShrewdOption = {
		hook: new DefaultHook(),
		autoCommit: true,
		debug: true
	}

	/** Notified, to-be-rendered Observers. */
	private static readonly _renderQueue: Set<Observer> = new Set();

	/** Objects to be terminated. */
	private static readonly _terminateQueue: Set<ShrewdObject> = new Set();

	/** Objects to be initialized. */
	private static readonly _initializeQueue: Set<DecoratedMemeber> = new Set();

	/** Whether there is auto-commit in the current stack. */
	private static _promised: boolean = false;

	public static $commit() {
		Global.$pushState({ $isCommitting: true });

		try {
			// Start comitting.
			for(let observer of Core._renderQueue) {
				Observer.$render(observer);
			}
		} finally {
			// Initializing
			for(let member of Core._initializeQueue) {
				member.$initialize();
			}
			Core._initializeQueue.clear();

			// Finish comitting.
			Observer.$clearPending();
			Core._renderQueue.clear();
			Global.$restore();

			// Terminate objects.
			for(let shrewd of Core._terminateQueue) {
				shrewd.$terminate();
			}
			Core._terminateQueue.clear();

			Core.$option.hook.gc();
		}
	}

	public static $register(target: DecoratedMemeber) {
		Core._initializeQueue.add(target);
	}

	/** Auto-commit runs after finishing the current stack (but before any setTimeout). */
	private static _autoCommit() {
		Core.$commit();
		Core._promised = false;
	}

	public static $unqueue(observer: Observer) {
		Core._renderQueue.delete(observer);
	}

	public static $queue(observer: Observer) {
		// There's no need to add rendering Observers again.
		if(!observer.$isRendering) {
			Core._renderQueue.add(observer);
		}

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
		try {
			return new constructor(...args);
		} finally {
			Observer.$trace.pop();
			Global.$restore();
		}
	}

	public static $terminate(target: object, lazy: boolean = false) {
		if(HiddenProperty.$has(target, $shrewdObject)) {
			let shrewd = target[$shrewdObject];
			if(lazy) {
				Core._terminateQueue.add(shrewd);
			} else {
				shrewd.$terminate();
			}
		}
	}
}