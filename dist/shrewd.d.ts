
/**
 * Enable strict mode in TypeScript to allow type checking for this interface.
 */
interface IObservablePropertyOptions<T> {
	validator?: (value: T) => boolean;
	renderer?: (value: T) => T;
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
export function observable<T>(option: IObservablePropertyOptions<T>): PropertyDecorator;
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

/**
 * Manually triggers the commission. This is mainly for testing purpose.
 */
export function commit(): void;

/**
 * Terminates a Shrewd object. The said object will cancel all its subscription,
 * and can no longer be subscribed. A Shrewd object must be terminated to allow garbage-colleting.
 * It might send one last notification to subscribers if changes has been made before termination.
 */
export function terminate(target: object): void;

/**
 * Construct a Shrewd object.
 */
export function construct<T, A extends any[]>(constructor: new (...args: A) => T, ...args: A): T;

export as namespace Shrewd;
