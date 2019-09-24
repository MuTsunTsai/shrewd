
/**
 * Enable strict mode in TypeScript to allow type checking for this interface.
 */
interface IDecoratorOptions<T> {
	validator?: (value: T) => boolean;
	renderer?: (value: T) => T;
	lazy?: boolean;
}


/**
 * The shrewd decorator turns a field into an ObservableProperty,
 * a get accessor into a ComputedProperty, and a method into a ReactiveMethod.
 */
export function shrewd<T>(option: IDecoratorOptions<T>): PropertyDecorator;
export function shrewd(target: object, prop: PropertyKey): void;
export function shrewd(target: object, prop: PropertyKey, descriptor: PropertyDescriptor): PropertyDescriptor;

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
