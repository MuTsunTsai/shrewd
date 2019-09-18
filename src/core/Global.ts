
interface IState {
	$isCommitting: boolean;
	$isConstructing: boolean;
	$target: Observer | null;
	$isActive: boolean;
}

class Global {

	private static _state: IState = {
		$isCommitting: false,
		$isConstructing: false,
		$isActive: false,
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

	/** 目前是否處於認可階段 */
	public static get $isCommitting() { return Global._state.$isCommitting; }

	/** 目前是否正在建構新物件 */
	public static get $isConstructing() { return Global._state.$isConstructing; }

	/** 目前的側錄執行者是否為活躍 */
	public static get $isActive() { return Global._state.$isActive; }

	/** 目前的側錄執行者 */
	public static get $target() { return Global._state.$target; }

}