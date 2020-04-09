
class ReactiveMethodAdapter extends Adapter {

	protected _descriptor!: PropertyDescriptor;

	public get $decoratorDescriptor(): IDecoratorDescriptor {
		return {
			$key: this._name,
			$name: this._name,
			$constructor: ReactiveMethod,
			$method: this._descriptor.value,
			$option: this._options
		};
	}

	public $setup() {
		let descriptor = this._descriptor, name = this._name;
		delete descriptor.value;
		delete descriptor.writable;
		descriptor.get = function(this: IShrewdObjectParent) {
			let member: ReactiveMethod = ShrewdObject.get(this).$getMember(name);
			return member.$getter();
		}
		return descriptor;
	}
}