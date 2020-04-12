
class ComputedPropertyAdapter extends Adapter {

	protected _descriptor!: PropertyDescriptor;

	protected get _constructor() {
		return ComputedProperty;
	}

	protected get _method() {
		return this._descriptor.get!;
	}

	public $setup() {
		let name = this._name;
		let method: Function = this._method;
		this._descriptor.get = function(this: IShrewdObjectParent) {
			if(HiddenProperty.$has(this, $shrewdObject)) {
				let member: ComputedProperty = this[$shrewdObject].$getMember(name);
				return member.$getter();
			} else {
				return method.apply(this);
			}
		}
		return this._descriptor;
	}
}