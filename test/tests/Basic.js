"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
const shrewd_1 = require("../../dist/shrewd");
module.exports = function () {
    class A {
        constructor(a) {
            this.a = a;
        }
    }
    __decorate([
        shrewd_1.shrewd
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
        shrewd_1.shrewd
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
        shrewd_1.shrewd
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
    console.assert(m == 1 && n == 4, "c.log 的初始化只會執行 b.b 一次", n);
    a.a = 10;
    shrewd_1.commit();
    console.assert(m == 2, "c.log 有自動執行");
    console.assert(n == 5, "b.b 執行一次");
};
