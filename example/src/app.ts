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