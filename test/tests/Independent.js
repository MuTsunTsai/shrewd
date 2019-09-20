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
            this.value = 1;
            this.lookAtValue = true;
        }
        get c1() {
            t += "1";
            return this.value;
        }
        get c2() {
            t += "2";
            return this.c1;
        }
        log() {
            t += "3";
            if (this.lookAtValue)
                this.c2;
        }
    }
    __decorate([
        shrewd_1.shrewd
    ], A.prototype, "value", void 0);
    __decorate([
        shrewd_1.shrewd
    ], A.prototype, "lookAtValue", void 0);
    __decorate([
        shrewd_1.shrewd
    ], A.prototype, "c1", null);
    __decorate([
        shrewd_1.shrewd
    ], A.prototype, "c2", null);
    __decorate([
        shrewd_1.shrewd
    ], A.prototype, "log", null);
    var t = "";
    var a = new A();
    a.log();
    console.assert(t == "321", "初始執行", t);
    t = "";
    a.value = 2;
    shrewd_1.commit();
    console.assert(t == "123", "認可", t);
    t = "";
    a.value = 1;
    a.lookAtValue = false;
    shrewd_1.commit();
    console.assert(t == "13", "順序會使得 a.log 先被執行，而使 a.c2 不活躍", t);
    t = "";
    a.value = 2;
    shrewd_1.commit();
    console.assert(t == "", "因為 a.value 不再有反應方法相依於它，相依的東西都不會在認可階段執行", t);
    t = "";
    a.lookAtValue = true;
    shrewd_1.commit();
    console.assert(t == "321", "重新建立了參照關係", t);
};
