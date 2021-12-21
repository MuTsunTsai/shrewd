import { Core } from "Index";

export class AutoCommitController {

	/** Whether there is auto-commit in the current stack. */
	private static _promised: boolean = false;

	private static _autoCommit(): void {
		Core.$commit();
		AutoCommitController._promised = false;
	}

	/** Setup auto-commit if applicable. */
	public static $setup(): void {
		if(Core.$option.autoCommit && !AutoCommitController._promised) {
			AutoCommitController._promised = true;
			Promise.resolve().then(AutoCommitController._autoCommit);
		}
	}
}
