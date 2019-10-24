
//////////////////////////////////////////////////////////////////
/**
 * IHook classes are the bridges between Shrewd and other reactive
 * frameworks, such as Vue. They allow Shrewd to be used as
 * state store in those frameworks.
 */
//////////////////////////////////////////////////////////////////

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