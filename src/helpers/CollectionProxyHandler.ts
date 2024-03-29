import { Observable, Observer , $observableHelper, Helper, WrappedObservable } from "Index";

type Collection = Set<unknown> | Map<unknown, unknown>;

export interface IMethodDescriptor<T extends Collection> {
	$prop: keyof T;
	$method: Function;
	$target: T;
	$helper: Helper<T>;
	$receiver: T;
}

export class CollectionProxyHandler<T extends Collection> implements ProxyHandler<T> {

	public get(target: WrappedObservable<T>, prop: string | symbol, receiver: T): unknown {
		let ob = target[$observableHelper];
		let result = Reflect.get(target, prop);
		if(typeof result == "function") {
			result = this._method.bind({
				$prop: prop as keyof T,
				$target: target,
				$method: result.bind(target),
				$helper: ob,
				$receiver: receiver
			});
		}
		if(prop == "size") Observer.$refer(target[$observableHelper]);
		return result;
	}

	protected _method(this: IMethodDescriptor<T>, ...args: unknown[]) {
		switch(this.$prop) {
			case "clear":
				if(Observer.$isWritable(this.$helper) && this.$target.size > 0) {
					this.$target.clear();
					Observable.$publish(this.$helper);
				}
				return;
			case "delete":
				if(Observer.$isWritable(this.$helper) && this.$target.has(args[0])) {
					this.$target.delete(args[0]);
					Observable.$publish(this.$helper);
				}
				return;
			case Symbol.iterator:
			case "entries":
			case "forEach":
			case "has":
			case "keys":
			case "values":
				Observer.$refer(this.$helper);
			default:
				return this.$method(...args);
		}
	}
}
