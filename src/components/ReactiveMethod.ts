
//////////////////////////////////////////////////////////////////
/**
 * A ReactiveMethod runs automatically whenever any of its references
 * has changed. It would only run once during the committing stage.
 */
//////////////////////////////////////////////////////////////////

class ReactiveMethod extends DecoratedMember {

	private readonly _method: Function;
	private _result: any;

	constructor(parent: IShrewdObjectParent, descriptor: IDecoratorDescriptor) {
		super(parent, descriptor);
		this._method = descriptor.$method!;
	}

	protected get _defaultOption(): IDecoratorOptions<any> {
		// ReactiveMethods are active by default
		return { active: true };
	}

	public get $renderer() {
		return this._method.bind(this._parent);
	}

	protected $regularGet(): () => any {
		return () => {
			this._determineStateAndRender();
			return this._result;
		}
	}

	protected $terminateGet(): () => any {
		return () => this._result;
	}

	public $postrendering(result: any) {
		this._result = result;
		// ReactiveMethods always publish themselves regardless of return value.
		Observable.$publish(this);
	}

	protected _onTerminate() {
		Helper.$clear(this._result);
		super._onTerminate();
	}
}
