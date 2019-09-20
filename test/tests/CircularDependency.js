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
            this.switch = true;
        }
        get a() {
            return this.switch ? 1 : this.c;
        }
        get b() {
            return this.a + 1;
        }
        get c() {
            return this.b;
        }
        log() { this.c; }
    }
    __decorate([
        shrewd_1.shrewd
    ], A.prototype, "switch", void 0);
    __decorate([
        shrewd_1.shrewd
    ], A.prototype, "a", null);
    __decorate([
        shrewd_1.shrewd
    ], A.prototype, "b", null);
    __decorate([
        shrewd_1.shrewd
    ], A.prototype, "c", null);
    __decorate([
        shrewd_1.shrewd
    ], A.prototype, "log", null);
    let a = new A();
    a.log();
    console.assert(a.c == 2, "初始值", a.c);
    let err = "", warn = console.warn;
    console.warn = (s) => err = s;
    a.switch = false;
    shrewd_1.commit();
    console.assert(err == "Circular dependency detected: A.a => A.c => A.b => A.a" +
        "\nAll these observers will be terminated.", "打開 a.switch 會產生循環參照而出錯", err);
    console.warn = warn;
};
