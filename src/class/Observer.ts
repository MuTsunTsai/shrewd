
enum ObserverState {
	$outdated,
	$updated,
	$pending
}

abstract class Observer extends Observable {

	/////////////////////////////////////////////////////
	// Static member
	/////////////////////////////////////////////////////

	private static readonly _pending: Set<Observer> = new Set();

	private static readonly _trigger: Set<Observer> = new Set();

	/** A map from id to instance */
	public static readonly _map: Map<number, Observer> = new Map();

	public static readonly $trace: (Observer | string)[] = [];

	/**
	 * Treat all active, pending {@link Observer}s as updated.
	 */
	public static $clearPending(): void {
		for(let pending of Observer._pending) {
			if(pending._state == ObserverState.$pending && pending.$isActive) {
				pending._update();
				Observer._pending.delete(pending);
			}
		}
	}

	public static $clearTrigger(): void {
		for(let ob of Observer._trigger) ob.trigger.clear();
		Observer._trigger.clear();
	}

	public static $debug(ob: Observer): void {
		let path: string[] = [ob._name];
		while(ob.trigger.size) {
			let next = ob.trigger.values().next().value as Observable;
			if(!(next instanceof Observer)) break;
			let msg = next._name
			if(next instanceof DecoratedMember) msg += "(" + DecoratedMember.$getParent(next) + ")";
			path.push(msg);
			ob = next;
		}
		console.log(path);
	}

	/** Side-record dependencies. */
	public static $refer(observable: Observable): void {
		if(observable instanceof Observer && observable._isTerminated) return;
		if(Core.$option.hook.read(observable.$id) && observable instanceof Observer) observable._activate();
		let target = Global.$target;
		if(target && target != observable && !target._isTerminated) {
			target._reference.add(observable);
		}
	}

	/**
	 * Check reference dead-ends; inactivate Observers that has no subscription.
	 */
	public static $checkDeadEnd(observer: Observer): void {
		if(DeadController.$tryMarkChecked(observer)) {
			if(!observer._isTerminated && !(observer._isActive = observer.$checkActive())) {
				for(let ref of observer._reference) {
					if(ref instanceof Observer) Observer.$checkDeadEnd(ref);
				}
			}
		}
	}

	public static $render(observer: Observer, backtrack = false): void {
		observer._render(backtrack);
	}

	/////////////////////////////////////////////////////
	// Instance member
	/////////////////////////////////////////////////////

	/** The set of referred {@link Observable}s. */
	private _reference: Set<Observable> = new Set();

	/** Whether self is in the current rendering stack. */
	private _rendering: boolean = false;

	/** The current state of updating. */
	private _state: ObserverState = ObserverState.$outdated;

	private _isTerminated: boolean = false;

	/** Identifying name */
	protected _name: string;

	constructor(name: string) {
		super();
		Observer._map.set(this.$id, this);
		this._name = name;
	}

	/** Whether self is in the current rendering stack. */
	public get $isRendering(): boolean {
		return !!this._rendering;
	}

	private trigger: Set<Observable> = new Set();

	private _render(backtrack: boolean): void {
		if(backtrack) {
			this._backtrack();
			if(this._isTerminated) return;
		}

		// Push new state.
		Global.$pushState({
			$isConstructing: false,
			$target: this
		});
		this._rendering = true;
		CommitController.$dequeue(this);

		try {

			// Clear all references.
			let oldReferences = new Set(this._reference);
			this._clearReference();

			// Execute the rendering method.
			this.$prerendering();
			try {
				let result = this.$renderer();
				this.$postrendering(result);
			} finally {
				this.$cleanup();
			}
			this._update();

			// Make subscription based on the side-recording result.
			if(!this._isTerminated) {
				for(let observable of this._reference) {
					oldReferences.delete(observable);
					observable.$addSubscriber(this);
					if(this.$isActive && observable instanceof Observer) {
						observable._activate();
					}
				}
			}

			// Queue for dead-check
			for(let observable of oldReferences) {
				DeadController.$enqueue(observable);
			}

		} finally {
			// Restore state.
			this._rendering = false;
			Global.$restore();
		}
	}

