import { ComputedPropertyAdapter, IAdapterConstructor, ObservablePropertyAdapter, ReactiveMethodAdapter, Observer , InitializationController , $shrewdDecorators, IDecoratorDescriptor, IDecoratorOptions , HiddenProperty ,Core , Global , IShrewdObjectParent, ShrewdObject } from "../Index";

type UnknownConstructor = new (...args: unknown[]) => {};

//////////////////////////////////////////////////////////////////
/**
 * The static {@link Decorators} class used to contain various decorators
 * for decorating class members, but now it only contains one overloaded
 * decorator (i.e. `shrewd`) for all scenarios. The adapter classes
 * now control the actual setup of {@link DecoratedMember}s.
 */
//////////////////////////////////////////////////////////////////

export class Decorators {

	public static get(proto: object) {
		if(HiddenProperty.$has(proto, $shrewdDecorators)) {
			return proto[$shrewdDecorators];
		} else {
			let decorators: IDecoratorDescriptor[] = [];
			HiddenProperty.$add(proto, $shrewdDecorators, decorators);
			return decorators;
		};
	}

	/** `@shrewd` decorator for class */
	public static $shrewd<T extends Function>(constructor: T): T;

	/** `@shrewd` decorator with options. */
	public static $shrewd<T>(option: IDecoratorOptions<T>): PropertyDecorator;

	/** `@shrewd` decorator for fields. */
	public static $shrewd(proto: object, prop: PropertyKey): void;

	/** `@shrewd` decorator for get accessors or methods. */
	public static $shrewd(proto: object, prop: PropertyKey, descriptor: PropertyDescriptor): PropertyDescriptor;

	/** This is the private overload that process target with options. */
	public static $shrewd(a: object, b: PropertyKey, c?: PropertyDescriptor, d?: IDecoratorOptions<unknown>): void;

	/**
	 * This is the entry of the `@shrewd` decorator, and it contains various overloads that return
	 * proper decorators based on different use case.
	 */
	public static $shrewd(a: object, b?: PropertyKey, c?: PropertyDescriptor, d?: IDecoratorOptions<unknown>) {
		if(typeof b == "undefined") {
			if(typeof a == "function") {
				return Decorators._shrewdClass(a as UnknownConstructor);
			} else {
				return ((proto: object, prop: PropertyKey, descriptor?: PropertyDescriptor) =>
					Decorators.$shrewd(proto, prop, descriptor, a)) as PropertyDecorator;
			}
		} else if(typeof b == "string") {
			let descriptor = c || Object.getOwnPropertyDescriptor(a, b);
			if(!descriptor) {
				return Decorators._setup(ObservablePropertyAdapter, a, b, undefined, d);
			} else if(descriptor.get && !descriptor.set) {
				return Decorators._setup(ComputedPropertyAdapter, a, b, descriptor, d);
			} else if(typeof (descriptor.value) == "function") {
				return Decorators._setup(ReactiveMethodAdapter, a, b, descriptor, d);
			}
		}
		console.warn(`Setup error at ${a.constructor.name}[${b.toString()}]. ` +
			"Decorated member must be one of the following: a field, a readonly get accessor, or a method.");
		if(Core.$option.debug) debugger;
	}

	private static _shrewdClass<T extends UnknownConstructor>(ctor: T): T {
		var proxy = new Proxy<T>(ctor, Decorators._shrewdProxyHandler);
		Decorators._proxies.add(proxy);
		return proxy;
	}

	private static _proxies = new WeakSet();

	private static _shrewdProxyHandler: ProxyHandler<UnknownConstructor> = {
		construct(target: UnknownConstructor, args: unknown[], newTarget: UnknownConstructor): object {
			if(!Decorators._proxies.has(newTarget)) {
				console.warn(`Class [${newTarget.name}] is derived form @shrewd class [${target.name}], but it is not decorated with @shrewd.`);
			}
			Global.$pushState({
				$isConstructing: true,
				$isCommitting: false,
				$target: null
			});
			Observer.$trace.push(`construct ${target.name}`);
			try {
				let self: IShrewdObjectParent = Reflect.construct(target, args, newTarget);
				if(self.constructor == target) new ShrewdObject(self);
				if(Decorators.$immediateInit.has(self)) {
					Decorators.$immediateInit.delete(self);
					InitializationController.$initialize(self);
				}
				return self;
			} finally {
				Observer.$trace.pop();
				Global.$restore();
			}
		}
	};

	public static $immediateInit: Set<IShrewdObjectParent> = new Set();

	private static _setup(
		ctor: IAdapterConstructor,
		proto: object, prop: PropertyKey, descriptor?: PropertyDescriptor, option?: IDecoratorOptions<unknown>
	): PropertyDescriptor | void {
		var adapter = new ctor(proto, prop, descriptor, option);
		Decorators.get(proto).push(adapter.$decoratorDescriptor);
		return adapter.$setup();
	}
}
