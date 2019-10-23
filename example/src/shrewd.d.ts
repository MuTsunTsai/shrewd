
/**
 *  Provides connection to 3rd party reactive frameworks.
 */
interface IHook {
	/** Trigger a "read" operation to record dependency. */
	read(id: number): void;

	/** Trigger a "write" operation to notify changes. */
	write(id: number): void;

	/** Garbage collection; clearing up unsubscribed entries. */
	gc(): void;

	/** If the given Observable has 3rd party subscribers. */
	sub(id: number): boolean;
}

/**
 * Enable strict mode in TypeScript to allow type checking for this interface.
 */
interface IDecoratorOptions<T> {
	validator?: (value: T) => boolean;
	renderer?: (value: T) => T;

	/** If true, a ReactiveMethod will postpone its execution until the committing state. */
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
 * Manually triggers the commission. Under the default settings (with auto-commit) there is
 * no need to call this method, except for the case where the reactive results are immediately
 * required for further non-reactive actions.
 */
export function commit(): void;

/**
 * Terminates a Shrewd object. The said object will cancel all its subscriptions (to and from others),
 * and can no longer be subscribed. A Shrewd object must be terminated to allow garbage-collecting.
 * Any changes made before the termination will still propagate in the committing stage.
 * 
 * @param lazy: boolean, set to true would postpone the termination until the end of
 * the next committing stage (default is false).
 */
export function terminate(target: object, lazy?: boolean): void;

/**
 * Construct a Shrewd object. Inside a ComputedProperty or a ReactiveMethod, to dynamically construct
 * instances of classes decorated by Shrewd, one must do so through this method.
 */
export function construct<T, A extends any[]>(constructor: new (...args: A) => T, ...args: A): T;

/**
 * Built-in hooks.
 */
export const hook: {

	/** The default hook that does nothing. */
	default: IHook,

	/** Hook for Vue.js. */
	vue: IHook
};

interface IShrewdOption {

	/**
	 * Hook for 3rd party frameworks. The default hook is an instance of Shrewd.hook.default.
	 */
	hook: IHook;

	/**
	 * Whether to use auto-commit. The default value is true.
	 * However, setting it to false and calling Shrewd.commit() periodically
	 * might result in better performance for some applications.
	 */
	autoCommit: boolean;
}

/**
 * Shrewd global options.
 */
export const option: IShrewdOption;

export as namespace Shrewd;
