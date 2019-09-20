"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
const shrewd_1 = require("../../dist/shrewd");
module.exports = function () {
    let err = "", warn = console.warn;
    console.warn = (s) => err = s;
    class A {
        get value() { return 1; }
        set value(v) { }
    }
    __decorate([
        shrewd_1.shrewd
    ], A.prototype, "value", null);
    console.assert(err == "Setup error at A[value]. Decorated member must be one of the following: " +
        "a field, a readonly get accessor, or a method.", "不正確的設定", err);
    console.warn = warn;
};
