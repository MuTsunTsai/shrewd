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
            this.num = 0;
        }
        get value() {
            n += "1";
            return this.num % 2;
        }
    }
    __decorate([
        shrewd_1.shrewd
    ], A.prototype, "num", void 0);
    __decorate([
        shrewd_1.shrewd
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
        shrewd_1.shrewd
    ], B.prototype, "value", null);
    __decorate([
        shrewd_1.shrewd
    ], B.prototype, "log", null);
    var b = new B(), n = "";
    b.log();
    console.assert(n == "3214", "第一次執行因為還沒有建立參照關係，是 top-down 的", n);
    n = "";
    b.num = 1;
    console.assert(n == "", "認可前還沒執行重新計算", n);
    shrewd_1.commit();
    console.assert(n == "1234", "有了參照關係就會 bottom-up 執行", n);
    n = "";
    b.num = 0;
    b.log();
    console.assert(n == "1234", "有參照關係之後手動階段執行也會是 bottom-up", n);
    n = "";
    b.num = 2;
    shrewd_1.commit();
    console.assert(n == "1", "資料流在 A.log 處中斷了");
};
