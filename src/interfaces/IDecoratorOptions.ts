interface IDecoratorOptions<T = any> {
	validator?: (value: T) => boolean;
	renderer?: (value: T) => T;
	active?: boolean;
	comparer?: (oldValue: T, newValue: T) => boolean;
}
