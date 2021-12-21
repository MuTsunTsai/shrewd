import { $shrewdObject, IShrewdObjectParent, ShrewdObject ,$observableHelper, Helper, WrappedObservable , $shrewdDecorators, IDecoratorDescriptor, IShrewdPrototype } from "Index";

//////////////////////////////////////////////////////////////////
/**
 * The {@link HiddenProperty} static class manages hidden properties indexed
 * by symbols. Since they are named with symbols, they will not
 * conflict with existing properties of the target object.
 *
 * The overloading declaration here is rather long, as TypeScript currently
 * does not support using dynamic symbol as interface signature. (Maybe in TS 4.4)
 */
//////////////////////////////////////////////////////////////////

export class HiddenProperty {

	/** Whether the given object has the given hidden property. */
	public static $has<T extends object>(target: T, prop: typeof $observableHelper): target is WrappedObservable<T>;
	public static $has(target: object, prop: typeof $shrewdDecorators): target is IShrewdPrototype;
	public static $has(target: object, prop: typeof $shrewdObject): target is IShrewdObjectParent;
	public static $has(target: object, prop: symbol) {
		// It is possible that target has override the hasOwnProperty method,
		// so to be safe we call the native method.
		return Object.prototype.hasOwnProperty.call(target, prop);
	}

	/** Add a hidden property to an object. */
	public static $add<T extends object>(target: T, prop: typeof $observableHelper, value: Helper<T>): WrappedObservable<T>;
	public static $add(target: object, prop: typeof $shrewdDecorators, value: IDecoratorDescriptor[]): IShrewdPrototype;
	public static $add(target: object, prop: typeof $shrewdObject, value: ShrewdObject): IShrewdObjectParent;
	public static $add(target: object, prop: symbol, value: unknown) {
		Object.defineProperty(target, prop, {
			enumerable: false,
			writable: false,
			configurable: false,
			value
		});
		return target;
	}
}
