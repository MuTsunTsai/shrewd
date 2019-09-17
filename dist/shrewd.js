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
        let oldState = Global.$pushState({ $committing: true });
        for (let i = 0; i < Core._queue.length; i++)
            if (Core._queue[i]) {
                for (let observer of Core._queue[i])
                    Observer.$render(observer);
            }
        Core._queue = [];
        Global.$restore(oldState);
    }
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
    static $construct(constructor, ...args) {
        let oldState = Global.$pushState({
            $constructing: true,
            $committing: false,
            $active: false,
            $target: null
        });
        let result = new constructor(...args);
        Global.$restore(oldState);
        return result;
    }
}
Core._queue = [];
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
    static $observableFactory(proto, prop, option) {
        let descriptor = Object.getOwnPropertyDescriptor(proto, prop);
        if (descriptor)
            throw new SetupError(proto, prop, "Decorated property is not a field.");
        Decorators.get(proto).push({
            $key: prop,
            $name: proto.constructor.name + "." + prop.toString(),
            $constructor: ObservableProperty,
            $option: option
        });
        Object.defineProperty(proto, prop, {
            get() {
                ShrewdObject.get(this);
                return this[prop];
            },
            set(value) {
                ShrewdObject.get(this);
                this[prop] = value;
            }
        });
    }
    static $computed(proto, prop, descriptor) {
        if (!descriptor || !descriptor.get)
            throw new SetupError(proto, prop, "Decorated property has no getter.");
        if (descriptor.set)
            throw new SetupError(proto, prop, "Decorated property is not readonly.");
        let name = proto.constructor.name + "." + prop.toString();
        Decorators.get(proto).push({
            $key: name,
            $name: name,
            $constructor: ComputedProperty,
            $method: descriptor.get
        });
        descriptor.get = function () {
            return ShrewdObject.get(this).$getMember(name).$getter();
        };
        return descriptor;
    }
    static $reactive(proto, prop, descriptor) {
        if (!descriptor || typeof (descriptor.value) != "function") {
            throw new SetupError(proto, prop, "Decorated member is not a method.");
        }
        let name = proto.constructor.name + "." + prop.toString();
        Decorators.get(proto).push({
            $key: name,
            $name: name,
            $constructor: ReactiveMethod,
            $method: descriptor.value
        });
        delete descriptor.value;
        delete descriptor.writable;
        descriptor.get = function () {
            return ShrewdObject.get(this).$getMember(name).$getter();
        };
        return descriptor;
    }
}
const $shrewdObject = Symbol("ShrewdObject");
class ShrewdObject {
    constructor(parent) {
        this._terminated = false;
        this._members = new Map();
        this._parent = HiddenProperty.$add(parent, $shrewdObject, this);
        let proto = Object.getPrototypeOf(this._parent);
        while (proto) {
            if (HiddenProperty.$has(proto, $shrewdDecorators)) {
                let decorators = proto[$shrewdDecorators];
                for (let decorator of decorators) {
                    this._members.set(decorator.$key, new decorator.$constructor(this._parent, decorator));
                }
            }
            proto = Object.getPrototypeOf(proto);
        }
    }
    static get(target) {
        if (HiddenProperty.$has(target, $shrewdObject))
            return target[$shrewdObject];
        else
            return new ShrewdObject(target);
    }
    $terminate() {
        if (this._terminated)
            return;
        for (let memeber of this._members.values())
            memeber.$terminate();
        this._terminated = true;
    }
    $getMember(key) {
        return this._members.get(key);
    }
    get $observables() {
        let result = [];
        for (let member of this._members.values())
            if (member instanceof ObservableProperty)
                result.push(member);
        return result;
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
    static $isWritable(observable) {
        if (Global.$constructing || !observable.$hasSubscriber)
            return true;
        if (ObservableProperty.$rendering && !ObservableProperty.$accessible(observable)) {
            console.warn("Inside a renderer function, only the objects owned by the ObservableProperty can be written.");
            return false;
        }
        if (!ObservableProperty.$rendering && Global.$committing) {
            console.warn("Writing into Observables is not allowed inside a ComputedProperty or a ReactiveMethod. For self-correcting behavior, use the renderer option of the ObservableProperty. For constructing new Shrewd objects, use Shrewd.construct() method.");
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
        if (observer[$dependencyLevel] <= this[$dependencyLevel]) {
            observer[$dependencyLevel] = this[$dependencyLevel] + 1;
        }
    }
    $unsubscribe(observer) {
        this._subscribers.delete(observer);
    }
    get $hasSubscriber() {
        return this._subscribers.size > 0;
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
        return target;
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
        this._terminated = false;
    }
    static $refer(observable) {
        let target = Global.$target;
        if (target && target != observable && !target._terminated)
            target._reference.add(observable);
    }
    static $checkDeadEnd(observable) {
        if (observable instanceof Observer && !(observable instanceof ReactiveMethod) && !observable.$hasSubscriber) {
            let oldReferences = new Set(observable._reference);
            observable.$clearReference();
            observable._updated = false;
            for (let ref of oldReferences)
                this.$checkDeadEnd(ref);
        }
    }
    static $render(observer) {
        let oldState = Global.$pushState({
            $constructing: false,
            $target: observer,
            $active: Global.$active
                || observer instanceof ReactiveMethod
                || observer.$hasSubscriber
        });
        observer._rendering = true;
        if (!Global.$committing)
            Core.$unqueue(observer);
        let oldReferences = new Set(observer._reference);
        observer.$clearReference();
        let result = observer.$render();
        if (Global.$active)
            observer._updated = true;
        if (!observer._terminated) {
            for (let observable of observer._reference) {
                oldReferences.delete(observable);
                if (Global.$active)
                    observable.$subscribe(observer);
            }
        }
        for (let observable of oldReferences)
            Observer.$checkDeadEnd(observable);
        observer._rendering = false;
        Global.$restore(oldState);
        return result;
    }
    $notified() {
        this._updated = false;
        Core.$queue(this);
    }
    get $updated() { return this._updated; }
    get $rendering() { return this._rendering; }
    $clearReference() {
        for (let observable of this._reference)
            observable.$unsubscribe(this);
        this._reference.clear();
        this[$dependencyLevel] = 0;
    }
    $terminate() {
        if (this._terminated)
            return;
        this.$clearReference();
        this._terminated = true;
    }
    get $terminated() { return this._terminated; }
}
const $observableHelper = Symbol("Observable Helper");
class Helper extends Observable {
    constructor(target, handler) {
        super();
        this._target = HiddenProperty.$add(target, $observableHelper, this);
        this._proxy = new Proxy(target, handler);
        Helper._proxyMap.set(target, this._proxy);
    }
    static $wrap(value) {
        if (typeof value != "object")
            return value;
        if (Helper._proxyMap.has(value))
            return Helper._proxyMap.get(value);
        if (!Helper.$hasHelper(value)) {
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
    static $hasHelper(value) {
        return typeof value == "object" && HiddenProperty.$has(value, $observableHelper);
    }
    get $proxy() { return this._proxy; }
}
Helper._proxyMap = new WeakMap();
class CollectionProxyHandler extends BaseProxyHandler {
    get(target, prop, receiver) {
        let ob = target[$observableHelper];
        let result = Reflect.get(target, prop);
        if (typeof result == "function") {
            result = this._method.bind({
                $prop: prop,
                $target: target,
                $method: result.bind(target),
                $helper: ob,
                $receiver: receiver
            });
        }
        if (prop == "size")
            Observer.$refer(target[$observableHelper]);
        return result;
    }
    _method(...args) {
        switch (this.$prop) {
            case "clear":
                if (Observer.$isWritable(this.$helper) && this.$target.size > 0) {
                    this.$target.clear();
                    Observable.$publish(this.$helper);
                }
                return;
            case "delete":
                if (Observer.$isWritable(this.$helper) && this.$target.has(args[0])) {
                    this.$target.delete(args[0]);
                    Observable.$publish(this.$helper);
                }
                return;
            case Symbol.iterator:
            case "entries":
            case "forEach":
            case "has":
            case "keys":
            case "values":
                Observer.$refer(this.$helper);
            default:
                return this.$method(...args);
        }
    }
}
class DecoratedMemeber extends Observer {
    constructor(parent, descriptor) {
        super();
        this._parent = parent;
        this._name = descriptor.$name;
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
        let result = Reflect.get(target, prop, receiver);
        return result;
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
        for (let key in target)
            target[key] = Helper.$wrap(target[key]);
        super(target, ObjectHelper._handler);
    }
    get $child() {
        let result = [];
        for (let key in this._target) {
            let value = this._target[key];
            if (typeof value == "object")
                result.push(value);
        }
        return result;
    }
}
ObjectHelper._handler = new ObjectProxyHandler();
class SetProxyHandler extends CollectionProxyHandler {
    _method(...args) {
        if (this.$prop == "add") {
            if (Observer.$isWritable(this.$helper) && !this.$target.has(args[0])) {
                this.$target.add(Helper.$wrap(args[0]));
                Observable.$publish(this.$helper);
            }
            return this.$receiver;
        }
        return super._method.apply(this, args);
    }
}
class SetHelper extends Helper {
    constructor(set) {
        for (let value of set) {
            set.delete(value);
            set.add(Helper.$wrap(value));
        }
        super(set, SetHelper._handler);
    }
    get $child() {
        let result = [];
        for (let value of this._target) {
            if (typeof value == "object")
                result.push(value);
        }
        return result;
    }
}
SetHelper._handler = new SetProxyHandler();
class MapProxyHandler extends CollectionProxyHandler {
    _method(...args) {
        if (this.$prop == "set") {
            if (Observer.$isWritable(this.$helper) && !this.$target.has(args[0])) {
                this.$target.set(args[0], Helper.$wrap(args[1]));
                Observable.$publish(this.$helper);
            }
            return this.$receiver;
        }
        return super._method.apply(this, args);
    }
}
class MapHelper extends Helper {
    constructor(map) {
        for (let [key, value] of map)
            map.set(key, Helper.$wrap(value));
        super(map, MapHelper._handler);
    }
    get $child() {
        let result = [];
        for (let [key, value] of this._target) {
            if (typeof key == "object")
                result.push(key);
            if (typeof value == "object")
                result.push(value);
        }
        return result;
    }
}
MapHelper._handler = new MapProxyHandler();
class ComputedProperty extends DecoratedMemeber {
    constructor(parent, descriptor) {
        super(parent, descriptor);
        this._getter = descriptor.$method;
    }
    $render() {
        let value = this._getter.apply(this._parent);
        if (value != this._value) {
            this._value = value;
            Observable.$publish(this);
        }
    }
    $getter() {
        if (!this.$terminated) {
            Observer.$refer(this);
            if (!this.$updated)
                Observer.$render(this);
        }
        return this._value;
    }
}
class ObservableProperty extends DecoratedMemeber {
    constructor(parent, descriptor) {
        super(parent, descriptor);
        this._option = descriptor.$option || {};
        Object.defineProperty(parent, descriptor.$key, ObservableProperty.$interceptor(descriptor.$key));
    }
    static $interceptor(key) {
        return ObservableProperty._interceptor[key] = ObservableProperty._interceptor[key] || {
            get() { return ShrewdObject.get(this).$getMember(key).$getter(); },
            set(value) { ShrewdObject.get(this).$getMember(key).$setter(value); }
        };
    }
    static get $rendering() { return ObservableProperty._rendering; }
    static $setAccessible(target) {
        if (typeof target != "object")
            return;
        if (Helper.$hasHelper(target)) {
            if (!ObservableProperty._accessibles.has(target[$observableHelper])) {
                ObservableProperty._accessibles.add(target[$observableHelper]);
                for (let child of target[$observableHelper].$child)
                    ObservableProperty.$setAccessible(child);
            }
        }
        else if (HiddenProperty.$has(target, $shrewdObject)) {
            for (let obp of ShrewdObject.get(target).$observables) {
                if (!ObservableProperty._accessibles.has(obp)) {
                    ObservableProperty._accessibles.add(obp);
                    ObservableProperty.$setAccessible(obp._outputValue);
                }
            }
        }
    }
    static $accessible(observable) {
        return ObservableProperty._accessibles.has(observable);
    }
    $getter() {
        if (!this.$terminated) {
            Observer.$refer(this);
            if (this._option.renderer && !this.$updated)
                Observer.$render(this);
        }
        return this._outputValue;
    }
    $setter(value) {
        if (this.$terminated) {
            console.warn(`[${this._name}] has been terminated.`);
            return;
        }
        if (Observable.$isWritable(this) && value != this._inputValue) {
            if (this._option.validator && !this._option.validator.apply(this._parent, [value]))
                return;
            this._inputValue = Helper.$wrap(value);
            if (this._option.renderer)
                Observer.$render(this);
            else
                this.$publish(this._inputValue);
        }
    }
    $render() {
        ObservableProperty._rendering = true;
        ObservableProperty.$setAccessible(this._inputValue);
        let value = this._option.renderer.apply(this._parent, [this._inputValue]);
        ObservableProperty._accessibles.clear();
        ObservableProperty._rendering = false;
        if (value !== this._outputValue)
            this.$publish(Helper.$wrap(value));
    }
    $publish(value) {
        this._outputValue = value;
        Observable.$publish(this);
    }
}
ObservableProperty._interceptor = {};
ObservableProperty._rendering = false;
ObservableProperty._accessibles = new Set();
class ReactiveMethod extends DecoratedMemeber {
    constructor(parent, descriptor) {
        super(parent, descriptor);
        this._method = descriptor.$method;
    }
    $getter() {
        if (!this.$terminated) {
            Observer.$refer(this);
            if (!Global.$committing || !this.$updated)
                return () => Observer.$render(this);
        }
        return () => this._result;
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
        for (let i in arr)
            arr[i] = Helper.$wrap(arr[i]);
        super(arr, ArrayHelper._handler);
    }
    get $child() {
        let result = [];
        for (let value of this._target) {
            if (typeof value == "object")
                result.push(value);
        }
        return this._target;
    }
}
ArrayHelper._handler = new ArrayProxyHandler();
const Shrewd = {
    SetupError,
    observable: Decorators.$observable,
    computed: Decorators.$computed,
    reactive: Decorators.$reactive,
    commit: Core.$commit,
    construct: Core.$construct,
    terminate: function (target) {
        if (HiddenProperty.$has(target, $shrewdObject))
            target[$shrewdObject].$terminate();
    },
    Observer
};
class Global {
    static $pushState(state) {
        let old = Global._state;
        Global._state = Object.assign({}, Global._state, state);
        return old;
    }
    static $restore(state) {
        Global._state = state;
    }
    static get $committing() { return Global._state.$committing; }
    static get $constructing() { return Global._state.$constructing; }
    static get $active() { return Global._state.$active; }
    static get $target() { return Global._state.$target; }
}
Global._state = {
    $committing: false,
    $constructing: false,
    $active: false,
    $target: null
};

return Shrewd;
}));
