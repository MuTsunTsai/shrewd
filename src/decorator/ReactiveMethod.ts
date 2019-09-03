
class ReactiveMethod extends DecoratedMemeber {

	private _method: Function;

	constructor(parent: object, descriptor: IDecoratorDescriptor) {
		super(parent, descriptor);
		this._method = descriptor.method!;
	}

	public $getter() { return this._method; }

	protected $render() {
		this._method();
	}
}