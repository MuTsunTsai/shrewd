import { Observable, IShrewdObjectParent, Helper, IDecoratorDescriptor, IDecoratorOptions, DecoratedMember } from "../Index";

//////////////////////////////////////////////////////////////////
/**
 * A {@link ReactiveMethod} runs automatically whenever some of its references
 * has changed. It would only run once during the committing stage.
 */
//////////////////////////////////////////////////////////////////

export class ReactiveMethod extends DecoratedMember {

	private readonly _method: Function;
	private _result: unknown;

	constructor(parent: IShrewdObjectParent, descriptor: IDecoratorDescriptor) {
		super(parent, descriptor);
		this._method = descriptor.$method!;
	}

	protected get _defaultOption(): IDecoratorOptions<unknown> {
		// ReactiveMethods are active by default
		return { active: true };
	}

	public get $renderer() {
		return this._method.bind(this._parent);
	}

	protected $regularGet(): () => unknown {
		return () => {
			this._determineStateAndRender();
			return this._result;
		}
	}

	protected $terminateGet(): () => unknown {
		return () => this._result;
	}

	public $postrendering(result: unknown) {
		this._result = result;
		// ReactiveMethods always publish themselves regardless of return value.
		Observable.$publish(this);
	}

	protected _onTerminate() {
		Helper.$clear(this._result);
		super._onTerminate();
	}
}
