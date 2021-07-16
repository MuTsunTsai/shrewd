
//////////////////////////////////////////////////////////////////
/**
 * {@link Observable}s accept subscriptions from {@link Observer}s,
 * and they will notify those subscribers to execute when they
 * change their inner state (defined by the derived class).
 */
//////////////////////////////////////////////////////////////////

abstract class Observable {

	private static _id: number = 0;

	/**
	 * Whether under the current scope, the given {@link Observable} can be written.
	 *
	 * This method is intentionally made static to prevent overriding.
	 */
	public static $isWritable(observable: Observable): boolean {
		if(Global.$isConstructing || !observable.$hasSubscriber) return true;
		if(Global.$isRenderingProperty && !Global.$isAccessible(observable)) {
			console.warn("Inside a renderer function, only the objects owned by the ObservableProperty can be written.");
			if(Core.$option.debug) debugger;
			return false;
		}
		if(!Global.$isRenderingProperty && Global.$isCommitting) {
			console.warn("Writing into Observables is not allowed inside a ComputedProperty or a ReactiveMethod. For self-correcting behavior, use the renderer option of the ObservableProperty.");
			if(Core.$option.debug) debugger;
			return false;
		}
		return true;
	}

	/**
	 * Notify all subscribers.
	 *
	 * This method is intentionally made static to prevent overriding.
	 */
	public static $publish(observable: Observable): void {
		Core.$option.hook.write(observable.$id);
		for(let observer of observable._subscribers) {
			if(Core.$option.debug) observer.$notified(observable);
			else observer.$notified();
		}
	}

	constructor() {
		this.$id = Observable._id++;
	}

	public $addSubscriber(observer: Observer): void {
		this._subscribers.add(observer);
	}

	public $removeSubscriber(observer: Observer): void {
		this._subscribers.delete(observer);
	}

	protected get $hasSubscriber(): boolean {
		return this._subscribers.size > 0;
	}

	protected get $subscribers(): IterableIterator<Observer> {
		return this._subscribers.values();
	}

	public readonly $id: number;

	private _subscribers: Set<Observer> = new Set();
}
