
interface IAdapterConstructor {
	new(proto: object, prop: PropertyKey, descriptor?: PropertyDescriptor, options?: IDecoratorOptions<any>): IAdapter;
}

interface IAdapter {
	$precondition?(): boolean;

	readonly $decoratorDescriptor: IDecoratorDescriptor;

	$setup(): PropertyDescriptor | void;
}

abstract class Adapter implements IAdapter {

	protected _proto: object;
	protected _prop: PropertyKey;
	protected _descriptor?: PropertyDescriptor;
	protected _options?: IDecoratorOptions<any>;

	constructor(proto: object, prop: PropertyKey, descriptor?: PropertyDescriptor, options?: IDecoratorOptions<any>) {
		this._proto = proto;
		this._prop = prop;
		this._descriptor = descriptor;
		this._options = options;
	}

	protected get _name() {
		return this._proto.constructor.name + "." + this._prop.toString();
	}

	public abstract get $decoratorDescriptor(): IDecoratorDescriptor;

	public abstract $setup(): PropertyDescriptor | void;
}