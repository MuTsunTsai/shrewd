
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
 * 
 * 因此，在反應方法和計算屬性的情況中，每一個層次的方法都會產生獨立的 DecoratedMember 實體物件，
 * 而且都會獨立進行反應。所以在計算屬性的情況中，實際上各層的計算屬性都是獨立不相干的計算屬性，
 * 只是下層的計算屬性會去參照上層的計算屬性、且對外而言只有最下層的計算屬性是公開的而已。
 * 這樣的一個額外好處就是在父類別和繼承類別的同名計算屬性之間會存在一個停止點。
 * 
 * 反應方法的情況也是類似：各層的反應方法都是獨立的，
 * 但是我們允許下層的反應方法在執行的過程中去呼叫上層的反應方法。
 * 在這種場合中，下層方法也會被視為是參照上層方法（無論它是否使用了上層方法的傳回值），
 * 所以在認可階段中上層方法會先被執行，並且暫存回傳值（如果有的話）。
 * 不同的地方在於，反應方法即使回傳值一樣，只要它自己被通知執行了，
 * 它永遠會通知任何參照自己的反應方法或計算屬性也去執行。
 * 此外，在同一個認可階段中，同一個反應方法只會真正執行一次，
 * 之後如果再次呼叫，它只會立刻回傳暫存的回傳值，不會真正執行。
 * 
 */
//////////////////////////////////////////////////////////////////

const $shrewdDecorators = Symbol("Shrewd Decorators");

interface IShrewdPrototype {
	[$shrewdDecorators]?: IDecoratorDescriptor[];
}

interface IDecoratorDescriptor {
	/**
	 * 識別 DecoratedMemeber 的 PropertyKey。
	 * 在 ObservableProperty 的情況中，這個直接就是屬性的名稱，
	 * 而在 ComputedProperty 或 ReactiveMethod 的情況中，因為要區分不同層次原型中的方法，
	 * 會產生一個獨一無二的 symbol 來作為 key。
	 */
	key: PropertyKey;

	type: IDecoratedMemberConstructor;
	validator?: IValidator<any>;
	method?: Function;
}

interface IDecoratedMemberConstructor {
	new(target: Object, descriptor: IDecoratorDescriptor): DecoratedMemeber;
}

class Decorators {

	public static get(proto: IShrewdPrototype) {
		if(HiddenProperty.$has(proto, $shrewdDecorators)) {
			return proto[$shrewdDecorators]!;
		} else {
			let decorators: IDecoratorDescriptor[] = [];
			HiddenProperty.$add(proto, $shrewdDecorators, decorators);
			return decorators;
		};
	}

	public static $observable<T>(validator: IValidator<T>): PropertyDecorator;
	public static $observable(proto: object, prop: PropertyKey): void;
	public static $observable(a: any, b?: PropertyKey): any {
		if(typeof b == "string") Decorators.$observableFactory(a, b);
		else return (proto: object, prop: PropertyKey) => Decorators.$observableFactory(proto, prop, a);
	}

	private static $observableFactory(proto: object, prop: PropertyKey, validator?: IValidator<any>) {
		let descriptor = Object.getOwnPropertyDescriptor(proto, prop);
		if(descriptor) throw new SetupError(proto, prop, "Decorated property is not a field.");

		Decorators.get(proto).push({
			key: prop,
			type: ObservableProperty,
			validator: validator
		});

		Object.defineProperty(proto, prop, {
			get() {
				ShrewdObject.get(this).$initialize();
				return this[prop];
			},
			set(value: any) {
				ShrewdObject.get(this).$initialize();
				this[prop] = value;
			}
		});
	}

	public static $computed(proto: object, prop: PropertyKey, descriptor: PropertyDescriptor) {
		if(!descriptor || !descriptor.get) throw new SetupError(proto, prop, "Decorated property has no getter.");
		if(descriptor.set) throw new SetupError(proto, prop, "Decorated property is not readonly.");
		let symbol = Symbol(prop.toString());
		Decorators.get(proto).push({
			key: symbol,
			type: ComputedProperty,
			method: descriptor.get!
		});
		descriptor.get = function(this: IShrewdObject) {
			let shrewd = ShrewdObject.get(this);
			shrewd.$initialize();
			return shrewd.$getMember(symbol).$getter();
		}
		return descriptor;
	}

	public static $reactive(proto: object, prop: PropertyKey, descriptor: PropertyDescriptor) {
		if(!descriptor || typeof (descriptor.value) != "function") {
			throw new SetupError(proto, prop, "Decorated member is not a method.");
		}
		let symbol = Symbol(prop.toString());
		Decorators.get(proto).push({
			key: symbol,
			type: ReactiveMethod,
			method: descriptor.value!
		});
		delete descriptor.value;
		descriptor.get = function(this: IShrewdObject) {
			let shrewd = ShrewdObject.get(this);
			shrewd.$initialize();
			return shrewd.$getMember(symbol).$getter();
		}
		return descriptor;
	}
}
