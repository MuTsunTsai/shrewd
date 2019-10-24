# Shrewd

> A reactive framework designed for building front-end applications that involves complex dependencies among states.

[![npm version](https://img.shields.io/npm/v/shrewd.svg?logo=npm)](https://www.npmjs.com/package/shrewd)
![npm downloads](https://img.shields.io/npm/dt/shrewd?logo=npm)
[![GitHub package version](https://img.shields.io/github/package-json/v/MuTsunTsai/shrewd.svg?logo=github&label=Github)](https://github.com/MuTsunTsai/shrewd)
![license](https://img.shields.io/npm/l/shrewd.svg)

## Introduction

Reactive-programming frameworks has become popular as they allow programmers to focus on how data affect each other, not worrying about how to handle the propagation of state changes. In recent years, major front-end frameworks such as [Vue.js](https://vuejs.org), [React.js](https://reactjs.org/), [Angular](https://angular.io/) etc. all embraces this concept and have thier built-in reactive state-container, while other state-containers such as [Redux](https://redux.js.org/), [Vuex](https://vuex.vuejs.org/), [NgRx](https://ngrx.io/), [MobX](https://mobx.js.org) etc. provides independent support for reactive states.

Shrewd is also a reactive framework that can be used for building apps or state-containers for other frameworks. It is designed particularly with the following focuses:

- Built for complex system\
	Shrewd is meant for data systems that are highly complicated and may have numerous variables depending on each other in dynamic ways. It allows programmers to organize those variables in objects, and assign their dependencies in intuitive ways.

- TypeScript oriented\
	Shrewd is both developed with TypeScript and for TypeScript.

- Front-end oriented\
	Like most front-end packages, Shrewd has zero dependency, and can be used directly on webpages as a global variable without importing modules.

- Simplicity\
	Shrewd has very few APIs and can be picked-up in minutes.

- Efficiency\
	Shrewd performs only necessary calculations and rendering. Propagation of changes stops at any variable that remains unchanged, and resulting values are cached until its references have changed. Shrewd also make sure that it performs the propagation in the correct order so that nothing will be updated twice in the same committing stage.

- Prevents circular dependencies\
	The design of Shrewd makes it less likely to create circular dependency among data, and when there is one, Shrewd detects and provides readable debug message that helps programmers to fix the problem.

- Third party framework support\
	Shrewd provides hooks that enables it to communicate with other reactive frameworks, and it has a built-in hook for Vue.js.

## Basics

We shall demonstrate the basics of Shrewd using the following simple example. One can find all the files involved here in the `example` folder.

```ts
// There is only one decorator for all: "shrewd".
const { shrewd } = Shrewd;

// You can then use it in any class in your project.
class App {
	
	// Use it on a field, and it becomes an ObservableProperty.
	@shrewd public number = 0;

	// Use it on a getter, and it becomes a ComputedProperty.
	@shrewd public get remainder() {
		return this.number % 5;
	}

	// Use it on a method, and it becomes a ReactiveMethod.
	@shrewd public reaction() {
		console.log(this.remainder);
	}
}

var app = new App();

// Once ran, a ReactiveMethod re-run itself whenever something it depends on changes.
app.reaction();
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

Notice that our second command `app.number=17` does not result in any console output (other than the default one), since in this case `app.remainder` remains the same, and it does not trigger `app.reaction()`.


# Documentation

## Requirements

Shrewd uses many features in ECMAScript 2015 (es6), so it will not run on older browsers.

## Shrewd life cycle

There are two stages in the Shrewd life cycle: the manual stage and the committing stage. The manual stage is where changes are made to ObservableProperties (by user events, asynchronous callbacks, setTimeouts, etc.), and after the current execution stack is cleared, Shrewd (by default settings) enters the committing stage, where the changes are propagated to ComputedProperties and ReactiveMethods.

One can also turn off auto-commit by setting
```
Shrewd.option.autoCommit = false;
```
and then call `Shrewd.commit()` manually to propagate the changes.

## ObservableProperty

ObservableProperties are the sources in our data flow. Once they are set to new values, changes will be propagated in the next committing stage. 

ObservableProperties can only be changed manually, and setting their values inside an ComputedProperty or ReactiveMethod (these two, together with the renderer function mentioned later, are called reactions) is not allowed. This design is for preventing circular dependency and unnecessary re-running of reactions. The idea is that, if a value is supposed to depend on something else, one should make it an ComputedProperty, instead of trying to update it inside an reaction.

However, we made an exception to this rule, so that an ObservableProperty can update itself based on something else. One can also add a validation rule to it, so that it accepts only certain values.

```ts
class App {
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

The function `validator` runs immediately during a setting action, and it should return a boolean value indicating whether to accept the new value. The function `renderer` runs in the next committing stage, if there're changes to one of its dependent values, and it should return the value to replace the old one.

Values set to an ObservableProperty will be recursively modified into reactive data, so for example if the value is an array, the entire array becomes reactive as well. This behavior applies only to the native `Array`, `Set`, `Map`, and object literals, not including instances of classes derived from them.

Inside the `renderer` of an ObservableProperty, if the value is one of the above, it is also allowed to modify the values hold in it. But one may not modify values of other ObservableProperties, for the same reason.

## ComputedProperty

ComputedProperties are values entirely depending on other values. It recalculates itself everytime one of its references has changed. It's purpose is only for calculation, and it is not recommanded to manipulate UI inside it (this is something that should be done in a ReactiveMethod instead).

One important feature of a ComputedProperty is that it will perform recalculation automatically only when its result is eventually used by some ReactiveMethods down the line. If that's not the case, then it will postpone its recalculation, until some non-reactive code requires it.

## ReactiveMethod

ReactiveMethod re-run itself automatically during the next committing stage, whenever one of its references has changed. It could return a value so that other reactions may depend on it, but unlike ComputedProperties, it always re-run itself regardless of absence of observers.

ReactiveMethods needs to be called for the first time in order to start it (one may do so inside the constructor of the class if so desired). If the option `lazy` is set to `true`, then during the first call it will not execute immediately, but wait until the committing stage to execute.

```ts
@shrewd({ lazy: true })
public method() {
	....
}
```

## Dynamically constructed objects

It is commonly the case that one set of objects are created and destroyed based on another set of objects. In the example below, we establishe a one-to-one correspondence between a set of numbers and instances of class `C`:

```ts
class C {
	constructor(value: number) {
		this.value = value;
		this.name = value.toString();
	}
	
	public readonly value: number;
	
	@shrewd public name: string;

	...
}

class App {
	constructor() {
		this.render();
	}

	@shrewd public set: Set<number> = new Set();

	private _map: Map<number, C> = new Map();

	// this.map is a Map that depends on this.set
	@shrewd public get map() {
		for(let n of this.set) {
			if(!this._map.has(n)) {
				this._map.set(n, Shrewd.construct(C, n));
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

In order to construct new instances of class `C` inside the ComputedProperty `map` without violating the rule that "ObservableProperties cannot be set inside a ComputedProperty", Shrewd provides a method
```ts
Shrewd.construct(constructor: Function, ...params: any[])
```
that allows one to construct new objects without worries.

If an object is no longer needed in the future, make sure to call
```ts
Shrewd.terminate(target: object)
```
to terminate it (which stops all its reactive features). Without doing so, the object may not be garbage-collected and causes memory leaks.

## Circular dependency detection

In larger project where dependencies of data are complicated, it is easy to accidentally design a data flow that has circular dependencies. Shrewd can help us to catch such dependency and show us how to fix it. Consider the following example:

```ts
class A {
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
a.log();
```

In the beginning, nothing is wrong. But once we set `a.switch=false` in the console, circular dependency appears. In this particular case, the following message will appear in the console,

```
Circular dependency detected: A.a => A.c => A.b => A.a
All these reactions will be terminated.
```

so that not only we know that our code went wrong, but we can also trace exactly what causes the circular dependency to fix it. Whenever Shrewd detects circular dependency, it will terminate all reactions involved in the cycle, and try its best to continue without throwing errors. Once terminated, reactions will only return their last known return value, without performing anything.

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
		// Do not load a Shrewd object into the data,
		// as Vue will unnecessarily modifies our object;
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
	/** Trigger a "read" operation to record dependency. */
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

In the methods `read`, `write` and `sub`, the parameter `id` is the internal id for a Shrewd Observable object. You can then manage the dependency from your framework to Shrewd based on this id. You'll also need to implement the `gc` method to prevent memory leaks.