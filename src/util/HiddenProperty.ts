
//////////////////////////////////////////////////////////////////
/**
 * HiddenProperty 靜態類別管理著物件利用符號來檢索的隱藏屬性。
 * 因為限定用符號來檢索，因此這邊管理的屬性不可能跟物件既有的屬性衝突。
 */
//////////////////////////////////////////////////////////////////

class HiddenProperty {

	/** 檢查物件是否具有指定的隱藏屬性 */
	public static $has(target: object, prop: symbol) {
		// 因為 target 可能自己覆寫了 hasOwnProperty 方法，安全起見必須呼叫原始的方法
		return Object.prototype.hasOwnProperty.call(target, prop);
	}

	/** 將物件加上隱藏屬性 */
	public static $add(target: object, prop: symbol, value: any) {
		Object.defineProperty(target, prop, {
			enumerable: false,
			writable: false,
			configurable: false,
			value
		});
	}
}