	public $notified(by?: Observable): void {
		this._pend();
		this._outdate(by);
		if(this.$isActive) {
			CommitController.$enqueue(this);
		}
	}

	public $terminate(): void {
		if(this._isTerminated) return;
		CommitController.$dequeue(this);
		Observer._map.delete(this.$id);
		Observer._pending.delete(this);
		this._isTerminated = true;
		this._onTerminate();
	}

	protected _onTerminate(): void {
		this._clearReference();
		for(let subscriber of this.$subscribers) {
			subscriber._reference.delete(this);
			this.$removeSubscriber(subscriber);
		}
		this._update();
		this._rendering = false;
	}

	/** Set the state of the current and all down-stream {@link Observer}s to be pending. */
	private _pend(): void {
		if(this._state == ObserverState.$updated) {
			this._state = ObserverState.$pending;
			Observer._pending.add(this);
			for(let subscriber of this.$subscribers) {
				subscriber._pend();
			}
		}
	}

	/**
	 * This is the entry point of the reaction process.
	 *
	 * Inside the method it will determine whether the current {@link Observer} is outdated
	 * by recursively determine the states of all its dependencies, and if it is outdated,
	 * render it.
	 */
	protected _determineStateAndRender(): void {
		// Cyclic dependency found.
		if(this._rendering) this._onCyclicDependencyFound();

		if(this._state == ObserverState.$updated) return;
		Observer.$trace.push(this);

		try {
			this._backtrack();

			if(this._state == ObserverState.$outdated) {
				Observer.$render(this);
			} else {
				Observer._pending.delete(this);
				this._update();
			}
		} finally {
			Observer.$trace.pop();
		}
	}

	/** Backtrack all dependencies */
	private _backtrack(): void {
		// Gather references that are not updated.
		for(let ref of this._reference) {
			if(ref instanceof Observer) {
				// Found potential cyclic dependency; but it might just be dynamic dependency.
				// The only way to be certain is to actually execute it.
				if(ref._rendering) {
					Observer.$render(this);
					break;
				} else if(ref._state != ObserverState.$updated) {
					ref._determineStateAndRender();
				}
			}
		}
	}

	private _onCyclicDependencyFound(): void {
		if(Core.$option.debug) debugger;

		// Find the smallest cycle.
		let last = Observer.$trace.indexOf(this);
		let cycle = [this, ...Observer.$trace.slice(last + 1)];

		// Terminate everything inside the cycle, allowing the program to continue without throwing error.
		cycle.forEach(o => o instanceof Observer && o.$terminate());

		// Generate debug message.
		cycle.push(this);
		let trace = cycle.map(o => typeof o == "string" ? o : o._name).join(" => ");
		console.warn("Cyclic dependency detected: " + trace + "\nAll these reactions will be terminated.");
	}

	protected _update(): void {
		this._state = ObserverState.$updated;
	}

	protected _outdate(by?: Observable): void {
		if(by) {
			Observer._trigger.add(this);
			this.trigger.add(by);
		}
		this._state = ObserverState.$outdated;
	}

	protected get $state(): ObserverState {
		return this._state;
	}

	/** Whether the current {@link Observer} is active (i.e. has at least one subscriber) */
	protected get $isActive(): boolean {
		return this._isActive = this._isActive != undefined ? this._isActive : this.$checkActive();
	}

	/** Cached value of {@link Observer.$isActive $isActive}. */
	private _isActive?: boolean;

	protected $checkActive(): boolean {
		if(Core.$option.hook.sub(this.$id)) return true;
		for(let subscriber of this.$subscribers) {
			if(subscriber.$isActive) return true;
		}
		return false;
	}

	private _activate(): void {
		if(this.$isActive) return;
		this._isActive = true;
		for(let observable of this._reference) {
			if(observable instanceof Observer) observable._activate();
		}
	}

	public $prerendering(): void { }

	public abstract get $renderer(): Function;

	public $postrendering(result: unknown): void { }

	public $cleanup(): void { }

	private _clearReference(): void {
		for(let observable of this._reference) observable.$removeSubscriber(this);
		this._reference.clear();
	}

	protected get $hasReferences(): boolean {
		return this._reference.size > 0;
	}

	protected get $isTerminated(): boolean { return this._isTerminated; }
}
