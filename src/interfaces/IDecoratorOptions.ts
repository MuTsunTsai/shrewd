interface IDecoratorOptions<T = unknown> {
	validator?: (value: T) => boolean;
	renderer?: (value: T) => T;
	active?: boolean;
	comparer?: (oldValue: T, newValue: T, member: DecoratedMember) => boolean;
}
