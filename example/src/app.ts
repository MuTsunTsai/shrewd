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