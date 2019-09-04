/**
 * shrewd v0.0.0-beta.6
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
        Core._tick++;
        Core._commiting = true;
        for (let i = 0; i < Core._queue.length; i++)
            if (Core._queue[i]) {
                for (let observer of Core._queue[i])
                    Observer.$render(observer);
            }
        Core._queue = [];
        Core._commiting = false;
    }
    static get $tick() { return Core._commiting ? Core._tick : -1; }
    static get $committing() { return Core._commiting; }
    static $queue(observer) {
        let level = observer[$dependencyLevel];
        Core._queue[level] = Core._queue[level] || new Set();
        Core._queue[level].add(observer);
    }
}
Core._tick = 0;
Core._queue = [];
Core._commiting = false;
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
        this._observers = new Set();
    }
    static get $writable() {
        if (Core.$committing) {
            console.warn("Writing into Observables during committing is forbidden; use computed property instead.");
            return false;
        }
        return true;
    }
    $subscribe(observer) {
        this._observers.add(observer);
    }
    $unsubscribe(observer) {
        this._observers.delete(observer);
    }
    $notify() {
        for (let observer of this._observers)
            Core.$queue(observer);
    }
}
_a = $dependencyLevel;
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
class Observer extends Observable {
    constructor() {
        super(...arguments);
        this._reference = new Set();
    }
    static $refer(observable) {
        if (Observer._currentTarget)
            Observer._currentTarget._reference.add(observable);
    }
    static $render(observer) {
        let lastTarget = Observer._currentTarget;
        Observer._currentTarget = observer;
        for (let observable of observer._reference)
            observable.$unsubscribe(observer);
        observer._reference.clear();
        observer[$dependencyLevel] = 0;
        let result = observer.$render();
        for (let observable of observer._reference) {
            observable.$subscribe(observer);
            if (observable[$dependencyLevel] >= observer[$dependencyLevel]) {
                observer[$dependencyLevel] = observable[$dependencyLevel] + 1;
            }
        }
        Observer._currentTarget = lastTarget;
        return result;
    }
}
Observer._currentTarget = null;
class DecoratedMemeber extends Observer {
    constructor(parent, descriptor) {
        super();
        this._parent = parent;
        this._name = descriptor.name;
    }
    get [Symbol.toStringTag]() { return this._name; }
}
class ComputedProperty extends DecoratedMemeber {
    constructor(parent, descriptor) {
        super(parent, descriptor);
        this._initialized = false;
        this._getter = descriptor.method;
    }
    $render() {
        let value = this._getter.apply(this._parent);
        if (value != this._value) {
            this._value = value;
            this.$notify();
        }
    }
    $getter() {
        Observer.$refer(this);
        if (!this._initialized) {
            Observer.$render(this);
            this._initialized = true;
        }
        return this._value;
    }
}
class ObservableProperty extends DecoratedMemeber {
    constructor(parent, descriptor) {
        super(parent, descriptor);
        this._initialized = false;
        this._validator = descriptor.validator || ObservableProperty._defaultValidator;
        Object.defineProperty(parent, descriptor.key, ObservableProperty.interceptor(descriptor.key));
    }
    static interceptor(key) {
        return ObservableProperty._interceptor[key] = ObservableProperty._interceptor[key] || {
            get() { return ShrewdObject.get(this).$getMember(key).$getter(); },
            set(value) { ShrewdObject.get(this).$getMember(key).$setter(value); }
        };
    }
    $initialize() {
        Observer.$render(this);
        this._initialized = true;
    }
    $getter() {
        if (!this._initialized)
            this.$initialize();
        Observer.$refer(this);
        return this._outputValue;
    }
    $setter(value) {
        if (Observable.$writable && value != this._inputValue) {
            this._inputValue = value;
            if (this._initialized)
                this.$render();
            else
                this.$initialize();
        }
    }
    $render() {
        let value = this._validator.apply(this._parent, [this._inputValue]);
        if (value !== this._outputValue) {
            this._outputValue = value;
            this.$notify();
        }
    }
}
ObservableProperty._interceptor = {};
ObservableProperty._defaultValidator = (value) => value;
class ReactiveMethod extends DecoratedMemeber {
    constructor(parent, descriptor) {
        super(parent, descriptor);
        this._tick = 0;
        this._method = descriptor.method;
    }
    $getter() {
        Observer.$refer(this);
        if (this._tick == Core.$tick)
            return () => this._result;
        else
            return () => Observer.$render(this);
    }
    $render() {
        this._result = this._method.apply(this._parent);
        this._tick = Core.$tick;
        this.$notify();
        return this._result;
    }
}
const Shrewd = {
    SetupError,
    observable: Decorators.$observable,
    computed: Decorators.$computed,
    reactive: Decorators.$reactive,
    commit: Core.$commit
};

return Shrewd;
}));
