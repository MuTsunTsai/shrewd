
class ReactiveMethodAdapter extends Adapter<ReactiveMethod> {

	protected _descriptor!: PropertyDescriptor;

	protected get _constructor():IDecoratedMemberConstructor<ReactiveMethod> {
		return ReactiveMethod;
	}

	protected get _method() {
		return this._descriptor.value;
	}

	public $setup() {
		let name = this._name;
		let method: Function = this._method;
		delete this._descriptor.value;
		delete this._descriptor.writable;
		this._descriptor.get = function(this: IShrewdObjectParent) {
			if(HiddenProperty.$has(this, $shrewdObject)) {
				let member: ReactiveMethod = this[$shrewdObject].$getMember(name);
				return member.$getter();
			} else {
				return method.bind(this);
			}
		}
		return this._descriptor;
	}
}
