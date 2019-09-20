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
            this.max = 10;
            this.value = 0;
        }
        log() { o = this.value; }
    }
    __decorate([
        shrewd_1.shrewd
    ], A.prototype, "max", void 0);
    __decorate([
        shrewd_1.shrewd({
            validator(v) { return v >= 0; },
            renderer(v) {
                n++;
                return v > this.max ? this.max : v;
            }
        })
    ], A.prototype, "value", void 0);
    __decorate([
        shrewd_1.shrewd
    ], A.prototype, "log", null);
    var a = new A(), n = 0, o;
    a.value = 5;
    a.log();
    console.assert(o === 5 && n === 2, "輸入可接受的值無妨", n);
    a.value = 20;
    console.assert((o = a.value) === 10 && n === 3, "超過範圍的值會被修正", o, n);
    a.value = 20;
    console.assert(n === 3, "輸入同樣的數字不會重新稽核", n);
    a.max = 8;
    console.assert((o = a.value) === 8 && n === 4, "手動執行也會執行稽核", o, n);
    shrewd_1.commit();
    console.assert(o === 8 && n === 4, "因為已經執行過，所以不會再次稽核", o, n);
    a.max = 12;
    shrewd_1.commit();
    console.assert(o === 12 && n === 5, "會記得未稽核的值，以隨著新的稽核條件作出恢復");
    a.value = -3;
    console.assert(o === 12 && n === 5, "規則說如果指定負數，則完全不改變", o, n);
};
