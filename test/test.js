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
                n *= 2;
                return this.a.a;
            }
        }
        __decorate([
            shrewd_1.computed
        ], B.prototype, "b", null);
        var n = 1;
        var a = new A(0);
        var b = new B(a);
        console.assert(b.b === 0, "第一次呼叫 b.b 會使計算屬性初始化並且開始監視", b.b);
        console.assert(b.b === 0 && n === 2, "再次存取 b.b 不應該重新執行計算", n);
        a.a = 12;
        console.assert(b.b === 0 && n === 2, "在認可之前，b.b 的值不會改變", n);
        shrewd_1.commit();
        console.assert(b.b === 12 && n === 4, "認可動作應該自動執行 b.b 的計算並更新", b.b, n);
    },
    ComputedOverride() {
        class A {
            constructor() {
                this.num = 0;
            }
            get value() {
                n *= 2;
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
                n *= 3;
                return super.value;
            }
        }
        __decorate([
            shrewd_1.computed
        ], B.prototype, "value", null);
        var b = new B(), n = 1;
        b.num = 1;
        console.assert(b.value == 1 && n == 6, "兩個層級的 value 都會被呼叫", b.value, n);
        b.num = 3;
        shrewd_1.commit();
        console.assert(b.value == 1 && n == 12, "執行會在 A 的層次停住", b.value, n);
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
        console.assert(a.value === 10 && n === 2, "認可之前不會重新稽核", a.value);
        shrewd_1.commit();
        console.assert(a.value === 8 && n === 3, "認可之後執行稽核", a.value);
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
