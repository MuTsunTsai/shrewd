
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

const $shrewdDecorators = Symbol("Shrewd Decorators");

interface IShrewdPrototype {
	[$shrewdDecorators]: IDecoratorDescriptor[];
}

interface IDecoratorOptions<T> {
	validator?: (value: T) => boolean;
	renderer?: (value: T) => T;
	lazy?: boolean;
}

interface IDecoratorDescriptor {
	/**
	 * The PropertyKey for identifying this DecoratedMemeber.
	 * For an ObservableProperty, this is the name of the property.
	 * For a ComputedProperty or ReactiveMethod, the key is the same as the name,
	 * so as to distinguish the member from different prototype.
	 */
	$key: PropertyKey;

	/** Readable member name, if the format of [Class.MemberName]. */
	$name: string;

	/** The constructor used for this memeber. */
	$constructor: IDecoratedMemberConstructor;

	/** Options for this DecoratedMember. */
	$option?: IDecoratorOptions<any>;

	/** The original method defined on the prototype. */
	$method?: Function;
}

interface IDecoratedMemberConstructor {
	new(target: IShrewdObjectParent, descriptor: IDecoratorDescriptor): DecoratedMemeber;
}

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

	/**
	 * This is the entry of the @shrewd decorator, and it contains various overloads that return
	 * proper decorators based on different use case.
	 */
	public static $shrewd<T>(option: IDecoratorOptions<T>): PropertyDecorator;
	public static $shrewd(proto: object, prop: PropertyKey): void;
	public static $shrewd(proto: object, prop: PropertyKey, descriptor: PropertyDescriptor): PropertyDescriptor;
	public static $shrewd(a: object, b: PropertyKey, c?: PropertyDescriptor, d?: IDecoratorOptions<any>): void;
	public static $shrewd(a: object, b?: PropertyKey, c?: PropertyDescriptor, d?: IDecoratorOptions<any>) {
		if(typeof b == "undefined") {
			return ((proto: object, prop: PropertyKey, descriptor?: PropertyDescriptor) =>
				Decorators.$shrewd(proto, prop, descriptor, a)) as PropertyDecorator;
		} else if(typeof b == "string") {
			let descriptor = c || Object.getOwnPropertyDescriptor(a, b);
			if(!descriptor) { // ObservableProperty
				return Decorators.$observable(a, b, d);
			} else if(descriptor.get && !descriptor.set) { // ComputedProperty
				return Decorators.$computed(a, b, descriptor);
			} else if(typeof (descriptor.value) == "function") { // ReactiveMethod
				return Decorators.$reactive(a, b, descriptor, d);
			}
		}
		console.warn(`Setup error at ${a.constructor.name}[${b.toString()}]. ` +
			"Decorated member must be one of the following: a field, a readonly get accessor, or a method.");
		if(Core.$option.debug) debugger;
	}

	private static $observable(proto: object, prop: PropertyKey, option?: IDecoratorOptions<any>) {
		let descriptor = Object.getOwnPropertyDescriptor(proto, prop);
		if(descriptor) {
			console.warn(`Setup error at ${proto.constructor.name}[${prop.toString()}]. ` +
				"Decorated property is not a field.");
			if(Core.$option.debug) debugger;
			return;
		}

		Decorators.get(proto).push({
			$key: prop,
			$name: proto.constructor.name + "." + prop.toString(),
			$constructor: ObservableProperty,
			$option: option
		});

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

	public static $computed(proto: object, prop: PropertyKey, descriptor: PropertyDescriptor) {
		let name = proto.constructor.name + "." + prop.toString();
		Decorators.get(proto).push({
			$key: name,
			$name: name,
			$constructor: ComputedProperty,
			$method: descriptor.get
		});

		descriptor.get = function(this: IShrewdObjectParent) {
			let member: ComputedProperty = ShrewdObject.get(this).$getMember(name);
			return member.$getter();
		}
		return descriptor;
	}

	public static $reactive(proto: object, prop: PropertyKey, descriptor: PropertyDescriptor, option?: IDecoratorOptions<any>) {
		let name = proto.constructor.name + "." + prop.toString();
		Decorators.get(proto).push({
			$key: name,
			$name: name,
			$constructor: ReactiveMethod,
			$method: descriptor.value,
			$option: option
		});

		delete descriptor.value;
		delete descriptor.writable;
		descriptor.get = function(this: IShrewdObjectParent) {
			let member: ReactiveMethod = ShrewdObject.get(this).$getMember(name);
			return member.$getter();
		}
		return descriptor;
	}
}