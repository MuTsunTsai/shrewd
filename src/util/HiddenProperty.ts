
//////////////////////////////////////////////////////////////////
/**
 * HiddenProperty 靜態類別管理著物件利用符號來檢索的隱藏屬性。
 * 因為限定用符號來檢索，因此這邊管理的屬性不可能跟物件既有的屬性衝突。
 * 
 * 這邊的函數重載宣告有點冗長，主要是因為 TypeScript 目前不支援動態的 symbol 作為介面屬性簽章；
 * 這等到以後加入這個功能的時候可以重新改寫。
 */
//////////////////////////////////////////////////////////////////

class HiddenProperty {

	/** 檢查物件是否具有指定的隱藏屬性 */
	public static $has<T extends object>(target: T, prop: typeof $observableHelper): target is WrappedObservable<T>;
	public static $has(target: object, prop: typeof $shrewdDecorators): target is IShrewdPrototype;
	public static $has(target: object, prop: typeof $shrewdObject): target is IShrewdObjectParent;
	public static $has(target: object, prop: symbol) {
		// 因為 target 可能自己覆寫了 hasOwnProperty 方法，安全起見必須呼叫原始的方法
		return Object.prototype.hasOwnProperty.call(target, prop);
	}

	/** 將物件加上隱藏屬性 */
	public static $add<T extends object>(target: T, prop: typeof $observableHelper, value: Helper<T>): WrappedObservable<T>;
	public static $add(target: object, prop: typeof $shrewdDecorators, value: IDecoratorDescriptor[]): IShrewdPrototype;
	public static $add(target: object, prop: typeof $shrewdObject, value: ShrewdObject): IShrewdObjectParent;
	public static $add(target: object, prop: symbol, value: any) {
		Object.defineProperty(target, prop, {
			enumerable: false,
			writable: false,
			configurable: false,
			value
		});
		return target;
	}
}
