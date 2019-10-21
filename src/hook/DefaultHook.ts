
/**
 * Default Client does absolutely nothing.
 */
class DefaultHook implements IHook {
	public read(id: number): void { }
	public write(id: number): void { }
	public gc(): void { }
	public sub(id: number): boolean { return false; }
}
