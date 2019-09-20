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
            this.set = new Set();
        }
        log() {
            count = this.set.size;
            n++;
        }
    }
    __decorate([
        shrewd_1.shrewd({
            renderer(v) {
                for (let n of v)
                    if (n % 2 == 0)
                        v.delete(n);
                return v;
            }
        })
    ], A.prototype, "set", void 0);
    __decorate([
        shrewd_1.shrewd
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
};
