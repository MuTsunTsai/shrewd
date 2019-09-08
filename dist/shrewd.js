/**
 * shrewd v0.0.0-beta.11
 * (c) 2019 Mu-Tsun Tsai
 * Released under the MIT License.
 */

;(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory();
  } else {
    root.Shrewd = factory();
  }
}(this, function() {
"use strict";
class SetupError extends Error {
    constructor(target, prop, message) {
        super(message);
        this.class = target.constructor.name;
        this.prop = prop.toString();
        this.name = `SetupError at ${this.class}[${this.prop}]`;
    }
}
class Core {
    static $commit() {
        Core._commiting = true;
        for (let i = 0; i < Core._queue.length; i++)
            if (Core._queue[i]) {
                for (let observer of Core._queue[i])
                    Observer.$render(observer);
            }
        Core._queue = [];
        Core._commiting = false;
    }
    static get $committing() { return Core._commiting; }
    static _autoCommit() {
        Core.$commit();
        Core._promised = false;
    }
    static $unqueue(observer) {
        let set = Core._queue[observer[$dependencyLevel]];
        if (set)
            set.delete(observer);
    }
    static $queue(observer) {
        if (!observer.$rendering) {
            let level = observer[$dependencyLevel];
            Core._queue[level] = Core._queue[level] || new Set();
            Core._queue[level].add(observer);
        }
        if (!Core._promised) {
            let promise = Promise.resolve();
            promise.then(Core._autoCommit);
            Core._promised = true;
        }
    }
}
Core._queue = [];
Core._commiting = false;
Core._promised = false;
const $shrewdDecorators = Symbol("Shrewd Decorators");
class Decorators {
    static get(proto) {
        if (HiddenProperty.$has(proto, $shrewdDecorators)) {
            return proto[$shrewdDecorators];
        }
        else {
            let decorators = [];
            HiddenProperty.$add(proto, $shrewdDecorators, decorators);
            return decorators;
        }
        ;
    }
    static $observable(a, b) {
        if (typeof b == "string")
            Decorators.$observableFactory(a, b);
        else
            return (proto, prop) => Decorators.$observableFactory(proto, prop, a);
    }
    static $observableFactory(proto, prop, validator) {
        let descriptor = Object.getOwnPropertyDescriptor(proto, prop);
        if (descriptor)
            throw new SetupError(proto, prop, "Decorated property is not a field.");
        Decorators.get(proto).push({
            key: prop,
            name: proto.constructor.name + "." + prop.toString(),
            type: ObservableProperty,
            validator: validator
        });
        Object.defineProperty(proto, prop, {
            get() {
                ShrewdObject.get(this).$initialize();
                return this[prop];
            },
            set(value) {
                ShrewdObject.get(this).$initialize();
                this[prop] = value;
            }
        });
    }
    static $computed(proto, prop, descriptor) {
        if (!descriptor || !descriptor.get)
            throw new SetupError(proto, prop, "Decorated property has no getter.");
        if (descriptor.set)
            throw new SetupError(proto, prop, "Decorated property is not readonly.");
        let symbol = Symbol(prop.toString());
        Decorators.get(proto).push({
            key: symbol,
            name: proto.constructor.name + "." + prop.toString(),
            type: ComputedProperty,
            method: descriptor.get
        });
        descriptor.get = function () {
            let shrewd = ShrewdObject.get(this);
            shrewd.$initialize();
            return shrewd.$getMember(symbol).$getter();
        };
        return descriptor;
    }
    static $reactive(proto, prop, descriptor) {
        if (!descriptor || typeof (descriptor.value) != "function") {
            throw new SetupError(proto, prop, "Decorated member is not a method.");
        }
        let symbol = Symbol(prop.toString());
        Decorators.get(proto).push({
            key: symbol,
            name: proto.constructor.name + "." + prop.toString(),
            type: ReactiveMethod,
            method: descriptor.value
        });
        delete descriptor.value;
        delete descriptor.writable;
        descriptor.get = function () {
            let shrewd = ShrewdObject.get(this);
            shrewd.$initialize();
            return shrewd.$getMember(symbol).$getter();
        };
        return descriptor;
    }
}
const $shrewdObject = Symbol("ShrewdObject");
class ShrewdObject {
    constructor(parent) {
        this._initialized = false;
        this._members = new Map();
        this._parent = parent;
    }
    static get(target) {
        if (HiddenProperty.$has(target, $shrewdObject)) {
            return target[$shrewdObject];
        }
        else {
            let so = new ShrewdObject(target);
            HiddenProperty.$add(target, $shrewdObject, so);
            return so;
        }
    }
    $getMember(key) {
        return this._members.get(key);
    }
    $initialize() {
        if (this._initialized)
            return;
        let proto = Object.getPrototypeOf(this._parent);
        while (proto) {
            if (HiddenProperty.$has(proto, $shrewdDecorators)) {
                let decorators = proto[$shrewdDecorators];
                for (let decorator of decorators) {
                    this._members.set(decorator.key, new decorator.type(this._parent, decorator));
                }
            }
            proto = Object.getPrototypeOf(proto);
        }
        this._initialized = true;
    }
}
var _a;
"use strict";
const $dependencyLevel = Symbol("Dependency Level");
class Observable {
    constructor() {
        this[_a] = 0;
        this._subscribers = new Set();
    }
    static $validate(newValue, oldValue, validator, thisArg) {
        if (typeof newValue == "object" && HiddenProperty.$has(newValue, $observableHelper))
            Observable._validationTarget = newValue[$observableHelper];
        let result = validator.apply(thisArg, [newValue, oldValue]);
        Observable._validationTarget = null;
        return result;
    }
    static $isWritable(observable) {
        if (Core.$committing && Observable._validationTarget != observable) {
            if (Observable._validationTarget != null) {
                console.warn("For safety reasons, during validation only the value itself can be modified, not including descendant Observables.");
            }
            else {
                console.warn("Writing into Observables during committing is forbidden; use computed property instead.");
            }
            return false;
        }
        return true;
    }
    static $publish(observable) {
        for (let observer of observable._subscribers)
            observer.$notified();
    }
    $subscribe(observer) {
        this._subscribers.add(observer);
    }
    $unsubscribe(observer) {
        this._subscribers.delete(observer);
    }
    get $hasSubscriber() {
        return this._subscribers.size > 0;
    }
}
_a = $dependencyLevel;
Observable._validationTarget = null;
class HiddenProperty {
    static $has(target, prop) {
        return Object.prototype.hasOwnProperty.call(target, prop);
    }
    static $add(target, prop, value) {
        Object.defineProperty(target, prop, {
            enumerable: false,
            writable: false,
            configurable: false,
            value
        });
    }
}
class BaseProxyHandler {
    isExtensible(target) {
        return false;
    }
}
class Observer extends Observable {
    constructor() {
        super(...arguments);
        this._reference = new Set();
        this._rendering = false;
        this._updated = false;
    }
    static $refer(observable) {
        if (Observer._currentTarget && Observer._currentTarget != observable)
            Observer._currentTarget.$refer(observable);
    }
    static $render(observer) {
        let lastTarget = Observer._currentTarget;
        Observer._currentTarget = observer;
        observer._rendering = true;
        if (!Core.$committing)
            Core.$unqueue(observer);
        for (let observable of observer._reference)
            observable.$unsubscribe(observer);
        observer._reference.clear();
        observer[$dependencyLevel] = 0;
        let result;
        if (observer.$shouldRender) {
            result = observer.$render();
            observer._updated = true;
        }
        for (let observable of observer._reference) {
            if (observer[$dependencyLevel] <= observable[$dependencyLevel]) {
                observer[$dependencyLevel] = observable[$dependencyLevel] + 1;
            }
        }
        observer._rendering = false;
        Observer._currentTarget = lastTarget;
        return result;
    }
    $notified() {
        this._updated = false;
        Core.$queue(this);
    }
    get $updated() { return this._updated; }
    get $rendering() { return this._rendering; }
    get $shouldRender() { return true; }
    $refer(observable) {
        if (!this._reference.has(observable)) {
            this._reference.add(observable);
            observable.$subscribe(this);
        }
    }
}
Observer._currentTarget = null;
const $observableHelper = Symbol("Observable Helper");
class Helper extends Observable {
    constructor(target, handler) {
        super();
        HiddenProperty.$add(target, $observableHelper, this);
        this._proxy = new Proxy(target, handler);
    }
    static $wrap(value) {
        if (typeof value == "object" && !HiddenProperty.$has(value, $observableHelper)) {
            switch (Object.getPrototypeOf(value)) {
                case Array.prototype:
                    value = new ArrayHelper(value).$proxy;
                    break;
                case Set.prototype:
                    value = new SetHelper(value).$proxy;
                    break;
                case Map.prototype:
                    value = new MapHelper(value).$proxy;
                    break;
                case Object.prototype:
                    value = new ObjectHelper(value).$proxy;
                    break;
            }
        }
        return value;
    }
    get $proxy() { return this._proxy; }
}
class CollectionProxyHandler extends BaseProxyHandler {
    get(target, prop, receiver) {
        let ob = target[$observableHelper];
        let result = Reflect.get(target, prop);
        if (typeof result == "function") {
            result = this._method.bind({
                prop: prop,
                target: target,
                method: result.bind(target),
                helper: ob,
                receiver: receiver
            });
        }
        if (prop == "size")
            Observer.$refer(target[$observableHelper]);
        return result;
    }
    _method(...args) {
        switch (this.prop) {
            case "clear":
                if (Observer.$isWritable(this.helper) && this.target.size > 0) {
                    this.target.clear();
                    Observable.$publish(this.helper);
                }
                return;
            case "delete":
                if (Observer.$isWritable(this.helper) && this.target.has(args[0])) {
                    this.target.delete(args[0]);
                    Observable.$publish(this.helper);
                }
                return;
            case Symbol.iterator:
            case "entries":
            case "forEach":
            case "has":
            case "keys":
            case "values":
                Observer.$refer(this.helper);
            default:
                return this.method(...args);
        }
    }
}
class DecoratedMemeber extends Observer {
    constructor(parent, descriptor) {
        super();
        this._parent = parent;
        this._name = descriptor.name;
    }
    get [Symbol.toStringTag]() { return this._name; }
}
class ObjectProxyHandler extends BaseProxyHandler {
    has(target, prop) {
        Observer.$refer(target[$observableHelper]);
        return Reflect.has(target, prop);
    }
    get(target, prop, receiver) {
        Observer.$refer(target[$observableHelper]);
        return Reflect.get(target, prop, receiver);
    }
    set(target, prop, value, receiver) {
        let ob = target[$observableHelper];
        if (Observable.$isWritable(ob)) {
            let old = Reflect.get(target, prop, receiver);
            if (value !== old) {
                Reflect.set(target, prop, Helper.$wrap(value), receiver);
                Observable.$publish(ob);
            }
            return true;
        }
        else
            return true;
    }
    deleteProperty(target, prop) {
        let ob = target[$observableHelper];
        if (Observable.$isWritable(ob)) {
            let result = Reflect.deleteProperty(target, prop);
            if (result)
                Observable.$publish(ob);
            return result;
        }
        else
            return true;
    }
}
class ObjectHelper extends Helper {
    constructor(target) {
        super(target, ObjectHelper._handler);
    }
}
ObjectHelper._handler = new ObjectProxyHandler();
class SetProxyHandler extends CollectionProxyHandler {
    _method(...args) {
        if (this.prop == "add") {
            if (Observer.$isWritable(this.helper) && !this.target.has(args[0])) {
                this.target.add(Helper.$wrap(args[0]));
                Observable.$publish(this.helper);
            }
            return this.receiver;
        }
        return super._method.apply(this, args);
    }
}
class SetHelper extends Helper {
    constructor(set) {
        super(set, SetHelper._handler);
    }
}
SetHelper._handler = new SetProxyHandler();
class MapProxyHandler extends CollectionProxyHandler {
    _method(...args) {
        if (this.prop == "set") {
            if (Observer.$isWritable(this.helper) && !this.target.has(args[0])) {
                this.target.set(args[0], Helper.$wrap(args[1]));
                Observable.$publish(this.helper);
            }
            return this.receiver;
        }
        return super._method.apply(this, args);
    }
}
class MapHelper extends Helper {
    constructor(map) {
        super(map, MapHelper._handler);
    }
}
MapHelper._handler = new MapProxyHandler();
class ComputedProperty extends DecoratedMemeber {
    constructor(parent, descriptor) {
        super(parent, descriptor);
        this._getter = descriptor.method;
    }
    $refer(observable) {
        if (this.$hasSubscriber)
            super.$refer(observable);
    }
    get $shouldRender() {
        return !Core.$committing || this.$hasSubscriber;
    }
    $render() {
        let value = this._getter.apply(this._parent);
        if (value != this._value) {
            this._value = value;
            Observable.$publish(this);
        }
    }
    $getter() {
        Observer.$refer(this);
        if (!this.$updated || !Core.$committing)
            Observer.$render(this);
        return this._value;
    }
}
class ObservableProperty extends DecoratedMemeber {
    constructor(parent, descriptor) {
        super(parent, descriptor);
        this._validator = descriptor.validator || ObservableProperty._defaultValidator;
        Object.defineProperty(parent, descriptor.key, ObservableProperty.interceptor(descriptor.key));
    }
    static interceptor(key) {
        return ObservableProperty._interceptor[key] = ObservableProperty._interceptor[key] || {
            get() { return ShrewdObject.get(this).$getMember(key).$getter(); },
            set(value) { ShrewdObject.get(this).$getMember(key).$setter(value); }
        };
    }
    $getter() {
        Observer.$refer(this);
        if (!this.$updated)
            Observer.$render(this);
        return this._outputValue;
    }
    $setter(value) {
        if (Observable.$isWritable(this) && value != this._inputValue) {
            this._inputValue = Helper.$wrap(value);
            Observer.$render(this);
        }
    }
    $render() {
        let value = Observable.$validate(this._inputValue, this._outputValue, this._validator, this._parent);
        if (value !== this._outputValue) {
            this._outputValue = Helper.$wrap(value);
            Observable.$publish(this);
        }
    }
}
ObservableProperty._interceptor = {};
ObservableProperty._defaultValidator = (value) => value;
class ReactiveMethod extends DecoratedMemeber {
    constructor(parent, descriptor) {
        super(parent, descriptor);
        this._method = descriptor.method;
    }
    $getter() {
        Observer.$refer(this);
        if (Core.$committing && this.$updated)
            return () => this._result;
        else
            return () => Observer.$render(this);
    }
    $render() {
        this._result = this._method.apply(this._parent);
        Observable.$publish(this);
        return this._result;
    }
}
class ArrayProxyHandler extends ObjectProxyHandler {
    get(target, prop, receiver) {
        if (prop == "length" ||
            typeof prop == "symbol" || typeof prop == "number" ||
            typeof prop == "string" && prop.match(/^\d+$/)) {
            Observer.$refer(target[$observableHelper]);
        }
        return Reflect.get(target, prop, receiver);
    }
}
class ArrayHelper extends Helper {
    constructor(arr) {
        super(arr, ArrayHelper._handler);
    }
}
ArrayHelper._handler = new ArrayProxyHandler();
const Shrewd = {
    SetupError,
    observable: Decorators.$observable,
    computed: Decorators.$computed,
    reactive: Decorators.$reactive,
    commit: Core.$commit
};

return Shrewd;
}));
