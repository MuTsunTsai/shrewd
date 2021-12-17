import { Observable, Observer ,InitializationController } from "../Index";

interface IContext {
	$isCommitting: boolean;
	$isConstructing: boolean;
	$isRenderingProperty: boolean;
	$target: Observer | null;
	$accessibles: Set<Observable>;
}

//////////////////////////////////////////////////////////////////
/**
 * The static {@link Global} class is the internal state container of Shrewd.
 */
//////////////////////////////////////////////////////////////////

export class Global {

	private static _state: IContext = {
		$isCommitting: false,
		$isConstructing: false,
		$isRenderingProperty: false,
		$target: null,
		$accessibles: new Set()
	};

	private static _history: IContext[] = [];

	public static $pushState(state: Partial<IContext>) {
		Global._history.push(Global._state);
		Global._state = Object.assign({}, Global._state, state);
	}

	public static $restore() {
		Global._state = Global._history.pop()!;

		// After all stacked scopes are cleared, start initializing reactions.
		if(Global._history.length == 0) InitializationController.$flush();
	}

	/** Whether currently in committing stage. */
	public static get $isCommitting() { return Global._state.$isCommitting; }

	/** Whether Shrewd is constructing a new object. */
	public static get $isConstructing() { return Global._state.$isConstructing; }

	/** Whether Shrewd is rendering a ObservableProperty. */
	public static get $isRenderingProperty() { return Global._state.$isRenderingProperty; }

	/** Current target of side-recording. */
	public static get $target() { return Global._state.$target; }

	public static $isAccessible(observable: Observable) { return Global._state.$accessibles.has(observable); }

	public static $setAccessible(observable: Observable) { Global._state.$accessibles.add(observable); }
}
