
class SetProxyHandler extends CollectionProxyHandler<Set<any>> {

	protected _method(this: IMethodDescriptor<Set<any>>, ...args: any[]) {
		if(this.prop == "add") {
			if(Observer.$isWritable(this.helper) && !this.target.has(args[0])) {
				this.target.add(Helper.$wrap(args[0]));
				Observable.$publish(this.helper);
			}
			return this.receiver;
		}
		return super._method.apply(this, args);
	}
}

class SetHelper extends Helper<Set<any>> {

	private static _handler = new SetProxyHandler();

	constructor(set: Set<any>) {
		super(set, SetHelper._handler);
	}
}