
interface IAdapterConstructor {
	new(proto: object, prop: PropertyKey, descriptor?: PropertyDescriptor, options?: IDecoratorOptions<any>): IAdapter;
}

interface IAdapter {
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

	protected abstract get _constructor(): IDecoratedMemberConstructor;

	public $setup(): PropertyDescriptor | void {}
}