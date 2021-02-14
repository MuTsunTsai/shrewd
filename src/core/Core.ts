
interface IShrewdOption {
	hook: IHook;
	autoCommit: boolean;
	debug: boolean;
}

//////////////////////////////////////////////////////////////////
/**
 * The static `Core` class contains methods for controlling the
 * commission process, which indeed is the core of Shrewd.
 */
//////////////////////////////////////////////////////////////////

class Core {

	/** Shrewd global options. */
	public static $option: IShrewdOption = {
		hook: new DefaultHook(),
		autoCommit: true,
		debug: false
	}

	/** Notified, to-be-rendered Observers. */
	private static readonly _renderQueue: Set<Observer> = new Set();

	/** Objects to be terminated. */
	private static readonly _terminateQueue: Set<ShrewdObject> = new Set();

	/** Reactions to be initialized. */
	private static readonly _initializeQueue: Set<DecoratedMember> = new Set();

	/** `Observer`s that just lost a subscriber and might be dead. */
	private static readonly _deadQueue: Set<Observer> = new Set();

	/** `Observer`s that have passed dead-check in the current commission. */
	public static readonly $deadChecked: Set<Observer> = new Set();

	/** Whether there is auto-commit in the current stack. */
	private static _promised: boolean = false;

	/** A flag for preventing nested initialization. */
	private static _initializing: boolean = false;

	public static $commit() {
		if(Core.$option.hook.precommit) Core.$option.hook.precommit();

		Global.$pushState({ $isCommitting: true });
		try {
			// Start committing.
			for(let observer of Core._renderQueue) {
				Observer.$render(observer, true);
			}
		} finally {
			// Finish committing.
			Observer.$clearPending();
			Core._renderQueue.clear();
			Global.$restore();

			// Terminate objects.
			for(let shrewd of Core._terminateQueue) {
				shrewd.$terminate();
			}
			Core._terminateQueue.clear();

			if(Core.$option.debug) Observer.$clearTrigger();

			Core._deadCheck();
		}

		if(Core.$option.hook.postcommit) Core.$option.hook.postcommit();
	}

	private static _deadCheck() {
		for(let ob of Core._deadQueue) {
			Observer.$checkDeadEnd(ob);
		}
		Core._deadQueue.clear();
		for(let id of Core.$option.hook.gc()) {
			let ob = Observer._map.get(id);
			if(ob) Observer.$checkDeadEnd(ob);
		}
		Core.$deadChecked.clear();
	}

	public static $queueDeadCheck(observable: Observable) {
		if(observable instanceof Observer) Core._deadQueue.add(observable);
	}

	public static $queueInitialization(member: DecoratedMember) {
		Core._initializeQueue.add(member);
	}

	public static $initializeAll() {
		if(Core._initializing) return;
		Core._initializing = true;
		for(let member of Core._initializeQueue) {
			Core._initializeQueue.delete(member);
			member.$initialize();
		}
		Core._initializing = false;
	}

	public static $initialize(target: IShrewdObjectParent) {
		if(!target[$shrewdObject]) {
			Decorators.$immediateInit.add(target);
			return;
		}
		if(Core._initializing) return;
		Core._initializing = true;
		for(let member of target[$shrewdObject].$getMember()) {
			Core._initializeQueue.delete(member);
			member.$initialize();
		}
		Core._initializing = false;
	}

	/** Auto-commit runs after finishing the current stack (but before any setTimeout). */
	private static _autoCommit() {
		Core.$commit();
		Core._promised = false;
	}

	public static $dequeue(observer: Observer) {
		Core._renderQueue.delete(observer);
	}

	public static $enqueue(observer: Observer) {
		// There's no need to add rendering Observers again.
		if(!observer.$isRendering) {
			Core._renderQueue.add(observer);
		}

		// Setup auto-commit.
		if(Core.$option.autoCommit && !Core._promised) {
			Promise.resolve().then(Core._autoCommit);
			Core._promised = true;
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
