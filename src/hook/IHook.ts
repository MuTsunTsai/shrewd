
//////////////////////////////////////////////////////////////////
/**
 * `IHook` interface is the bridge between Shrewd and other reactive
 * frameworks, such as Vue.js. They allow Shrewd to be used as
 * state store in those frameworks.
 */
//////////////////////////////////////////////////////////////////

interface IHook {
	/**
	 * Trigger a "read" operation to record dependency.
	 * 
	 * Returns whether a dependency is established.
	 */
	read(id: number): boolean;

	/** Trigger a "write" operation to notify changes. */
	write(id: number): void;

	/**
	 * Garbage collection; clearing up unsubscribed entries.
	 * This method is called at the end of each committing stage.
	 * 
	 * Returns an array of id's that were cleaned-up.
	 */
	gc(): number[];

	/** If the given Observable has 3rd party subscribers. */
	sub(id: number): boolean;
}