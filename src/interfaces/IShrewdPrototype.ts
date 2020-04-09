
const $shrewdDecorators = Symbol("Shrewd Decorators");

interface IShrewdPrototype {
	[$shrewdDecorators]: IDecoratorDescriptor[];
}