
class SetupError extends Error {

	public class: string;
	public prop: string;

	constructor(target: object, prop: PropertyKey, message: string) {
		super(message);
		this.class = target.constructor.name;
		this.prop = prop.toString();
		this.name = `SetupError at ${this.class}[${this.prop}]`;
	}
}