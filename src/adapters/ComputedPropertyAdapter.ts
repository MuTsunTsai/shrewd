
class ComputedPropertyAdapter extends Adapter {

	protected _descriptor!: PropertyDescriptor;

	public get $decoratorDescriptor(): IDecoratorDescriptor {
		return {
			$key: this._name,
			$name: this._name,
			$constructor: ComputedProperty,
			$method: this._descriptor.get,
			$option: this._options
		};
	}

	public $setup() {
		var descriptor = this._descriptor, name = this._name;
		descriptor.get = function(this: IShrewdObjectParent) {
			let member: ComputedProperty = ShrewdObject.get(this).$getMember(name);
			return member.$getter();
		}
		return descriptor;
	}
}