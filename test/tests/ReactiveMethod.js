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
        shrewd_1.shrewd
    ], A.prototype, "value", void 0);
    __decorate([
        shrewd_1.shrewd
    ], A.prototype, "middle", null);
    __decorate([
        shrewd_1.shrewd
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
};
