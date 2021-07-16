
/**
 * {@link DefaultHook} is an {@link IHook} that does absolutely nothing.
 */
class DefaultHook implements IHook {
	public read(id: number): boolean { return false; }
	public write(id: number): void { }
	public gc(): number[] { return []; }
	public sub(id: number): boolean { return false; }
}
