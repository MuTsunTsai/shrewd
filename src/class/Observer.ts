
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

	/** A map from id to instance */
	public static readonly _map: Map<number, Observer> = new Map();

	public static readonly $trace: (Observer | string)[] = [];

	public static $clearPending() {
		for(let pending of Observer._pending) {
			// If a pending, active Observer does not get updated after the committing stage,
			// then it must be in fact updated.
			if(pending._state == ObserverState.$pending && pending.$isActive) {
				pending._update();
				Observer._pending.delete(pending);
			}
		}
	}

	/** Side-record dependencies. */
	public static $refer(observable: Observable) {
		if(observable instanceof Observer && observable._isTerminated) return;
		if(Core.$option.hook.read(observable.$id) && observable instanceof Observer) observable._activate();
		let target = Global.$target;
		if(target && target != observable && !target._isTerminated) {
			target._reference.add(observable);
		}
	}

	// Check reference dead-ends; inactivate Observers that has no subscription.
	// ReactiveMethods are exceptions; they are always active regardlessly.
	public static $checkDeadEnd(observable: Observable) {
		if(
			observable instanceof Observer
			&& !observable._isTerminated
			&& observable._isActive // This condition helps skipping Observers already checked.
			&& !(observable._isActive = observable.$checkActive())
		) {
			Core.$dequeue(observable);
			for(let ref of observable._reference) {
				Observer.$checkDeadEnd(ref);
			}
		}
	}

	public static $render(observer: Observer): void {

		// Push new state.
		Global.$pushState({
			$isConstructing: false,
			$target: observer
		});
		observer._isRendering = true;
		Core.$dequeue(observer);

		try {

			// Clear all references.
			let oldReferences = new Set(observer._reference);
			observer._clearReference();

			// Execute the rendering method.
			observer.$prerendering();
			try {
				let result = observer.$renderer();
				observer.$postrendering(result);
			} finally {
				observer.$cleanup();
			}
			observer._update();

			// Make subscription based on the side-recording result.
			if(!observer._isTerminated) {
				for(let observable of observer._reference) {
					oldReferences.delete(observable);
					observable.$subscribe(observer);
					if(observer.$isActive && observable instanceof Observer) {
						observable._activate();
					}
				}
			}

			// Clean up dead-ends.
			for(let observable of oldReferences) {
				Observer.$checkDeadEnd(observable);
			}

		} finally {
			// Restore state.
			observer._isRendering = false;
			Global.$restore();
		}
	}

	/////////////////////////////////////////////////////
	// Instance member
	/////////////////////////////////////////////////////

	/** The set of referred Observables. */
	private _reference: Set<Observable> = new Set();

	/** Whether self is in the current rendering stack. */
	private _isRendering: boolean = false;

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
	public get $isRendering() {
		return this._isRendering;
	}

	public $notified() {
		this._pend();
		this._outdate();
		if(this.$isActive) {
			Core.$enqueue(this);
		}
	}

	public $terminate() {
		if(this._isTerminated) return;
		Core.$dequeue(this);
		Observer._map.delete(this.$id);
		Observer._pending.delete(this);
		this._isTerminated = true;
		this._onTerminate();
	}

	protected _onTerminate() {
		this._clearReference();
		for(let subscriber of this.$subscribers) {
			subscriber._reference.delete(this);
			this.$unsubscribe(subscriber);
		}
		this._update();
		this._isRendering = false;
	}

	/** Set the state of the current and all down-stream `Observer` to be pending. */
	private _pend() {
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
	 * Inside the method it will determine whether the current `Observer` is outdated
	 * by recursively determine the states of all its dependencies, and if it is outdated,
	 * render it.
	 */
	protected _determineStateAndRender() {

		// Cyclic dependency found.
		if(this._isRendering) this._onCyclicDependencyFound();

		if(this._state == ObserverState.$updated) return;
		Observer.$trace.push(this);

		try {
			// Gather references that are not updated.
			for(let ref of this._reference) {
				if(ref instanceof Observer) {
					// Found potential cyclic dependency; but it might just be dynamic dependency.
					// The only way to be certain is to actually execute it.
					if(ref._isRendering) {
						Observer.$render(this);
						break;
					} else if(ref._state != ObserverState.$updated) {
						ref._determineStateAndRender();
					}
				}
			}

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

	private _onCyclicDependencyFound() {
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

	protected _update() {
		this._state = ObserverState.$updated;
	}

	protected _outdate() {
		this._state = ObserverState.$outdated;
	}

	protected get $state() {
		return this._state;
	}

	/** Whether the current `Observer` is active (i.e. has any subscriber) */
	protected get $isActive(): boolean {
		return this._isActive = this._isActive != undefined ? this._isActive : this.$checkActive();
	}

	/** Cached value of `$isActive`. */
	private _isActive?: boolean;

	protected $checkActive() {
		if(Core.$option.hook.sub(this.$id)) return true;
		for(let subscriber of this.$subscribers) {
			if(subscriber.$isActive) return true;
		}
		return false;
	}

	private _activate() {
		if(this.$isActive) return;
		this._isActive = true;
		for(let observable of this._reference) {
			if(observable instanceof Observer) observable._activate();
		}
	}

	public $prerendering() { }

	public abstract get $renderer(): () => any;

	public $postrendering(result: any) { }

	public $cleanup() { }

	private _clearReference(): void {
		for(let observable of this._reference) observable.$unsubscribe(this);
		this._reference.clear();
	}

	protected get $hasReferences(): boolean {
		return this._reference.size > 0;
	}

	protected get $isTerminated(): boolean { return this._isTerminated; }
}
