
interface IShrewdOption {
	hook: IHook;
	autoCommit: boolean;
	debug: boolean;
}

//////////////////////////////////////////////////////////////////
/**
 * The static {@link Core} class contains methods for controlling the
 * commission process, which indeed is the core of Shrewd.
 */
//////////////////////////////////////////////////////////////////

class Core {

	/** Shrewd global options. */
	public static readonly $option: IShrewdOption = {
		hook: new DefaultHook(),
		autoCommit: true,
		debug: false
	}

	public static $commit(): void {
		if(Core.$option.hook.precommit) Core.$option.hook.precommit();

		CommitController.$flush();
		TerminationController.$flush();

		if(Core.$option.debug) Observer.$clearTrigger();

		DeadController.$flush();

		if(Core.$option.hook.postcommit) Core.$option.hook.postcommit();
	}
}
