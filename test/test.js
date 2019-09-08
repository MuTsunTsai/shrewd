"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const shrewd_1 = require("../dist/shrewd");
const Tests = {
    Basic() {
        class A {
            constructor(a) {
                this.a = a;
            }
        }
        __decorate([
            shrewd_1.observable
        ], A.prototype, "a", void 0);
        class B {
            constructor(a) {
                this.a = a;
            }
            get b() {
                n++;
                return this.a.a;
            }
        }
        __decorate([
            shrewd_1.computed
        ], B.prototype, "b", null);
        class C {
            constructor(b) {
                this.b = b;
            }
            log() {
                this.b.b;
                this.b.b;
                m++;
            }
        }
        __decorate([
            shrewd_1.reactive
        ], C.prototype, "log", null);
        var n = 0, m = 0;
        var a = new A(0);
        var b = new B(a);
        console.assert(b.b == 0 && n == 1, "第一次呼叫 b.b 會使計算屬性初始化並且開始監視");
        console.assert(b.b === 0 && n == 2, "手動再次存取 b.b 會再次執行計算", n);
        a.a = 12;
        shrewd_1.commit();
        console.assert(n == 2, "因為 b.b 沒有訂閱者，即使認可也不會自動更新 b.b");
        console.assert(b.b == 12 && n == 3, "不過手動讀取 b.b 仍然是可以的", n);
        var c = new C(b);
        c.log();
        console.assert(m == 1 && n == 5, "c.log 的初始化會讀取 b.b 兩次，因為此時仍算是手動階段");
        a.a = 10;
        shrewd_1.commit();
        console.assert(m == 2, "c.log 有自動執行");
        console.assert(n == 6, "有了訂閱者之後 b.b 會自動更新，但在認可階段裡面只會被執行一次");
    },
    ComputedOverride() {
        class A {
            constructor() {
                this.num = 0;
            }
            get value() {
                n += "1";
                return this.num % 2;
            }
        }
        __decorate([
            shrewd_1.observable
        ], A.prototype, "num", void 0);
        __decorate([
            shrewd_1.computed
        ], A.prototype, "value", null);
        class B extends A {
            get value() {
                n += "2";
                return super.value;
            }
            log() {
                n += "3";
                this.value;
                n += "4";
            }
        }
        __decorate([
            shrewd_1.computed
        ], B.prototype, "value", null);
        __decorate([
            shrewd_1.reactive
        ], B.prototype, "log", null);
        var b = new B(), n = "";
        b.log();
        console.assert(n == "3214", "手動階段執行是 top-down 的", n);
        n = "";
        b.num = 1;
        console.assert(n == "", "認可前還沒執行重新計算", n);
        shrewd_1.commit();
        console.assert(n == "1234", "認可階段是 bottom-up 執行", n);
        n = "";
        b.num = 3;
        shrewd_1.commit();
        console.assert(n == "1", "資料流在 A.log 處中斷了");
    },
    ObservableValidation() {
        class A {
            constructor() {
                this.max = 10;
                this.value = 0;
            }
        }
        __decorate([
            shrewd_1.observable
        ], A.prototype, "max", void 0);
        __decorate([
            shrewd_1.observable(function (v) {
                n++;
                return v > this.max ? this.max : v;
            })
        ], A.prototype, "value", void 0);
        var a = new A(), n = 0;
        a.value = 5;
        console.assert(a.value === 5 && n === 1, "輸入可接受的值無妨");
        a.value = 20;
        console.assert(a.value === 10 && n === 2, "超過範圍的值會被修正", a.value);
        a.value = 20;
        console.assert(n === 2, "輸入同樣的數字不會重新稽核");
        a.max = 8;
        console.assert(a.value === 8 && n === 3, "手動執行也會執行稽核", a.value, n);
        shrewd_1.commit();
        console.assert(a.value === 8 && n === 3, "因為已經執行過，所以不會再次稽核", a.value, n);
        a.max = 12;
        shrewd_1.commit();
        console.assert(a.value === 12 && n === 4, "會記得未稽核的值，以隨著新的稽核條件作出恢復");
    },
    DecoratorRequirement() {
        var error;
        try {
            class A {
                get value() { return 1; }
                set value(v) { }
            }
            __decorate([
                shrewd_1.computed
            ], A.prototype, "value", null);
        }
        catch (e) {
            if (e instanceof shrewd_1.SetupError)
                error = e;
            else
                throw e;
        }
        console.assert(error instanceof shrewd_1.SetupError && error.class == "A" && error.prop == "value", "類別 A 的 value 屬性設置了 setter 是不能裝飾為 computed 的");
        error = undefined;
        try {
            class B {
                get value() { return 1; }
            }
            __decorate([
                shrewd_1.observable
            ], B.prototype, "value", null);
        }
        catch (e) {
            if (e instanceof shrewd_1.SetupError)
                error = e;
            else
                throw e;
        }
        console.assert(error instanceof shrewd_1.SetupError && error.class == "B" && error.prop == "value", "類別 B 的 value 屬性是不能裝飾為 observable 的");
    },
    ReactiveMethod() {
        class A {
            constructor() {
                this.n = 0;
                this.value = 0;
                this.log();
            }
            get middle() {
                return this.value % 2;
            }
            log() {
                this.middle;
                this.n++;
            }
        }
        __decorate([
            shrewd_1.observable
        ], A.prototype, "value", void 0);
        __decorate([
            shrewd_1.computed
        ], A.prototype, "middle", null);
        __decorate([
            shrewd_1.reactive
        ], A.prototype, "log", null);
        var a = new A();
        console.assert(a.n === 1, "初次執行");
        a.value = 1;
        shrewd_1.commit();
        console.assert(a.middle === 1, "中間值改變");
        console.assert(a.n === 2, "參照值改變導致 log 再次執行", a.n);
        shrewd_1.commit();
        console.assert(a.n === 2, "如果沒有任何改變，再次認可並不會再次執行 log");
        a.value = 3;
        shrewd_1.commit();
        console.assert(a.n === 2, "因為中間值沒改變，log 不重新執行");
        a.value = 2;
        shrewd_1.commit();
        console.assert(a.n === 3, "再次執行 log");
    },
    ReactiveOverride() {
        class A {
            constructor() {
                this.n = "";
                this.value = 1;
            }
            log() {
                this.n += "1";
                return this.value != 3;
            }
        }
        __decorate([
            shrewd_1.observable
        ], A.prototype, "value", void 0);
        __decorate([
            shrewd_1.reactive
        ], A.prototype, "log", null);
        class B extends A {
            log() {
                this.n += "2";
                if (!super.log())
                    return;
                this.n += "3";
            }
        }
        __decorate([
            shrewd_1.reactive
        ], B.prototype, "log", null);
        var b = new B();
        b.log();
        console.assert(b.n == "213", "兩個層次的 log 都有被執行，且因為是獨立呼叫，下層優先", b.n);
        b.n = "";
        b.value = 2;
        shrewd_1.commit();
        console.assert(b.n == "123", "兩個層次的 log 都恰再次被執行一次", b.n);
        b.n = "";
        b.value = 3;
        shrewd_1.commit();
        console.assert(b.n == "12", "回傳值中斷", b.n);
    },
    ObservableArray() {
        class A {
            constructor() {
                this.arr = [];
            }
            get total() {
                n++;
                return this.arr.reduce((t, v) => t + v, 0);
            }
            log() {
                t = this.total;
            }
        }
        __decorate([
            shrewd_1.observable(function (arr) {
                let j = 0;
                for (let i = 0; i < arr.length; i++) {
                    if (arr[i] != 1)
                        arr[j++] = arr[i];
                }
                arr.length = j;
                return arr;
            })
        ], A.prototype, "arr", void 0);
        __decorate([
            shrewd_1.computed
        ], A.prototype, "total", null);
        __decorate([
            shrewd_1.reactive
        ], A.prototype, "log", null);
        var n = 0, t;
        var a = new A();
        a.log();
        a.arr.push(1, 2, 3);
        shrewd_1.commit();
        console.assert(a.arr.length == 2, "稽核會殺掉元素 1");
        console.assert(n == 2, "會紀錄到陣列的變更", n);
        console.assert(t == 5, "計算出結果");
        a.arr.push(1);
        shrewd_1.commit();
        console.assert(a.arr.length == 2, "錯誤的元素加不進去", a.arr.length);
        console.assert(n == 3, "雖然稽核把陣列修正了回來，但是仍然視為是曾經變更過", n);
        a.arr[1] = 2;
        shrewd_1.commit();
        console.assert(n == 4, "陣列元素變更會偵測到");
        console.assert(t == 4, "更新計算結果");
        a.arr[1] = 2;
        shrewd_1.commit();
        console.assert(n == 4, "指定同樣的內容並不會觸發通知");
    },
    ObservableArraySet() {
        class A {
            constructor() {
                this.set = new Set();
            }
            log() {
                count = this.set.size;
                n++;
            }
        }
        __decorate([
            shrewd_1.observable(function (v) {
                for (let n of v)
                    if (n % 2 == 0)
                        v.delete(n);
                return v;
            })
        ], A.prototype, "set", void 0);
        __decorate([
            shrewd_1.reactive
        ], A.prototype, "log", null);
        var count = 0, n = 0;
        var a = new A();
        a.set.add(1);
        a.set.add(2);
        a.set.add(3);
        a.log();
        console.assert(count == 2 && n == 1, "初始計數", count, n);
        a.set.add(5);
        shrewd_1.commit();
        console.assert(count == 3 && n == 2, "自動更新");
        a.set.add(5);
        shrewd_1.commit();
        console.assert(count == 3 && n == 2, "沒有實際上的變更發生");
        a.set.clear();
        shrewd_1.commit();
        console.assert(count == 0 && n == 3, "自動更新");
    },
    ObservableObject() {
        class A {
            constructor() {
                this.value = {
                    prop: 1
                };
            }
            log() {
                m = this.value.prop;
                if ("new" in this.value)
                    m += this.value.new.value;
                n++;
            }
        }
        __decorate([
            shrewd_1.observable
        ], A.prototype, "value", void 0);
        __decorate([
            shrewd_1.reactive
        ], A.prototype, "log", null);
        var n = 0, m = 0;
        var a = new A();
        a.log();
        console.assert(n == 1 && m == 1, "初始紀錄", n, m);
        a.value.prop = 2;
        a.value.prop = 3;
        shrewd_1.commit();
        console.assert(n == 2 && m == 3, "自動更新", n, m);
        a.value.new = { value: 1 };
        shrewd_1.commit();
        console.assert(n == 3 && m == 4, "加入新的屬性為純粹物件", n, m);
        a.value.new.value = 2;
        shrewd_1.commit();
        console.assert(n == 4 && m == 5, "新加的屬性物件之屬性也具有反應能力", n, m);
    }
};
let assert = console.assert;
let pass = true;
console.assert = (a, ...obj) => { assert(a, ...obj); if (!a)
    throw true; };
for (let test in Tests) {
    try {
        Tests[test]();
    }
    catch (e) {
        if (e instanceof Error)
            console.error(e);
        console.log(`\x1b[31m${test} : failed\x1b[0m`);
        pass = false;
    }
}
if (pass)
    console.log("\x1b[32mAll tests succeeded.\x1b[0m");
console.assert = assert;
