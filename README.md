# Shrewd

> A reactive framework designed for building front-end applications that involves complex dependencies among states.

## Introduction

Reactive-programming frameworks has become popular as they allow programmers to focus on how data affect each other, not worrying about how to handle the propagation of state changes. In recent years, major front-end frameworks such as [Vue.js](https://vuejs.org), [React.js](https://reactjs.org/), [Angular](https://angular.io/) etc. all embraces this concept and have thier built-in reactive state-container, while other state-containers such as [Redux](https://redux.js.org/), [Vuex](https://vuex.vuejs.org/), [NgRx](https://ngrx.io/), [MobX](https://mobx.js.org) etc. provides independent support for reactive states.

Shrewd is also a reactive framework that can be used for building apps or state-containers for other frameworks. It is designed particularly with the following focuses:

- TypeScript oriented\
	Shrewd is both developed with TypeScript and for TypeScript.

- Front-end oriented\
	Shrewd can be used directly on webpages without importing modules.

- Simplicity\
	Shrewd has very few APIs and can be picked up in minutes.

- Efficiency\
	Shrewd performs only necessary calculations and rendering, and it stops any further action if at any stage the result does not change.

- Prevents circular dependencies\
	The design of Shrewd makes it less likely to create circular dependency among data, and when there is one, Shrewd detects and provides readable error message that helps programmers to fix the problem.

- Third party framework support\
	Shrewd provides hooks that enables it to communicate with other reactive frameworks, and it has a built-in hook for Vue.js.

## Basics

We shall demonstrate the basics of Shrewd using the following simple example. One can find all the files involved here in the `example` folder.

```ts
// There is only one decorator for all: "shrewd".
// Add shrewd.d.ts into your TypeScript project,
// so that TypeScript would recognizes the global constant Shrewd.
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

Transpile the TypeScript code above into `app.js`, and use it in a webpage like this:

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