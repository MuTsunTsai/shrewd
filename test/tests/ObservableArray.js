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
            this.prop = 0;
            this.arr = [];
        }
        get total() {
            n++;
            return this.arr.reduce((t, v) => t + v, 0);
        }
        log() {
            t = this.total;
        }
    }
    __decorate([
        shrewd_1.shrewd
    ], A.prototype, "prop", void 0);
    __decorate([
        shrewd_1.shrewd({
            renderer(arr) {
                let j = 0;
                for (let i = 0; i < arr.length; i++) {
                    if (arr[i] != 1)
                        arr[j++] = arr[i];
                }
                arr.length = j;
                return arr;
            }
        })
    ], A.prototype, "arr", void 0);
    __decorate([
        shrewd_1.shrewd
    ], A.prototype, "total", null);
    __decorate([
        shrewd_1.shrewd
    ], A.prototype, "log", null);
    var n = 0, t;
    var a = new A();
    a.log();
    a.arr.push(1, 2, 3);
    shrewd_1.commit();
    console.assert(a.arr.length == 2, "稽核會殺掉元素 1", a.arr.toString());
    console.assert(n == 2, "會紀錄到陣列的變更", n);
    console.assert(t == 5, "計算出結果");
    a.arr.push(1);
    shrewd_1.commit();
    console.assert(a.arr.length == 2, "錯誤的元素加不進去", a.arr.length);
    console.assert(n == 3, "雖然稽核把陣列修正了回來，但是仍然視為是曾經變更過", n);
    a.arr[1] = 2;
    shrewd_1.commit();
    console.assert(n == 4, "陣列元素變更會偵測到");
    console.assert(t == 4, "更新計算結果");
    a.arr[1] = 2;
    shrewd_1.commit();
    console.assert(n == 4, "指定同樣的內容並不會觸發通知");
};
