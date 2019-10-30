
//////////////////////////////////////////////////////////////////
/**
 * Decorators 類別包含了各種可以裝飾類別成員的裝飾器。
 * 
 * 由於成員裝飾器是作用在類別的原型上面，而且不像類別裝飾器一樣能夠修改類別的建構子，
 * 所以這些裝飾器沒有辦法直接修改對象類別的實體行為；取而代之地，
 * 它們的運作原理都是在原型上設置一個啟動器，
 * 使得當對象成員第一次被呼叫的同時對實體進行初始化修改。
 * 
 * 這樣的作法對於欄位來說是單純的，因為欄位是沒有辦法被繼承的，
 * 而啟動器設置完成之後也就再也不會被執行到。
 * 
 * 對於方法類型的成員，無論是反應方法或是計算屬性，我們都需要額外考慮到方法繼承的問題。
 * 經過考慮之後，我決定如此定義：繼承類別中的方法必須重新加上裝飾器才會有其裝飾效果。
 * 這樣做有幾個理由：
 * 1. 在計算屬性之中，繼承類別的同名計算屬性其實未必會呼叫 super 的屬性（視其計算規則而定），
 *    如果繼承類別的屬性不用加上裝飾器，那麼就可能因為沒有呼叫 super 屬性而沒有被修改到。
 * 2. 如果繼承類別的計算屬性或監視方法不用加上裝飾器，那至少在第一次執行的時候，
 *    我們一定無法立刻監控繼承類別中的方法的執行，所以為了建立相依性，
 *    整個方法至少還要再執行一次；雖然這只有在第一次呼叫的時候有這樣的問題，
 *    但是我總之覺得這很不清爽。
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
	}

	private static $observable(proto: object, prop: PropertyKey, option?: IDecoratorOptions<any>) {
		let descriptor = Object.getOwnPropertyDescriptor(proto, prop);
		if(descriptor) {
			console.warn(`Setup error at ${proto.constructor.name}[${prop.toString()}]. ` +
				"Decorated property is not a field.");
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
			let member = ShrewdObject.get(this).$getMember(name);
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
			let member = ShrewdObject.get(this).$getMember(name);
			return member.$getter();
		}
		return descriptor;
	}
}
