/**
 * shrewd v0.0.0-beta.13
 * (c) 2019-2020 Mu-Tsun Tsai
 * Released under the MIT License.
 */

/**
 *  Provides connection to 3rd party reactive frameworks.
 */
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

/**
 * Enable strict mode in TypeScript to allow type checking for this interface.
 */
interface IDecoratorOptions<T> {
	
	/** Validator for ObservableProperty. */
	validator?: (value: T) => boolean;
	
	/** Renderer function for ObservableProperty. */
	renderer?: (value: T) => T;
}

/**
 * The shrewd decorator makes a class reactive,
 * and it turns a field into an ObservableProperty,
 * a get accessor into a ComputedProperty, and a method into a ReactiveMethod.
 */
export function shrewd<T extends new (...args: any[]) => {}>(constructor: T): T;
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
 */
export function terminate(target: object): void;

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

	/**
	 * Whether to pause when Shrewd detects problem and when a debugger is available.
	 * The default value is true.
	 */
	debug: boolean;
}

/**
 * Shrewd global options.
 */
export const option: IShrewdOption;

export as namespace Shrewd;
