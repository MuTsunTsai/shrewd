
class HiddenProperty {

	public static $has(target: object, prop: PropertyKey) {
		// 因為 target 可能自己覆寫了 hasOwnProperty 方法，安全起見必須呼叫原始的方法
		return Object.prototype.hasOwnProperty.call(target, prop);
	}

	public static $add(target: object, prop: PropertyKey, value: any) {
		Object.defineProperty(target, prop, {
			enumerable: false,
			writable: false,
			configurable: false,
			value
		});
	}

}
