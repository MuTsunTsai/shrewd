/**
 * shrewd v0.0.0-beta.12
 * (c) 2019-2020 Mu-Tsun Tsai
 * Released under the MIT License.
 */
;
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof exports === 'object') {
        module.exports = factory();
    } else {
        root.Shrewd = factory();
    }
}(this, function () {
    'use strict';
    class Adapter {
        constructor(proto, prop, descriptor, options) {
            this._proto = proto;
            this._prop = prop;
            this._descriptor = descriptor;
            this._options = options;
        }
        get _name() {
            return this._proto.constructor.name + '.' + this._prop.toString();
        }
    }
    class Observable {
        constructor() {
            this._subscribers = new Set();
            this.$id = Observable._id++;
        }
        static $isWritable(observable) {
            if (Global.$isConstructing || !observable.$hasSubscriber)
                return true;
            if (Global.$isRenderingProperty && !Global.$isAccessible(observable)) {
                console.warn('Inside a renderer function, only the objects owned by the ObservableProperty can be written.');
                if (Core.$option.debug)
                    debugger;
                return false;
            }
            if (!Global.$isRenderingProperty && Global.$isCommitting) {
                console.warn('Writing into Observables is not allowed inside a ComputedProperty or a ReactiveMethod. For self-correcting behavior, use the renderer option of the ObservableProperty. For constructing new Shrewd objects, use Shrewd.construct() method.');
                if (Core.$option.debug)
                    debugger;
                return false;
            }
            return true;
        }
        static $publish(observable) {
            Core.$option.hook.write(observable.$id);
            for (let observer of observable._subscribers) {
                observer.$notified();
            }
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
    Observable._id = 0;
    class DefaultHook {
        read(id) {
        }
        write(id) {
        }
        gc() {
        }
        sub(id) {
            return false;
        }
    }
    class VueHook {
        constructor() {
            this._vue = new Vue({ data: { shrewd: {} } });
        }
        read(id) {
            this._vue.shrewd[id];
        }
        write(id) {
            Vue.set(this._vue.shrewd, id, {});
        }
        gc() {
            for (let id in this._vue.shrewd) {
                if (this._vue.shrewd[id].__ob__.dep.subs.length == 0)
                    Vue.delete(this._vue.shrewd, id);
            }
        }
        sub(id) {
            return id in this._vue.shrewd && this._vue.shrewd[id].__ob__.dep.subs.length > 0;
        }
    }
    class Core {
        static $commit() {
            Global.$pushState({ $isCommitting: true });
            try {
                for (let observer of Core._renderQueue) {
                    Observer.$render(observer);
                }
            } finally {
                for (let member of Core._initializeQueue) {
                    member.$initialize();
                }
                Core._initializeQueue.clear();
                Observer.$clearPending();
                Core._renderQueue.clear();
                Global.$restore();
                for (let shrewd of Core._terminateQueue) {
                    shrewd.$terminate();
                }
                Core._terminateQueue.clear();
                Core.$option.hook.gc();
            }
        }
        static $register(target) {
            Core._initializeQueue.add(target);
        }
        static _autoCommit() {
            Core.$commit();
            Core._promised = false;
        }
        static $unqueue(observer) {
            Core._renderQueue.delete(observer);
        }
        static $queue(observer) {
            if (!observer.$isRendering) {
                Core._renderQueue.add(observer);
            }
            if (Core.$option.autoCommit && !Core._promised) {
                let promise = Promise.resolve();
                promise.then(Core._autoCommit);
                Core._promised = true;
            }
        }
        static $construct(constructor, ...args) {
            Global.$pushState({
                $isConstructing: true,
                $isCommitting: false,
                $target: null
            });
            Observer.$trace.push('construct ' + constructor.name);
            try {
                return new constructor(...args);
            } finally {
                Observer.$trace.pop();
                Global.$restore();
            }
        }
        static $terminate(target, lazy = false) {
            if (HiddenProperty.$has(target, $shrewdObject)) {
                let shrewd = target[$shrewdObject];
                if (lazy) {
                    Core._terminateQueue.add(shrewd);
                } else {
                    shrewd.$terminate();
                }
            }
        }
    }
    Core.$option = {
        hook: new DefaultHook(),
        autoCommit: true,
        debug: true
    };
    Core._renderQueue = new Set();
    Core._terminateQueue = new Set();
    Core._initializeQueue = new Set();
    Core._promised = false;
    class Decorators {
        static get(proto) {
            if (HiddenProperty.$has(proto, $shrewdDecorators)) {
                return proto[$shrewdDecorators];
            } else {
                let decorators = [];
                HiddenProperty.$add(proto, $shrewdDecorators, decorators);
                return decorators;
            }
            ;
        }
        static $shrewd(a, b, c, d) {
            if (typeof b == 'undefined') {
                return (proto, prop, descriptor) => Decorators.$shrewd(proto, prop, descriptor, a);
            } else if (typeof b == 'string') {
                let descriptor = c || Object.getOwnPropertyDescriptor(a, b);
                if (!descriptor) {
                    return Decorators._setup(ObservablePropertyAdapter, a, b, undefined, d);
                } else if (descriptor.get && !descriptor.set) {
                    return Decorators._setup(ComputedPropertyAdapter, a, b, descriptor, d);
                } else if (typeof descriptor.value == 'function') {
                    return Decorators._setup(ReactiveMethodAdapter, a, b, descriptor, d);
                }
            }
            console.warn(`Setup error at ${ a.constructor.name }[${ b.toString() }]. ` + 'Decorated member must be one of the following: a field, a readonly get accessor, or a method.');
            if (Core.$option.debug)
                debugger;
        }
        static _setup(ctor, proto, prop, descriptor, option) {
            var adapter = new ctor(proto, prop, descriptor, option);
            if (adapter.$precondition && !adapter.$precondition())
                return;
            Decorators.get(proto).push(adapter.$decoratorDescriptor);
            return adapter.$setup();
        }
    }
    const $shrewdObject = Symbol('ShrewdObject');
    class ShrewdObject {
        constructor(parent) {
            this._isTerminated = false;
            this._members = new Map();
            this._parent = HiddenProperty.$add(parent, $shrewdObject, this);
            let proto = Object.getPrototypeOf(this._parent);
            while (proto) {
                if (HiddenProperty.$has(proto, $shrewdDecorators)) {
                    let decorators = proto[$shrewdDecorators];
                    for (let decorator of decorators)
                        this._setup(decorator);
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
        _setup(decorator) {
            this._members.set(decorator.$key, new decorator.$constructor(this._parent, decorator));
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
    class CollectionProxyHandler {
        get(target, prop, receiver) {
            let ob = target[$observableHelper];
            let result = Reflect.get(target, prop);
            if (typeof result == 'function') {
                result = this._method.bind({
                    $prop: prop,
                    $target: target,
                    $method: result.bind(target),
                    $helper: ob,
                    $receiver: receiver
                });
            }
            if (prop == 'size')
                Observer.$refer(target[$observableHelper]);
            return result;
        }
        _method(...args) {
            switch (this.$prop) {
            case 'clear':
                if (Observer.$isWritable(this.$helper) && this.$target.size > 0) {
                    this.$target.clear();
                    Observable.$publish(this.$helper);
                }
                return;
            case 'delete':
                if (Observer.$isWritable(this.$helper) && this.$target.has(args[0])) {
                    this.$target.delete(args[0]);
                    Observable.$publish(this.$helper);
                }
                return;
            case Symbol.iterator:
            case 'entries':
            case 'forEach':
            case 'has':
            case 'keys':
            case 'values':
                Observer.$refer(this.$helper);
            default:
                return this.$method(...args);
            }
        }
    }
    class ObservablePropertyAdapter extends Adapter {
        precondition() {
            let descriptor = Object.getOwnPropertyDescriptor(this._proto, this._prop);
            if (descriptor) {
                console.warn(`Setup error at ${ this._proto.constructor.name }[${ this._prop.toString() }]. ` + 'Decorated property is not a field.');
                if (Core.$option.debug)
                    debugger;
                return false;
            }
            return true;
        }
        get $decoratorDescriptor() {
            return {
                $key: this._prop,
                $name: this._name,
                $constructor: ObservableProperty,
                $option: this._options
            };
        }
        $setup() {
            var proto = this._proto, prop = this._prop;
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
    }
    var ObserverState;
    (function (ObserverState) {
        ObserverState[ObserverState['$outdated'] = 0] = '$outdated';
        ObserverState[ObserverState['$updated'] = 1] = '$updated';
        ObserverState[ObserverState['$pending'] = 2] = '$pending';
    }(ObserverState || (ObserverState = {})));
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
                if (pending._state == ObserverState.$pending && pending.$isActive) {
                    pending._update();
                    Observer._pending.delete(pending);
                }
            }
        }
        static $refer(observable) {
            if (observable instanceof Observer && observable._isTerminated)
                return;
            Core.$option.hook.read(observable.$id);
            let target = Global.$target;
            if (target && target != observable && !target._isTerminated) {
                target._reference.add(observable);
            }
        }
        static $checkDeadEnd(observable) {
            if (observable instanceof Observer && !observable._isTerminated) {
                observable._isActive = observable.checkActive();
                if (!observable.$isActive) {
                    let oldReferences = new Set(observable._reference);
                    Core.$unqueue(observable);
                    for (let ref of oldReferences) {
                        Observer.$checkDeadEnd(ref);
                    }
                }
            }
        }
        static $render(observer) {
            Global.$pushState({
                $isConstructing: false,
                $target: observer
            });
            observer._isRendering = true;
            Core.$unqueue(observer);
            try {
                let oldReferences = new Set(observer._reference);
                observer.$clearReference();
                let result = observer.$render();
                observer._update();
                if (!observer._isTerminated) {
                    for (let observable of observer._reference) {
                        oldReferences.delete(observable);
                        observable.$subscribe(observer);
                        if (observer.$isActive && observable instanceof Observer) {
                            observable.activate();
                        }
                    }
                }
                for (let observable of oldReferences) {
                    Observer.$checkDeadEnd(observable);
                }
                return result;
            } finally {
                observer._isRendering = false;
                Global.$restore();
            }
        }
        get $isRendering() {
            return this._isRendering;
        }
        $notified() {
            this._pend();
            this._outdate();
            if (this.$isActive) {
                Core.$queue(this);
            }
        }
        $terminate() {
            if (this._isTerminated)
                return;
            Core.$unqueue(this);
            Observer._pending.delete(this);
            this._isTerminated = true;
            this._onTerminate();
        }
        _onTerminate() {
            this.$clearReference();
            for (let subscriber of this.$subscribers) {
                subscriber._reference.delete(this);
                this.$unsubscribe(subscriber);
            }
            this._update();
            this._isRendering = false;
        }
        _pend() {
            if (this._state == ObserverState.$updated) {
                this._state = ObserverState.$pending;
                Observer._pending.add(this);
                for (let subscriber of this.$subscribers) {
                    subscriber._pend();
                }
            }
        }
        _determineStateAndRender(force = false) {
            if (this._isRendering)
                this._onCyclicDependencyFound();
            if (this._state == ObserverState.$updated)
                return;
            Observer.$trace.push(this);
            try {
                for (let ref of this._reference) {
                    if (ref instanceof Observer) {
                        if (ref._isRendering) {
                            Observer.$render(this);
                            break;
                        } else if (ref._state != ObserverState.$updated) {
                            ref._determineStateAndRender();
                        }
                    }
                }
                if (this._state == ObserverState.$outdated || force) {
                    Observer.$render(this);
                } else {
                    Observer._pending.delete(this);
                    this._update();
                }
            } finally {
                Observer.$trace.pop();
            }
        }
        _onCyclicDependencyFound() {
            let last = Observer.$trace.indexOf(this);
            let cycle = [
                this,
                ...Observer.$trace.slice(last + 1)
            ];
            cycle.forEach(o => o instanceof Observer && o.$terminate());
            cycle.push(this);
            let trace = cycle.map(o => typeof o == 'string' ? o : o._name).join(' => ');
            console.warn('Cyclic dependency detected: ' + trace + '\nAll these reactions will be terminated.');
            if (Core.$option.debug)
                debugger;
        }
        _update() {
            this._state = ObserverState.$updated;
        }
        _outdate() {
            this._state = ObserverState.$outdated;
        }
        get $state() {
            return this._state;
        }
        get $isActive() {
            return this._isActive = this._isActive != undefined ? this._isActive : this.checkActive();
        }
        checkActive() {
            if (Core.$option.hook.sub(this.$id))
                return true;
            for (let subscriber of this.$subscribers) {
                if (subscriber.$isActive)
                    return true;
            }
            return false;
        }
        activate() {
            if (this.$isActive)
                return;
            this._isActive = true;
            for (let observable of this._reference) {
                if (observable instanceof Observer)
                    observable.activate();
            }
        }
        $clearReference() {
            for (let observable of this._reference)
                observable.$unsubscribe(this);
            this._reference.clear();
        }
        get $isTerminated() {
            return this._isTerminated;
        }
    }
    Observer._pending = new Set();
    Observer.$trace = [];
    const $observableHelper = Symbol('Observable Helper');
    class Helper extends Observable {
        constructor(target, handler) {
            super();
            this._target = HiddenProperty.$add(target, $observableHelper, this);
            this._proxy = new Proxy(target, handler);
            Helper._proxyMap.set(target, this._proxy);
        }
        static $wrap(value) {
            if (value == null || typeof value != 'object')
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
            return value != null && typeof value == 'object' && HiddenProperty.$has(value, $observableHelper);
        }
        get $proxy() {
            return this._proxy;
        }
    }
    Helper._proxyMap = new WeakMap();
    class DecoratedMemeber extends Observer {
        constructor(parent, descriptor) {
            super(descriptor.$name);
            this._initialized = false;
            this._option = Object.assign(this._defaultOption, descriptor.$option);
            this._parent = parent;
            Core.$register(this);
        }
        $initialize() {
            this._initialized = true;
        }
        get _defaultOption() {
            return {};
        }
        checkActive() {
            if (this._option.active)
                return true;
            return super.checkActive();
        }
        $getter() {
            if (this.$isTerminated) {
                return this.$terminateGet();
            } else {
                Observer.$refer(this);
                if (!Global.$isCommitting && !this._initialized) {
                    return this.$initialGet();
                } else {
                    return this.$regularGet();
                }
            }
        }
    }
    class ObjectProxyHandler {
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
            } else
                return true;
        }
        deleteProperty(target, prop) {
            let ob = target[$observableHelper];
            if (Observable.$isWritable(ob)) {
                let result = Reflect.deleteProperty(target, prop);
                if (result)
                    Observable.$publish(ob);
                return result;
            } else
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
                if (typeof value == 'object') {
                    result.push(value);
                }
            }
            return result;
        }
    }
    ObjectHelper._handler = new ObjectProxyHandler();
    class SetProxyHandler extends CollectionProxyHandler {
        _method(...args) {
            if (this.$prop == 'add') {
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
                if (typeof value == 'object') {
                    result.push(value);
                }
            }
            return result;
        }
    }
    SetHelper._handler = new SetProxyHandler();
    class MapProxyHandler extends CollectionProxyHandler {
        _method(...args) {
            if (this.$prop == 'set') {
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
                if (typeof key == 'object') {
                    result.push(key);
                }
                if (typeof value == 'object') {
                    result.push(value);
                }
            }
            return result;
        }
    }
    MapHelper._handler = new MapProxyHandler();
    class ComputedProperty extends DecoratedMemeber {
        constructor(parent, descriptor) {
            super(parent, descriptor);
            this._getter = descriptor.$method;
            if (this._option.active)
                this.$notified();
        }
        $render() {
            let value = this._getter.apply(this._parent);
            if (value != this._value) {
                this._value = value;
                Observable.$publish(this);
            }
        }
        $initialGet() {
            return this.$regularGet();
        }
        $regularGet() {
            this._determineStateAndRender();
            return this._value;
        }
        $terminateGet() {
            return this._value;
        }
    }
    class ObservableProperty extends DecoratedMemeber {
        constructor(parent, descriptor) {
            super(parent, descriptor);
            Object.defineProperty(parent, descriptor.$key, ObservableProperty.$interceptor(descriptor.$key));
            if (!this._option.renderer) {
                this._update();
            }
        }
        static $interceptor(key) {
            return ObservableProperty._interceptor[key] = ObservableProperty._interceptor[key] || {
                get() {
                    let member = ShrewdObject.get(this).$getMember(key);
                    return member.$getter();
                },
                set(value) {
                    let member = ShrewdObject.get(this).$getMember(key);
                    member.$setter(value);
                }
            };
        }
        static $setAccessible(target) {
            if (target == null || typeof target != 'object')
                return;
            if (Helper.$hasHelper(target)) {
                if (!Global.$isAccessible(target[$observableHelper])) {
                    Global.$setAccessible(target[$observableHelper]);
                    for (let child of target[$observableHelper].$child)
                        ObservableProperty.$setAccessible(child);
                }
            } else if (HiddenProperty.$has(target, $shrewdObject)) {
                for (let obp of ShrewdObject.get(target).$observables) {
                    if (!Global.$isAccessible(obp)) {
                        Global.$setAccessible(obp);
                        ObservableProperty.$setAccessible(obp._outputValue);
                    }
                }
            }
        }
        _outdate() {
            if (this._option.renderer) {
                super._outdate();
            }
        }
        $initialGet() {
            return this._inputValue;
        }
        $regularGet() {
            if (this._option.renderer) {
                this._determineStateAndRender();
            }
            return this._outputValue;
        }
        $terminateGet() {
            return this._outputValue;
        }
        $setter(value) {
            if (this.$isTerminated) {
                this._outputValue = value;
                return;
            }
            if (Observable.$isWritable(this) && value !== this._inputValue) {
                if (this._option.validator && !this._option.validator.apply(this._parent, [value])) {
                    return Core.$option.hook.write(this.$id);
                }
                this._inputValue = Helper.$wrap(value);
                if (this._option.renderer) {
                    this.$notified();
                } else {
                    this.$publish(this._inputValue);
                }
            }
        }
        $render() {
            Global.$pushState({
                $isRenderingProperty: true,
                $accessibles: new Set()
            });
            try {
                ObservableProperty.$setAccessible(this._inputValue);
                let value = this._option.renderer.apply(this._parent, [this._inputValue]);
                if (value !== this._outputValue) {
                    this.$publish(Helper.$wrap(value));
                }
            } finally {
                Global.$restore();
            }
        }
        $publish(value) {
            this._outputValue = value;
            Observable.$publish(this);
        }
        _onTerminate() {
            delete this._inputValue;
            delete this._option;
            super._onTerminate();
        }
    }
    ObservableProperty._interceptor = {};
    class ReactiveMethod extends DecoratedMemeber {
        constructor(parent, descriptor) {
            super(parent, descriptor);
            this._method = descriptor.$method;
        }
        get _defaultOption() {
            return { active: true };
        }
        $initialGet() {
            return () => {
                this.$notified();
                return this._result;
            };
        }
        $regularGet() {
            return () => {
                this._determineStateAndRender();
                return this._result;
            };
        }
        $terminateGet() {
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
            if (prop == 'length' || typeof prop == 'symbol' || typeof prop == 'number' || typeof prop == 'string' && prop.match(/^\d+$/)) {
                Observer.$refer(target[$observableHelper]);
            }
            return Reflect.get(target, prop, receiver);
        }
    }
    class ArrayHelper extends Helper {
        constructor(arr) {
            for (let i in arr) {
                arr[i] = Helper.$wrap(arr[i]);
            }
            super(arr, ArrayHelper._handler);
        }
        get $child() {
            let result = [];
            for (let value of this._target) {
                if (typeof value == 'object') {
                    result.push(value);
                }
            }
            return this._target;
        }
    }
    ArrayHelper._handler = new ArrayProxyHandler();
    const Shrewd = {
        shrewd: Decorators.$shrewd,
        symbol: $shrewdObject,
        commit: Core.$commit,
        construct: Core.$construct,
        terminate: Core.$terminate,
        hook: {
            default: DefaultHook,
            vue: VueHook
        },
        option: Core.$option
    };
    if (typeof window !== 'undefined' && window.Vue) {
        Core.$option.hook = new VueHook();
    }
    class ComputedPropertyAdapter extends Adapter {
        get $decoratorDescriptor() {
            return {
                $key: this._name,
                $name: this._name,
                $constructor: ComputedProperty,
                $method: this._descriptor.get,
                $option: this._options
            };
        }
        $setup() {
            var descriptor = this._descriptor, name = this._name;
            descriptor.get = function () {
                let member = ShrewdObject.get(this).$getMember(name);
                return member.$getter();
            };
            return descriptor;
        }
    }
    class ReactiveMethodAdapter extends Adapter {
        get $decoratorDescriptor() {
            return {
                $key: this._name,
                $name: this._name,
                $constructor: ReactiveMethod,
                $method: this._descriptor.value,
                $option: this._options
            };
        }
        $setup() {
            let descriptor = this._descriptor, name = this._name;
            delete descriptor.value;
            delete descriptor.writable;
            descriptor.get = function () {
                let member = ShrewdObject.get(this).$getMember(name);
                return member.$getter();
            };
            return descriptor;
        }
    }
    class Global {
        static $pushState(state) {
            Global._history.push(Global._state);
            Global._state = Object.assign({}, Global._state, state);
        }
        static $restore() {
            Global._state = Global._history.pop();
        }
        static get $isCommitting() {
            return Global._state.$isCommitting;
        }
        static get $isConstructing() {
            return Global._state.$isConstructing;
        }
        static get $isRenderingProperty() {
            return Global._state.$isRenderingProperty;
        }
        static get $target() {
            return Global._state.$target;
        }
        static $isAccessible(observable) {
            return Global._state.$accessibles.has(observable);
        }
        static $setAccessible(observable) {
            Global._state.$accessibles.add(observable);
        }
    }
    Global._state = {
        $isCommitting: false,
        $isConstructing: false,
        $isRenderingProperty: false,
        $target: null,
        $accessibles: new Set()
    };
    Global._history = [];
    const $shrewdDecorators = Symbol('Shrewd Decorators');
    return Shrewd;
}));
//# sourceMappingURL=shrewd.js.map
