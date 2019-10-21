
interface IState {
	$isCommitting: boolean;
	$isConstructing: boolean;
	$target: Observer | null;
}

class Global {

	private static _state: IState = {
		$isCommitting: false,
		$isConstructing: false,
		$target: null
	};

	private static _history: IState[] = [];

	public static $pushState(state: Partial<IState>) {
		Global._history.push(Global._state);
		Global._state = Object.assign({}, Global._state, state);
	}

	public static $restore() {
		Global._state = Global._history.pop()!;
	}

	/** Whether currently in committing stage. */
	public static get $isCommitting() { return Global._state.$isCommitting; }

	/** Whether Shrewd is constructing a new object. */
	public static get $isConstructing() { return Global._state.$isConstructing; }

	/** Current target of side-recording. */
	public static get $target() { return Global._state.$target; }

}