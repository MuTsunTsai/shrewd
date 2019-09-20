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
        shrewd_1.shrewd
    ], A.prototype, "value", void 0);
    __decorate([
        shrewd_1.shrewd
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
        shrewd_1.shrewd
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
};
