
//////////////////////////////////////////////////////////////////
/**
 * IHook classes are the bridges between Shrewd and other reactive
 * frameworks, such as Vue. They allow Shrewd to be used as
 * state store in those frameworks.
 */
//////////////////////////////////////////////////////////////////

interface IHook {
	/** Trigger a "read" operation. */
	read(id: number): void;

	/** Trigger a "write" operation. */
	write(id: number): void;

	/** Garbage collection. */
	gc(): void;

	/** If the given Observable has 3rd party subscribers. */
	sub(id: number): boolean;
}