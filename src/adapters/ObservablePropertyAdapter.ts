
class ObservablePropertyAdapter extends Adapter {

	public precondition() {
		let descriptor = Object.getOwnPropertyDescriptor(this._proto, this._prop);
		if(descriptor) {
			console.warn(`Setup error at ${this._proto.constructor.name}[${this._prop.toString()}]. ` +
				"Decorated property is not a field.");
			if(Core.$option.debug) debugger;
			return false;
		}
		return true;
	}

	public get $decoratorDescriptor(): IDecoratorDescriptor {
		return {
			$key: this._prop,
			$name: this._name,
			$constructor: ObservableProperty,
			$option: this._options
		}
	}

	public $setup() {
		var proto = this._proto, prop = this._prop;
		Object.defineProperty(proto, prop, {
			get() {
				ShrewdObject.get(this);
				return this[prop];
			},
			set(value: any) {
				ShrewdObject.get(this);
				this[prop] = value;
			}
		});
	}
}