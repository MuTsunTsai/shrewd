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
class Core {
    static $commit() {
        Global.$pushState({ $isCommitting: true });
        while (Core._queue.size > 0) {
            for (let observer of Core._queue)
                Observer.$render(observer);
        }
        Observer.$clearPending();
        Core._queue.clear();
        Global.$restore();
    }
    static _autoCommit() {
        Core.$commit();
        Core._promised = false;
    }
    static $unqueue(observer) {
        Core._queue.delete(observer);
    }
    static $queue(observer) {
        if (!observer.$isRendering)
            Core._queue.add(observer);
        if (!Core._promised) {
            let promise = Promise.resolve();
            promise.then(Core._autoCommit);
            Core._promised = true;
        }
    }
    static $construct(constructor, ...args) {
        Global.$pushState({
            $isConstructing: true,
            $isCommitting: false,
            $isActive: false,
            $target: null
        });
        let result = new constructor(...args);
        Global.$restore();
        return result;
    }
    static $terminate(target) {
        if (HiddenProperty.$has(target, $shrewdObject))
            target[$shrewdObject].$terminate();
    }
}
Core._queue = new Set();
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
    static $shrewd(a, b, c) {
        if (typeof b == "undefined") {
            return ((proto, prop) => Decorators.$observable(proto, prop, a));
        }
        else if (typeof b == "string") {
            let descriptor = c || Object.getOwnPropertyDescriptor(a, b);
            if (!descriptor) {
                return Decorators.$observable(a, b);
            }
            else if (descriptor.get && !descriptor.set) {
                return Decorators.$computed(a, b, descriptor);
            }
            else if (typeof (descriptor.value) == "function") {
                return Decorators.$reactive(a, b, descriptor);
            }
        }
        console.warn(`Setup error at ${a.constructor.name}[${b.toString()}]. ` +
            "Decorated member must be one of the following: a field, a readonly get accessor, or a method.");
    }
    static $observable(proto, prop, option) {
        let descriptor = Object.getOwnPropertyDescriptor(proto, prop);
        if (descriptor) {
            console.warn(`Setup error at ${proto.constructor.name}[${prop.toString()}]. ` +
                "Decorated property is not a field.");
            return;
        }
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
        this._isTerminated = false;
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
        if (this._isTerminated)
            return;
        for (let memeber of this._members.values())
            memeber.$terminate();
        this._isTerminated = true;
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
class Observable {
    constructor() {
        this._subscribers = new Set();
    }
    static $isWritable(observable) {
        if (Global.$isConstructing || !observable.$hasSubscriber)
            return true;
        if (ObservableProperty.$isRendering && !ObservableProperty.$isAccessible(observable)) {
            console.warn("Inside a renderer function, only the objects owned by the ObservableProperty can be written.");
            return false;
        }
        if (!ObservableProperty.$isRendering && Global.$isCommitting) {
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
    }
    $unsubscribe(observer) {
        this._subscribers.delete(observer);
    }
    get $hasSubscriber() {
        return this._subscribers.size > 0;
    }
    get $subscribers() {
        return this._subscribers.values();
    }
}
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
var ObserverState;
(function (ObserverState) {
    ObserverState[ObserverState["$outdated"] = 0] = "$outdated";
    ObserverState[ObserverState["$updated"] = 1] = "$updated";
    ObserverState[ObserverState["$pending"] = 2] = "$pending";
})(ObserverState || (ObserverState = {}));
class Observer extends Observable {
    constructor(name) {
        super();
        this._reference = new Set();
        this._isRendering = false;
        this._state = ObserverState.$outdated;
        this._isTerminated = false;
        this._name = name;
    }
    static $clearPending() {
        for (let pending of Observer._pending) {
            if (pending._state == ObserverState.$pending)
                pending._update();
        }
        Observer._pending.clear();
    }
    static $refer(observable) {
        let target = Global.$target;
        if (target && target != observable && !target._isTerminated)
            target._reference.add(observable);
    }
    static $checkDeadEnd(observable) {
        if (observable instanceof Observer && !observable._isActive) {
            let oldReferences = new Set(observable._reference);
            observable.$clearReference();
            Core.$unqueue(observable);
            observable._state = ObserverState.$outdated;
            for (let ref of oldReferences)
                Observer.$checkDeadEnd(ref);
        }
    }
    static $render(observer) {
        Global.$pushState({
            $isConstructing: false,
            $target: observer,
            $isActive: Global.$isActive || observer._isActive
        });
        observer._isRendering = true;
        Core.$unqueue(observer);
        let oldReferences = new Set(observer._reference);
        observer.$clearReference();
        let result = observer.$render();
        if (Global.$isActive)
            observer._update();
        if (!observer._isTerminated) {
            for (let observable of observer._reference) {
                oldReferences.delete(observable);
                if (Global.$isActive)
                    observable.$subscribe(observer);
            }
        }
        for (let observable of oldReferences)
            Observer.$checkDeadEnd(observable);
        observer._isRendering = false;
        Global.$restore();
        return result;
    }
    get $isRendering() { return this._isRendering; }
    $notified() {
        this._pend();
        this._state = ObserverState.$outdated;
        Core.$queue(this);
    }
    $terminate() {
        if (this._isTerminated)
            return;
        this.$clearReference();
        this._update();
        this._isTerminated = true;
    }
    _pend() {
        if (this._state == ObserverState.$updated) {
            this._state = ObserverState.$pending;
            Observer._pending.add(this);
            for (let subscriber of this.$subscribers)
                subscriber._pend();
        }
    }
    _determineState() {
        if (this.$isRendering) {
            let last = Observer._trace.indexOf(this);
            let cycle = [this, ...Observer._trace.slice(last + 1), this];
            cycle.forEach(o => o.$terminate());
            let trace = cycle.map(o => o._name).join(" => ");
            console.warn("Circular dependency detected: " + trace + "\nAll these observers will be terminated.");
        }
        if (this._state == ObserverState.$updated)
            return;
        Observer._trace.push(this);
        for (let ref of this._reference) {
            if (ref instanceof Observer) {
                if (ref._isRendering)
                    Observer.$render(this);
                else if (ref._state != ObserverState.$updated)
                    ref._determineState();
            }
        }
        if (this._state == ObserverState.$outdated)
            Observer.$render(this);
        else {
            Observer._pending.delete(this);
            this._update();
        }
        Observer._trace.pop();
    }
    _update() { this._state = ObserverState.$updated; }
    get _isPending() { return this._state == ObserverState.$pending; }
    get _isActive() { return this.$hasSubscriber; }
    $clearReference() {
        for (let observable of this._reference)
            observable.$unsubscribe(this);
        this._reference.clear();
    }
    get $isTerminated() { return this._isTerminated; }
}
Observer._pending = new Set();
Observer._trace = [];
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
        super(descriptor.$name);
        this._parent = parent;
    }
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
        if (!this.$isTerminated) {
            Observer.$refer(this);
            this._determineState();
        }
        else {
            this._value = this._getter.apply(this._parent);
        }
        return this._value;
    }
}
class ObservableProperty extends DecoratedMemeber {
    constructor(parent, descriptor) {
        super(parent, descriptor);
        this._option = descriptor.$option || {};
        Object.defineProperty(parent, descriptor.$key, ObservableProperty.$interceptor(descriptor.$key));
        if (!this._option.renderer)
            this._update();
    }
    static $interceptor(key) {
        return ObservableProperty._interceptor[key] = ObservableProperty._interceptor[key] || {
            get() { return ShrewdObject.get(this).$getMember(key).$getter(); },
            set(value) { ShrewdObject.get(this).$getMember(key).$setter(value); }
        };
    }
    static get $isRendering() { return ObservableProperty._isRendering; }
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
    static $isAccessible(observable) {
        return ObservableProperty._accessibles.has(observable);
    }
    $getter() {
        if (!this.$isTerminated) {
            Observer.$refer(this);
            if (this._option.renderer)
                this._determineState();
        }
        return this._outputValue;
    }
    $setter(value) {
        if (this.$isTerminated) {
            this._outputValue = value;
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
        ObservableProperty._isRendering = true;
        ObservableProperty.$setAccessible(this._inputValue);
        let value = this._option.renderer.apply(this._parent, [this._inputValue]);
        ObservableProperty._accessibles.clear();
        ObservableProperty._isRendering = false;
        if (value !== this._outputValue)
            this.$publish(Helper.$wrap(value));
    }
    $publish(value) {
        this._outputValue = value;
        Observable.$publish(this);
    }
    $terminate() {
        if (this.$isTerminated)
            return;
        delete this._inputValue;
        delete this._option;
        super.$terminate();
    }
}
ObservableProperty._interceptor = {};
ObservableProperty._isRendering = false;
ObservableProperty._accessibles = new Set();
class ReactiveMethod extends DecoratedMemeber {
    constructor(parent, descriptor) {
        super(parent, descriptor);
        this._method = descriptor.$method;
    }
    get _isActive() { return true; }
    $getter() {
        if (!this.$isTerminated) {
            Observer.$refer(this);
            if (!Global.$isCommitting && !this._isPending)
                return () => Observer.$render(this);
            return () => {
                this._determineState();
                return this._result;
            };
        }
        else {
            return () => this._method.apply(this._parent);
        }
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
    shrewd: Decorators.$shrewd,
    decorate: null,
    commit: Core.$commit,
    construct: Core.$construct,
    terminate: Core.$terminate
};
class Global {
    static $pushState(state) {
        Global._history.push(Global._state);
        Global._state = Object.assign({}, Global._state, state);
    }
    static $restore() {
        Global._state = Global._history.pop();
    }
    static get $isCommitting() { return Global._state.$isCommitting; }
    static get $isConstructing() { return Global._state.$isConstructing; }
    static get $isActive() { return Global._state.$isActive; }
    static get $target() { return Global._state.$target; }
}
Global._state = {
    $isCommitting: false,
    $isConstructing: false,
    $isActive: false,
    $target: null
};
Global._history = [];

return Shrewd;
}));
