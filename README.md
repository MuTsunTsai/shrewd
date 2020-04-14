# Shrewd

> A reactive framework designed for building front-end applications that involves complex dependencies among states.

[![npm version](https://img.shields.io/npm/v/shrewd.svg?logo=npm)](https://www.npmjs.com/package/shrewd)
[![npm downloads](https://img.shields.io/npm/dt/shrewd?logo=npm)](https://www.npmjs.com/package/shrewd)
[![GitHub package version](https://img.shields.io/github/package-json/v/MuTsunTsai/shrewd.svg?logo=github&label=Github)](https://github.com/MuTsunTsai/shrewd)
![license](https://img.shields.io/npm/l/shrewd.svg)

## Introduction

Reactive-programming frameworks has become popular as they allow programmers to focus on how data affect each other, not worrying about how to handle the propagation of state changes. In recent years, major front-end frameworks such as [Vue.js](https://vuejs.org), [React.js](https://reactjs.org/), [Angular](https://angular.io/), [Blazor](https://blazor.net/) etc. all embrace this concept and have their built-in reactive state-containers, while other state-containers such as [Redux](https://redux.js.org/), [Vuex](https://vuex.vuejs.org/), [NgRx](https://ngrx.io/), [MobX](https://mobx.js.org), etc. provides independent support for reactive states.

Shrewd is also a reactive framework that can be used for building apps or state-containers for other frameworks. It is designed particularly with the following focuses:

- Built for complex systems\
	Shrewd is meant for data systems that are highly complicated and may have numerous variables depending on each other. It allows programmers to organize those variables in objects, and assign their dependencies in intuitive ways.

- Simple and intuitive\
	Shrewd has very few APIs and can be picked up in minutes. Like frameworks such as Vue.js, Shrewd also allows you to write dependencies in natural-looking scripts, without a bunch of pipings. Shrewd will monitor the scripts and gather the dependencies for you.

- Efficiency\
	Shrewd performs only the necessary calculations and rendering. Propagation of changes stops at any variable that remains unchanged, and resulting values are cached until its references have changed. Shrewd also make sure that it performs the propagation in the correct order so that nothing will be updated twice in the same committing stage.

- Built for dynamic systems\
	Shrewd is perfect for systems in which dependencies could change based on other variables. No matter how the dependency digraph has changed, as long as it remains acyclic, Shrewd will propagate the changes in the correct order, and make sure that dependent variables are notified only when their current dependencies have changed.

- TypeScript oriented\
	Shrewd is both developed with TypeScript and for TypeScript.

- Front-end oriented\
	Like most front-end packages, Shrewd has zero package-dependencies and can be used directly on webpages as a global variable without importing modules.

- Prevents cyclic dependencies\
	Highly complicated system means the chances of accidentally creating cyclic dependencies are high. The design of Shrewd APIs makes it less likely to create cyclic dependency among data, and when there is one, Shrewd detects and provides readable debug messages that help programmers to fix the problem.

- Third-party framework support\
	Shrewd provides hooks that enables it to communicate with other reactive frameworks, and it has a built-in hook for Vue.js.

## Basics

We shall demonstrate the basics of Shrewd using the following simple example. One can find all the files involved here in the `example` folder.

```ts
// There is only one decorator for all: "shrewd".
// Shrewd will automatically select the proper overloading.
const { shrewd } = Shrewd;

// You can then use it on any class in your project to make the class reactive.
// You don't need to add @shrewd on abstract classes;
// just make sure that it is added to all final concrete classes.
@shrewd class App {
	
	// Use it on a field, and it becomes an ObservableProperty.
	@shrewd public number = 0;

	// Use it on a getter, and it becomes a ComputedProperty.
	@shrewd public get remainder() {
		// In this example, "this.remainder" depends on "this.number";
		return this.number % 5;
	}

	// Use it on a method, and it becomes a ReactiveMethod.
	@shrewd public reaction() {
		console.log(this.remainder);
		// Now "this.reaction" depends on "this.remainder".
		// If the latter changes, "this.reaction" will re-run itself.
	}
}

// After the consturction, Shrewd will automatically start all ReactiveMethods.
var app = new App();
```

Transpile the TypeScript code above into `app.js` (you'll need to add `shrewd.d.ts` to the project, and enables the `experimentalDecorators` option), and use it in a webpage like this:

```html
<script src="shrewd.js"></script>
<script src="app.js"></script>
```

And now we can try our app in the browser console:

```
  0
> app.number=12
  2
< 12
> app.number=17
< 17
> app.number=10
  0
< 10
```

Notice that our second command `app.number=17` does not result in any console output (other than the default one) since in this case, `app.remainder` remains the same, and it does not trigger `app.reaction()`.


# Documentation

## Requirements

Shrewd uses many features in ECMAScript 2015 (es6), so it will not run on older browsers.

## Shrewd life cycle

There are two stages in the Shrewd life cycle: the manual stage and the committing stage. The manual stage is where changes are made to ObservableProperties (by user events, asynchronous callbacks, setTimeouts, etc.), and after the current execution stack is cleared, Shrewd (by default settings) enters the committing stage, where the changes are propagated to ComputedProperties and ReactiveMethods.

One can also turn off auto-commit by setting
```
Shrewd.option.autoCommit = false;
```
and then call `Shrewd.commit()` manually to propagate the changes. This works particularly well for frame-based apps, where one may call `Shrewd.commit()` per frame to reduce calculation loads.

## ObservableProperty

ObservableProperties are the sources in our data flow. Once they are set to new values, changes will be propagated in the next committing stage. 

ObservableProperties can only be changed manually, and setting their values inside a ComputedProperty or ReactiveMethod (these two, together with the renderer function mentioned later, are called reactions) is not allowed. This design is for preventing cyclic dependency and unnecessary re-running of reactions. The idea is that, if a value is supposed to depend on something else, one should make it an ComputedProperty, instead of trying to update it inside a reaction.

However, we made an exception to this rule, so that an ObservableProperty can update itself based on something else. One can also add a validation rule to it so that it accepts only certain values.

```ts
@shrewd class App {
	@shrewd public nonNegative = false;

	@shrewd({
		validator(this: App, value: number) {
			return !this.nonNegative || value >= 0;
		},
		renderer(this: App, value: number) {
			return this.nonNegative && value < 0 ? -value : value;
		}
	})
	public number = 0;

	...
}
```

In this example, `app.number` can be set manually, and if `app.nonNegative` is set to `true`, not only from now on it will reject commands like `app.number=-1`, but if `app.number` is negative at that very moment, it will change it to positive as well.

The function `validator` runs immediately during a setting action, and it should return a boolean value indicating whether to accept the new value. The function `renderer` runs in the next committing stage if there're changes to one of its dependent values, and it should return the value to replace the old one.

Values set to an ObservableProperty will be recursively modified into reactive data, so for example if the value is an array, the entire array becomes reactive as well. This behavior applies only to the native `Array`, `Set`, `Map`, and object literals, not including instances of classes derived from them.

Inside the `renderer` of an ObservableProperty, if the value is one of the above, it is also allowed to modify the values held in it. But one may not modify the values of other ObservableProperties, for the same reason.

## ComputedProperty

ComputedProperties are values entirely depending on other values. It recalculates itself every time one of its references has changed. Its purpose is only for calculation, and it is not recommended to manipulate UI inside it (this is something that should be done in a ReactiveMethod instead).

One important feature of a ComputedProperty is that it will perform recalculation automatically only when its result is eventually used by some ReactiveMethods down the line. If that's not the case, then it will postpone its recalculation, until some non-reactive code (such as user events, or third party reactive frameworks) requires it.

## ReactiveMethod

ReactiveMethod re-runs itself automatically during the next committing stage, if and only if one of its references has changed. It could return a value so that other reactions may depend on it, but unlike ComputedProperties, it always re-runs itself regardless of the absence of observers.

After the construction of a class decorated with `@shrewd` decorator, all its ReactiveMethods will start automatically.

## Dynamically constructed objects

It is commonly the case that one set of objects are created and destroyed based on another set of objects. In the example below, we establish a one-to-one correspondence between a set of numbers and instances of class `C`:

```ts
@shrewd class C {
	constructor(value: number) {
		this.value = value;
		this.name = value.toString();
	}
	
	public readonly value: number;
	
	@shrewd public name: string;

	...
}

@shrewd class App {
	@shrewd public set: Set<number> = new Set();

	private _map: Map<number, C> = new Map();

	// this.map is a Map that depends on this.set
	@shrewd public get map() {
		for(let n of this.set) {
			if(!this._map.has(n)) {
				this._map.set(n, new C(n));
			}
		}
		for(let c of this._map.values()) {
			if(!this.set.has(c.value)) {
				this._map.delete(c.value);
				Shrewd.terminate(c);
			}
		}
		// Return a new Map instance, otherwise the value will be
		// considered unchanged and will not trigger further reaction.
		return new Map(this._map);
	}

	@shrewd private render() {
		// For demonstration purpose, we use a ReactiveMethod
		// to watch this.map to ensure that it gets updated.
		this.map;
	}
}
```

If an object is no longer needed in the future, make sure to call
```ts
Shrewd.terminate(target: object)
```
to terminate it (which stops all its reactive features). Without doing so, the object may not be garbage-collected and causes memory leaks.

## Initialization

In order to make sure that all dependencies are already injected into our reactive object before its reactions are executed, Shrewd initializes the reactions only after the object has been fully constructed. If any reactions are accessed during the construction, it will simply behaved the same way as if they are not reactive.

## Comparison

| | `ObservableProperty` | `ComputedProperty` | `ReactiveMethod` |
| --- | --- | --- | --- |
| Setting | Runs validation when applicable. Only allowed in manual stage or within constructors. | --- | --- |
| Initialization | Runs validation when applicable; if not validated, the value will become `undefined`. | Computes once to get its initial value. | Executes once. |
| Getting | Renders the property when applicable, and returns the value after rendering. | Recomputes as needed, and returns new value. | Executes the method when triggered or called manually, and returns the new result. |
| Triggers further reaction ... | ...if the return value has changed. | ...if the return value has changed. | ...in any case. |
| After terminated | Can be get or set like normal properties, without validation or rendering. | Returns the last-known value without executing. | Returns the last-known value without executing. |

## Cyclic dependency detection

In larger projects where dependencies of data are complicated, it is easy to accidentally design a data flow that has cyclic dependencies. Shrewd can help us to catch such dependency and show us how to fix it. Consider the following example:

```ts
@shrewd class A {
	@shrewd public switch = true;

	@shrewd public get a(): number {
		return this.switch ? 1 : this.c;
	}

	@shrewd public get b(): number {
		return this.a + 1;
	}

	@shrewd public get c(): number {
		return this.b;
	}

	@shrewd public log() { this.c; }
}

let a = new A();
```

In the beginning, nothing is wrong. But once we set `a.switch=false` in the console, cyclic dependency appears. In this particular case, the following message will appear in the console,

```
Cyclic dependency detected: A.a => A.c => A.b => A.a
All these reactions will be terminated.
```

so that not only we know that our code went wrong, but we can also trace exactly what causes the cyclic dependency to fix it. Whenever Shrewd detects cyclic dependency, it will terminate all reactions involved in the cycle, and try its best to continue without throwing uncatched errors. Once terminated, reactions will only return their last known return value, without performing anything.

## Use Shrewd with Vue.js

To demonstrate, we shall modify our very first example.

```html
<script src="vue.js"></script>
<!-- Load Shrewd after Vue.js, and it will use the built-in hook for Vue automatically -->
<script src="shrewd.js"></script>
<script src="app.js"></script>

<div id="vue">
	<!-- do the usual Vue.js thing with our Shrewd object, and it works! -->
	<input v-model.number="app.number" />
	<div>{{app.remainder}}</div>
</div>

<script>
	var vue = new Vue({
		el: "#vue",
		// Do not load a Shrewd object into the data section,
		// as Vue will make redundant modifications to our object;
		// use computed property to get it instead
		computed: {
			app() {
				// Recall that "app" was defined in app.js
				return app;
			}
		}
	})
</script>
```

## Use custom hook

You can create your own hook to make Shrewd work with any framework of your choice. All you have to do is to create an object that implements the `IHook` interface:

```ts
interface IHook {
	/** Trigger a "read" operation to record dependencies. */
	read(id: number): void;

	/** Trigger a "write" operation to notify changes. */
	write(id: number): void;

	/**
	 * Garbage collection; clearing up unsubscribed entries.
	 * This method is called at the end of each committing stage.
	 */
	gc(): void;

	/** If the given Observable has 3rd party subscribers. */
	sub(id: number): boolean;
}
```

And then install it by:

```ts
Shrewd.option.hook = myHookInstance;
```

In the methods `read`, `write` and `sub`, the parameter `id` is the internal id for a Shrewd Observable object. You can then manage the dependencies from your framework to Shrewd based on this id. You'll also need to implement the `gc` method to prevent memory leaks.

# Let us hear you!

Shrewd is still in its infancy and thus many candidate features are yet to be added. Most notably, currently it does not provide built-in APIs for adapting one collection (Array, Set, etc.) of objects to another collection, and for now, you have to implement it yourself using ideas similar to one of the examples given above. It could also provide more options to meet the needs of different use cases. So please let us know what you think and help us make Shrewd better!