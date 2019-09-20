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
        shrewd_1.shrewd
    ], A.prototype, "value", void 0);
    __decorate([
        shrewd_1.shrewd
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
};
