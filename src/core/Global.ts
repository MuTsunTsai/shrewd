
interface IState {
	$committing: boolean;
	$constructing: boolean;
	$target: Observer | null;
	$active: boolean;
}

class Global {

	private static _state: IState = {
		$committing: false,
		$constructing: false,
		$active: false,
		$target: null
	};

	public static $pushState(state: Partial<IState>): IState {
		let old = Global._state;
		Global._state = Object.assign({}, Global._state, state);
		return old;
	}

	public static $restore(state: IState) {
		Global._state = state;
	}

	/** 目前是否處於認可階段 */
	public static get $committing() { return Global._state.$committing; }

	/** 目前是否正在建構新物件 */
	public static get $constructing() { return Global._state.$constructing; }

	/** 目前的側錄執行者是否為活躍 */
	public static get $active() { return Global._state.$active; }

	/** 目前的側錄執行者 */
	public static get $target() { return Global._state.$target; }
	
}