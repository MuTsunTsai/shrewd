
/**
 * Enable strict mode in TypeScript to allow type checking for this interface.
 */
interface IValidator<T> {
	(value: T): T;
}

/**
 * The class SetupError is for testing purpose only.
 * It indicates any incorrect usage of the decorators.
 */
export class SetupError extends Error {
	public class: string;
	public prop: string;
	constructor(target: object, prop: PropertyKey, message: string);
}

/**
 * The observable decorator turns any field of a class into an observable property.
 */
export function observable<T>(validator: IValidator<T>): PropertyDecorator;
export function observable(target: object, prop: PropertyKey): void;

/**
 * The computed decorator turns any get accessor into a computed property.
 * 
 * Once read, it will automatically update itself if any of its reference changes.
 */
export function computed(target: object, prop: PropertyKey, descriptor: PropertyDescriptor): PropertyDescriptor;

/**
 * The reactive decorator turns any method into a reactive method.
 * 
 * Once run, it will automatically re-run itself if any of its reference changes.
 */
export function reactive(target: object, prop: PropertyKey, descriptor: PropertyDescriptor): PropertyDescriptor;

export function commit(): void;

export as namespace Shrewd;
