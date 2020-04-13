
//////////////////////////////////////////////////////////////////
/**
 * The static Decorators class contains various decorators for decorating class members.
 * 
 * Because member decorators act on prototypes instead of on instances,
 * and has no control over the constructor (as in a class decorator),
 * these decorators cannot modify individual instances, and instead,
 * they set up initializers on the prototype so that instances gets initialized
 * when those members are first accessed.
 */
//////////////////////////////////////////////////////////////////

class Decorators {

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
	public static $shrewd<T extends new (...args: any[]) => {}>(constructor: T): T;

	/** `@shrewd` decorator with options. */
	public static $shrewd<T>(option: IDecoratorOptions<T>): PropertyDecorator;

	/** `@shrewd` decorator for fields. */
	public static $shrewd(proto: object, prop: PropertyKey): void;

	/** `@shrewd` decorator for get accessors or methods. */
	public static $shrewd(proto: object, prop: PropertyKey, descriptor: PropertyDescriptor): PropertyDescriptor;

	/** This is the private overload that process target with options. */
	public static $shrewd(a: object, b: PropertyKey, c?: PropertyDescriptor, d?: IDecoratorOptions<any>): void;

	/**
	 * This is the entry of the `@shrewd` decorator, and it contains various overloads that return
	 * proper decorators based on different use case.
	 */
	public static $shrewd(a: object, b?: PropertyKey, c?: PropertyDescriptor, d?: IDecoratorOptions<any>) {
		if(typeof b == "undefined") {
			if(typeof a == "function") {
				return Decorators._shrewdClass(a as any);
			} else {
				return ((proto: object, prop: PropertyKey, descriptor?: PropertyDescriptor) =>
					Decorators.$shrewd(proto, prop, descriptor, a)) as PropertyDecorator;
			}
		} else if(typeof b == "string") {
			let descriptor = c || Object.getOwnPropertyDescriptor(a, b);
			if(!descriptor) { // ObservableProperty
				return Decorators._setup(ObservablePropertyAdapter, a, b, undefined, d);
			} else if(descriptor.get && !descriptor.set) { // ComputedProperty
				return Decorators._setup(ComputedPropertyAdapter, a, b, descriptor, d);
			} else if(typeof (descriptor.value) == "function") { // ReactiveMethod
				return Decorators._setup(ReactiveMethodAdapter, a, b, descriptor, d);
			}
		}
		console.warn(`Setup error at ${a.constructor.name}[${b.toString()}]. ` +
			"Decorated member must be one of the following: a field, a readonly get accessor, or a method.");
		if(Core.$option.debug) debugger;
	}

	private static _shrewdClass<T extends new (...args: any[]) => {}>(ctor: T): T {
		let result: any;
		let name = ctor.name;

		// The following two sagments are extracted to allow mangling during minify.
		let start = () => {
			Global.$pushState({
				$isConstructing: true,
				$isCommitting: false,
				$target: null
			});
			Observer.$trace.push(`construct ${name}`);
		};
		let finish = () => {
			Observer.$trace.pop();
			Global.$restore();
		};

		// We use eval to preserve the name of the class in our proxied class,
		// in order to provide better console debugging experience.
		// This of course is inefficient, but since class decorators will only apply once,
		// the cost is insignificant.
		eval(`result=class ${name} extends ctor{constructor(...a){start();try{super(...a);if(this.constructor==result)new ShrewdObject(this);}finally{finish();}}}`);
		/*
		result = class ${name} extends constructor {
			constructor(...args) {
				start();
				try {
					super(...args);
					if(this.constructor == result) {
						new ShrewdObject(this);
					}
				} finally {
					finish();
				}
			}
		}
		*/
		return result;
	}

	private static _setup(
		ctor: IAdapterConstructor,
		proto: object, prop: PropertyKey, descriptor?: PropertyDescriptor, option?: IDecoratorOptions<any>
	): PropertyDescriptor | void {
		var adapter = new ctor(proto, prop, descriptor, option);
		Decorators.get(proto).push(adapter.$decoratorDescriptor);
		return adapter.$setup();
	}
}