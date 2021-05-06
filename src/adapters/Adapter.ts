
interface IAdapterConstructor {
	new(proto: object, prop: PropertyKey, descriptor?: PropertyDescriptor, options?: IDecoratorOptions<unknown>): IAdapter;
}

interface IAdapter {
	readonly $decoratorDescriptor: IDecoratorDescriptor;

	$setup(): PropertyDescriptor | void;
}

//////////////////////////////////////////////////////////////////
/**
 * An `Adapter` prepares an `IDecoratorDescriptor` for a given member.
 */
//////////////////////////////////////////////////////////////////

abstract class Adapter<T extends DecoratedMember> implements IAdapter {

	protected _proto: object;
	protected _prop: PropertyKey;
	protected _descriptor?: PropertyDescriptor;
	protected _options?: IDecoratorOptions<unknown>;

	constructor(proto: object, prop: PropertyKey, descriptor?: PropertyDescriptor, options?: IDecoratorOptions<unknown>) {
		this._proto = proto;
		this._prop = prop;
		this._descriptor = descriptor;
		this._options = options;
	}

	protected get _name(): string {
		return this._proto.constructor.name + "." + this._prop.toString();
	}

	public get $decoratorDescriptor(): IDecoratorDescriptor {
		return {
			$key: this._prop.toString(),
			$class: this._proto.constructor.name,
			$constructor: this._constructor,
			$method: this._method,
			$option: this._options
		};
	}

	protected get _method(): Function | undefined {
		return undefined;
	}

	protected abstract get _constructor(): IDecoratedMemberConstructor<T>;

	public $setup(): PropertyDescriptor | void { }
}
